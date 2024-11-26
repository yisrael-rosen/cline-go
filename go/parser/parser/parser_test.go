package parser

import (
	"os"
	"path/filepath"
	"testing"
)

func TestParse(t *testing.T) {
	// Create a temporary test file
	content := `package test

// User represents a system user
type User struct {
	ID   int
	Name string
}

// ProcessData handles data processing
func ProcessData(data []byte) error {
	return nil
}

var (
	// MaxUsers is the maximum number of users
	MaxUsers = 100
)

const (
	// StatusOK represents success
	StatusOK = "ok"
)`

	tmpDir := t.TempDir()
	testFile := filepath.Join(tmpDir, "test.go")
	if err := os.WriteFile(testFile, []byte(content), 0644); err != nil {
		t.Fatalf("Failed to create test file: %v", err)
	}

	// Parse the file
	result, err := Parse(testFile)
	if err != nil {
		t.Fatalf("Parse failed: %v", err)
	}

	if !result.Success {
		t.Fatalf("Parse returned failure: %s", result.Error)
	}

	// Verify symbols
	expectedSymbols := map[string]string{
		"User":        "struct",
		"ProcessData": "function",
		"MaxUsers":    "variable",
		"StatusOK":    "constant",
	}

	foundSymbols := make(map[string]bool)
	for _, symbol := range result.Symbols {
		expectedKind, ok := expectedSymbols[symbol.Name]
		if !ok {
			t.Errorf("Unexpected symbol found: %s", symbol.Name)
			continue
		}
		if symbol.Kind != expectedKind {
			t.Errorf("Symbol %s: expected kind %s, got %s", symbol.Name, expectedKind, symbol.Kind)
		}
		foundSymbols[symbol.Name] = true
	}

	// Check for missing symbols
	for name := range expectedSymbols {
		if !foundSymbols[name] {
			t.Errorf("Expected symbol not found: %s", name)
		}
	}

	// Verify documentation
	for _, symbol := range result.Symbols {
		switch symbol.Name {
		case "User":
			if symbol.Doc != "User represents a system user\n" {
				t.Errorf("Incorrect documentation for User: %q", symbol.Doc)
			}
		case "ProcessData":
			if symbol.Doc != "ProcessData handles data processing\n" {
				t.Errorf("Incorrect documentation for ProcessData: %q", symbol.Doc)
			}
		}
	}
}

func TestParseErrors(t *testing.T) {
	tests := []struct {
		name     string
		content  string
		wantErr  bool
		errMatch string
	}{
		{
			name: "invalid syntax",
			content: `package test
				func invalid syntax{
			}`,
			wantErr:  true,
			errMatch: "Failed to parse file",
		},
		{
			name: "empty file",
			content: `
			`,
			wantErr:  true,
			errMatch: "Failed to parse file",
		},
		{
			name:     "non-existent file",
			content:  "",
			wantErr:  true,
			errMatch: "Failed to parse file",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			tmpDir := t.TempDir()
			testFile := filepath.Join(tmpDir, "test.go")

			if tt.content != "" {
				if err := os.WriteFile(testFile, []byte(tt.content), 0644); err != nil {
					t.Fatalf("Failed to create test file: %v", err)
				}
			}

			result, err := Parse(testFile)
			if tt.wantErr {
				if err == nil && result.Success {
					t.Error("Expected error but got success")
					return
				}
				if !result.Success && tt.errMatch != "" && result.Error != tt.errMatch {
					t.Errorf("Error message = %q, want %q", result.Error, tt.errMatch)
				}
			} else if err != nil || !result.Success {
				t.Errorf("Parse() failed unexpectedly: %v, %v", err, result.Error)
			}
		})
	}
}
