package parser

import (
	"bytes"
	"go/ast"
	"go/format"
	"go/parser"
	"go/token"
	"os"
	"regexp"
)

// Edit performs the requested code edit
func Edit(req EditRequest) EditResult {
	// First validate the new content
	fset := token.NewFileSet()
	_, err := parser.ParseFile(fset, "", "package temp\n"+req.Content, parser.ParseComments)
	if err != nil {
		return EditResult{
			Success: false,
			Error:   "Failed to parse new content: " + err.Error(),
		}
	}

	// Read the original file content
	content, err := os.ReadFile(req.Path)
	if err != nil {
		return EditResult{
			Success: false,
			Error:   "Failed to read file: " + err.Error(),
		}
	}

	// Parse the source file
	file, err := parser.ParseFile(fset, req.Path, content, parser.ParseComments)
	if err != nil {
		return EditResult{
			Success: false,
			Error:   "Failed to parse file: " + err.Error(),
		}
	}

	// Find the target symbol and its parent
	var (
		target ast.Node
		parent ast.Node
	)
	ast.Inspect(file, func(n ast.Node) bool {
		if n == nil {
			return true
		}

		switch v := n.(type) {
		case *ast.FuncDecl:
			if v.Name.Name == req.Symbol {
				target = v
				return false
			}
		case *ast.TypeSpec:
			if v.Name.Name == req.Symbol {
				target = v
				parent = findParentGenDecl(file, v)
				return false
			}
		case *ast.GenDecl:
			for _, spec := range v.Specs {
				switch s := spec.(type) {
				case *ast.TypeSpec:
					if s.Name.Name == req.Symbol {
						target = s
						parent = v
						return false
					}
				case *ast.ValueSpec:
					for _, name := range s.Names {
						if name.Name == req.Symbol {
							target = s
							parent = v
							return false
						}
					}
				}
			}
		}
		return true
	})

	if target == nil {
		return EditResult{
			Success: false,
			Error:   "Symbol not found: " + req.Symbol,
		}
	}

	// Get the target's source text range
	var targetStart, targetEnd token.Position
	if parent != nil {
		targetStart = fset.Position(parent.Pos())
		targetEnd = fset.Position(parent.End())
	} else {
		targetStart = fset.Position(target.Pos())
		targetEnd = fset.Position(target.End())
	}

	// Find and remove any comments before the target
	contentStr := string(content)
	lines := bytes.Split(content, []byte("\n"))
	startLine := targetStart.Line - 1
	for startLine > 0 && isComment(string(lines[startLine-1])) {
		startLine--
	}

	// Create the replacement text
	var replacement string
	switch req.Position {
	case "before":
		replacement = req.Content + "\n\n" + contentStr[targetStart.Offset:targetEnd.Offset]
	case "after":
		replacement = contentStr[targetStart.Offset:targetEnd.Offset] + "\n\n" + req.Content
	default:
		replacement = req.Content
	}

	// Replace the target text including its comments
	newContent := contentStr[:fset.Position(file.Package).Offset] + // Keep package declaration
		contentStr[fset.Position(file.Package).Offset:bytes.Index(content, lines[startLine])] + // Keep imports
		replacement +
		contentStr[targetEnd.Offset:] // Keep rest of file

	// Parse the modified content
	newFile, err := parser.ParseFile(fset, req.Path, newContent, parser.ParseComments)
	if err != nil {
		return EditResult{
			Success: false,
			Error:   "Failed to parse modified content: " + err.Error(),
		}
	}

	// Format the modified AST
	var buf bytes.Buffer
	if err := format.Node(&buf, fset, newFile); err != nil {
		return EditResult{
			Success: false,
			Error:   "Failed to format modified code: " + err.Error(),
		}
	}

	// Write the result back to the file
	if err := os.WriteFile(req.Path, buf.Bytes(), 0644); err != nil {
		return EditResult{
			Success: false,
			Error:   "Failed to write file: " + err.Error(),
		}
	}

	return EditResult{
		Success: true,
		Content: buf.String(),
	}
}

func isComment(line string) bool {
	return regexp.MustCompile(`^\s*//`).MatchString(line)
}

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

func containsNode(parent, target ast.Node) bool {
	found := false
	ast.Inspect(parent, func(n ast.Node) bool {
		if n == target {
			found = true
			return false
		}
		return true
	})
	return found
}
