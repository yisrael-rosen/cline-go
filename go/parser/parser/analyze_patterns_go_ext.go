package parser

import (
	"fmt"
	"go/ast"
	"strings"
)

// InterfacePatternCheck represents an interface pattern analysis check
type InterfacePatternCheck struct {
	Name        string
	Description string
	Severity    string
	Check       func(node ast.Node) []Issue
}

// TestPatternCheck represents a testing pattern analysis check
type TestPatternCheck struct {
	Name        string
	Description string
	Severity    string
	Check       func(node ast.Node) []Issue
}

// PackagePatternCheck represents a package organization pattern check
type PackagePatternCheck struct {
	Name        string
	Description string
	Severity    string
	Check       func(node ast.Node) []Issue
}

// Interface pattern checks
var interfaceChecks = []InterfacePatternCheck{
	{
		Name:        "interface-composition",
		Description: "Detect interface composition patterns",
		Severity:    "info",
		Check: func(node ast.Node) []Issue {
			var issues []Issue
			ast.Inspect(node, func(n ast.Node) bool {
				if ts, ok := n.(*ast.TypeSpec); ok {
					if it, ok := ts.Type.(*ast.InterfaceType); ok {
						if !hasGoodComposition(it) {
							issues = append(issues, Issue{
								Type:       "pattern",
								Message:    fmt.Sprintf("Interface %s could benefit from composition", ts.Name.Name),
								Severity:   "info",
								Suggestion: "Consider breaking down into smaller interfaces",
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
		Name:        "io-interfaces",
		Description: "Analyze io package interface usage",
		Severity:    "info",
		Check: func(node ast.Node) []Issue {
			var issues []Issue
			ast.Inspect(node, func(n ast.Node) bool {
				if ts, ok := n.(*ast.TypeSpec); ok {
					if st, ok := ts.Type.(*ast.StructType); ok {
						if shouldImplementIO(st) && !implementsIO(st) {
							issues = append(issues, Issue{
								Type:       "pattern",
								Message:    fmt.Sprintf("Type %s could implement io interfaces", ts.Name.Name),
								Severity:   "info",
								Suggestion: "Consider implementing io.Reader/Writer",
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

// Test pattern checks
var testPatternChecks = []TestPatternCheck{
	{
		Name:        "table-driven",
		Description: "Detect table-driven tests",
		Severity:    "info",
		Check: func(node ast.Node) []Issue {
			var issues []Issue
			ast.Inspect(node, func(n ast.Node) bool {
				if fd, ok := n.(*ast.FuncDecl); ok {
					if isTestFunc(fd) && !isTableDriven(fd) {
						issues = append(issues, Issue{
							Type:       "pattern",
							Message:    fmt.Sprintf("Test %s could use table-driven approach", fd.Name.Name),
							Severity:   "info",
							Suggestion: "Consider using test cases slice",
						})
					}
				}
				return true
			})
			return issues
		},
	},
	{
		Name:        "test-helpers",
		Description: "Analyze test helper functions",
		Severity:    "info",
		Check: func(node ast.Node) []Issue {
			var issues []Issue
			ast.Inspect(node, func(n ast.Node) bool {
				if fd, ok := n.(*ast.FuncDecl); ok {
					if isTestHelper(fd) && !usesHelperMarker(fd) {
						issues = append(issues, Issue{
							Type:       "pattern",
							Message:    fmt.Sprintf("Helper function %s should be marked", fd.Name.Name),
							Severity:   "info",
							Suggestion: "Add t.Helper() call",
						})
					}
				}
				return true
			})
			return issues
		},
	},
}

// Package pattern checks
var packageChecks = []PackagePatternCheck{
	{
		Name:        "package-layout",
		Description: "Analyze package organization",
		Severity:    "info",
		Check: func(node ast.Node) []Issue {
			var issues []Issue
			ast.Inspect(node, func(n ast.Node) bool {
				if file, ok := n.(*ast.File); ok {
					if !hasGoodLayout(file) {
						issues = append(issues, Issue{
							Type:       "pattern",
							Message:    "Package could be better organized",
							Severity:   "info",
							Suggestion: "Consider standard Go project layout",
						})
					}
				}
				return true
			})
			return issues
		},
	},
	{
		Name:        "internal-packages",
		Description: "Check internal package usage",
		Severity:    "warning",
		Check: func(node ast.Node) []Issue {
			var issues []Issue
			ast.Inspect(node, func(n ast.Node) bool {
				if file, ok := n.(*ast.File); ok {
					if shouldBeInternal(file) {
						issues = append(issues, Issue{
							Type:       "pattern",
							Message:    "Consider using internal package",
							Severity:   "warning",
							Suggestion: "Move implementation details to internal/",
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

func hasGoodComposition(it *ast.InterfaceType) bool {
	// Check if interface is composed of smaller interfaces
	for _, method := range it.Methods.List {
		if _, ok := method.Type.(*ast.SelectorExpr); ok {
			return true
		}
	}
	return len(it.Methods.List) <= 3 // Small interfaces are okay
}

func shouldImplementIO(st *ast.StructType) bool {
	// Check if type deals with data streams
	for _, field := range st.Fields.List {
		if field.Type != nil {
			if ident, ok := field.Type.(*ast.Ident); ok {
				name := ident.Name
				if strings.Contains(name, "Buffer") || strings.Contains(name, "Stream") {
					return true
				}
			}
		}
	}
	return false
}

func implementsIO(st *ast.StructType) bool {
	hasRead := false
	hasWrite := false

	ast.Inspect(st, func(n ast.Node) bool {
		if fd, ok := n.(*ast.FuncDecl); ok {
			if fd.Name.Name == "Read" {
				hasRead = true
			}
			if fd.Name.Name == "Write" {
				hasWrite = true
			}
		}
		return true
	})

	return hasRead || hasWrite
}

func isTestFunc(fd *ast.FuncDecl) bool {
	return strings.HasPrefix(fd.Name.Name, "Test") &&
		!strings.HasSuffix(fd.Name.Name, "Helper")
}

func isTableDriven(fd *ast.FuncDecl) bool {
	hasTestCases := false
	hasRangeStmt := false

	ast.Inspect(fd, func(n ast.Node) bool {
		switch n := n.(type) {
		case *ast.RangeStmt:
			hasRangeStmt = true
		case *ast.CompositeLit:
			if arr, ok := n.Type.(*ast.ArrayType); ok {
				if _, ok := arr.Elt.(*ast.StructType); ok {
					hasTestCases = true
				}
			}
		}
		return true
	})

	return hasTestCases && hasRangeStmt
}

func isTestHelper(fd *ast.FuncDecl) bool {
	return strings.HasSuffix(fd.Name.Name, "Helper") ||
		strings.Contains(fd.Name.Name, "helper")
}

func usesHelperMarker(fd *ast.FuncDecl) bool {
	hasHelper := false
	ast.Inspect(fd, func(n ast.Node) bool {
		if ce, ok := n.(*ast.CallExpr); ok {
			if se, ok := ce.Fun.(*ast.SelectorExpr); ok {
				if se.Sel.Name == "Helper" {
					hasHelper = true
					return false
				}
			}
		}
		return true
	})
	return hasHelper
}

func hasGoodLayout(file *ast.File) bool {
	// Check for standard Go project layout patterns
	hasDoc := false
	hasExports := false
	hasTests := false

	for _, decl := range file.Decls {
		if doc, ok := decl.(*ast.GenDecl); ok && doc.Doc != nil {
			hasDoc = true
		}
		if fn, ok := decl.(*ast.FuncDecl); ok {
			if fn.Name.IsExported() {
				hasExports = true
			}
			if strings.HasPrefix(fn.Name.Name, "Test") {
				hasTests = true
			}
		}
	}

	return hasDoc && hasExports && hasTests
}

func shouldBeInternal(file *ast.File) bool {
	// Check if package contains implementation details
	hasPrivateDetails := false
	hasPublicAPI := false

	for _, decl := range file.Decls {
		if fn, ok := decl.(*ast.FuncDecl); ok {
			if fn.Name.IsExported() {
				hasPublicAPI = true
			} else {
				hasPrivateDetails = true
			}
		}
	}

	return hasPrivateDetails && !hasPublicAPI
}

// RunGoExtendedPatternAnalysis runs interface, test, and package pattern checks
func RunGoExtendedPatternAnalysis(node ast.Node) []Issue {
	var issues []Issue

	// Run interface checks
	for _, check := range interfaceChecks {
		issues = append(issues, check.Check(node)...)
	}

	// Run test checks
	for _, check := range testPatternChecks {
		issues = append(issues, check.Check(node)...)
	}

	// Run package checks
	for _, check := range packageChecks {
		issues = append(issues, check.Check(node)...)
	}

	return issues
}
