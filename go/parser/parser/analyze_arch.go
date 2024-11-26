package parser

import (
	"fmt"
	"go/ast"
	"path/filepath"
	"strings"
)

// ArchitectureCheck represents an architectural analysis check
type ArchitectureCheck struct {
	Name        string
	Description string
	Severity    string
	Check       func(node ast.Node, pkg string) []Issue
}

// DependencyCheck represents a dependency analysis check
type DependencyCheck struct {
	Name        string
	Description string
	Severity    string
	Check       func(node ast.Node) []Issue
}

// TestCheck represents a test coverage analysis check
type TestCheck struct {
	Name        string
	Description string
	Severity    string
	Check       func(node ast.Node) []Issue
}

// Architecture checks
var architectureChecks = []ArchitectureCheck{
	{
		Name:        "layer-violation",
		Description: "Detect violations of layered architecture",
		Severity:    "error",
		Check: func(node ast.Node, pkg string) []Issue {
			var issues []Issue
			ast.Inspect(node, func(n ast.Node) bool {
				if imp, ok := n.(*ast.ImportSpec); ok {
					importPath := strings.Trim(imp.Path.Value, `"`)
					if isLayerViolation(pkg, importPath) {
						issues = append(issues, Issue{
							Type:       "architecture",
							Message:    fmt.Sprintf("Layer violation: %s imports %s", pkg, importPath),
							Severity:   "error",
							Suggestion: "Respect layer boundaries and dependency rules",
						})
					}
				}
				return true
			})
			return issues
		},
	},
	{
		Name:        "package-cycles",
		Description: "Detect package dependency cycles",
		Severity:    "warning",
		Check: func(node ast.Node, pkg string) []Issue {
			var issues []Issue
			deps := make(map[string][]string)

			ast.Inspect(node, func(n ast.Node) bool {
				if imp, ok := n.(*ast.ImportSpec); ok {
					importPath := strings.Trim(imp.Path.Value, `"`)
					deps[pkg] = append(deps[pkg], importPath)
				}
				return true
			})

			if hasCycle(deps) {
				issues = append(issues, Issue{
					Type:       "architecture",
					Message:    "Package dependency cycle detected",
					Severity:   "warning",
					Suggestion: "Break circular dependencies using interfaces or restructuring",
				})
			}

			return issues
		},
	},
}

// Dependency checks
var dependencyChecks = []DependencyCheck{
	{
		Name:        "unused-imports",
		Description: "Detect unused imports",
		Severity:    "warning",
		Check: func(node ast.Node) []Issue {
			var issues []Issue
			imports := make(map[string]bool)
			usedIdents := make(map[string]bool)

			// Collect imports
			ast.Inspect(node, func(n ast.Node) bool {
				if imp, ok := n.(*ast.ImportSpec); ok {
					if imp.Name != nil {
						imports[imp.Name.Name] = false
					} else {
						path := strings.Trim(imp.Path.Value, `"`)
						imports[filepath.Base(path)] = false
					}
				}
				return true
			})

			// Check usage
			ast.Inspect(node, func(n ast.Node) bool {
				if sel, ok := n.(*ast.SelectorExpr); ok {
					if ident, ok := sel.X.(*ast.Ident); ok {
						usedIdents[ident.Name] = true
					}
				}
				return true
			})

			// Find unused imports
			for imp := range imports {
				if !usedIdents[imp] {
					issues = append(issues, Issue{
						Type:       "dependency",
						Message:    fmt.Sprintf("Unused import: %s", imp),
						Severity:   "warning",
						Suggestion: "Remove unused import",
					})
				}
			}

			return issues
		},
	},
	{
		Name:        "version-conflicts",
		Description: "Detect potential version conflicts",
		Severity:    "warning",
		Check: func(node ast.Node) []Issue {
			var issues []Issue
			versions := make(map[string]string)

			ast.Inspect(node, func(n ast.Node) bool {
				if imp, ok := n.(*ast.ImportSpec); ok {
					path := strings.Trim(imp.Path.Value, `"`)
					if ver := extractVersion(path); ver != "" {
						if existing, ok := versions[path]; ok && existing != ver {
							issues = append(issues, Issue{
								Type:       "dependency",
								Message:    fmt.Sprintf("Version conflict for %s: %s vs %s", path, existing, ver),
								Severity:   "warning",
								Suggestion: "Align dependency versions",
							})
						}
						versions[path] = ver
					}
				}
				return true
			})

			return issues
		},
	},
}

