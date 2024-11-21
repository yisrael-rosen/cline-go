export class Position {
    constructor(public readonly line: number, public readonly character: number) {}

    compareTo(other: Position): number {
        if (this.line !== other.line) {
            return this.line - other.line;
        }
        return this.character - other.character;
    }

    isBefore(other: Position): boolean {
        return this.compareTo(other) < 0;
    }

    isBeforeOrEqual(other: Position): boolean {
        return this.compareTo(other) <= 0;
    }

    isAfter(other: Position): boolean {
        return this.compareTo(other) > 0;
    }

    isAfterOrEqual(other: Position): boolean {
        return this.compareTo(other) >= 0;
    }

    isEqual(other: Position): boolean {
        return this.line === other.line && this.character === other.character;
    }

    translate(lineDelta?: number, characterDelta?: number): Position {
        const newLine = this.line + (lineDelta || 0);
        const newCharacter = this.character + (characterDelta || 0);
        return new Position(newLine, newCharacter);
    }

    with(line?: number, character?: number): Position {
        return new Position(
            line === undefined ? this.line : line,
            character === undefined ? this.character : character
        );
    }
}

export class Range {
    constructor(
        public readonly start: Position,
        public readonly end: Position
    ) {}

    get isEmpty(): boolean {
        return this.start.isEqual(this.end);
    }

    get isSingleLine(): boolean {
        return this.start.line === this.end.line;
    }

    contains(positionOrRange: Position | Range): boolean {
        if (positionOrRange instanceof Position) {
            const position = positionOrRange;
            return this.start.isBeforeOrEqual(position) && this.end.isAfterOrEqual(position);
        } else {
            const range = positionOrRange;
            return this.contains(range.start) && this.contains(range.end);
        }
    }

    isEqual(other: Range): boolean {
        return this.start.isEqual(other.start) && this.end.isEqual(other.end);
    }

    intersection(other: Range): Range | undefined {
        const start = this.start.isBefore(other.start) ? other.start : this.start;
        const end = this.end.isBefore(other.end) ? this.end : other.end;
        if (start.isBeforeOrEqual(end)) {
            return new Range(start, end);
        }
        return undefined;
    }

    union(other: Range): Range {
        const start = this.start.isBefore(other.start) ? this.start : other.start;
        const end = this.end.isAfter(other.end) ? this.end : other.end;
        return new Range(start, end);
    }

    with(start?: Position, end?: Position): Range {
        return new Range(
            start || this.start,
            end || this.end
        );
    }
}

export class Uri {
    static file(path: string): Uri {
        return new Uri(path);
    }

    constructor(public readonly fsPath: string) {
        this.scheme = 'file';
        this.path = fsPath;
    }

    readonly scheme: string;
    readonly authority: string = '';
    readonly path: string;
    readonly query: string = '';
    readonly fragment: string = '';

    toString(): string {
        return `file://${this.fsPath}`;
    }

    toJSON(): any {
        return {
            scheme: this.scheme,
            authority: this.authority,
            path: this.path,
            query: this.query,
            fragment: this.fragment,
            fsPath: this.fsPath,
            external: `file://${this.fsPath}`,
            $mid: 1,
            _sep: 1
        };
    }

    with(change: { scheme?: string; authority?: string; path?: string; query?: string; fragment?: string }): Uri {
        return this;
    }
}

export class Location {
    constructor(
        public readonly uri: Uri,
        public readonly range: Range
    ) {}
}

export class DocumentSymbol {
    constructor(
        public readonly name: string,
        public readonly detail: string,
        public readonly kind: number,
        public readonly range: Range,
        public readonly selectionRange: Range,
        public readonly children?: DocumentSymbol[]
    ) {}
}

export enum EndOfLine {
    LF = 1,
    CRLF = 2
}

export interface TextLine {
    text: string;
    lineNumber: number;
    range: Range;
    rangeIncludingLineBreak: Range;
    firstNonWhitespaceCharacterIndex: number;
    isEmptyOrWhitespace: boolean;
}

export class TextDocument {
    private _version: number = 1;
    private _lineCount: number;
    private _lines: string[];

    constructor(private content: string, public uri: Uri) {
        this._lines = content.split('\n');
        this._lineCount = this._lines.length;
    }

    get fileName(): string {
        return this.uri.fsPath;
    }

    get isUntitled(): boolean {
        return false;
    }

