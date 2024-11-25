export function processAction(action: string): string {
    switch (action) {
        case 'create':
            return 'Creating new item';
        case 'update':
            return 'Updating existing item';
        case 'delete':
            return 'Deleting item';
        default:
            return 'Unknown action';
    }
}

export function handleStatus(status: number): string {
    switch (status) {
        case 200:
            return 'OK';
        case 404:
            return 'Not Found';
        case 500:
            return 'Server Error';
        default:
            return 'Unknown Status';
    }
}

export function processNestedAction(action: string, subAction: string): string {
    switch (action) {
        case 'user':
            switch (subAction) {
                case 'create':
                    return 'Creating new user';
                case 'delete':
                    return 'Deleting user';
                default:
                    return 'Unknown user action';
            }
        case 'post':
            switch (subAction) {
                case 'create':
                    return 'Creating new post';
                case 'delete':
                    return 'Deleting post';
                default:
                    return 'Unknown post action';
            }
        default:
            return 'Unknown action type';
    }
}

export function handleComplexCase(input: unknown): string {
    const inputType = typeof input;
    switch (inputType) {
        // Case with multi-line comment
        /* This is a complex case
           with multiple lines
           of comments */
                case 'string':
                    return 'Modified string case';
        case 'newCase':
            return 'New case added';


        case 'number': { // Handle numeric input
            let result = '';
            const numInput = input as number;
            if (numInput > 0) {
                result = 'Positive';
            } else if (numInput < 0) {
                result = 'Negative';
            } else {
                result = 'Zero';
            }
            return result;
        }

        // Empty case with fallthrough
        case 'undefined':
        case 'symbol':
            return 'Special type';

        // Case with template literal and expression
        case 'object':
            return `Object: ${input === null ? 'null' : 'instance'}`;

        // Case with escaped characters and quotes
        case 'boolean':
            return 'Boolean: "' + String(input) + '"\\n';

        default: {
            // Default case with block
            const message = 'Unknown type';
            console.log(message);
            return message;
        }
    }
}

export function handleEmptyCase(value: number): string {
    switch (value) {
        case 1:
        case 2:
        case 3:
            return 'Low number';
        case 4:
        case 5:
        case 6:
            return 'Medium number';
        case 7:
        case 8:
        case 9:
            return 'High number';
        default:
            return 'Out of range';
    }
}
