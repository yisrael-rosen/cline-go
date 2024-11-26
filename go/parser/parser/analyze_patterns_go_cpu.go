package parser

import (
	"go/ast"
	"go/token"
)

// CachePatternCheck represents a CPU cache pattern check
type CachePatternCheck struct {
	Name        string
	Description string
	Severity    string
	Check       func(node ast.Node) []Issue
}

// AssemblyPatternCheck represents an assembly optimization check
type AssemblyPatternCheck struct {
	Name        string
	Description string
	Severity    string
	Check       func(node ast.Node) []Issue
}

// ProfilingPatternCheck represents a profiling hint check
type ProfilingPatternCheck struct {
	Name        string
	Description string
	Severity    string
	Check       func(node ast.Node) []Issue
}

// Cache pattern checks
var cacheChecks = []CachePatternCheck{
	{
		Name:        "cache-line",
		Description: "Detect cache line padding issues",
		Severity:    "info",
		Check: func(node ast.Node) []Issue {
			var issues []Issue
			ast.Inspect(node, func(n ast.Node) bool {
				if ts, ok := n.(*ast.TypeSpec); ok {
					if hasCacheIssue(ts) {
						issues = append(issues, Issue{
							Type:       "cache",
							Message:    "Struct layout may cause cache line thrashing",
							Severity:   "info",
							Suggestion: "Consider reordering fields or adding padding",
						})
					}
				}
				return true
			})
			return issues
		},
	},
	{
		Name:        "false-sharing",
		Description: "Analyze potential false sharing",
		Severity:    "warning",
		Check: func(node ast.Node) []Issue {
			var issues []Issue
			ast.Inspect(node, func(n ast.Node) bool {
				if ts, ok := n.(*ast.TypeSpec); ok {
					if hasFalseSharing(ts) {
						issues = append(issues, Issue{
							Type:       "cache",
							Message:    "Potential false sharing in concurrent access",
							Severity:   "warning",
							Suggestion: "Add cache line padding between fields",
						})
					}
				}
				return true
			})
			return issues
		},
	},
}

// Assembly optimization checks
var assemblyChecks = []AssemblyPatternCheck{
	{
		Name:        "simd-candidate",
		Description: "Detect SIMD optimization opportunities",
		Severity:    "info",
		Check: func(node ast.Node) []Issue {
			var issues []Issue
			ast.Inspect(node, func(n ast.Node) bool {
				if fd, ok := n.(*ast.FuncDecl); ok {
					if isSIMDCandidate(fd) {
						issues = append(issues, Issue{
							Type:       "assembly",
							Message:    "Function could benefit from SIMD",
							Severity:   "info",
							Suggestion: "Consider using assembly or compiler intrinsics",
						})
					}
				}
				return true
			})
			return issues
		},
	},
	{
		Name:        "branch-predict",
		Description: "Analyze branch prediction patterns",
		Severity:    "info",
		Check: func(node ast.Node) []Issue {
			var issues []Issue
			ast.Inspect(node, func(n ast.Node) bool {
				if ifStmt, ok := n.(*ast.IfStmt); ok {
					if hasPoorBranchPrediction(ifStmt) {
						issues = append(issues, Issue{
							Type:       "assembly",
							Message:    "Branch may cause prediction misses",
							Severity:   "info",
							Suggestion: "Consider likely/unlikely hints",
						})
					}
				}
				return true
			})
			return issues
		},
	},
}

