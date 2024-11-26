package parser

import (
	"fmt"
	"go/ast"
	"strings"
)

// PatternCheck represents a design pattern analysis check
type PatternCheck struct {
	Name        string
	Description string
	Severity    string
	Check       func(node ast.Node) []Issue
}

// SOLIDCheck represents a SOLID principles analysis check
type SOLIDCheck struct {
	Name        string
	Description string
	Severity    string
	Check       func(node ast.Node) []Issue
}

// APICheck represents an API design analysis check
type APICheck struct {
	Name        string
	Description string
	Severity    string
	Check       func(node ast.Node) []Issue
}

// Design pattern checks
var patternChecks = []PatternCheck{
	{
		Name:        "singleton-usage",
		Description: "Detect singleton pattern usage and potential issues",
		Severity:    "warning",
		Check: func(node ast.Node) []Issue {
			var issues []Issue
			ast.Inspect(node, func(n ast.Node) bool {
				if ts, ok := n.(*ast.TypeSpec); ok {
					if st, ok := ts.Type.(*ast.StructType); ok {
						// Check for singleton characteristics
						if isSingleton(ts, st) {
							issues = append(issues, Issue{
								Type:       "pattern",
								Message:    fmt.Sprintf("Singleton pattern detected in %s", ts.Name.Name),
								Severity:   "warning",
								Suggestion: "Consider dependency injection instead of singleton",
							})
						}
					}
				}
				return true
			})
			return issues
		},
	},
	{
		Name:        "factory-method",
		Description: "Analyze factory method implementations",
		Severity:    "info",
		Check: func(node ast.Node) []Issue {
			var issues []Issue
			ast.Inspect(node, func(n ast.Node) bool {
				if fd, ok := n.(*ast.FuncDecl); ok {
					if isFactoryMethod(fd) {
						// Check factory method best practices
						if !hasErrorReturn(fd) {
							issues = append(issues, Issue{
								Type:       "pattern",
								Message:    fmt.Sprintf("Factory method %s should return error", fd.Name.Name),
								Severity:   "info",
								Suggestion: "Add error return for better error handling",
							})
						}
					}
				}
				return true
			})
			return issues
		},
	},
}

// SOLID principle checks
var solidChecks = []SOLIDCheck{
	{
		Name:        "single-responsibility",
		Description: "Check Single Responsibility Principle",
		Severity:    "warning",
		Check: func(node ast.Node) []Issue {
			var issues []Issue
			ast.Inspect(node, func(n ast.Node) bool {
				if ts, ok := n.(*ast.TypeSpec); ok {
					if st, ok := ts.Type.(*ast.StructType); ok {
						if hasMultipleResponsibilities(st) {
							issues = append(issues, Issue{
								Type:       "solid",
								Message:    fmt.Sprintf("Type %s may have multiple responsibilities", ts.Name.Name),
								Severity:   "warning",
								Suggestion: "Split type into smaller, focused types",
							})
						}
					}
				}
				return true
			})
			return issues
		},
	},
	{
		Name:        "interface-segregation",
		Description: "Check Interface Segregation Principle",
		Severity:    "warning",
		Check: func(node ast.Node) []Issue {
			var issues []Issue
			ast.Inspect(node, func(n ast.Node) bool {
				if ts, ok := n.(*ast.TypeSpec); ok {
					if it, ok := ts.Type.(*ast.InterfaceType); ok {
						if isLargeInterface(it) {
							issues = append(issues, Issue{
								Type:       "solid",
								Message:    fmt.Sprintf("Interface %s may be too large", ts.Name.Name),
								Severity:   "warning",
								Suggestion: "Split interface into smaller, focused interfaces",
							})
						}
					}
				}
				return true
			})
			return issues
		},
	},
}

