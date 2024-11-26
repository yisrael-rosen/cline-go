package main

import (
	"encoding/json"
	"flag"
	"fmt"
	"io/ioutil"
	"log"
	"net/http"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
)

// API request/response types
type ParseRequest struct {
	Content string `json:"content"` // Go code content to parse
}

type EditRequest struct {
	Content    string `json:"content"`    // Go code content to edit
	SymbolName string `json:"symbolName"` // Symbol to edit
	EditType   string `json:"editType"`   // replace, insert, delete
	NewContent string `json:"newContent"` // New content for the symbol
}

type BatchParseRequest struct {
	Files []struct {
		Name    string `json:"name"`
		Content string `json:"content"`
	} `json:"files"`
}

type BatchEditRequest struct {
	Files []struct {
		Name    string `json:"name"`
		Content string `json:"content"`
		Edits   []struct {
			SymbolName string `json:"symbolName"`
			EditType   string `json:"editType"`
			NewContent string `json:"newContent"`
		} `json:"edits"`
	} `json:"files"`
}

type AnalyzeRequest struct {
	Content string   `json:"content"`
	Checks  []string `json:"checks"` // e.g., "unused", "complexity", "docs"
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
	Error string `json:"error,omitempty"`
}

func main() {
	port := flag.Int("port", 8080, "Port to listen on")
	flag.Parse()

	// Set up routes
	http.HandleFunc("/parse", handleParse)
	http.HandleFunc("/edit", handleEdit)
	http.HandleFunc("/batch/parse", handleBatchParse)
	http.HandleFunc("/batch/edit", handleBatchEdit)
	http.HandleFunc("/analyze", handleAnalyze)
	http.HandleFunc("/format", handleFormat)
	http.HandleFunc("/search", handleSearch)
	http.HandleFunc("/health", handleHealth)
	http.HandleFunc("/", handleDocs)

	// Start server
	addr := fmt.Sprintf(":%d", *port)
	log.Printf("Starting server on %s", addr)
	if err := http.ListenAndServe(addr, nil); err != nil {
		log.Fatalf("Server failed: %v", err)
	}
}

func handleParse(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req ParseRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, fmt.Sprintf("Invalid request: %v", err), http.StatusBadRequest)
		return
	}

	// Create temporary file for the content
	tmpFile, err := ioutil.TempFile("", "goparser-*.go")
	if err != nil {
		http.Error(w, fmt.Sprintf("Server error: %v", err), http.StatusInternalServerError)
		return
	}
	defer os.Remove(tmpFile.Name())

	if _, err := tmpFile.WriteString(req.Content); err != nil {
		http.Error(w, fmt.Sprintf("Server error: %v", err), http.StatusInternalServerError)
		return
	}
	tmpFile.Close()

	// Run parser
	result := runParser(map[string]interface{}{
		"operation": "parse",
		"file":      tmpFile.Name(),
	})

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(result)
}

func handleEdit(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req EditRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, fmt.Sprintf("Invalid request: %v", err), http.StatusBadRequest)
		return
	}

	// Create temporary file for the content
	tmpFile, err := ioutil.TempFile("", "goparser-*.go")
	if err != nil {
		http.Error(w, fmt.Sprintf("Server error: %v", err), http.StatusInternalServerError)
		return
	}
	defer os.Remove(tmpFile.Name())

	if _, err := tmpFile.WriteString(req.Content); err != nil {
		http.Error(w, fmt.Sprintf("Server error: %v", err), http.StatusInternalServerError)
		return
	}
	tmpFile.Close()

	// Run parser
	result := runParser(map[string]interface{}{
		"operation": "edit",
		"file":      tmpFile.Name(),
		"edit": map[string]interface{}{
			"symbolName": req.SymbolName,
			"editType":   req.EditType,
			"newContent": req.NewContent,
		},
	})

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(result)
}

func handleBatchParse(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req BatchParseRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, fmt.Sprintf("Invalid request: %v", err), http.StatusBadRequest)
		return
	}

	results := make(map[string]ParserResult)
	for _, file := range req.Files {
		// Create temporary file
		tmpFile, err := ioutil.TempFile("", "goparser-*.go")
		if err != nil {
			results[file.Name] = ParserResult{
				Success: false,
				Error:   fmt.Sprintf("Server error: %v", err),
			}
			continue
		}
		defer os.Remove(tmpFile.Name())

		if _, err := tmpFile.WriteString(file.Content); err != nil {
			results[file.Name] = ParserResult{
				Success: false,
				Error:   fmt.Sprintf("Server error: %v", err),
			}
			continue
		}
		tmpFile.Close()

		// Parse file
		results[file.Name] = runParser(map[string]interface{}{
			"operation": "parse",
			"file":      tmpFile.Name(),
		})
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(results)
}

