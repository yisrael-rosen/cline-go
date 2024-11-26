package parser

import (
	"fmt"
	"go/ast"
	"strings"
)

// BehavioralPatternCheck represents a behavioral pattern analysis check
type BehavioralPatternCheck struct {
	Name        string
	Description string
	Severity    string
	Check       func(node ast.Node) []Issue
}

// StructuralPatternCheck represents a structural pattern analysis check
type StructuralPatternCheck struct {
	Name        string
	Description string
	Severity    string
	Check       func(node ast.Node) []Issue
}

// CreationalPatternCheck represents a creational pattern analysis check
type CreationalPatternCheck struct {
	Name        string
	Description string
	Severity    string
	Check       func(node ast.Node) []Issue
}

// Behavioral pattern checks
var behavioralChecks = []BehavioralPatternCheck{
	{
		Name:        "observer",
		Description: "Detect observer pattern implementation",
		Severity:    "info",
		Check: func(node ast.Node) []Issue {
			var issues []Issue
			ast.Inspect(node, func(n ast.Node) bool {
				if ts, ok := n.(*ast.TypeSpec); ok {
					if isObserverPattern(ts) {
						issues = append(issues, Issue{
							Type:       "pattern",
							Message:    fmt.Sprintf("Observer pattern detected in %s", ts.Name.Name),
							Severity:   "info",
							Suggestion: "Consider using channels for event handling",
						})
					}
				}
				return true
			})
			return issues
		},
	},
	{
		Name:        "strategy",
		Description: "Analyze strategy pattern usage",
		Severity:    "info",
		Check: func(node ast.Node) []Issue {
			var issues []Issue
			ast.Inspect(node, func(n ast.Node) bool {
				if ts, ok := n.(*ast.TypeSpec); ok {
					if isStrategyPattern(ts) {
						issues = append(issues, Issue{
							Type:       "pattern",
							Message:    fmt.Sprintf("Strategy pattern detected in %s", ts.Name.Name),
							Severity:   "info",
							Suggestion: "Consider using functional options pattern",
						})
					}
				}
				return true
			})
			return issues
		},
	},
}

// Structural pattern checks
var structuralChecks = []StructuralPatternCheck{
	{
		Name:        "decorator",
		Description: "Detect decorator pattern implementation",
		Severity:    "info",
		Check: func(node ast.Node) []Issue {
			var issues []Issue
			ast.Inspect(node, func(n ast.Node) bool {
				if ts, ok := n.(*ast.TypeSpec); ok {
					if isDecoratorPattern(ts) {
						issues = append(issues, Issue{
							Type:       "pattern",
							Message:    fmt.Sprintf("Decorator pattern detected in %s", ts.Name.Name),
							Severity:   "info",
							Suggestion: "Consider using middleware pattern for HTTP handlers",
						})
					}
				}
				return true
			})
			return issues
		},
	},
	{
		Name:        "adapter",
		Description: "Analyze adapter pattern usage",
		Severity:    "info",
		Check: func(node ast.Node) []Issue {
			var issues []Issue
			ast.Inspect(node, func(n ast.Node) bool {
				if ts, ok := n.(*ast.TypeSpec); ok {
					if isAdapterPattern(ts) {
						issues = append(issues, Issue{
							Type:       "pattern",
							Message:    fmt.Sprintf("Adapter pattern detected in %s", ts.Name.Name),
							Severity:   "info",
							Suggestion: "Consider using interfaces for better abstraction",
						})
					}
				}
				return true
			})
			return issues
		},
	},
}

