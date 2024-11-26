package parser

import (
	"go/ast"
)

// EscapePatternCheck represents an escape analysis pattern check
type EscapePatternCheck struct {
	Name        string
	Description string
	Severity    string
	Check       func(node ast.Node) []Issue
}

// InlinePatternCheck represents an inlining pattern check
type InlinePatternCheck struct {
	Name        string
	Description string
	Severity    string
	Check       func(node ast.Node) []Issue
}

// ZeroAllocPatternCheck represents a zero allocation pattern check
type ZeroAllocPatternCheck struct {
	Name        string
	Description string
	Severity    string
	Check       func(node ast.Node) []Issue
}

// Escape analysis pattern checks
var escapeChecks = []EscapePatternCheck{
	{
		Name:        "pointer-escape",
		Description: "Detect unnecessary pointer escapes",
		Severity:    "warning",
		Check: func(node ast.Node) []Issue {
			var issues []Issue
			ast.Inspect(node, func(n ast.Node) bool {
				if fd, ok := n.(*ast.FuncDecl); ok {
					if hasUnnecessaryEscape(fd) {
						issues = append(issues, Issue{
							Type:       "escape",
							Message:    "Unnecessary pointer escape",
							Severity:   "warning",
							Suggestion: "Consider returning value instead of pointer",
						})
					}
				}
				return true
			})
			return issues
		},
	},
	{
		Name:        "closure-capture",
		Description: "Analyze closure variable captures",
		Severity:    "info",
		Check: func(node ast.Node) []Issue {
			var issues []Issue
			ast.Inspect(node, func(n ast.Node) bool {
				if fd, ok := n.(*ast.FuncLit); ok {
					if hasCapturedPointer(fd) {
						issues = append(issues, Issue{
							Type:       "escape",
							Message:    "Pointer captured by closure",
							Severity:   "info",
							Suggestion: "Consider copying value if possible",
						})
					}
				}
				return true
			})
			return issues
		},
	},
}

// Inlining pattern checks
var inlineChecks = []InlinePatternCheck{
	{
		Name:        "inline-candidate",
		Description: "Detect inlining opportunities",
		Severity:    "info",
		Check: func(node ast.Node) []Issue {
			var issues []Issue
			ast.Inspect(node, func(n ast.Node) bool {
				if fd, ok := n.(*ast.FuncDecl); ok {
					if isInlineCandidate(fd) {
						issues = append(issues, Issue{
							Type:       "inline",
							Message:    "Function could be inlined",
							Severity:   "info",
							Suggestion: "Consider marking as inline",
						})
					}
				}
				return true
			})
			return issues
		},
	},
	{
		Name:        "inline-blocker",
		Description: "Analyze inlining blockers",
		Severity:    "info",
		Check: func(node ast.Node) []Issue {
			var issues []Issue
			ast.Inspect(node, func(n ast.Node) bool {
				if fd, ok := n.(*ast.FuncDecl); ok {
					if hasInlineBlocker(fd) {
						issues = append(issues, Issue{
							Type:       "inline",
							Message:    "Function has inlining blocker",
							Severity:   "info",
							Suggestion: "Consider simplifying function for inlining",
						})
					}
				}
				return true
			})
			return issues
		},
	},
}

// Zero allocation pattern checks
var zeroAllocChecks = []ZeroAllocPatternCheck{
	{
		Name:        "string-convert",
		Description: "Detect string conversion allocations",
		Severity:    "info",
		Check: func(node ast.Node) []Issue {
			var issues []Issue
			ast.Inspect(node, func(n ast.Node) bool {
				if call, ok := n.(*ast.CallExpr); ok {
					if hasStringAlloc(call) {
						issues = append(issues, Issue{
							Type:       "alloc",
							Message:    "String conversion allocates",
							Severity:   "info",
							Suggestion: "Consider using []byte directly",
						})
					}
				}
				return true
			})
			return issues
		},
	},
	{
		Name:        "interface-convert",
		Description: "Analyze interface conversions",
		Severity:    "info",
		Check: func(node ast.Node) []Issue {
			var issues []Issue
			ast.Inspect(node, func(n ast.Node) bool {
				if expr, ok := n.(*ast.TypeAssertExpr); ok {
					if hasUnnecessaryAssert(expr) {
						issues = append(issues, Issue{
							Type:       "alloc",
							Message:    "Unnecessary interface conversion",
							Severity:   "info",
							Suggestion: "Consider using concrete type",
						})
					}
				}
				return true
			})
			return issues
		},
	},
}

