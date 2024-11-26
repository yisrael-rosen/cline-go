package parser

import (
	"fmt"
	"go/ast"
	"go/parser"
	"go/printer"
	"go/token"
	"strings"
)

// RefactorPattern represents a code refactoring pattern
type RefactorPattern struct {
	Name        string `json:"name"`
	Description string `json:"description"`
	Before      string `json:"before"`
	After       string `json:"after"`
}

// RefactorRequest represents a refactoring request
type RefactorRequest struct {
	Pattern string            `json:"pattern"` // Name of the pattern to apply
	Params  map[string]string `json:"params"`  // Parameters for the pattern
}

// Common refactoring patterns
var DefaultPatterns = []RefactorPattern{
	{
		Name:        "extract-function",
		Description: "Extract code into a new function",
		Before: `func {{.SourceFunc}}() {
	{{.Code}}
}`,
		After: `func {{.NewFunc}}() {
	{{.Code}}
}

func {{.SourceFunc}}() {
	{{.NewFunc}}()
}`,
	},
	{
		Name:        "add-error-handling",
		Description: "Add error handling to a function",
		Before: `func {{.Func}}({{.Params}}) {
	{{.Code}}
}`,
		After: `func {{.Func}}({{.Params}}) error {
	{{.Code}}
	if err != nil {
		return fmt.Errorf("{{.ErrorMsg}}: %w", err)
	}
	return nil
}`,
	},
	{
		Name:        "add-context",
		Description: "Add context parameter to function",
		Before: `func {{.Func}}({{.Params}}) {{.Return}} {
	{{.Code}}
}`,
		After: `func {{.Func}}(ctx context.Context, {{.Params}}) {{.Return}} {
	{{.Code}}
}`,
	},
	{
		Name:        "implement-interface",
		Description: "Implement an interface",
		Before: `type {{.Type}} struct {
	{{.Fields}}
}`,
		After: `type {{.Type}} struct {
	{{.Fields}}
}

{{range .Methods}}
func (t *{{$.Type}}) {{.Name}}({{.Params}}) {{.Return}} {
	{{.Body}}
}
{{end}}`,
	},
}

// ApplyRefactoring applies a refactoring pattern to the code
func ApplyRefactoring(filename string, req RefactorRequest) (*EditResult, error) {
	// Find the pattern
	var pattern *RefactorPattern
	for _, p := range DefaultPatterns {
		if p.Name == req.Pattern {
			pattern = &p
			break
		}
	}
	if pattern == nil {
		return nil, fmt.Errorf("pattern %q not found", req.Pattern)
	}

	// Parse the file
	fset := token.NewFileSet()
	node, err := parser.ParseFile(fset, filename, nil, parser.ParseComments)
	if err != nil {
		return nil, fmt.Errorf("failed to parse file: %v", err)
	}

	// Apply the pattern
	switch pattern.Name {
	case "extract-function":
		return extractFunction(node, fset, req.Params)
	case "add-error-handling":
		return addErrorHandling(node, fset, req.Params)
	case "add-context":
		return addContext(node, fset, req.Params)
	case "implement-interface":
		return implementInterface(node, fset, req.Params)
	default:
		return nil, fmt.Errorf("pattern %q not implemented", pattern.Name)
	}
}

func extractFunction(node *ast.File, fset *token.FileSet, params map[string]string) (*EditResult, error) {
	sourceFunc := params["sourceFunc"]
	newFunc := params["newFunc"]
	code := params["code"]

	// Find the source function
	var funcDecl *ast.FuncDecl
	ast.Inspect(node, func(n ast.Node) bool {
		if f, ok := n.(*ast.FuncDecl); ok && f.Name.Name == sourceFunc {
			funcDecl = f
			return false
		}
		return true
	})

	if funcDecl == nil {
		return nil, fmt.Errorf("function %q not found", sourceFunc)
	}

	// Create the new function
	newFuncDecl := &ast.FuncDecl{
		Name: ast.NewIdent(newFunc),
		Type: &ast.FuncType{
			Params:  &ast.FieldList{},
			Results: &ast.FieldList{},
		},
		Body: &ast.BlockStmt{
			List: []ast.Stmt{
				&ast.ExprStmt{
					X: &ast.CallExpr{
						Fun: ast.NewIdent(code),
					},
				},
			},
		},
	}

	// Add the new function to the file
	node.Decls = append(node.Decls, newFuncDecl)

	// Format the result
	var buf strings.Builder
	if err := printer.Fprint(&buf, fset, node); err != nil {
		return nil, fmt.Errorf("failed to format code: %v", err)
	}

	return &EditResult{
		Success: true,
		Content: buf.String(),
	}, nil
}

