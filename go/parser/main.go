package main

import (
	"encoding/json"
	"flag"
	"fmt"
	"os"

	"github.com/rosen/go-parser/parser"
)

type Command struct {
	Operation string              `json:"operation"` // "parse" or "edit"
	File      string              `json:"file"`
	Edit      *parser.EditRequest `json:"edit,omitempty"`
}

func main() {
	// Check if we're reading from stdin
	inputFlag := flag.String("input", "", "Input source ('-' for stdin)")
	flag.Parse()

	var cmd Command
	if *inputFlag == "-" {
		// Read command from stdin
		decoder := json.NewDecoder(os.Stdin)
		if err := decoder.Decode(&cmd); err != nil {
			writeError(fmt.Sprintf("Failed to parse input: %v", err))
			os.Exit(1)
		}
	} else {
		// Use command line flags
		filePath := flag.String("file", "", "Path to the Go file")
		symbol := flag.String("symbol", "", "Symbol to edit")
		content := flag.String("content", "", "New content")
		position := flag.String("position", "", "Position (before/after) or empty for replace")

		flag.Parse()

		if *filePath == "" {
			writeError("File path is required")
			os.Exit(1)
		}

		cmd = Command{
			File: *filePath,
		}

		if *symbol != "" {
			cmd.Operation = "edit"
			cmd.Edit = &parser.EditRequest{
				Path:     *filePath,
				Symbol:   *symbol,
				Content:  *content,
				Position: *position,
			}
		} else {
			cmd.Operation = "parse"
		}
	}

	switch cmd.Operation {
	case "parse":
		result, err := parser.Parse(cmd.File)
		if err != nil {
			writeError(fmt.Sprintf("Parse failed: %v", err))
			os.Exit(1)
		}
		writeJSON(result)

	case "edit":
		if cmd.Edit == nil {
			writeError("Edit request is required for edit operation")
			os.Exit(1)
		}
		result := parser.Edit(*cmd.Edit)
		writeJSON(result)

	default:
		writeError(fmt.Sprintf("Unknown operation: %s", cmd.Operation))
		os.Exit(1)
	}
}

func writeJSON(v interface{}) {
	if err := json.NewEncoder(os.Stdout).Encode(v); err != nil {
		fmt.Fprintf(os.Stderr, "Failed to write JSON: %v\n", err)
		os.Exit(1)
	}
}

func writeError(msg string) {
	err := struct {
		Success bool   `json:"success"`
		Error   string `json:"error"`
	}{
		Success: false,
		Error:   msg,
	}
	writeJSON(err)
}
