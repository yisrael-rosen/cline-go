package parser

import (
	"fmt"
	"go/ast"
	"strings"
)

// GoPatternCheck represents a Go-specific pattern analysis check
type GoPatternCheck struct {
	Name        string
	Description string
	Severity    string
	Check       func(node ast.Node) []Issue
}

// GoConcurrencyCheck represents a concurrency pattern analysis check
type GoConcurrencyCheck struct {
	Name        string
	Description string
	Severity    string
	Check       func(node ast.Node) []Issue
}

// ErrorPatternCheck represents an error handling pattern analysis check
type ErrorPatternCheck struct {
	Name        string
	Description string
	Severity    string
	Check       func(node ast.Node) []Issue
}

// Go-specific pattern checks
var goPatternChecks = []GoPatternCheck{
	{
		Name:        "option-pattern",
		Description: "Detect functional options pattern",
		Severity:    "info",
		Check: func(node ast.Node) []Issue {
			var issues []Issue
			ast.Inspect(node, func(n ast.Node) bool {
				if ts, ok := n.(*ast.TypeSpec); ok {
					if isOptionPattern(ts) {
						issues = append(issues, Issue{
							Type:       "pattern",
							Message:    fmt.Sprintf("Functional options pattern detected in %s", ts.Name.Name),
							Severity:   "info",
							Suggestion: "Consider documenting option functions",
						})
					}
				}
				return true
			})
			return issues
		},
	},
	{
		Name:        "constructor-pattern",
		Description: "Analyze constructor patterns",
		Severity:    "info",
		Check: func(node ast.Node) []Issue {
			var issues []Issue
			ast.Inspect(node, func(n ast.Node) bool {
				if fd, ok := n.(*ast.FuncDecl); ok {
					if isConstructor(fd) && !hasValidation(fd) {
						issues = append(issues, Issue{
							Type:       "pattern",
							Message:    fmt.Sprintf("Constructor %s lacks validation", fd.Name.Name),
							Severity:   "warning",
							Suggestion: "Add input validation to constructor",
						})
					}
				}
				return true
			})
			return issues
		},
	},
}

// Concurrency pattern checks
var goConcurrencyChecks = []GoConcurrencyCheck{
	{
		Name:        "worker-pool",
		Description: "Detect worker pool pattern",
		Severity:    "info",
		Check: func(node ast.Node) []Issue {
			var issues []Issue
			ast.Inspect(node, func(n ast.Node) bool {
				if fd, ok := n.(*ast.FuncDecl); ok {
					if isWorkerPool(fd) {
						issues = append(issues, Issue{
							Type:       "pattern",
							Message:    fmt.Sprintf("Worker pool pattern detected in %s", fd.Name.Name),
							Severity:   "info",
							Suggestion: "Consider using errgroup for error handling",
						})
					}
				}
				return true
			})
			return issues
		},
	},
	{
		Name:        "pipeline",
		Description: "Analyze pipeline pattern",
		Severity:    "info",
		Check: func(node ast.Node) []Issue {
			var issues []Issue
			ast.Inspect(node, func(n ast.Node) bool {
				if fd, ok := n.(*ast.FuncDecl); ok {
					if isPipeline(fd) && !hasContextHandling(fd) {
						issues = append(issues, Issue{
							Type:       "pattern",
							Message:    fmt.Sprintf("Pipeline %s lacks context handling", fd.Name.Name),
							Severity:   "warning",
							Suggestion: "Add context for cancellation",
						})
					}
				}
				return true
			})
			return issues
		},
	},
}

