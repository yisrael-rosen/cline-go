package parser

import (
	"go/ast"
	"strings"
)

// PerformancePatternCheck represents a performance pattern analysis check
type PerformancePatternCheck struct {
	Name        string
	Description string
	Severity    string
	Check       func(node ast.Node) []Issue
}

// GenericsPatternCheck represents a generics pattern analysis check
type GenericsPatternCheck struct {
	Name        string
	Description string
	Severity    string
	Check       func(node ast.Node) []Issue
}

// ContextPatternCheck represents a context usage pattern check
type ContextPatternCheck struct {
	Name        string
	Description string
	Severity    string
	Check       func(node ast.Node) []Issue
}

// Performance pattern checks
var goPerformanceChecks = []PerformancePatternCheck{
	{
		Name:        "slice-preallocation",
		Description: "Detect missing slice preallocation",
		Severity:    "info",
		Check: func(node ast.Node) []Issue {
			var issues []Issue
			ast.Inspect(node, func(n ast.Node) bool {
				if loop, ok := n.(*ast.RangeStmt); ok {
					if shouldPreallocate(loop) {
						issues = append(issues, Issue{
							Type:       "performance",
							Message:    "Consider preallocating slice",
							Severity:   "info",
							Suggestion: "Use make() with known capacity",
						})
					}
				}
				return true
			})
			return issues
		},
	},
	{
		Name:        "string-concat",
		Description: "Analyze string concatenation",
		Severity:    "info",
		Check: func(node ast.Node) []Issue {
			var issues []Issue
			ast.Inspect(node, func(n ast.Node) bool {
				if assign, ok := n.(*ast.AssignStmt); ok {
					if hasIneffientConcat(assign) {
						issues = append(issues, Issue{
							Type:       "performance",
							Message:    "Inefficient string concatenation",
							Severity:   "info",
							Suggestion: "Use strings.Builder for multiple concatenations",
						})
					}
				}
				return true
			})
			return issues
		},
	},
}

// Generics pattern checks
var genericsChecks = []GenericsPatternCheck{
	{
		Name:        "type-constraints",
		Description: "Analyze type constraint usage",
		Severity:    "info",
		Check: func(node ast.Node) []Issue {
			var issues []Issue
			ast.Inspect(node, func(n ast.Node) bool {
				if typeSpec, ok := n.(*ast.TypeSpec); ok {
					if hasLooseConstraints(typeSpec) {
						issues = append(issues, Issue{
							Type:       "generics",
							Message:    "Consider tightening type constraints",
							Severity:   "info",
							Suggestion: "Use more specific constraints",
						})
					}
				}
				return true
			})
			return issues
		},
	},
	{
		Name:        "generic-methods",
		Description: "Check generic method patterns",
		Severity:    "info",
		Check: func(node ast.Node) []Issue {
			var issues []Issue
			ast.Inspect(node, func(n ast.Node) bool {
				if fd, ok := n.(*ast.FuncDecl); ok {
					if shouldUseGenerics(fd) {
						issues = append(issues, Issue{
							Type:       "generics",
							Message:    "Consider using generics",
							Severity:   "info",
							Suggestion: "Convert to generic function",
						})
					}
				}
				return true
			})
			return issues
		},
	},
}

