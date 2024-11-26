package parser

import (
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

	tests := []struct {
		name     string
		initial  string
		req      EditRequest
		want     EditResult
		validate func(t *testing.T, path string)
	}{
		{
			name: "add context parameter",
			initial: `package test
func Process(data []byte) error {
	return nil
}`,
			req: EditRequest{
				Symbol: "Process",
				Content: `func Process(ctx context.Context, data []byte) error {
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
				if !strings.Contains(string(content), "ctx context.Context") {
					t.Error("Context parameter not added")
				}
			},
		},
		{
			name: "add struct field tags",
			initial: `package test
type User struct {
	ID   int
	Name string
}`,
			req: EditRequest{
				Symbol: "User",
				Content: `type User struct {
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
				// Check for formatted tag strings
				if !strings.Contains(contentStr, "`json:\"id\"") && !strings.Contains(contentStr, "`json:\"id\" db:\"id\"`") && !strings.Contains(contentStr, "`json:\"id\" db:\"id\"") {
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
type Handler interface {
	Handle(context.Context) error
}
type Service struct{}`,
			req: EditRequest{
				Symbol:   "Service",
				Position: "after",
				Content: `func (s *Service) Handle(ctx context.Context) error {
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
				if !strings.Contains(string(content), "func (s *Service) Handle") {
					t.Error("Interface method not implemented")
				}
			},
		},
		{
			name: "add method before existing",
			initial: `package test
type Service struct{}
func (s *Service) Process() error {
	return nil
}`,
			req: EditRequest{
				Symbol:   "Process",
				Position: "before",
				Content: `func (s *Service) Validate() error {
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
				validateStr := string(content)
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
type Service struct{}
func (s *Service) Process() error {
	return nil
}`,
			req: EditRequest{
				Symbol:   "Process",
				Position: "after",
				Content: `func (s *Service) Cleanup() error {
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
				validateStr := string(content)
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
func Existing() {}`,
			req: EditRequest{
				Symbol:  "NonExistent",
				Content: "func NonExistent() {}",
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
func Valid() {}`,
			req: EditRequest{
				Symbol:  "Valid",
				Content: "invalid go code {",
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
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// Create test file
			path := filepath.Join(tmpDir, tt.name+".go")
			if err := os.WriteFile(path, []byte(tt.initial), 0644); err != nil {
				t.Fatal(err)
			}

			// Set path in request
			tt.req.Path = path

			// Run edit
			got := Edit(tt.req)

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
