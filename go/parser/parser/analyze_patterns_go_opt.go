package parser

import (
	"go/ast"
	"go/token"
)

// MemoryPatternCheck represents a memory allocation pattern check
type MemoryPatternCheck struct {
	Name        string
	Description string
	Severity    string
	Check       func(node ast.Node) []Issue
}

// GoroutinePatternCheck represents a goroutine pattern check
type GoroutinePatternCheck struct {
	Name        string
	Description string
	Severity    string
	Check       func(node ast.Node) []Issue
}

// SyncPatternCheck represents a synchronization pattern check
type SyncPatternCheck struct {
	Name        string
	Description string
	Severity    string
	Check       func(node ast.Node) []Issue
}

// Memory allocation pattern checks
var memoryChecks = []MemoryPatternCheck{
	{
		Name:        "heap-allocations",
		Description: "Detect unnecessary heap allocations",
		Severity:    "warning",
		Check: func(node ast.Node) []Issue {
			var issues []Issue
			ast.Inspect(node, func(n ast.Node) bool {
				if call, ok := n.(*ast.CallExpr); ok {
					if isUnnecessaryAllocation(call) {
						issues = append(issues, Issue{
							Type:       "memory",
							Message:    "Unnecessary heap allocation",
							Severity:   "warning",
							Suggestion: "Consider using stack allocation or sync.Pool",
						})
					}
				}
				return true
			})
			return issues
		},
	},
	{
		Name:        "buffer-reuse",
		Description: "Analyze buffer reuse patterns",
		Severity:    "info",
		Check: func(node ast.Node) []Issue {
			var issues []Issue
			ast.Inspect(node, func(n ast.Node) bool {
				if loop, ok := n.(*ast.RangeStmt); ok {
					if shouldReuseBuffer(loop) {
						issues = append(issues, Issue{
							Type:       "memory",
							Message:    "Consider reusing buffer",
							Severity:   "info",
							Suggestion: "Use sync.Pool for buffer reuse",
						})
					}
				}
				return true
			})
			return issues
		},
	},
}

// Goroutine pattern checks
var goroutineChecks = []GoroutinePatternCheck{
	{
		Name:        "goroutine-leaks",
		Description: "Detect potential goroutine leaks",
		Severity:    "error",
		Check: func(node ast.Node) []Issue {
			var issues []Issue
			ast.Inspect(node, func(n ast.Node) bool {
				if goStmt, ok := n.(*ast.GoStmt); ok {
					if mightLeak(goStmt) {
						issues = append(issues, Issue{
							Type:       "goroutine",
							Message:    "Potential goroutine leak",
							Severity:   "error",
							Suggestion: "Add cancellation mechanism",
						})
					}
				}
				return true
			})
			return issues
		},
	},
	{
		Name:        "worker-pools",
		Description: "Analyze worker pool implementations",
		Severity:    "info",
		Check: func(node ast.Node) []Issue {
			var issues []Issue
			ast.Inspect(node, func(n ast.Node) bool {
				if fd, ok := n.(*ast.FuncDecl); ok {
					if isIneffientWorkerPool(fd) {
						issues = append(issues, Issue{
							Type:       "goroutine",
							Message:    "Inefficient worker pool",
							Severity:   "info",
							Suggestion: "Use worker pool with bounded concurrency",
						})
					}
				}
				return true
			})
			return issues
		},
	},
}