func addErrorHandling(node *ast.File, fset *token.FileSet, params map[string]string) (*EditResult, error) {
	funcName := params["func"]
	errorMsg := params["errorMsg"]

	// Find the function
	var funcDecl *ast.FuncDecl
	ast.Inspect(node, func(n ast.Node) bool {
		if f, ok := n.(*ast.FuncDecl); ok && f.Name.Name == funcName {
			funcDecl = f
			return false
		}
		return true
	})

	if funcDecl == nil {
		return nil, fmt.Errorf("function %q not found", funcName)
	}

	// Add error return type
	if funcDecl.Type.Results == nil {
		funcDecl.Type.Results = &ast.FieldList{}
	}
	funcDecl.Type.Results.List = append(funcDecl.Type.Results.List,
		&ast.Field{
			Type: ast.NewIdent("error"),
		},
	)

	// Add error handling
	funcDecl.Body.List = append(funcDecl.Body.List,
		&ast.IfStmt{
			Cond: &ast.Ident{Name: "err != nil"},
			Body: &ast.BlockStmt{
				List: []ast.Stmt{
					&ast.ReturnStmt{
						Results: []ast.Expr{
							&ast.CallExpr{
								Fun: &ast.SelectorExpr{
									X:   ast.NewIdent("fmt"),
									Sel: ast.NewIdent("Errorf"),
								},
								Args: []ast.Expr{
									&ast.BasicLit{
										Kind:  token.STRING,
										Value: fmt.Sprintf("%q", errorMsg+": %w"),
									},
									ast.NewIdent("err"),
								},
							},
						},
					},
				},
			},
		},
	)

	// Format the result
	var buf strings.Builder
	if err := printer.Fprint(&buf, fset, node); err != nil {
		return nil, fmt.Errorf("failed to format code: %v", err)
	}

	return &EditResult{
		Success: true,
		Content: buf.String(),
	}, nil
}

func addContext(node *ast.File, fset *token.FileSet, params map[string]string) (*EditResult, error) {
	funcName := params["func"]

	// Find the function
	var funcDecl *ast.FuncDecl
	ast.Inspect(node, func(n ast.Node) bool {
		if f, ok := n.(*ast.FuncDecl); ok && f.Name.Name == funcName {
			funcDecl = f
			return false
		}
		return true
	})

	if funcDecl == nil {
		return nil, fmt.Errorf("function %q not found", funcName)
	}

	// Add context parameter
	ctxField := &ast.Field{
		Names: []*ast.Ident{ast.NewIdent("ctx")},
		Type: &ast.SelectorExpr{
			X:   ast.NewIdent("context"),
			Sel: ast.NewIdent("Context"),
		},
	}

	if funcDecl.Type.Params.List == nil {
		funcDecl.Type.Params.List = []*ast.Field{ctxField}
	} else {
		funcDecl.Type.Params.List = append([]*ast.Field{ctxField},
			funcDecl.Type.Params.List...)
	}

	// Add context import if needed
	addImport(node, "context")

	// Format the result
	var buf strings.Builder
	if err := printer.Fprint(&buf, fset, node); err != nil {
		return nil, fmt.Errorf("failed to format code: %v", err)
	}

	return &EditResult{
		Success: true,
		Content: buf.String(),
	}, nil
}

func implementInterface(node *ast.File, fset *token.FileSet, params map[string]string) (*EditResult, error) {
	typeName := params["type"]
	interfaceName := params["interface"]

	// Find the type
	var typeSpec *ast.TypeSpec
	ast.Inspect(node, func(n ast.Node) bool {
		if ts, ok := n.(*ast.TypeSpec); ok && ts.Name.Name == typeName {
			typeSpec = ts
			return false
		}
		return true
	})

	if typeSpec == nil {
		return nil, fmt.Errorf("type %q not found", typeName)
	}

	// Find the interface
	var interfaceType *ast.InterfaceType
	ast.Inspect(node, func(n ast.Node) bool {
		if ts, ok := n.(*ast.TypeSpec); ok && ts.Name.Name == interfaceName {
			if it, ok := ts.Type.(*ast.InterfaceType); ok {
				interfaceType = it
				return false
			}
		}
		return true
	})

	if interfaceType == nil {
		return nil, fmt.Errorf("interface %q not found", interfaceName)
	}

	// Generate method stubs
	for _, method := range interfaceType.Methods.List {
		funcType := method.Type.(*ast.FuncType)
		methodDecl := &ast.FuncDecl{
			Recv: &ast.FieldList{
				List: []*ast.Field{
					{
						Names: []*ast.Ident{ast.NewIdent("t")},
						Type: &ast.StarExpr{
							X: ast.NewIdent(typeName),
						},
					},
				},
			},
			Name: method.Names[0],
			Type: funcType,
			Body: &ast.BlockStmt{
				List: []ast.Stmt{
					&ast.ReturnStmt{},
				},
			},
		}
		node.Decls = append(node.Decls, methodDecl)
	}

	// Format the result
	var buf strings.Builder
	if err := printer.Fprint(&buf, fset, node); err != nil {
		return nil, fmt.Errorf("failed to format code: %v", err)
	}

	return &EditResult{
		Success: true,
		Content: buf.String(),
	}, nil
}

func addImport(node *ast.File, pkg string) {
	// Check if import already exists
	for _, imp := range node.Imports {
		if imp.Path.Value == fmt.Sprintf("%q", pkg) {
			return
		}
	}

	// Add new import
	newImport := &ast.ImportSpec{
		Path: &ast.BasicLit{
			Kind:  token.STRING,
			Value: fmt.Sprintf("%q", pkg),
		},
	}

	if node.Imports == nil {
		node.Imports = []*ast.ImportSpec{newImport}
	} else {
		node.Imports = append(node.Imports, newImport)
	}
}
