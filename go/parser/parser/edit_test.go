package parser

import (
	"fmt"
	"os"
	"path/filepath"
	"strings"
	"testing"
)

func TestEdit(t *testing.T) {
	// Create a temporary directory for test files
	tmpDir, err := os.MkdirTemp("", "edit_test")
	if err != nil {
		t.Fatal(err)
	}
	defer os.RemoveAll(tmpDir)

	fmt.Printf("DEBUG: Created temp dir: %s\n", tmpDir)

	// Helper to print file content after operation
	printResult := func(path string) {
		content, err := os.ReadFile(path)
		if err != nil {
			fmt.Printf("Failed to read result: %v\n", err)
			return
		}
		fmt.Printf("Result file content:\n%s\n", string(content))
	}

	tests := []struct {
		name     string
		initial  string
		req      EditRequest
		want     EditResult
		validate func(t *testing.T, path string)
	}{
		{
			name: "replace function with multi-line comment",
			initial: `package test
// Process handles data
// This is a legacy implementation
// @deprecated: use ProcessV2 instead
func Process(data []byte) error {
	return nil
}`,
			req: EditRequest{
				Symbol:   "Process",
				EditType: "replace",
				Content: `// Process handles data with context
// This is the new implementation that:
// - Supports context
// - Provides better error handling
// - Follows new standards
func Process(ctx context.Context, data []byte) error {
	return nil
}`,
			},
			want: EditResult{
				Success: true,
			},
			validate: func(t *testing.T, path string) {
				content, err := os.ReadFile(path)
				if err != nil {
					t.Fatal(err)
				}
				contentStr := string(content)
				if !strings.Contains(contentStr, "handles data with context") {
					t.Error("New first line comment not added")
				}
				if !strings.Contains(contentStr, "Supports context") {
					t.Error("New bullet point comments not added")
				}
				if strings.Contains(contentStr, "@deprecated") {
					t.Error("Old comment still present")
				}
				if !strings.Contains(contentStr, "ctx context.Context") {
					t.Error("Context parameter not added")
				}
			},
		},
		{
			name: "insert method with block comment before target",
			initial: `package test
// Service handles operations
type Service struct{}

/* Process performs the main operation
   with multi-line processing logic */
func (s *Service) Process() error {
	return nil
}`,
			req: EditRequest{
				Symbol:   "Validate",
				EditType: "insert",
				Content: `/* Validate ensures data integrity by:
   - Checking format
   - Validating constraints
   - Verifying permissions */
func (s *Service) Validate() error {
	return nil
}`,
				Insert: &InsertConfig{
					Position:         "before",
					RelativeToSymbol: "Process",
				},
			},
			want: EditResult{
				Success: true,
			},
			validate: func(t *testing.T, path string) {
				content, err := os.ReadFile(path)
				if err != nil {
					t.Fatal(err)
				}
				contentStr := string(content)
				if !strings.Contains(contentStr, "Validate ensures data integrity") {
					t.Error("New block comment not added")
				}
				if !strings.Contains(contentStr, "- Checking format") {
					t.Error("Comment bullet points not preserved")
				}
				validateIdx := strings.Index(contentStr, "Validate")
				processIdx := strings.Index(contentStr, "Process")
				if validateIdx > processIdx {
					t.Error("Method not added before target")
				}
			},
		},
		{
			name: "add context parameter",
			initial: `package test
// Process processes data without context
func Process(data []byte) error {
	return nil
}`,
			req: EditRequest{
				Symbol:   "Process",
				EditType: "replace",
				Content: `// Process processes data with context for better control
func Process(ctx context.Context, data []byte) error {
	return nil
}`,
			},
			want: EditResult{
				Success: true,
			},
			validate: func(t *testing.T, path string) {
				content, err := os.ReadFile(path)
				if err != nil {
					t.Fatal(err)
				}
				contentStr := string(content)
				if !strings.Contains(contentStr, "ctx context.Context") {
					t.Error("Context parameter not added")
				}
				if !strings.Contains(contentStr, "processes data with context") {
					t.Error("New documentation not added")
				}
				if strings.Contains(contentStr, "processes data without context") {
					t.Error("Old documentation still present")
				}
			},
		},
		{
			name: "add struct field tags",
			initial: `package test
// User represents a basic user without metadata
type User struct {
	ID   int
	Name string
}`,
			req: EditRequest{
				Symbol:   "User",
				EditType: "replace",
				Content: `// User represents a user with JSON and DB metadata
type User struct {
	ID   int    ` + "`json:\"id\" db:\"id\"`" + `
	Name string ` + "`json:\"name\" db:\"name\"`" + `
}`,
			},
			want: EditResult{
				Success: true,
			},
			validate: func(t *testing.T, path string) {
				content, err := os.ReadFile(path)
				if err != nil {
					t.Fatal(err)
				}
				contentStr := string(content)
				if !strings.Contains(contentStr, "represents a user with JSON and DB metadata") {
					t.Error("New documentation not added")
				}
				if strings.Contains(contentStr, "represents a basic user without metadata") {
					t.Error("Old documentation still present")
				}
				if !strings.Contains(contentStr, "`json:\"id\"") && !strings.Contains(contentStr, "`json:\"id\" db:\"id\"`") {
					t.Error("JSON tags not added")
				}
				if !strings.Contains(contentStr, "db:\"name\"") && !strings.Contains(contentStr, "`db:\"name\"`") {
					t.Error("DB tags not added")
				}
			},
		},
		{
			name: "implement interface method",
			initial: `package test
// Handler handles basic operations
type Handler interface {
	Handle(context.Context) error
}
// Service provides basic functionality
type Service struct{}`,
			req: EditRequest{
				Symbol:   "Handle",
				EditType: "insert",
				Content: `// Handle implements Handler interface with advanced error handling
func (s *Service) Handle(ctx context.Context) error {
	return nil
}`,
				Insert: &InsertConfig{
					Position:         "after",
					RelativeToSymbol: "Service",
				},
			},
			want: EditResult{
				Success: true,
			},
			validate: func(t *testing.T, path string) {
				content, err := os.ReadFile(path)
				if err != nil {
					t.Fatal(err)
				}
				contentStr := string(content)
				if !strings.Contains(contentStr, "implements Handler interface with advanced error handling") {
					t.Error("Method documentation not added")
				}
				if !strings.Contains(contentStr, "func (s *Service) Handle") {
					t.Error("Interface method not implemented")
				}
			},
		},
		{
			name: "add method before existing",
			initial: `package test
// Service provides data processing
type Service struct{}
// Process handles data processing
func (s *Service) Process() error {
	return nil
}`,
			req: EditRequest{
				Symbol:   "Validate",
				EditType: "insert",
				Content: `// Validate ensures data integrity before processing
func (s *Service) Validate() error {
	return nil
}`,
				Insert: &InsertConfig{
					Position:         "before",
					RelativeToSymbol: "Process",
				},
			},
			want: EditResult{
				Success: true,
			},
			validate: func(t *testing.T, path string) {
				content, err := os.ReadFile(path)
				if err != nil {
					t.Fatal(err)
				}
				validateStr := string(content)
				if !strings.Contains(validateStr, "ensures data integrity") {
					t.Error("New method documentation not added")
				}
				if !strings.Contains(validateStr, "func (s *Service) Validate") {
					t.Error("Method not added")
				}
				validateIdx := strings.Index(validateStr, "Validate")
				processIdx := strings.Index(validateStr, "Process")
				if validateIdx > processIdx {
					t.Error("Method not added before target")
				}
			},
		},
		{
			name: "add method after existing",
			initial: `package test
// Service provides data processing
type Service struct{}
// Process handles initial data processing
func (s *Service) Process() error {
	return nil
}`,
			req: EditRequest{
				Symbol:   "Cleanup",
				EditType: "insert",
				Content: `// Cleanup performs post-processing cleanup operations
func (s *Service) Cleanup() error {
	return nil
}`,
				Insert: &InsertConfig{
					Position:         "after",
					RelativeToSymbol: "Process",
				},
			},
			want: EditResult{
				Success: true,
			},
			validate: func(t *testing.T, path string) {
				content, err := os.ReadFile(path)
				if err != nil {
					t.Fatal(err)
				}
				validateStr := string(content)
				if !strings.Contains(validateStr, "performs post-processing cleanup") {
					t.Error("New method documentation not added")
				}
				if !strings.Contains(validateStr, "func (s *Service) Cleanup") {
					t.Error("Method not added")
				}
				processIdx := strings.Index(validateStr, "Process")
				cleanupIdx := strings.Index(validateStr, "Cleanup")
				if cleanupIdx < processIdx {
					t.Error("Method not added after target")
				}
			},
		},
		{
			name: "handle missing symbol",
			initial: `package test
// Existing function with basic functionality
func Existing() {}`,
			req: EditRequest{
				Symbol:   "NonExistent",
				EditType: "replace",
				Content:  "func NonExistent() {}",
			},
			want: EditResult{
				Success: false,
				Error:   "Symbol not found: NonExistent",
			},
			validate: func(t *testing.T, path string) {
				content, err := os.ReadFile(path)
				if err != nil {
					t.Fatal(err)
				}
				if strings.Contains(string(content), "NonExistent") {
					t.Error("File was modified when it shouldn't have been")
				}
			},
		},
		{
			name: "handle invalid syntax",
			initial: `package test
// Valid performs basic validation
func Valid() {}`,
			req: EditRequest{
				Symbol:   "Valid",
				EditType: "replace",
				Content:  "invalid go code {",
			},
			want: EditResult{
				Success: false,
				Error:   "Failed to parse new content",
			},
			validate: func(t *testing.T, path string) {
				content, err := os.ReadFile(path)
				if err != nil {
					t.Fatal(err)
				}
				if !strings.Contains(string(content), "func Valid()") {
					t.Error("Original content was modified")
				}
			},
		},
		{
			name: "handle missing insert config",
			initial: `package test
func Existing() {}`,
			req: EditRequest{
				Symbol:   "New",
				EditType: "insert",
				Content:  "func New() {}",
			},
			want: EditResult{
				Success: false,
				Error:   "Insert configuration is required for insert operations",
			},
		},
		{
			name: "handle invalid insert position",
			initial: `package test
func Existing() {}`,
			req: EditRequest{
				Symbol:   "New",
				EditType: "insert",
				Content:  "func New() {}",
				Insert: &InsertConfig{
					Position:         "invalid",
					RelativeToSymbol: "Existing",
				},
			},
			want: EditResult{
				Success: false,
				Error:   "Invalid Position in Insert config: must be 'before' or 'after'",
			},
		},
		{
			name: "handle missing relative symbol",
			initial: `package test
func Existing() {}`,
			req: EditRequest{
				Symbol:   "New",
				EditType: "insert",
				Content:  "func New() {}",
				Insert: &InsertConfig{
					Position: "after",
				},
			},
			want: EditResult{
				Success: false,
				Error:   "RelativeToSymbol is required in Insert config",
			},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// Create test file
			path := filepath.Join(tmpDir, tt.name+".go")
			fmt.Printf("\nDEBUG: Creating test file: %s\n", path)
			fmt.Printf("DEBUG: Initial content:\n%s\n", tt.initial)

			if err := os.WriteFile(path, []byte(tt.initial), 0644); err != nil {
				t.Fatal(err)
			}

			// Set path in request
			tt.req.Path = path

			// Run edit
			got := Edit(tt.req)

			// Print result file content
			fmt.Printf("\nTest case: %s\n", tt.name)
			printResult(path)

			// Check success/error status
			if got.Success != tt.want.Success {
				t.Errorf("Edit() success = %v, want %v", got.Success, tt.want.Success)
			}
			if tt.want.Error != "" && !strings.Contains(got.Error, tt.want.Error) {
				t.Errorf("Edit() error = %v, want %v", got.Error, tt.want.Error)
			}

			// Run validation if provided
			if tt.validate != nil {
				tt.validate(t, path)
			}
		})
	}
}
