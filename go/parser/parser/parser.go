package parser

import (
	"go/ast"
	"go/parser"
	"go/token"
	"strings"
)

// Symbol represents a code symbol with its metadata
type Symbol struct {
	Name     string   `json:"name"`
	Kind     string   `json:"kind"`
	Start    int      `json:"start"`
	End      int      `json:"end"`
	Doc      string   `json:"doc,omitempty"`
	Children []Symbol `json:"children,omitempty"`
}

// ParseResult represents the result of parsing a Go file
type ParseResult struct {
	Success bool     `json:"success"`
	Symbols []Symbol `json:"symbols,omitempty"`
	Error   string   `json:"error,omitempty"`
}

// cleanDoc removes extra whitespace but preserves the final newline
func cleanDoc(doc string) string {
	lines := strings.Split(strings.TrimRight(doc, "\n"), "\n")
	var cleaned []string
	for _, line := range lines {
		line = strings.TrimSpace(line)
		if line != "" {
			cleaned = append(cleaned, line)
		}
	}
	return strings.Join(cleaned, " ") + "\n"
}

// Parse parses a Go file and returns its symbols
func Parse(path string) (ParseResult, error) {
	fset := token.NewFileSet()
	file, err := parser.ParseFile(fset, path, nil, parser.ParseComments)
	if err != nil {
		return ParseResult{
			Success: false,
			Error:   "Failed to parse file",
		}, err
	}

	var symbols []Symbol

	// Extract declarations
	for _, decl := range file.Decls {
		switch d := decl.(type) {
		case *ast.FuncDecl:
			// Function declaration
			pos := fset.Position(d.Pos())
			end := fset.Position(d.End())
			symbol := Symbol{
				Name:  d.Name.Name,
				Kind:  "function",
				Start: pos.Offset,
				End:   end.Offset,
			}
			if d.Doc != nil {
				symbol.Doc = cleanDoc(d.Doc.Text())
			}
			symbols = append(symbols, symbol)

		case *ast.GenDecl:
			// General declarations (var, const, type)
			for _, spec := range d.Specs {
				switch s := spec.(type) {
				case *ast.TypeSpec:
					// Type declaration
					pos := fset.Position(s.Pos())
					end := fset.Position(s.End())
					symbol := Symbol{
						Name:  s.Name.Name,
						Kind:  "type",
						Start: pos.Offset,
						End:   end.Offset,
					}
					if d.Doc != nil {
						symbol.Doc = cleanDoc(d.Doc.Text())
					}

					// Handle struct and interface types
					switch t := s.Type.(type) {
					case *ast.StructType:
						symbol.Kind = "struct"
						// Add struct fields as children
						for _, field := range t.Fields.List {
							for _, name := range field.Names {
								fieldPos := fset.Position(field.Pos())
								fieldEnd := fset.Position(field.End())
								symbol.Children = append(symbol.Children, Symbol{
									Name:  name.Name,
									Kind:  "field",
									Start: fieldPos.Offset,
									End:   fieldEnd.Offset,
								})
							}
						}
					case *ast.InterfaceType:
						symbol.Kind = "interface"
						// Add interface methods as children
						for _, method := range t.Methods.List {
							for _, name := range method.Names {
								methodPos := fset.Position(method.Pos())
								methodEnd := fset.Position(method.End())
								symbol.Children = append(symbol.Children, Symbol{
									Name:  name.Name,
									Kind:  "method",
									Start: methodPos.Offset,
									End:   methodEnd.Offset,
								})
							}
						}
					}
					symbols = append(symbols, symbol)

				case *ast.ValueSpec:
					// Variable and constant declarations
					for _, name := range s.Names {
						pos := fset.Position(name.Pos())
						end := fset.Position(name.End())
						kind := "variable"
						if d.Tok == token.CONST {
							kind = "constant"
						}
						symbol := Symbol{
							Name:  name.Name,
							Kind:  kind,
							Start: pos.Offset,
							End:   end.Offset,
						}
						if d.Doc != nil {
							symbol.Doc = cleanDoc(d.Doc.Text())
						}
						symbols = append(symbols, symbol)
					}
				}
			}
		}
	}

	return ParseResult{
		Success: true,
		Symbols: symbols,
	}, nil
}
