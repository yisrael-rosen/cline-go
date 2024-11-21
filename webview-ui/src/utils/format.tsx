import * as React from 'react';

export function formatLargeNumber(num: number): string {
        if (num >= 1e9) {
                return (num / 1e9).toFixed(1) + "b"
        }
        if (num >= 1e6) {
                return (num / 1e6).toFixed(1) + "m"
        }
        if (num >= 1e3) {
                return (num / 1e3).toFixed(1) + "k"
        }
        return num.toString()
}

export function highlightMentions(text?: string): React.ReactElement {
    if (!text) {
        return React.createElement(React.Fragment);
    }
    
    const parts = text.split(/(@(?:problems|\/[^/\s]+(?:\/[^/\s]*)*(?:\/)?))/).filter(Boolean);
    
    return React.createElement(
        React.Fragment,
        null,
        parts.map((part: string, i: number) => {
            if (part.startsWith("@")) {
                return React.createElement(
                    "span",
                    {
                        key: i,
                        style: {
                            backgroundColor: "var(--vscode-editor-findMatchHighlightBackground)",
                            color: "inherit",
                        },
                    },
                    part
                );
            }
            return part;
        })
    );
}