// Helper functions

func hasUnnecessaryEscape(fd *ast.FuncDecl) bool {
	if fd.Type.Results == nil {
		return false
	}

	// Check if returning small value as pointer
	for _, result := range fd.Type.Results.List {
		if star, ok := result.Type.(*ast.StarExpr); ok {
			if ident, ok := star.X.(*ast.Ident); ok {
				// Check if it's a small type that shouldn't be returned as pointer
				return isSmallType(ident.Name)
			}
		}
	}
	return false
}

func hasCapturedPointer(fd *ast.FuncLit) bool {
	hasPointer := false
	ast.Inspect(fd, func(n ast.Node) bool {
		if ident, ok := n.(*ast.Ident); ok {
			// Check if identifier is a captured pointer
			if ident.Obj != nil && isPointerVar(ident.Obj) {
				hasPointer = true
				return false
			}
		}
		return true
	})
	return hasPointer
}

func isInlineCandidate(fd *ast.FuncDecl) bool {
	if fd.Body == nil {
		return false
	}

	// Check if function is small enough for inlining
	stmtCount := 0
	ast.Inspect(fd.Body, func(n ast.Node) bool {
		switch n.(type) {
		case *ast.AssignStmt, *ast.ReturnStmt, *ast.ExprStmt:
			stmtCount++
		}
		return true
	})

	return stmtCount <= 5 // Small functions are inline candidates
}

func hasInlineBlocker(fd *ast.FuncDecl) bool {
	hasBlocker := false
	ast.Inspect(fd.Body, func(n ast.Node) bool {
		switch n.(type) {
		case *ast.DeferStmt, *ast.GoStmt, *ast.SelectStmt:
			hasBlocker = true
			return false
		}
		return true
	})
	return hasBlocker
}

func hasStringAlloc(call *ast.CallExpr) bool {
	if fun, ok := call.Fun.(*ast.Ident); ok {
		return fun.Name == "string" && len(call.Args) == 1 &&
			isSliceType(call.Args[0])
	}
	return false
}

func hasUnnecessaryAssert(expr *ast.TypeAssertExpr) bool {
	// Check if asserting to same type or unnecessary interface
	if ident, ok := expr.Type.(*ast.Ident); ok {
		return ident.Name == "interface{}"
	}
	return false
}

// Utility functions

func isSmallType(name string) bool {
	smallTypes := map[string]bool{
		"bool":    true,
		"int8":    true,
		"uint8":   true,
		"int16":   true,
		"uint16":  true,
		"int32":   true,
		"uint32":  true,
		"float32": true,
		"float64": true,
	}
	return smallTypes[name]
}

func isPointerVar(obj *ast.Object) bool {
	if obj.Kind != ast.Var {
		return false
	}
	if decl, ok := obj.Decl.(*ast.Field); ok {
		_, isPtr := decl.Type.(*ast.StarExpr)
		return isPtr
	}
	return false
}

func isSliceType(expr ast.Expr) bool {
	_, ok := expr.(*ast.ArrayType)
	return ok
}

// RunGoEscapePatternAnalysis runs escape, inline, and zero allocation pattern checks
func RunGoEscapePatternAnalysis(node ast.Node) []Issue {
	var issues []Issue

	// Run escape checks
	for _, check := range escapeChecks {
		issues = append(issues, check.Check(node)...)
	}

	// Run inline checks
	for _, check := range inlineChecks {
		issues = append(issues, check.Check(node)...)
	}

	// Run zero allocation checks
	for _, check := range zeroAllocChecks {
		issues = append(issues, check.Check(node)...)
	}

	return issues
}