// Context pattern checks
var contextChecks = []ContextPatternCheck{
	{
		Name:        "context-first",
		Description: "Check context parameter position",
		Severity:    "warning",
		Check: func(node ast.Node) []Issue {
			var issues []Issue
			ast.Inspect(node, func(n ast.Node) bool {
				if fd, ok := n.(*ast.FuncDecl); ok {
					if hasContextNotFirst(fd) {
						issues = append(issues, Issue{
							Type:       "context",
							Message:    "Context should be first parameter",
							Severity:   "warning",
							Suggestion: "Move context.Context to first position",
						})
					}
				}
				return true
			})
			return issues
		},
	},
	{
		Name:        "context-propagation",
		Description: "Analyze context propagation",
		Severity:    "warning",
		Check: func(node ast.Node) []Issue {
			var issues []Issue
			ast.Inspect(node, func(n ast.Node) bool {
				if fd, ok := n.(*ast.FuncDecl); ok {
					if !propagatesContext(fd) {
						issues = append(issues, Issue{
							Type:       "context",
							Message:    "Context not propagated to called functions",
							Severity:   "warning",
							Suggestion: "Pass context to downstream functions",
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

func shouldPreallocate(loop *ast.RangeStmt) bool {
	// Check if loop appends to slice
	hasAppend := false
	ast.Inspect(loop.Body, func(n ast.Node) bool {
		if call, ok := n.(*ast.CallExpr); ok {
			if fun, ok := call.Fun.(*ast.Ident); ok {
				if fun.Name == "append" {
					hasAppend = true
					return false
				}
			}
		}
		return true
	})
	return hasAppend
}

func hasIneffientConcat(assign *ast.AssignStmt) bool {
	concatCount := 0
	ast.Inspect(assign, func(n ast.Node) bool {
		if op, ok := n.(*ast.BinaryExpr); ok {
			if op.Op.String() == "+" {
				concatCount++
			}
		}
		return true
	})
	return concatCount > 2 // More than 2 concatenations
}

func hasLooseConstraints(ts *ast.TypeSpec) bool {
	// Check if type parameter constraints are too generic
	if iface, ok := ts.Type.(*ast.InterfaceType); ok {
		// Check if it's a generic constraint
		if len(iface.Methods.List) == 0 {
			return true // Empty interface constraint
		}
		for _, method := range iface.Methods.List {
			if ident, ok := method.Type.(*ast.Ident); ok {
				if ident.Name == "any" || ident.Name == "interface{}" {
					return true
				}
			}
		}
	}
	return false
}

func shouldUseGenerics(fd *ast.FuncDecl) bool {
	// Check if function has similar implementations for different types
	if fd.Recv != nil {
		return false // Skip methods
	}

	similarFuncs := make(map[string]bool)
	ast.Inspect(fd, func(n ast.Node) bool {
		if ident, ok := n.(*ast.Ident); ok {
			name := ident.Name
			if strings.HasPrefix(name, fd.Name.Name) && name != fd.Name.Name {
				similarFuncs[name] = true
			}
		}
		return true
	})

	return len(similarFuncs) > 1
}

func hasContextNotFirst(fd *ast.FuncDecl) bool {
	if fd.Type.Params == nil || len(fd.Type.Params.List) == 0 {
		return false
	}

	hasContext := false
	isFirst := false

	// Check first parameter
	if sel, ok := fd.Type.Params.List[0].Type.(*ast.SelectorExpr); ok {
		if sel.Sel.Name == "Context" {
			isFirst = true
		}
	}

	// Check all parameters
	for _, param := range fd.Type.Params.List {
		if sel, ok := param.Type.(*ast.SelectorExpr); ok {
			if sel.Sel.Name == "Context" {
				hasContext = true
				break
			}
		}
	}

	return hasContext && !isFirst
}

func propagatesContext(fd *ast.FuncDecl) bool {
	if !hasContextParam(fd) {
		return true // No context to propagate
	}

	propagates := false
	ast.Inspect(fd.Body, func(n ast.Node) bool {
		if call, ok := n.(*ast.CallExpr); ok {
			if hasContextArg(call) {
				propagates = true
				return false
			}
		}
		return true
	})

	return propagates
}

func hasContextParam(fd *ast.FuncDecl) bool {
	if fd.Type.Params == nil {
		return false
	}

	for _, param := range fd.Type.Params.List {
		if sel, ok := param.Type.(*ast.SelectorExpr); ok {
			if sel.Sel.Name == "Context" {
				return true
			}
		}
	}
	return false
}

func hasContextArg(call *ast.CallExpr) bool {
	for _, arg := range call.Args {
		if ident, ok := arg.(*ast.Ident); ok {
			if ident.Name == "ctx" || strings.Contains(ident.Name, "context") {
				return true
			}
		}
	}
	return false
}

// RunGoPerformancePatternAnalysis runs performance, generics, and context pattern checks
func RunGoPerformancePatternAnalysis(node ast.Node) []Issue {
	var issues []Issue

	// Run performance checks
	for _, check := range goPerformanceChecks {
		issues = append(issues, check.Check(node)...)
	}

	// Run generics checks
	for _, check := range genericsChecks {
		issues = append(issues, check.Check(node)...)
	}

	// Run context checks
	for _, check := range contextChecks {
		issues = append(issues, check.Check(node)...)
	}

	return issues
}