// Test coverage checks
var testChecks = []TestCheck{
	{
		Name:        "missing-tests",
		Description: "Detect exported items without tests",
		Severity:    "warning",
		Check: func(node ast.Node) []Issue {
			var issues []Issue
			exported := make(map[string]bool)
			tested := make(map[string]bool)

			// Collect exported items
			ast.Inspect(node, func(n ast.Node) bool {
				switch v := n.(type) {
				case *ast.FuncDecl:
					if v.Name.IsExported() {
						exported[v.Name.Name] = true
					}
				case *ast.TypeSpec:
					if v.Name.IsExported() {
						exported[v.Name.Name] = true
					}
				}
				return true
			})

			// Check test coverage
			ast.Inspect(node, func(n ast.Node) bool {
				if fn, ok := n.(*ast.FuncDecl); ok {
					if strings.HasPrefix(fn.Name.Name, "Test") {
						testName := strings.TrimPrefix(fn.Name.Name, "Test")
						tested[testName] = true
					}
				}
				return true
			})

			// Find untested items
			for item := range exported {
				if !tested[item] {
					issues = append(issues, Issue{
						Type:       "test",
						Message:    fmt.Sprintf("No tests found for exported item: %s", item),
						Severity:   "warning",
						Suggestion: "Add tests for exported functionality",
					})
				}
			}

			return issues
		},
	},
	{
		Name:        "test-quality",
		Description: "Analyze test quality",
		Severity:    "info",
		Check: func(node ast.Node) []Issue {
			var issues []Issue

			ast.Inspect(node, func(n ast.Node) bool {
				if fn, ok := n.(*ast.FuncDecl); ok {
					if strings.HasPrefix(fn.Name.Name, "Test") {
						// Check for assertions
						hasAssertions := false
						ast.Inspect(fn, func(n ast.Node) bool {
							if call, ok := n.(*ast.CallExpr); ok {
								if sel, ok := call.Fun.(*ast.SelectorExpr); ok {
									if sel.Sel.Name == "Error" || sel.Sel.Name == "Fatal" ||
										strings.HasPrefix(sel.Sel.Name, "Assert") ||
										strings.HasPrefix(sel.Sel.Name, "Require") {
										hasAssertions = true
										return false
									}
								}
							}
							return true
						})

						if !hasAssertions {
							issues = append(issues, Issue{
								Type:       "test",
								Message:    fmt.Sprintf("Test %s has no assertions", fn.Name.Name),
								Severity:   "info",
								Suggestion: "Add assertions to verify test expectations",
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

// Helper functions

func isLayerViolation(pkg, imp string) bool {
	layers := map[string]int{
		"presentation":   1,
		"application":    2,
		"domain":         3,
		"infrastructure": 4,
	}

	pkgLayer := -1
	impLayer := -1

	for layer, level := range layers {
		if strings.Contains(pkg, layer) {
			pkgLayer = level
		}
		if strings.Contains(imp, layer) {
			impLayer = level
		}
	}

	// Lower layers should not depend on higher layers
	return pkgLayer != -1 && impLayer != -1 && pkgLayer < impLayer
}

func hasCycle(deps map[string][]string) bool {
	visited := make(map[string]bool)
	path := make(map[string]bool)

	var visit func(pkg string) bool
	visit = func(pkg string) bool {
		if !visited[pkg] {
			visited[pkg] = true
			path[pkg] = true

			for _, dep := range deps[pkg] {
				if !visited[dep] && visit(dep) {
					return true
				} else if path[dep] {
					return true
				}
			}
		}
		path[pkg] = false
		return false
	}

	for pkg := range deps {
		if !visited[pkg] {
			if visit(pkg) {
				return true
			}
		}
	}

	return false
}

func extractVersion(path string) string {
	parts := strings.Split(path, "@")
	if len(parts) > 1 {
		return parts[1]
	}
	return ""
}

// RunArchitecturalAnalysis runs architecture, dependency, and test coverage checks
func RunArchitecturalAnalysis(node ast.Node, pkg string) []Issue {
	var issues []Issue

	// Run architecture checks
	for _, check := range architectureChecks {
		issues = append(issues, check.Check(node, pkg)...)
	}

	// Run dependency checks
	for _, check := range dependencyChecks {
		issues = append(issues, check.Check(node)...)
	}

	// Run test coverage checks
	for _, check := range testChecks {
		issues = append(issues, check.Check(node)...)
	}

	return issues
}
