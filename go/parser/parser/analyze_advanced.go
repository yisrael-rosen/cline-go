package parser

import (
	"fmt"
	"go/ast"
	"go/token"
	"strings"
)

// SecurityCheck represents a security analysis check
type SecurityCheck struct {
	Name        string
	Description string
	Severity    string
	Check       func(node ast.Node) []Issue
}

// PerformanceCheck represents a performance analysis check
type PerformanceCheck struct {
	Name        string
	Description string
	Severity    string
	Check       func(node ast.Node) []Issue
}

// ConcurrencyCheck represents a concurrency analysis check
type ConcurrencyCheck struct {
	Name        string
	Description string
	Severity    string
	Check       func(node ast.Node) []Issue
}

// Security checks
var securityChecks = []SecurityCheck{
	{
		Name:        "sql-injection",
		Description: "Detect potential SQL injection vulnerabilities",
		Severity:    "critical",
		Check: func(node ast.Node) []Issue {
			var issues []Issue
			ast.Inspect(node, func(n ast.Node) bool {
				if call, ok := n.(*ast.CallExpr); ok {
					if sel, ok := call.Fun.(*ast.SelectorExpr); ok {
						if strings.HasPrefix(sel.Sel.Name, "Query") || strings.HasPrefix(sel.Sel.Name, "Exec") {
							// Check for string concatenation in SQL queries
							for _, arg := range call.Args {
								if binary, ok := arg.(*ast.BinaryExpr); ok {
									if binary.Op == token.ADD {
										issues = append(issues, Issue{
											Type:       "security",
											Message:    "Potential SQL injection vulnerability",
											Severity:   "critical",
											Suggestion: "Use parameterized queries instead of string concatenation",
										})
									}
								}
							}
						}
					}
				}
				return true
			})
			return issues
		},
	},
	{
		Name:        "hardcoded-secrets",
		Description: "Detect hardcoded secrets and credentials",
		Severity:    "critical",
		Check: func(node ast.Node) []Issue {
			var issues []Issue
			ast.Inspect(node, func(n ast.Node) bool {
				if assign, ok := n.(*ast.AssignStmt); ok {
					for _, rhs := range assign.Rhs {
						if lit, ok := rhs.(*ast.BasicLit); ok {
							if lit.Kind == token.STRING {
								value := strings.Trim(lit.Value, `"'`)
								if looksLikeSecret(value) {
									issues = append(issues, Issue{
										Type:       "security",
										Message:    "Hardcoded secret detected",
										Severity:   "critical",
										Suggestion: "Use environment variables or a secure configuration system",
									})
								}
							}
						}
					}
				}
				return true
			})
			return issues
		},
	},
}

// Performance checks
var performanceChecks = []PerformanceCheck{
	{
		Name:        "large-allocations",
		Description: "Detect potentially unnecessary large allocations",
		Severity:    "warning",
		Check: func(node ast.Node) []Issue {
			var issues []Issue
			ast.Inspect(node, func(n ast.Node) bool {
				if makeExpr, ok := n.(*ast.CallExpr); ok {
					if fun, ok := makeExpr.Fun.(*ast.Ident); ok && fun.Name == "make" {
						if len(makeExpr.Args) >= 2 {
							if lit, ok := makeExpr.Args[1].(*ast.BasicLit); ok {
								if size := parseSize(lit.Value); size > 1000000 {
									issues = append(issues, Issue{
										Type:       "performance",
										Message:    fmt.Sprintf("Large allocation of size %d", size),
										Severity:   "warning",
										Suggestion: "Consider using a buffer pool or reducing allocation size",
									})
								}
							}
						}
					}
				}
				return true
			})
			return issues
		},
	},
	{
		Name:        "inefficient-loops",
		Description: "Detect potentially inefficient loop patterns",
		Severity:    "warning",
		Check: func(node ast.Node) []Issue {
			var issues []Issue
			ast.Inspect(node, func(n ast.Node) bool {
				if loop, ok := n.(*ast.RangeStmt); ok {
					if _, ok := loop.Key.(*ast.Ident); !ok {
						// Check for unnecessary value copies in range loops
						if val, ok := loop.Value.(*ast.Ident); ok {
							if isLargeType(val) {
								issues = append(issues, Issue{
									Type:       "performance",
									Message:    "Potentially inefficient value copy in range loop",
									Severity:   "warning",
									Suggestion: "Use a pointer or key-only range if value is not needed",
								})
							}
						}
					}
				}
				return true
			})
			return issues
		},
	},
}

// Concurrency checks
var concurrencyChecks = []ConcurrencyCheck{
	{
		Name:        "mutex-pass-by-value",
		Description: "Detect mutex passed by value",
		Severity:    "error",
		Check: func(node ast.Node) []Issue {
			var issues []Issue
			ast.Inspect(node, func(n ast.Node) bool {
				if field, ok := n.(*ast.Field); ok {
					if sel, ok := field.Type.(*ast.SelectorExpr); ok {
						if sel.Sel.Name == "Mutex" {
							if !isPointerType(field.Type) {
								issues = append(issues, Issue{
									Type:       "concurrency",
									Message:    "Mutex passed by value",
									Severity:   "error",
									Suggestion: "Pass mutex by pointer to avoid data races",
								})
							}
						}
					}
				}
				return true
			})
			return issues
		},
	},
	{
		Name:        "goroutine-leaks",
		Description: "Detect potential goroutine leaks",
		Severity:    "warning",
		Check: func(node ast.Node) []Issue {
			var issues []Issue
			ast.Inspect(node, func(n ast.Node) bool {
				if goStmt, ok := n.(*ast.GoStmt); ok {
					if !hasContextParameter(goStmt.Call) {
						issues = append(issues, Issue{
							Type:       "concurrency",
							Message:    "Goroutine without context",
							Severity:   "warning",
							Suggestion: "Pass context to goroutine for proper cancellation",
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

func looksLikeSecret(s string) bool {
	secretPatterns := []string{
		"password",
		"secret",
		"key",
		"token",
		"credential",
	}

	s = strings.ToLower(s)
	for _, pattern := range secretPatterns {
		if strings.Contains(s, pattern) {
			return true
		}
	}
	return false
}

func parseSize(s string) int {
	size := 0
	fmt.Sscanf(s, "%d", &size)
	return size
}

func isLargeType(ident *ast.Ident) bool {
	// In a real implementation, this would check the actual type size
	// For now, we'll assume certain type names indicate large types
	largeTypes := []string{
		"struct",
		"array",
		"slice",
		"map",
	}

	for _, t := range largeTypes {
		if strings.Contains(ident.Name, t) {
			return true
		}
	}
	return false
}

func isPointerType(expr ast.Expr) bool {
	_, ok := expr.(*ast.StarExpr)
	return ok
}

func hasContextParameter(call *ast.CallExpr) bool {
	for _, arg := range call.Args {
		if ident, ok := arg.(*ast.Ident); ok {
			if ident.Name == "ctx" || ident.Name == "context" {
				return true
			}
		}
	}
	return false
}

// RunAdvancedAnalysis runs security, performance, and concurrency checks
func RunAdvancedAnalysis(node ast.Node) []Issue {
	var issues []Issue

	// Run security checks
	for _, check := range securityChecks {
		issues = append(issues, check.Check(node)...)
	}

	// Run performance checks
	for _, check := range performanceChecks {
		issues = append(issues, check.Check(node)...)
	}

	// Run concurrency checks
	for _, check := range concurrencyChecks {
		issues = append(issues, check.Check(node)...)
	}

	return issues
}
