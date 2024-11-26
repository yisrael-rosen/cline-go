package parser

import (
	"fmt"
	"go/ast"
	"go/parser"
	"go/token"
)

// AnalysisResult represents the result of code analysis
type AnalysisResult struct {
	Success bool        `json:"success"`
	Issues  []Issue     `json:"issues,omitempty"`
	Metrics CodeMetrics `json:"metrics,omitempty"`
	Error   string      `json:"error,omitempty"`
}

// Issue represents a code issue found during analysis
type Issue struct {
	Type       string `json:"type"`
	Message    string `json:"message"`
	File       string `json:"file"`
	Line       int    `json:"line"`
	Column     int    `json:"column"`
	Severity   string `json:"severity"`
	Suggestion string `json:"suggestion,omitempty"`
}

// CodeMetrics represents code quality metrics
type CodeMetrics struct {
	Complexity      int     `json:"complexity"`
	LinesOfCode     int     `json:"linesOfCode"`
	CommentRatio    float64 `json:"commentRatio"`
	TestCoverage    float64 `json:"testCoverage"`
	Dependencies    int     `json:"dependencies"`
	Abstractions    int     `json:"abstractions"`
	Implementations int     `json:"implementations"`
}

// AnalyzeCode performs advanced code analysis
func AnalyzeCode(filename string, checks []string) (*AnalysisResult, error) {
	// Parse the file
	fset := token.NewFileSet()
	node, err := parser.ParseFile(fset, filename, nil, parser.ParseComments)
	if err != nil {
		return nil, fmt.Errorf("failed to parse file: %v", err)
	}

	result := &AnalysisResult{
		Success: true,
		Issues:  make([]Issue, 0),
		Metrics: CodeMetrics{},
	}

	// Run requested checks
	for _, check := range checks {
		switch check {
		case "complexity":
			analyzeComplexity(node, fset, result)
		case "naming":
			analyzeNaming(node, fset, result)
		case "docs":
			analyzeDocs(node, fset, result)
		case "errors":
			analyzeErrors(node, fset, result)
		case "patterns":
			analyzePatterns(node, fset, result)
		}
	}

	// Calculate metrics
	calculateMetrics(node, fset, result)

	return result, nil
}

func analyzeComplexity(node *ast.File, fset *token.FileSet, result *AnalysisResult) {
	ast.Inspect(node, func(n ast.Node) bool {
		switch v := n.(type) {
		case *ast.FuncDecl:
			complexity := calculateComplexity(v)
			if complexity > 10 {
				result.Issues = append(result.Issues, Issue{
					Type:       "complexity",
					Message:    fmt.Sprintf("Function %s has cyclomatic complexity of %d", v.Name.Name, complexity),
					File:       fset.Position(v.Pos()).Filename,
					Line:       fset.Position(v.Pos()).Line,
					Column:     fset.Position(v.Pos()).Column,
					Severity:   "warning",
					Suggestion: "Consider breaking down the function into smaller functions",
				})
			}
			result.Metrics.Complexity += complexity
		}
		return true
	})
}

func analyzeNaming(node *ast.File, fset *token.FileSet, result *AnalysisResult) {
	ast.Inspect(node, func(n ast.Node) bool {
		switch v := n.(type) {
		case *ast.FuncDecl:
			if !isValidName(v.Name.Name) {
				result.Issues = append(result.Issues, Issue{
					Type:       "naming",
					Message:    fmt.Sprintf("Function name %s doesn't follow naming conventions", v.Name.Name),
					File:       fset.Position(v.Pos()).Filename,
					Line:       fset.Position(v.Pos()).Line,
					Column:     fset.Position(v.Pos()).Column,
					Severity:   "warning",
					Suggestion: "Use camelCase for function names",
				})
			}
		case *ast.TypeSpec:
			if !isValidName(v.Name.Name) {
				result.Issues = append(result.Issues, Issue{
					Type:       "naming",
					Message:    fmt.Sprintf("Type name %s doesn't follow naming conventions", v.Name.Name),
					File:       fset.Position(v.Pos()).Filename,
					Line:       fset.Position(v.Pos()).Line,
					Column:     fset.Position(v.Pos()).Column,
					Severity:   "warning",
					Suggestion: "Use PascalCase for type names",
				})
			}
		}
		return true
	})
}

func analyzeDocs(node *ast.File, fset *token.FileSet, result *AnalysisResult) {
	ast.Inspect(node, func(n ast.Node) bool {
		switch v := n.(type) {
		case *ast.FuncDecl:
			if v.Doc == nil || len(v.Doc.List) == 0 {
				result.Issues = append(result.Issues, Issue{
					Type:       "docs",
					Message:    fmt.Sprintf("Function %s lacks documentation", v.Name.Name),
					File:       fset.Position(v.Pos()).Filename,
					Line:       fset.Position(v.Pos()).Line,
					Column:     fset.Position(v.Pos()).Column,
					Severity:   "info",
					Suggestion: "Add documentation comments",
				})
			}
		case *ast.TypeSpec:
			if v.Doc == nil || len(v.Doc.List) == 0 {
				result.Issues = append(result.Issues, Issue{
					Type:       "docs",
					Message:    fmt.Sprintf("Type %s lacks documentation", v.Name.Name),
					File:       fset.Position(v.Pos()).Filename,
					Line:       fset.Position(v.Pos()).Line,
					Column:     fset.Position(v.Pos()).Column,
					Severity:   "info",
					Suggestion: "Add documentation comments",
				})
			}
		}
		return true
	})
}