// API design checks
var apiChecks = []APICheck{
	{
		Name:        "api-versioning",
		Description: "Check API versioning practices",
		Severity:    "warning",
		Check: func(node ast.Node) []Issue {
			var issues []Issue
			ast.Inspect(node, func(n ast.Node) bool {
				if fd, ok := n.(*ast.FuncDecl); ok {
					if isAPIHandler(fd) && !hasVersioning(fd) {
						issues = append(issues, Issue{
							Type:       "api",
							Message:    fmt.Sprintf("API handler %s lacks versioning", fd.Name.Name),
							Severity:   "warning",
							Suggestion: "Add API version to route or handler",
						})
					}
				}
				return true
			})
			return issues
		},
	},
	{
		Name:        "error-responses",
		Description: "Analyze API error handling",
		Severity:    "warning",
		Check: func(node ast.Node) []Issue {
			var issues []Issue
			ast.Inspect(node, func(n ast.Node) bool {
				if fd, ok := n.(*ast.FuncDecl); ok {
					if isAPIHandler(fd) && !hasStructuredErrors(fd) {
						issues = append(issues, Issue{
							Type:       "api",
							Message:    fmt.Sprintf("API handler %s may lack structured error responses", fd.Name.Name),
							Severity:   "warning",
							Suggestion: "Use structured error responses with status codes and messages",
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

func isSingleton(ts *ast.TypeSpec, st *ast.StructType) bool {
	// Check for private instance variable
	hasPrivateInstance := false
	hasGetInstanceMethod := false

	// Look for private instance field
	for _, field := range st.Fields.List {
		if len(field.Names) > 0 && !field.Names[0].IsExported() {
			hasPrivateInstance = true
			break
		}
	}

	// Look for GetInstance method in the same file
	ast.Inspect(ts.Name, func(n ast.Node) bool {
		if fd, ok := n.(*ast.FuncDecl); ok {
			if fd.Name.Name == "GetInstance" || fd.Name.Name == "Instance" {
				hasGetInstanceMethod = true
				return false
			}
		}
		return true
	})

	return hasPrivateInstance && hasGetInstanceMethod
}

func isFactoryMethod(fd *ast.FuncDecl) bool {
	// Check if function returns a new instance
	if fd.Type.Results != nil && len(fd.Type.Results.List) > 0 {
		if strings.HasPrefix(fd.Name.Name, "New") || strings.HasPrefix(fd.Name.Name, "Create") {
			return true
		}
	}
	return false
}

func hasMultipleResponsibilities(st *ast.StructType) bool {
	// Count different types of methods and fields
	var methodGroups = make(map[string]int)

	ast.Inspect(st, func(n ast.Node) bool {
		if fd, ok := n.(*ast.FuncDecl); ok {
			group := categorizeMethod(fd.Name.Name)
			methodGroups[group]++
		}
		return true
	})

	// If we have methods from more than 2 different categories,
	// the type might have too many responsibilities
	return len(methodGroups) > 2
}

func isLargeInterface(it *ast.InterfaceType) bool {
	// Count methods in interface
	methodCount := 0
	for _, method := range it.Methods.List {
		methodCount += len(method.Names)
	}
	return methodCount > 5 // Consider interfaces with more than 5 methods as large
}

func isAPIHandler(fd *ast.FuncDecl) bool {
	// Check if function looks like an HTTP handler
	if fd.Type.Params != nil && len(fd.Type.Params.List) == 2 {
		for _, param := range fd.Type.Params.List {
			if expr, ok := param.Type.(*ast.SelectorExpr); ok {
				if expr.Sel.Name == "ResponseWriter" || expr.Sel.Name == "Request" {
					return true
				}
			}
		}
	}
	return false
}

func hasVersioning(fd *ast.FuncDecl) bool {
	// Check for version in function name or route
	return strings.Contains(fd.Name.Name, "V1") ||
		strings.Contains(fd.Name.Name, "V2") ||
		strings.Contains(fd.Name.Name, "Version")
}

func hasStructuredErrors(fd *ast.FuncDecl) bool {
	hasErrorStruct := false
	ast.Inspect(fd, func(n ast.Node) bool {
		// Look for error response structs or status codes
		if ce, ok := n.(*ast.CallExpr); ok {
			if se, ok := ce.Fun.(*ast.SelectorExpr); ok {
				if se.Sel.Name == "WriteJSON" || se.Sel.Name == "JSON" {
					hasErrorStruct = true
					return false
				}
			}
		}
		return true
	})
	return hasErrorStruct
}

func categorizeMethod(name string) string {
	switch {
	case strings.HasPrefix(name, "Get") || strings.HasPrefix(name, "Find"):
		return "query"
	case strings.HasPrefix(name, "Save") || strings.HasPrefix(name, "Update"):
		return "mutation"
	case strings.HasPrefix(name, "Validate"):
		return "validation"
	case strings.HasPrefix(name, "Process") || strings.HasPrefix(name, "Handle"):
		return "business"
	default:
		return "other"
	}
}

// RunPatternAnalysis runs design pattern, SOLID, and API checks
func RunPatternAnalysis(node ast.Node) []Issue {
	var issues []Issue

	// Run pattern checks
	for _, check := range patternChecks {
		issues = append(issues, check.Check(node)...)
	}

	// Run SOLID checks
	for _, check := range solidChecks {
		issues = append(issues, check.Check(node)...)
	}

	// Run API checks
	for _, check := range apiChecks {
		issues = append(issues, check.Check(node)...)
	}

	return issues
}
