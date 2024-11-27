package parser

import (
	"bytes"
	"fmt"
	"go/ast"
	"go/parser"
	"go/printer"
	"go/token"
	"os"
)

// parseFile parses a Go source file and returns the AST
func parseFile(fset *token.FileSet, path string, src interface{}) (*ast.File, error) {
	return parser.ParseFile(fset, path, src, parser.ParseComments)
}

// validateRequest checks if the EditRequest is valid
func validateRequest(req EditRequest) error {
	if req.EditType == "" {
		return fmt.Errorf("EditType is required")
	}
	if req.EditType != "replace" && req.EditType != "insert" && req.EditType != "delete" {
		return fmt.Errorf("Invalid EditType: must be 'replace', 'insert', or 'delete'")
	}
	if req.Symbol == "" {
		return fmt.Errorf("Symbol is required")
	}
	if req.EditType != "delete" && req.Content == "" {
		return fmt.Errorf("Content is required for %s operations", req.EditType)
	}
	if req.EditType == "insert" {
		if req.Insert == nil {
			return fmt.Errorf("Insert configuration is required for insert operations")
		}
		if req.Insert.Position != "before" && req.Insert.Position != "after" {
			return fmt.Errorf("Invalid Position in Insert config: must be 'before' or 'after'")
		}
		if req.Insert.RelativeToSymbol == "" {
			return fmt.Errorf("RelativeToSymbol is required in Insert config")
		}
	}
	return nil
}

// findParentGenDecl finds the parent GenDecl for a given TypeSpec
func findParentGenDecl(file *ast.File, target ast.Node) *ast.GenDecl {
	var parent *ast.GenDecl
	ast.Inspect(file, func(n ast.Node) bool {
		if n == nil {
			return true
		}
		if genDecl, ok := n.(*ast.GenDecl); ok {
			for _, spec := range genDecl.Specs {
				if spec == target {
					parent = genDecl
					return false
				}
			}
		}
		return true
	})
	return parent
}

// findSymbol looks for a symbol in the AST and returns its declaration
func findSymbol(file *ast.File, symbolName string) (ast.Decl, bool) {
	var targetDecl ast.Decl
	var found bool

	ast.Inspect(file, func(n ast.Node) bool {
		if found {
			return false
		}
		if n == nil {
			return true
		}

		switch v := n.(type) {
		case *ast.FuncDecl:
			if v.Name.Name == symbolName {
				targetDecl = v
				found = true
				return false
			}
		case *ast.TypeSpec:
			if v.Name.Name == symbolName {
				if genDecl := findParentGenDecl(file, v); genDecl != nil {
					targetDecl = genDecl
					found = true
					return false
				}
			}
		}
		return true
	})

	return targetDecl, found
}

// Edit performs the requested code edit operation
func Edit(req EditRequest) EditResult {
	if req.EditType == "insert" && req.Insert != nil {
		fmt.Printf("DEBUG: Insert config - Position: %s, RelativeToSymbol: %s\n",
			req.Insert.Position, req.Insert.RelativeToSymbol)
	}

	// Validate request
	if err := validateRequest(req); err != nil {
		return EditResult{
			Success: false,
			Error:   err.Error(),
		}
	}

	// Create a new token.FileSet for this operation
	fset := token.NewFileSet()

	// Read and parse the original file
	content, err := os.ReadFile(req.Path)
	if err != nil {
		return EditResult{
			Success: false,
			Error:   fmt.Sprintf("Failed to read file: %v", err),
		}
	}

	file, err := parseFile(fset, req.Path, content)
	if err != nil {
		return EditResult{
			Success: false,
			Error:   fmt.Sprintf("Failed to parse file: %v", err),
		}
	}

	// For replace and insert operations, parse the new content
	var newDecl ast.Decl
	var newComment *ast.CommentGroup
	if req.EditType != "delete" {
		// Parse new content with the same package name
		newContent := fmt.Sprintf("package %s\n%s", file.Name.Name, req.Content)
		newFile, err := parseFile(fset, "", newContent)
		if err != nil {
			return EditResult{
				Success: false,
				Error:   fmt.Sprintf("Failed to parse new content: %v", err),
			}
		}

		if len(newFile.Decls) == 0 {
			return EditResult{
				Success: false,
				Error:   "No declaration found in new content",
			}
		}
		newDecl = newFile.Decls[0]

		// Get the comment from the new content
		if len(newFile.Comments) > 0 {
			newComment = newFile.Comments[0]
		}
	}

	// Find the target symbol
	targetSymbol := req.Symbol
	if req.EditType == "insert" {
		targetSymbol = req.Insert.RelativeToSymbol
	}

	targetDecl, found := findSymbol(file, targetSymbol)
	if !found {
		return EditResult{
			Success: false,
			Error:   fmt.Sprintf("Symbol not found: %s", targetSymbol),
		}
	}

	// Create new declarations list
	var newDecls []ast.Decl

	// Build new declarations list
	for _, decl := range file.Decls {
		if decl == targetDecl {
			switch req.EditType {
			case "replace":
				if newComment != nil {
					switch d := newDecl.(type) {
					case *ast.FuncDecl:
						d.Doc = newComment
					case *ast.GenDecl:
						d.Doc = newComment
					}
				}
				newDecls = append(newDecls, newDecl)
			case "insert":
				if req.Insert.Position == "before" {
					fmt.Printf("DEBUG: Inserting before target\n")
					if newComment != nil {
						switch d := newDecl.(type) {
						case *ast.FuncDecl:
							d.Doc = newComment
						case *ast.GenDecl:
							d.Doc = newComment
						}
					}
					newDecls = append(newDecls, newDecl)
					newDecls = append(newDecls, decl)
				} else {
					fmt.Printf("DEBUG: Inserting after target\n")
					newDecls = append(newDecls, decl)
					if newComment != nil {
						switch d := newDecl.(type) {
						case *ast.FuncDecl:
							d.Doc = newComment
						case *ast.GenDecl:
							d.Doc = newComment
						}
					}
					newDecls = append(newDecls, newDecl)
				}
			case "delete":
				fmt.Printf("DEBUG: Skipping declaration (delete)\n")
				continue
			}
		} else {
			newDecls = append(newDecls, decl)
		}
	}

	// Create new file with updated declarations
	resultFile := &ast.File{
		Name:    file.Name,
		Decls:   newDecls,
		Scope:   file.Scope,
		Imports: file.Imports,
	}

	// Format the result
	var buf bytes.Buffer
	cfg := &printer.Config{
		Mode:     printer.UseSpaces | printer.TabIndent,
		Tabwidth: 8,
	}
	if err := cfg.Fprint(&buf, fset, resultFile); err != nil {
		return EditResult{
			Success: false,
			Error:   fmt.Sprintf("Failed to format modified code: %v", err),
		}
	}

	resultStr := buf.String()

	// Write the result back to the file
	if err := os.WriteFile(req.Path, []byte(resultStr), 0644); err != nil {
		return EditResult{
			Success: false,
			Error:   fmt.Sprintf("Failed to write file: %v", err),
		}
	}

	return EditResult{
		Success: true,
		Content: resultStr,
	}
}
