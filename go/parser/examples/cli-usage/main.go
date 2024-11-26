package main

import (
	"encoding/json"
	"flag"
	"fmt"
	"io/ioutil"
	"os"
	"os/exec"
	"path/filepath"
)

func main() {
	// Example 1: List all functions in a Go file
	listFuncs := flag.Bool("list-funcs", false, "List all functions in a Go file")

	// Example 2: Extract documentation
	extractDocs := flag.Bool("extract-docs", false, "Extract documentation from a Go file")

	// Example 3: Rename a function
	rename := flag.Bool("rename", false, "Rename a function")
	oldName := flag.String("old", "", "Old function name")
	newName := flag.String("new", "", "New function name")

	// Example 4: Add error handling
	addErrors := flag.Bool("add-errors", false, "Add error handling to a function")
	funcName := flag.String("func", "", "Function to modify")

	filePath := flag.String("file", "", "Go file to process")
	flag.Parse()

	if *filePath == "" {
		fmt.Println("Please specify a Go file with -file")
		os.Exit(1)
	}

	// Example 1: List functions
	if *listFuncs {
		cmd := map[string]interface{}{
			"operation": "parse",
			"file":      *filePath,
		}
		result := runParser(cmd)

		fmt.Println("Functions found:")
		for _, symbol := range result.Symbols {
			if symbol.Kind == "function" {
				fmt.Printf("- %s\n", symbol.Name)
				if symbol.Doc != "" {
					fmt.Printf("  Doc: %s\n", symbol.Doc)
				}
			}
		}
	}

	// Example 2: Extract documentation
	if *extractDocs {
		cmd := map[string]interface{}{
			"operation": "parse",
			"file":      *filePath,
		}
		result := runParser(cmd)

		fmt.Println("Documentation:")
		for _, symbol := range result.Symbols {
			if symbol.Doc != "" {
				fmt.Printf("%s (%s):\n%s\n", symbol.Name, symbol.Kind, symbol.Doc)
			}
		}
	}

	// Example 3: Rename function
	if *rename {
		if *oldName == "" || *newName == "" {
			fmt.Println("Please specify -old and -new function names")
			os.Exit(1)
		}

		// First find the function
		parseCmd := map[string]interface{}{
			"operation": "parse",
			"file":      *filePath,
		}
		parseResult := runParser(parseCmd)

		var funcContent string
		for _, symbol := range parseResult.Symbols {
			if symbol.Kind == "function" && symbol.Name == *oldName {
				// Get the function content and replace the name
				content, err := ioutil.ReadFile(*filePath)
				if err != nil {
					fmt.Printf("Error reading file: %v\n", err)
					os.Exit(1)
				}
				funcContent = string(content[symbol.Start:symbol.End])
				funcContent = fmt.Sprintf("func %s%s", *newName, funcContent[len("func "+*oldName):])
				break
			}
		}

		if funcContent == "" {
			fmt.Printf("Function %s not found\n", *oldName)
			os.Exit(1)
		}

		// Replace the function
		editCmd := map[string]interface{}{
			"operation": "edit",
			"file":      *filePath,
			"edit": map[string]interface{}{
				"symbolName": *oldName,
				"editType":   "replace",
				"newContent": funcContent,
			},
		}
		editResult := runParser(editCmd)

		if editResult.Success {
			fmt.Printf("Renamed %s to %s\n", *oldName, *newName)
		} else {
			fmt.Printf("Error renaming function: %s\n", editResult.Error)
		}
	}

	// Example 4: Add error handling
	if *addErrors {
		if *funcName == "" {
			fmt.Println("Please specify function name with -func")
			os.Exit(1)
		}

		// First find the function
		parseCmd := map[string]interface{}{
			"operation": "parse",
			"file":      *filePath,
		}
		parseResult := runParser(parseCmd)

		var funcContent string
		for _, symbol := range parseResult.Symbols {
			if symbol.Kind == "function" && symbol.Name == *funcName {
				content, err := ioutil.ReadFile(*filePath)
				if err != nil {
					fmt.Printf("Error reading file: %v\n", err)
					os.Exit(1)
				}
				funcContent = string(content[symbol.Start:symbol.End])

				// Add error handling
				funcContent = addErrorHandling(funcContent)
				break
			}
		}

		if funcContent == "" {
			fmt.Printf("Function %s not found\n", *funcName)
			os.Exit(1)
		}

		// Update the function
		editCmd := map[string]interface{}{
			"operation": "edit",
			"file":      *filePath,
			"edit": map[string]interface{}{
				"symbolName": *funcName,
				"editType":   "replace",
				"newContent": funcContent,
			},
		}
		editResult := runParser(editCmd)

		if editResult.Success {
			fmt.Printf("Added error handling to %s\n", *funcName)
		} else {
			fmt.Printf("Error modifying function: %s\n", editResult.Error)
		}
	}
}

type ParserResult struct {
	Success bool `json:"success"`
	Symbols []struct {
		Name  string `json:"name"`
		Kind  string `json:"kind"`
		Start int    `json:"start"`
		End   int    `json:"end"`
		Doc   string `json:"doc"`
	} `json:"symbols"`
	Error string `json:"error"`
}

func runParser(command map[string]interface{}) ParserResult {
	// Convert command to JSON
	input, err := json.Marshal(command)
	if err != nil {
		fmt.Printf("Error creating command: %v\n", err)
		os.Exit(1)
	}

	// Create temp file for input
	tmpInput, err := ioutil.TempFile("", "parser-input-*.json")
	if err != nil {
		fmt.Printf("Error creating temp file: %v\n", err)
		os.Exit(1)
	}
	defer os.Remove(tmpInput.Name())

	if _, err := tmpInput.Write(input); err != nil {
		fmt.Printf("Error writing input: %v\n", err)
		os.Exit(1)
	}
	tmpInput.Close()

	// Create temp file for output
	tmpOutput, err := ioutil.TempFile("", "parser-output-*.json")
	if err != nil {
		fmt.Printf("Error creating temp file: %v\n", err)
		os.Exit(1)
	}
	defer os.Remove(tmpOutput.Name())
	tmpOutput.Close()

	// Get parser path
	parserPath := filepath.Join("bin", "goparser")
	if os.Getenv("GOPARSER_PATH") != "" {
		parserPath = os.Getenv("GOPARSER_PATH")
	}

	// Run parser
	execCmd := exec.Command(parserPath, "-input", tmpInput.Name(), "-output", tmpOutput.Name())
	execCmd.Stdout = os.Stdout
	execCmd.Stderr = os.Stderr
	if err := execCmd.Run(); err != nil {
		fmt.Printf("Error running parser: %v\n", err)
		os.Exit(1)
	}

	// Parse result
	var result ParserResult
	resultBytes, err := ioutil.ReadFile(tmpOutput.Name())
	if err != nil {
		fmt.Printf("Error reading result: %v\n", err)
		os.Exit(1)
	}

	if err := json.Unmarshal(resultBytes, &result); err != nil {
		fmt.Printf("Error parsing result: %v\n", err)
		os.Exit(1)
	}

	return result
}

func addErrorHandling(funcContent string) string {
	// Simple error handling addition - in practice, you'd want more sophisticated parsing
	return fmt.Sprintf(`%s
	if err != nil {
		return fmt.Errorf("operation failed: %%w", err)
	}`, funcContent[:len(funcContent)-1])
}