// Profiling pattern checks
var profilingChecks = []ProfilingPatternCheck{
	{
		Name:        "pprof-labels",
		Description: "Check pprof label usage",
		Severity:    "info",
		Check: func(node ast.Node) []Issue {
			var issues []Issue
			ast.Inspect(node, func(n ast.Node) bool {
				if fd, ok := n.(*ast.FuncDecl); ok {
					if needsProfilingLabels(fd) {
						issues = append(issues, Issue{
							Type:       "profiling",
							Message:    "Hot function lacks pprof labels",
							Severity:   "info",
							Suggestion: "Add pprof labels for better profiling",
						})
					}
				}
				return true
			})
			return issues
		},
	},
	{
		Name:        "trace-points",
		Description: "Analyze trace point coverage",
		Severity:    "info",
		Check: func(node ast.Node) []Issue {
			var issues []Issue
			ast.Inspect(node, func(n ast.Node) bool {
				if fd, ok := n.(*ast.FuncDecl); ok {
					if needsTracePoints(fd) {
						issues = append(issues, Issue{
							Type:       "profiling",
							Message:    "Complex function lacks trace points",
							Severity:   "info",
							Suggestion: "Add trace points for better observability",
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

func hasCacheIssue(ts *ast.TypeSpec) bool {
	if st, ok := ts.Type.(*ast.StructType); ok {
		// Check field sizes and alignment
		var totalSize int
		for _, field := range st.Fields.List {
			size := getTypeSize(field.Type)
			if size > 0 {
				totalSize += size
			}
		}
		return totalSize > 64 // Larger than cache line
	}
	return false
}

func hasFalseSharing(ts *ast.TypeSpec) bool {
	if st, ok := ts.Type.(*ast.StructType); ok {
		// Look for concurrent access patterns
		hasAtomic := false
		hasMutex := false
		for _, field := range st.Fields.List {
			if isAtomicType(field.Type) {
				hasAtomic = true
			}
			if isMutexType(field.Type) {
				hasMutex = true
			}
		}
		return hasAtomic || hasMutex
	}
	return false
}

func isSIMDCandidate(fd *ast.FuncDecl) bool {
	// Look for loop patterns that could use SIMD
	hasLoop := false
	hasNumericOps := false

	ast.Inspect(fd.Body, func(n ast.Node) bool {
		switch n := n.(type) {
		case *ast.RangeStmt, *ast.ForStmt:
			hasLoop = true
		case *ast.BinaryExpr:
			if isNumericOp(n.Op) {
				hasNumericOps = true
			}
		}
		return true
	})

	return hasLoop && hasNumericOps
}

func hasPoorBranchPrediction(ifStmt *ast.IfStmt) bool {
	// Check for complex conditions that might be hard to predict
	complexity := 0
	ast.Inspect(ifStmt.Cond, func(n ast.Node) bool {
		switch n.(type) {
		case *ast.BinaryExpr:
			complexity++
		}
		return true
	})
	return complexity > 2
}

func needsProfilingLabels(fd *ast.FuncDecl) bool {
	// Check if function is complex enough to warrant profiling
	complexity := 0
	ast.Inspect(fd.Body, func(n ast.Node) bool {
		switch n.(type) {
		case *ast.CallExpr, *ast.ForStmt, *ast.RangeStmt:
			complexity++
		}
		return true
	})
	return complexity > 5
}

func needsTracePoints(fd *ast.FuncDecl) bool {
	// Check if function has multiple paths that should be traced
	pathCount := 0
	ast.Inspect(fd.Body, func(n ast.Node) bool {
		switch n.(type) {
		case *ast.IfStmt, *ast.SwitchStmt:
			pathCount++
		}
		return true
	})
	return pathCount > 3
}

// Utility functions

func getTypeSize(expr ast.Expr) int {
	switch t := expr.(type) {
	case *ast.Ident:
		switch t.Name {
		case "bool", "int8", "uint8", "byte":
			return 1
		case "int16", "uint16":
			return 2
		case "int32", "uint32", "float32":
			return 4
		case "int64", "uint64", "float64":
			return 8
		}
	}
	return 0
}

func isAtomicType(expr ast.Expr) bool {
	if sel, ok := expr.(*ast.SelectorExpr); ok {
		return sel.Sel.Name == "Value"
	}
	return false
}

func isMutexType(expr ast.Expr) bool {
	if sel, ok := expr.(*ast.SelectorExpr); ok {
		return sel.Sel.Name == "Mutex" || sel.Sel.Name == "RWMutex"
	}
	return false
}

func isNumericOp(op token.Token) bool {
	switch op {
	case token.ADD, token.SUB, token.MUL, token.QUO, token.REM:
		return true
	}
	return false
}

// RunGoCPUPatternAnalysis runs cache, assembly, and profiling pattern checks
func RunGoCPUPatternAnalysis(node ast.Node) []Issue {
	var issues []Issue

	// Run cache checks
	for _, check := range cacheChecks {
		issues = append(issues, check.Check(node)...)
	}

	// Run assembly checks
	for _, check := range assemblyChecks {
		issues = append(issues, check.Check(node)...)
	}

	// Run profiling checks
	for _, check := range profilingChecks {
		issues = append(issues, check.Check(node)...)
	}

	return issues
}