func analyzeErrors(node *ast.File, fset *token.FileSet, result *AnalysisResult) {
	ast.Inspect(node, func(n ast.Node) bool {
		switch v := n.(type) {
		case *ast.FuncDecl:
			// Check for error return types
			if hasErrorReturn(v) && !hasErrorHandling(v) {
				result.Issues = append(result.Issues, Issue{
					Type:       "errors",
					Message:    fmt.Sprintf("Function %s may not handle all error cases", v.Name.Name),
					File:       fset.Position(v.Pos()).Filename,
					Line:       fset.Position(v.Pos()).Line,
					Column:     fset.Position(v.Pos()).Column,
					Severity:   "error",
					Suggestion: "Add error handling",
				})
			}
		}
		return true
	})
}

func analyzePatterns(node *ast.File, fset *token.FileSet, result *AnalysisResult) {
	ast.Inspect(node, func(n ast.Node) bool {
		switch v := n.(type) {
		case *ast.FuncDecl:
			// Check for common anti-patterns
			if hasDeepNesting(v) {
				result.Issues = append(result.Issues, Issue{
					Type:       "pattern",
					Message:    fmt.Sprintf("Function %s has deep nesting", v.Name.Name),
					File:       fset.Position(v.Pos()).Filename,
					Line:       fset.Position(v.Pos()).Line,
					Column:     fset.Position(v.Pos()).Column,
					Severity:   "warning",
					Suggestion: "Consider early returns or guard clauses",
				})
			}
		}
		return true
	})
}

func calculateMetrics(node *ast.File, fset *token.FileSet, result *AnalysisResult) {
	var lines, comments int

	// Count lines and comments
	ast.Inspect(node, func(n ast.Node) bool {
		if n == nil {
			return true
		}

		lines++
		if _, ok := n.(*ast.Comment); ok {
			comments++
		}

		return true
	})

	result.Metrics.LinesOfCode = lines
	if lines > 0 {
		result.Metrics.CommentRatio = float64(comments) / float64(lines)
	}

	// Count abstractions (interfaces) and implementations
	ast.Inspect(node, func(n ast.Node) bool {
		switch v := n.(type) {
		case *ast.TypeSpec:
			if _, ok := v.Type.(*ast.InterfaceType); ok {
				result.Metrics.Abstractions++
			} else {
				result.Metrics.Implementations++
			}
		}
		return true
	})

	// Count dependencies (imports)
	result.Metrics.Dependencies = len(node.Imports)
}

// Helper functions

func calculateComplexity(fn *ast.FuncDecl) int {
	complexity := 1 // Base complexity

	ast.Inspect(fn, func(n ast.Node) bool {
		switch n.(type) {
		case *ast.IfStmt, *ast.ForStmt, *ast.RangeStmt, *ast.CaseClause, *ast.CommClause:
			complexity++
		}
		return true
	})

	return complexity
}

func isValidName(name string) bool {
	if len(name) == 0 {
		return false
	}

	// Check if first character is letter
	if !isLetter(rune(name[0])) {
		return false
	}

	// Check for underscores and numbers
	for _, r := range name[1:] {
		if !isLetter(r) && !isDigit(r) && r != '_' {
			return false
		}
	}

	return true
}

func isLetter(r rune) bool {
	return (r >= 'a' && r <= 'z') || (r >= 'A' && r <= 'Z')
}

func isDigit(r rune) bool {
	return r >= '0' && r <= '9'
}

func hasErrorReturn(fn *ast.FuncDecl) bool {
	if fn.Type.Results == nil {
		return false
	}

	for _, field := range fn.Type.Results.List {
		if ident, ok := field.Type.(*ast.Ident); ok {
			if ident.Name == "error" {
				return true
			}
		}
	}

	return false
}

func hasErrorHandling(fn *ast.FuncDecl) bool {
	hasHandling := false

	ast.Inspect(fn, func(n ast.Node) bool {
		if ifStmt, ok := n.(*ast.IfStmt); ok {
			if binExpr, ok := ifStmt.Cond.(*ast.BinaryExpr); ok {
				if ident, ok := binExpr.X.(*ast.Ident); ok {
					if ident.Name == "err" {
						hasHandling = true
						return false
					}
				}
			}
		}
		return true
	})

	return hasHandling
}

func hasDeepNesting(fn *ast.FuncDecl) bool {
	maxDepth := 0
	currentDepth := 0

	ast.Inspect(fn, func(n ast.Node) bool {
		switch n.(type) {
		case *ast.IfStmt, *ast.ForStmt, *ast.RangeStmt:
			currentDepth++
			if currentDepth > maxDepth {
				maxDepth = currentDepth
			}
		}
		return true
	})

	return maxDepth > 3 // Consider nesting deeper than 3 levels as "deep"
}