func handleBatchEdit(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req BatchEditRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, fmt.Sprintf("Invalid request: %v", err), http.StatusBadRequest)
		return
	}

	results := make(map[string][]ParserResult)
	for _, file := range req.Files {
		// Create temporary file
		tmpFile, err := ioutil.TempFile("", "goparser-*.go")
		if err != nil {
			results[file.Name] = []ParserResult{{
				Success: false,
				Error:   fmt.Sprintf("Server error: %v", err),
			}}
			continue
		}
		defer os.Remove(tmpFile.Name())

		if _, err := tmpFile.WriteString(file.Content); err != nil {
			results[file.Name] = []ParserResult{{
				Success: false,
				Error:   fmt.Sprintf("Server error: %v", err),
			}}
			continue
		}
		tmpFile.Close()

		// Apply edits
		fileResults := make([]ParserResult, len(file.Edits))
		for i, edit := range file.Edits {
			fileResults[i] = runParser(map[string]interface{}{
				"operation": "edit",
				"file":      tmpFile.Name(),
				"edit": map[string]interface{}{
					"symbolName": edit.SymbolName,
					"editType":   edit.EditType,
					"newContent": edit.NewContent,
				},
			})
		}
		results[file.Name] = fileResults
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(results)
}

func handleAnalyze(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req AnalyzeRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, fmt.Sprintf("Invalid request: %v", err), http.StatusBadRequest)
		return
	}

	// Create temporary file
	tmpFile, err := ioutil.TempFile("", "goparser-*.go")
	if err != nil {
		http.Error(w, fmt.Sprintf("Server error: %v", err), http.StatusInternalServerError)
		return
	}
	defer os.Remove(tmpFile.Name())

	if _, err := tmpFile.WriteString(req.Content); err != nil {
		http.Error(w, fmt.Sprintf("Server error: %v", err), http.StatusInternalServerError)
		return
	}
	tmpFile.Close()

	// Run analysis
	result := runParser(map[string]interface{}{
		"operation": "analyze",
		"file":      tmpFile.Name(),
		"checks":    req.Checks,
	})

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(result)
}