// Synchronization pattern checks
var syncChecks = []SyncPatternCheck{
	{
		Name:        "mutex-patterns",
		Description: "Analyze mutex usage patterns",
		Severity:    "warning",
		Check: func(node ast.Node) []Issue {
			var issues []Issue
			ast.Inspect(node, func(n ast.Node) bool {
				if fd, ok := n.(*ast.FuncDecl); ok {
					if hasLongMutexLock(fd) {
						issues = append(issues, Issue{
							Type:       "sync",
							Message:    "Long mutex lock duration",
							Severity:   "warning",
							Suggestion: "Minimize critical section",
						})
					}
				}
				return true
			})
			return issues
		},
	},
	{
		Name:        "channel-patterns",
		Description: "Analyze channel usage patterns",
		Severity:    "warning",
		Check: func(node ast.Node) []Issue {
			var issues []Issue
			ast.Inspect(node, func(n ast.Node) bool {
				if fd, ok := n.(*ast.FuncDecl); ok {
					if hasChannelLeak(fd) {
						issues = append(issues, Issue{
							Type:       "sync",
							Message:    "Potential channel leak",
							Severity:   "warning",
							Suggestion: "Ensure channel is closed",
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

func isUnnecessaryAllocation(call *ast.CallExpr) bool {
	if fun, ok := call.Fun.(*ast.Ident); ok {
		if fun.Name == "make" || fun.Name == "new" {
			// Check if allocation size is small
			if len(call.Args) > 1 {
				if lit, ok := call.Args[1].(*ast.BasicLit); ok {
					if lit.Value == "1" {
						return true // Size 1 allocation might be unnecessary
					}
				}
			}
		}
	}
	return false
}

func shouldReuseBuffer(loop *ast.RangeStmt) bool {
	// Check if loop creates new buffer each iteration
	createsBuffer := false
	ast.Inspect(loop.Body, func(n ast.Node) bool {
		if call, ok := n.(*ast.CallExpr); ok {
			if fun, ok := call.Fun.(*ast.Ident); ok {
				if fun.Name == "make" && len(call.Args) > 0 {
					if ident, ok := call.Args[0].(*ast.Ident); ok {
						if ident.Name == "[]byte" {
							createsBuffer = true
							return false
						}
					}
				}
			}
		}
		return true
	})
	return createsBuffer
}

func mightLeak(goStmt *ast.GoStmt) bool {
	// Check if goroutine has cancellation mechanism
	hasContext := false
	hasSelect := false

	ast.Inspect(goStmt.Call, func(n ast.Node) bool {
		switch n := n.(type) {
		case *ast.SelectorExpr:
			if n.Sel.Name == "Context" {
				hasContext = true
			}
		case *ast.SelectStmt:
			hasSelect = true
		}
		return true
	})

	return !hasContext && !hasSelect
}

func isIneffientWorkerPool(fd *ast.FuncDecl) bool {
	// Check for unbounded goroutine creation
	hasUnboundedGo := false
	hasSemaphore := false

	ast.Inspect(fd.Body, func(n ast.Node) bool {
		switch n := n.(type) {
		case *ast.GoStmt:
			hasUnboundedGo = true
		case *ast.SelectorExpr:
			if n.Sel.Name == "Semaphore" {
				hasSemaphore = true
			}
		}
		return true
	})

	return hasUnboundedGo && !hasSemaphore
}

func hasLongMutexLock(fd *ast.FuncDecl) bool {
	// Check for long critical sections
	lockCount := 0
	stmtCount := 0
	inLock := false

	ast.Inspect(fd.Body, func(n ast.Node) bool {
		if sel, ok := n.(*ast.SelectorExpr); ok {
			if sel.Sel.Name == "Lock" {
				lockCount++
				inLock = true
			} else if sel.Sel.Name == "Unlock" {
				inLock = false
			}
		}
		if inLock {
			if _, ok := n.(*ast.ExprStmt); ok {
				stmtCount++
			}
		}
		return true
	})

	return lockCount > 0 && stmtCount > 5 // More than 5 statements in critical section
}

func hasChannelLeak(fd *ast.FuncDecl) bool {
	// Check for channels that might not be closed
	makesChan := false
	closesChan := false

	ast.Inspect(fd.Body, func(n ast.Node) bool {
		switch n := n.(type) {
		case *ast.CallExpr:
			if fun, ok := n.Fun.(*ast.Ident); ok {
				if fun.Name == "make" {
					if len(n.Args) > 0 {
						if _, ok := n.Args[0].(*ast.ChanType); ok {
							makesChan = true
						}
					}
				}
			}
		case *ast.UnaryExpr:
			if n.Op == token.ARROW {
				closesChan = true
			}
		}
		return true
	})

	return makesChan && !closesChan
}

// RunGoOptimizationPatternAnalysis runs memory, goroutine, and sync pattern checks
func RunGoOptimizationPatternAnalysis(node ast.Node) []Issue {
	var issues []Issue

	// Run memory checks
	for _, check := range memoryChecks {
		issues = append(issues, check.Check(node)...)
	}

	// Run goroutine checks
	for _, check := range goroutineChecks {
		issues = append(issues, check.Check(node)...)
	}

	// Run sync checks
	for _, check := range syncChecks {
		issues = append(issues, check.Check(node)...)
	}

	return issues
}
