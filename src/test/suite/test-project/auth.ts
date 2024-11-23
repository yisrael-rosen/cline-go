import { User, UserService } from './user';

export class AuthService {
    private userService: UserService;

    constructor(userService: UserService) {
        this.userService = userService;
    }

    public authenticateUser(email: string, password: string): User | null {
        const users = this.userService.getAllUsers();
        const user = users.find(u => u.email === email);

        // Simulated authentication (in real-world, you'd hash and compare passwords)
        if (user) {
            return user;
        }
        return null;
    }

    public registerUser(id: number, name: string, email: string, password: string): User {
        const newUser = { id, name, email };
        this.userService.addUser(newUser);
        return newUser;
    }
}

export function validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}
