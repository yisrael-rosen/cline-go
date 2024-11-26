package parser

// EditRequest represents a request to edit code
type EditRequest struct {
	Path     string // File path to edit
	Position string // "before" or "after" for insertions, empty for replacement
	Symbol   string // Symbol name to target
	Content  string // New content to insert/replace
}

// EditResult represents the result of an edit operation
type EditResult struct {
	Success bool   // Whether the edit was successful
	Error   string // Error message if unsuccessful
	Content string // The edited content
}
