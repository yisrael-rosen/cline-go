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

func validateEditRequest(req *parser.EditRequest) error {
	if req == nil {
		return fmt.Errorf("edit request is required")
	}
	if req.Symbol == "" {
		return fmt.Errorf("symbol is required")
	}
	if req.EditType == "" {
		return fmt.Errorf("edit type is required")
	}
	if req.EditType != "replace" && req.EditType != "insert" && req.EditType != "delete" {
		return fmt.Errorf("invalid edit type: must be 'replace', 'insert', or 'delete'")
	}
	if req.EditType != "delete" && req.Content == "" {
		return fmt.Errorf("content is required for %s operations", req.EditType)
	}
	if req.EditType == "insert" {
		if req.Insert == nil {
			return fmt.Errorf("insert configuration is required for insert operations")
		}
		if req.Insert.Position == "" {
			return fmt.Errorf("position is required for insert operations")
		}
		if req.Insert.Position != "before" && req.Insert.Position != "after" {
			return fmt.Errorf("invalid position: must be 'before' or 'after'")
		}
		if req.Insert.RelativeToSymbol == "" {
			return fmt.Errorf("relative-to symbol is required for insert operations")
		}
	}
	return nil
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
		// Validate the JSON input
		if cmd.Operation == "edit" {
			if err := validateEditRequest(cmd.Edit); err != nil {
				writeError(err.Error())
				os.Exit(1)
			}
		}
	} else {
		// Use command line flags
		filePath := flag.String("file", "", "Path to the Go file")
		symbol := flag.String("symbol", "", "Symbol to edit")
		editType := flag.String("type", "", "Edit type (replace/insert/delete)")
		content := flag.String("content", "", "New content")
		position := flag.String("position", "", "Position (before/after) for insert operations")
		relativeToSymbol := flag.String("relative-to", "", "Target symbol for insert operations")

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
			editReq := &parser.EditRequest{
				Path:     *filePath,
				Symbol:   *symbol,
				EditType: *editType,
				Content:  *content,
			}

			// Add insert configuration if needed
			if *editType == "insert" {
				editReq.Insert = &parser.InsertConfig{
					Position:         *position,
					RelativeToSymbol: *relativeToSymbol,
				}
			}

			// Validate the edit request
			if err := validateEditRequest(editReq); err != nil {
				writeError(err.Error())
				os.Exit(1)
			}

			cmd.Edit = editReq
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
