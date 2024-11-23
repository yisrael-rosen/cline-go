"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateEmail = exports.AuthService = void 0;
class AuthService {
    constructor(userService) {
        this.userService = userService;
    }
    authenticateUser(email, password) {
        const users = this.userService.getAllUsers();
        const user = users.find(u => u.email === email);
        // Simulated authentication (in real-world, you'd hash and compare passwords)
        if (user) {
            return user;
        }
        return null;
    }
    registerUser(id, name, email, password) {
        const newUser = { id, name, email };
        this.userService.addUser(newUser);
        return newUser;
    }
}
exports.AuthService = AuthService;
function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}
exports.validateEmail = validateEmail;
