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

func validateEditRequest(symbol, editType, content, position, relativeToSymbol string) error {
	if symbol == "" {
		return fmt.Errorf("symbol is required")
	}
	if editType == "" {
		return fmt.Errorf("edit type is required")
	}
	if editType != "replace" && editType != "insert" && editType != "delete" {
		return fmt.Errorf("invalid edit type: must be 'replace', 'insert', or 'delete'")
	}
	if editType != "delete" && content == "" {
		return fmt.Errorf("content is required for %s operations", editType)
	}
	if editType == "insert" {
		if position == "" {
			return fmt.Errorf("position is required for insert operations")
		}
		if position != "before" && position != "after" {
			return fmt.Errorf("invalid position: must be 'before' or 'after'")
		}
		if relativeToSymbol == "" {
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
		if cmd.Operation == "edit" && cmd.Edit != nil {
			if err := validateEditRequest(
				cmd.Edit.Symbol,
				cmd.Edit.EditType,
				cmd.Edit.Content,
				cmd.Edit.Insert.Position,
				cmd.Edit.Insert.RelativeToSymbol,
			); err != nil {
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
			// Validate command line parameters
			if err := validateEditRequest(*symbol, *editType, *content, *position, *relativeToSymbol); err != nil {
				writeError(err.Error())
				os.Exit(1)
			}

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
