package parser

import (
	"bytes"
	"fmt"
	"go/ast"
	"go/format"
	"go/parser"
	"go/token"
	"os"
)

// Edit performs the requested code edit
func Edit(req EditRequest) EditResult {
	// Set up the token file set
	fset := token.NewFileSet()

	// Parse the source file
	file, err := parser.ParseFile(fset, req.Path, nil, parser.ParseComments)
	if err != nil {
		return EditResult{
			Success: false,
			Error:   "Failed to parse file: " + err.Error(),
		}
	}

	// Find the target symbol
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

	// Parse the new content
	newFile, err := parser.ParseFile(fset, "", "package temp\n"+req.Content, parser.ParseComments)
	if err != nil {
		return EditResult{
			Success: false,
			Error:   "Failed to parse new content: " + err.Error(),
		}
	}

	if len(newFile.Decls) == 0 {
		return EditResult{
			Success: false,
			Error:   "No declarations found in new content",
		}
	}

	// Get the first declaration from the new content
	newDecl := newFile.Decls[0]

	fmt.Printf("Debug: New declaration type: %T\n", newDecl)
	if genDecl, ok := newDecl.(*ast.GenDecl); ok {
		for _, spec := range genDecl.Specs {
			if typeSpec, ok := spec.(*ast.TypeSpec); ok {
				if structType, ok := typeSpec.Type.(*ast.StructType); ok {
					fmt.Printf("Debug: New struct fields:\n")
					for _, field := range structType.Fields.List {
						fmt.Printf("Debug: Field: %s, Tag: %#v\n", field.Names[0].Name, field.Tag)
					}
				}
			}
		}
	}

	// Replace or insert the node
	switch req.Position {
	case "before":
		insertBefore(file, target, newDecl)
	case "after":
		insertAfter(file, target, newDecl)
	default:
		if parent != nil {
			replaceInParent(parent, target, newDecl)
		} else {
			replace(file, target, newDecl)
		}
	}

	// Format the modified AST
	var buf bytes.Buffer
	if err := format.Node(&buf, fset, file); err != nil {
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

	// Debug: Read back the file content to verify
	content, err := os.ReadFile(req.Path)
	if err != nil {
		fmt.Printf("Debug: Error reading back file: %v\n", err)
	} else {
		fmt.Printf("Debug: Actual file content after write:\n%s\n", string(content))
	}

	return EditResult{
		Success: true,
		Content: buf.String(),
	}
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

func insertBefore(file *ast.File, target, newNode ast.Node) {
	for i, decl := range file.Decls {
		if decl == target || containsNode(decl, target) {
			newDecls := make([]ast.Decl, 0, len(file.Decls)+1)
			newDecls = append(newDecls, file.Decls[:i]...)
			newDecls = append(newDecls, newNode.(ast.Decl))
			newDecls = append(newDecls, file.Decls[i:]...)
			file.Decls = newDecls
			return
		}
	}
}

func insertAfter(file *ast.File, target, newNode ast.Node) {
	for i, decl := range file.Decls {
		if decl == target || containsNode(decl, target) {
			newDecls := make([]ast.Decl, 0, len(file.Decls)+1)
			newDecls = append(newDecls, file.Decls[:i+1]...)
			newDecls = append(newDecls, newNode.(ast.Decl))
			newDecls = append(newDecls, file.Decls[i+1:]...)
			file.Decls = newDecls
			return
		}
	}
}

func replace(file *ast.File, target, newNode ast.Node) {
	for i, decl := range file.Decls {
		if decl == target {
			file.Decls[i] = newNode.(ast.Decl)
			return
		}
	}
}

func replaceInParent(parent, target, newNode ast.Node) {
	switch p := parent.(type) {
	case *ast.GenDecl:
		for i, spec := range p.Specs {
			if spec == target {
				switch n := newNode.(type) {
				case *ast.GenDecl:
					if len(n.Specs) > 0 {
						if newTypeSpec, ok := n.Specs[0].(*ast.TypeSpec); ok {
							if oldTypeSpec, ok := spec.(*ast.TypeSpec); ok {
								fmt.Printf("Debug: Replacing type spec %s\n", oldTypeSpec.Name)
								// Keep the original name but replace the entire type spec
								newTypeSpec.Name = oldTypeSpec.Name
								p.Specs[i] = newTypeSpec
							}
						}
					}
				case *ast.TypeSpec:
					if oldTypeSpec, ok := spec.(*ast.TypeSpec); ok {
						fmt.Printf("Debug: Direct type spec replacement for %s\n", oldTypeSpec.Name)
						// Keep the original name but replace the entire type spec
						n.Name = oldTypeSpec.Name
						p.Specs[i] = n
					}
				}
				return
			}
		}
	}
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