    get isDirty(): boolean {
        return false;
    }

    get isClosed(): boolean {
        return false;
    }

    get languageId(): string {
        return this.uri.fsPath.endsWith('.go') ? 'go' : 'typescript';
    }

    get version(): number {
        return this._version;
    }

    get lineCount(): number {
        return this._lineCount;
    }

    get eol(): EndOfLine {
        return EndOfLine.LF;
    }

    getText(range?: Range): string {
        if (!range) {
            return this.content;
        }
        const startOffset = this.offsetAt(range.start);
        const endOffset = this.offsetAt(range.end);
        return this.content.substring(startOffset, endOffset);
    }

    getWordRangeAtPosition(position: Position, regexp?: RegExp): Range | undefined {
        const line = this._lines[position.line];
        if (!line) return undefined;

        regexp = regexp || /\w+/g;
        let match: RegExpExecArray | null;
        while (match = regexp.exec(line)) {
            const start = match.index;
            const end = start + match[0].length;
            if (start <= position.character && position.character <= end) {
                return new Range(
                    new Position(position.line, start),
                    new Position(position.line, end)
                );
            }
        }
        return undefined;
    }

    positionAt(offset: number): Position {
        const textBeforeOffset = this.content.substring(0, offset);
        const lines = textBeforeOffset.split('\n');
        const line = lines.length - 1;
        const lastLine = lines[lines.length - 1];
        const character = lastLine ? lastLine.length : 0;
        return new Position(line, character);
    }

    offsetAt(position: Position): number {
        let offset = 0;
        for (let i = 0; i < position.line; i++) {
            offset += this._lines[i].length + 1; // +1 for newline
        }
        return offset + Math.min(position.character, this._lines[position.line].length);
    }

    lineAt(line: number): TextLine {
        const text = this._lines[line] || '';
        const range = new Range(
            new Position(line, 0),
            new Position(line, text.length)
        );
        const rangeIncludingLineBreak = new Range(
            new Position(line, 0),
            new Position(line, text.length + 1)
        );
        const firstNonWhitespaceCharacterIndex = text.search(/\S/);
        const isEmptyOrWhitespace = firstNonWhitespaceCharacterIndex === -1;
        
        return {
            text,
            lineNumber: line,
            range,
            rangeIncludingLineBreak,
            firstNonWhitespaceCharacterIndex,
            isEmptyOrWhitespace
        };
    }

    save(): Promise<boolean> {
        return Promise.resolve(true);
    }

    validateRange(range: Range): Range {
        return range;
    }

    validatePosition(position: Position): Position {
        return position;
    }
}

export class TextEditor {
    constructor(public document: TextDocument) {}
}

export enum ViewColumn {
    Active = -1,
    Beside = -2,
    One = 1,
    Two = 2,
    Three = 3
}

export interface TextDocumentShowOptions {
    viewColumn?: ViewColumn;
    preserveFocus?: boolean;
    preview?: boolean;
    selection?: Range;
}

// Mock implementations
let mockOpenTextDocument = async (uri: Uri | string): Promise<TextDocument> => {
    throw new Error('Not implemented');
};

let mockExecuteCommand = async <T>(command: string, ...args: any[]): Promise<T> => {
    throw new Error('Not implemented');
};

export const window = {
    showTextDocument: (doc: TextDocument | Uri, columnOrOptions?: ViewColumn | TextDocumentShowOptions, preserveFocus?: boolean) => {
        if (doc instanceof Uri) {
            return Promise.resolve(new TextEditor(new TextDocument('', doc)));
        }
        return Promise.resolve(new TextEditor(doc));
    },
    createOutputChannel: (name: string) => ({
        appendLine: (value: string) => {},
        show: () => {}
    })
};

export const workspace = {
    openTextDocument: (uri: Uri | string) => mockOpenTextDocument(uri)
};

export const commands = {
    executeCommand: <T>(command: string, ...args: any[]) => mockExecuteCommand<T>(command, ...args)
};

// Helper functions to set mock implementations
export function setMockOpenTextDocument(impl: typeof mockOpenTextDocument) {
    mockOpenTextDocument = impl;
}

export function setMockExecuteCommand(impl: typeof mockExecuteCommand) {
    mockExecuteCommand = impl;
}

// Symbol kinds
export const SymbolKind = {
    Class: 4,
    Method: 5,
    Property: 6,
    Variable: 12
};