func handleFormat(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req struct {
		Content string `json:"content"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, fmt.Sprintf("Invalid request: %v", err), http.StatusBadRequest)
		return
	}

	// Create temporary file
	tmpFile, err := ioutil.TempFile("", "goparser-*.go")
	if err != nil {
		http.Error(w, fmt.Sprintf("Server error: %v", err), http.StatusInternalServerError)
		return
	}
	defer os.Remove(tmpFile.Name())

	if _, err := tmpFile.WriteString(req.Content); err != nil {
		http.Error(w, fmt.Sprintf("Server error: %v", err), http.StatusInternalServerError)
		return
	}
	tmpFile.Close()

	// Run gofmt
	cmd := exec.Command("gofmt", tmpFile.Name())
	formatted, err := cmd.Output()
	if err != nil {
		http.Error(w, fmt.Sprintf("Format error: %v", err), http.StatusBadRequest)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{
		"formatted": string(formatted),
	})
}

func handleSearch(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req struct {
		Content string   `json:"content"`
		Pattern string   `json:"pattern"`
		Types   []string `json:"types"` // e.g., "function", "struct", "interface"
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, fmt.Sprintf("Invalid request: %v", err), http.StatusBadRequest)
		return
	}

	// Create temporary file
	tmpFile, err := ioutil.TempFile("", "goparser-*.go")
	if err != nil {
		http.Error(w, fmt.Sprintf("Server error: %v", err), http.StatusInternalServerError)
		return
	}
	defer os.Remove(tmpFile.Name())

	if _, err := tmpFile.WriteString(req.Content); err != nil {
		http.Error(w, fmt.Sprintf("Server error: %v", err), http.StatusInternalServerError)
		return
	}
	tmpFile.Close()

	// Parse and filter symbols
	result := runParser(map[string]interface{}{
		"operation": "parse",
		"file":      tmpFile.Name(),
	})

	if !result.Success {
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(result)
		return
	}

	// Filter symbols
	var filtered []struct {
		Name  string `json:"name"`
		Kind  string `json:"kind"`
		Start int    `json:"start"`
		End   int    `json:"end"`
		Doc   string `json:"doc"`
	}

	for _, symbol := range result.Symbols {
		// Check type filter
		if len(req.Types) > 0 {
			typeMatch := false
			for _, t := range req.Types {
				if strings.EqualFold(symbol.Kind, t) {
					typeMatch = true
					break
				}
			}
			if !typeMatch {
				continue
			}
		}

		// Check pattern
		if req.Pattern != "" {
			if !strings.Contains(strings.ToLower(symbol.Name), strings.ToLower(req.Pattern)) {
				continue
			}
		}

		filtered = append(filtered, symbol)
	}

	result.Symbols = filtered
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(result)
}

func handleHealth(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{
		"status": "ok",
	})
}

func handleDocs(w http.ResponseWriter, r *http.Request) {
	docs := `
<!DOCTYPE html>
<html>
<head>
    <title>Go Parser API</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
        pre { background: #f5f5f5; padding: 10px; border-radius: 5px; }
        .endpoint { margin: 20px 0; }
        .method { color: #e83e8c; }
    </style>
</head>
<body>
    <h1>Go Parser API</h1>
    
    <div class="endpoint">
        <h3><span class="method">POST</span> /parse</h3>
        <p>Parse Go code and return symbols.</p>
        <pre>
{
    "content": "package main\n\nfunc Hello() {}"
}
        </pre>
    </div>

    <div class="endpoint">
        <h3><span class="method">POST</span> /edit</h3>
        <p>Edit a symbol in Go code.</p>
        <pre>
{
    "content": "package main\n\nfunc Hello() {}",
    "symbolName": "Hello",
    "editType": "replace",
    "newContent": "func Hello() { println(\"Hello\") }"
}
        </pre>
    </div>

    <div class="endpoint">
        <h3><span class="method">POST</span> /batch/parse</h3>
        <p>Parse multiple Go files.</p>
        <pre>
{
    "files": [
        {
            "name": "main.go",
            "content": "package main\n\nfunc Hello() {}"
        },
        {
            "name": "util.go",
            "content": "package main\n\nfunc Util() {}"
        }
    ]
}
        </pre>
    </div>

    <div class="endpoint">
        <h3><span class="method">POST</span> /batch/edit</h3>
        <p>Edit multiple symbols across files.</p>
        <pre>
{
    "files": [
        {
            "name": "main.go",
            "content": "package main\n\nfunc Hello() {}",
            "edits": [
                {
                    "symbolName": "Hello",
                    "editType": "replace",
                    "newContent": "func Hello() { println(\"Hello\") }"
                }
            ]
        }
    ]
}
        </pre>
    </div>

    <div class="endpoint">
        <h3><span class="method">POST</span> /analyze</h3>
        <p>Analyze Go code for various checks.</p>
        <pre>
{
    "content": "package main\n\nfunc Hello() {}",
    "checks": ["unused", "complexity", "docs"]
}
        </pre>
    </div>

    <div class="endpoint">
        <h3><span class="method">POST</span> /format</h3>
        <p>Format Go code using gofmt.</p>
        <pre>
{
    "content": "package   main\n\nfunc    Hello()    {}"
}
        </pre>
    </div>

    <div class="endpoint">
        <h3><span class="method">POST</span> /search</h3>
        <p>Search for symbols in Go code.</p>
        <pre>
{
    "content": "package main\n\nfunc Hello() {}\nfunc World() {}",
    "pattern": "hello",
    "types": ["function"]
}
        </pre>
    </div>

    <div class="endpoint">
        <h3><span class="method">GET</span> /health</h3>
        <p>Check API health.</p>
    </div>

    <h2>Example Usage</h2>
    <pre>
# Parse Go code
curl -X POST http://localhost:8080/parse \
    -H "Content-Type: application/json" \
    -d '{"content": "package main\n\nfunc Hello() {}"}'

# Format Go code
curl -X POST http://localhost:8080/format \
    -H "Content-Type: application/json" \
    -d '{"content": "package   main\n\nfunc    Hello()    {}"}'

# Search for functions
curl -X POST http://localhost:8080/search \
    -H "Content-Type: application/json" \
    -d '{
        "content": "package main\n\nfunc Hello() {}\nfunc World() {}",
        "pattern": "hello",
        "types": ["function"]
    }'
    </pre>
</body>
</html>`

	w.Header().Set("Content-Type", "text/html")
	fmt.Fprint(w, docs)
}

func runParser(command map[string]interface{}) ParserResult {
	// Convert command to JSON
	input, err := json.Marshal(command)
	if err != nil {
		return ParserResult{Success: false, Error: fmt.Sprintf("Error creating command: %v", err)}
	}

	// Create temp file for input
	tmpInput, err := ioutil.TempFile("", "parser-input-*.json")
	if err != nil {
		return ParserResult{Success: false, Error: fmt.Sprintf("Error creating temp file: %v", err)}
	}
	defer os.Remove(tmpInput.Name())

	if _, err := tmpInput.Write(input); err != nil {
		return ParserResult{Success: false, Error: fmt.Sprintf("Error writing input: %v", err)}
	}
	tmpInput.Close()

	// Create temp file for output
	tmpOutput, err := ioutil.TempFile("", "parser-output-*.json")
	if err != nil {
		return ParserResult{Success: false, Error: fmt.Sprintf("Error creating temp file: %v", err)}
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
		return ParserResult{Success: false, Error: fmt.Sprintf("Error running parser: %v", err)}
	}

	// Parse result
	var result ParserResult
	resultBytes, err := ioutil.ReadFile(tmpOutput.Name())
	if err != nil {
		return ParserResult{Success: false, Error: fmt.Sprintf("Error reading result: %v", err)}
	}

	if err := json.Unmarshal(resultBytes, &result); err != nil {
		return ParserResult{Success: false, Error: fmt.Sprintf("Error parsing result: %v", err)}
	}

	return result
}
