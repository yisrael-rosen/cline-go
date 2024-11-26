// Type definitions for go-parser
export interface EditRequest {
    Path: string;
    Position?: string;
    Symbol: string;
    Content: string;
}

export interface EditResult {
    Success: boolean;
    Error?: string;
    Content?: string;
}
