// Test file with various symbols for document symbol testing

export interface User {
    id: number;
    name: string;
}

export class UserService {
    private users: User[] = [];

    constructor() {
        this.initializeUsers();
    }

    private initializeUsers(): void {
        this.users.push({ id: 1, name: 'John Doe' });
    }

    public getUsers(): User[] {
        return this.users;
    }

    public getUserById(id: number): User | undefined {
        return this.users.find(user => user.id === id);
    }
}

export function createUser(id: number, name: string): User {
    return { id, name };
}

const globalVariable = 'Test';

export default UserService;