// Error handling pattern checks
var errorChecks = []ErrorPatternCheck{
	{
		Name:        "error-wrapping",
		Description: "Detect error wrapping patterns",
		Severity:    "warning",
		Check: func(node ast.Node) []Issue {
			var issues []Issue
			ast.Inspect(node, func(n ast.Node) bool {
				if ret, ok := n.(*ast.ReturnStmt); ok {
					if hasUnwrappedError(ret) {
						issues = append(issues, Issue{
							Type:       "pattern",
							Message:    "Unwrapped error detected",
							Severity:   "warning",
							Suggestion: "Use fmt.Errorf with %w for error wrapping",
						})
					}
				}
				return true
			})
			return issues
		},
	},
	{
		Name:        "error-types",
		Description: "Analyze custom error types",
		Severity:    "info",
		Check: func(node ast.Node) []Issue {
			var issues []Issue
			ast.Inspect(node, func(n ast.Node) bool {
				if ts, ok := n.(*ast.TypeSpec); ok {
					if isErrorType(ts) && !hasErrorFields(ts) {
						issues = append(issues, Issue{
							Type:       "pattern",
							Message:    fmt.Sprintf("Error type %s lacks context fields", ts.Name.Name),
							Severity:   "info",
							Suggestion: "Add fields for error context",
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

func isOptionPattern(ts *ast.TypeSpec) bool {
	// Look for Option type and Apply method
	hasOptionType := false
	hasApplyMethod := false

	ast.Inspect(ts, func(n ast.Node) bool {
		switch v := n.(type) {
		case *ast.TypeSpec:
			if strings.HasSuffix(v.Name.Name, "Option") {
				hasOptionType = true
			}
		case *ast.FuncDecl:
			if v.Name.Name == "Apply" {
				hasApplyMethod = true
			}
		}
		return true
	})

	return hasOptionType && hasApplyMethod
}

func isConstructor(fd *ast.FuncDecl) bool {
	return strings.HasPrefix(fd.Name.Name, "New") && fd.Recv == nil
}

func hasValidation(fd *ast.FuncDecl) bool {
	hasCheck := false
	ast.Inspect(fd, func(n ast.Node) bool {
		if _, ok := n.(*ast.IfStmt); ok {
			// Look for nil checks or validation
			hasCheck = true
			return false
		}
		return true
	})
	return hasCheck
}

func isWorkerPool(fd *ast.FuncDecl) bool {
	hasWorkers := false
	hasJobChannel := false

	ast.Inspect(fd, func(n ast.Node) bool {
		switch n.(type) {
		case *ast.GoStmt:
			hasWorkers = true
		case *ast.ChanType:
			hasJobChannel = true
		}
		return true
	})

	return hasWorkers && hasJobChannel
}

func isPipeline(fd *ast.FuncDecl) bool {
	// Look for channel input and output
	inChan := false
	outChan := false

	if fd.Type.Params != nil {
		for _, param := range fd.Type.Params.List {
			if _, ok := param.Type.(*ast.ChanType); ok {
				inChan = true
				break
			}
		}
	}

	if fd.Type.Results != nil {
		for _, result := range fd.Type.Results.List {
			if _, ok := result.Type.(*ast.ChanType); ok {
				outChan = true
				break
			}
		}
	}

	return inChan && outChan
}

func hasContextHandling(fd *ast.FuncDecl) bool {
	hasContext := false
	hasSelect := false

	ast.Inspect(fd, func(n ast.Node) bool {
		switch n.(type) {
		case *ast.SelectStmt:
			hasSelect = true
		case *ast.SelectorExpr:
			if sel, ok := n.(*ast.SelectorExpr); ok {
				if sel.Sel.Name == "Context" {
					hasContext = true
				}
			}
		}
		return true
	})

	return hasContext && hasSelect
}

func hasUnwrappedError(ret *ast.ReturnStmt) bool {
	for _, expr := range ret.Results {
		if ident, ok := expr.(*ast.Ident); ok {
			if ident.Name == "err" {
				return true
			}
		}
	}
	return false
}

func isErrorType(ts *ast.TypeSpec) bool {
	// Check if type implements error interface
	if st, ok := ts.Type.(*ast.StructType); ok {
		hasError := false
		for _, method := range st.Fields.List {
			if ident, ok := method.Type.(*ast.Ident); ok {
				if ident.Name == "error" {
					hasError = true
					break
				}
			}
		}
		return hasError
	}
	return false
}

func hasErrorFields(ts *ast.TypeSpec) bool {
	if st, ok := ts.Type.(*ast.StructType); ok {
		for _, field := range st.Fields.List {
			if len(field.Names) > 0 {
				return true // Has at least one named field
			}
		}
	}
	return false
}

// RunGoPatternAnalysis runs Go-specific, concurrency, and error pattern checks
func RunGoPatternAnalysis(node ast.Node) []Issue {
	var issues []Issue

	// Run Go pattern checks
	for _, check := range goPatternChecks {
		issues = append(issues, check.Check(node)...)
	}

	// Run concurrency checks
	for _, check := range goConcurrencyChecks {
		issues = append(issues, check.Check(node)...)
	}

	// Run error checks
	for _, check := range errorChecks {
		issues = append(issues, check.Check(node)...)
	}

	return issues
}