// Creational pattern checks
var creationalChecks = []CreationalPatternCheck{
	{
		Name:        "builder",
		Description: "Detect builder pattern implementation",
		Severity:    "info",
		Check: func(node ast.Node) []Issue {
			var issues []Issue
			ast.Inspect(node, func(n ast.Node) bool {
				if ts, ok := n.(*ast.TypeSpec); ok {
					if isBuilderPattern(ts) {
						issues = append(issues, Issue{
							Type:       "pattern",
							Message:    fmt.Sprintf("Builder pattern detected in %s", ts.Name.Name),
							Severity:   "info",
							Suggestion: "Consider using functional options pattern",
						})
					}
				}
				return true
			})
			return issues
		},
	},
	{
		Name:        "prototype",
		Description: "Analyze prototype pattern usage",
		Severity:    "info",
		Check: func(node ast.Node) []Issue {
			var issues []Issue
			ast.Inspect(node, func(n ast.Node) bool {
				if ts, ok := n.(*ast.TypeSpec); ok {
					if isPrototypePattern(ts) {
						issues = append(issues, Issue{
							Type:       "pattern",
							Message:    fmt.Sprintf("Prototype pattern detected in %s", ts.Name.Name),
							Severity:   "info",
							Suggestion: "Consider using Clone() method",
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

func isObserverPattern(ts *ast.TypeSpec) bool {
	// Look for Subscribe/Notify methods
	hasSubscribe := false
	hasNotify := false

	ast.Inspect(ts, func(n ast.Node) bool {
		if fd, ok := n.(*ast.FuncDecl); ok {
			if strings.Contains(fd.Name.Name, "Subscribe") || strings.Contains(fd.Name.Name, "Register") {
				hasSubscribe = true
			}
			if strings.Contains(fd.Name.Name, "Notify") || strings.Contains(fd.Name.Name, "Publish") {
				hasNotify = true
			}
		}
		return true
	})

	return hasSubscribe && hasNotify
}

func isStrategyPattern(ts *ast.TypeSpec) bool {
	// Look for strategy interface and implementations
	if it, ok := ts.Type.(*ast.InterfaceType); ok {
		// Check if interface has a single method
		return len(it.Methods.List) == 1
	}
	return false
}

func isDecoratorPattern(ts *ast.TypeSpec) bool {
	// Look for wrapper struct with embedded interface
	if st, ok := ts.Type.(*ast.StructType); ok {
		for _, field := range st.Fields.List {
			if _, ok := field.Type.(*ast.InterfaceType); ok {
				return true
			}
		}
	}
	return false
}

func isAdapterPattern(ts *ast.TypeSpec) bool {
	// Look for adapter struct with adaptee field
	if st, ok := ts.Type.(*ast.StructType); ok {
		hasAdaptee := false
		implementsInterface := false

		for _, field := range st.Fields.List {
			if len(field.Names) == 0 {
				// Embedded interface
				implementsInterface = true
			} else {
				// Named field (potential adaptee)
				hasAdaptee = true
			}
		}

		return hasAdaptee && implementsInterface
	}
	return false
}

func isBuilderPattern(ts *ast.TypeSpec) bool {
	// Look for builder methods returning *Builder
	hasBuilderMethods := false
	hasBuild := false

	ast.Inspect(ts, func(n ast.Node) bool {
		if fd, ok := n.(*ast.FuncDecl); ok {
			if fd.Recv != nil {
				if strings.Contains(fd.Name.Name, "With") || strings.Contains(fd.Name.Name, "Set") {
					hasBuilderMethods = true
				}
				if fd.Name.Name == "Build" {
					hasBuild = true
				}
			}
		}
		return true
	})

	return hasBuilderMethods && hasBuild
}

func isPrototypePattern(ts *ast.TypeSpec) bool {
	// Look for Clone or Copy method
	hasClone := false

	ast.Inspect(ts, func(n ast.Node) bool {
		if fd, ok := n.(*ast.FuncDecl); ok {
			if fd.Name.Name == "Clone" || fd.Name.Name == "Copy" {
				hasClone = true
				return false
			}
		}
		return true
	})

	return hasClone
}

// RunExtendedPatternAnalysis runs behavioral, structural, and creational pattern checks
func RunExtendedPatternAnalysis(node ast.Node) []Issue {
	var issues []Issue

	// Run behavioral checks
	for _, check := range behavioralChecks {
		issues = append(issues, check.Check(node)...)
	}

	// Run structural checks
	for _, check := range structuralChecks {
		issues = append(issues, check.Check(node)...)
	}

	// Run creational checks
	for _, check := range creationalChecks {
		issues = append(issues, check.Check(node)...)
	}

	return issues
}
