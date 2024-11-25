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
