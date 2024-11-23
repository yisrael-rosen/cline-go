export interface User {
    id: number;
    name: string;
    email: string;
}

export class UserService {
    private users: User[] = [];

    constructor() {
        this.initializeDefaultUsers();
    }

    private initializeDefaultUsers(): void {
        this.users.push({
            id: 1,
            name: 'John Doe',
            email: 'john.doe@example.com'
        });
    }

    public addUser(user: User): void {
        this.users.push(user);
    }

    public getUserById(id: number): User | undefined {
        return this.users.find(user => user.id === id);
    }

    public getAllUsers(): User[] {
        return [...this.users];
    }
}

export function createUser(id: number, name: string, email: string): User {
    return { id, name, email };
}
