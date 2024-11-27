package parser

// EditRequest represents a request to edit code
type EditRequest struct {
	Path     string        // File path to edit
	EditType string        // Required: "replace", "insert", or "delete"
	Symbol   string        // Symbol name to target (for replace/delete) or new symbol name (for insert)
	Content  string        // New content to insert/replace
	Insert   *InsertConfig `json:",omitempty"` // Required configuration when EditType is "insert"
}

// InsertConfig contains the configuration for insert operations
type InsertConfig struct {
	Position         string // Required: "before" or "after"
	RelativeToSymbol string // Required: Name of the existing symbol to insert relative to
}

// EditResult represents the result of an edit operation
type EditResult struct {
	Success bool   // Whether the edit was successful
	Error   string // Error message if unsuccessful
	Content string // The edited content
}
