"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.main = void 0;
const user_1 = require("./user");
const auth_1 = require("./auth");
function main() {
    const userService = new user_1.UserService();
    const authService = new auth_1.AuthService(userService);
    // Register a new user
    const newUser = authService.registerUser(2, 'Jane Smith', 'jane.smith@example.com', 'securePassword123');
    // Validate email
    if ((0, auth_1.validateEmail)(newUser.email)) {
        console.log(`User ${newUser.name} registered successfully`);
    }
    // Attempt authentication
    const authenticatedUser = authService.authenticateUser('jane.smith@example.com', 'securePassword123');
    if (authenticatedUser) {
        console.log(`User ${authenticatedUser.name} authenticated`);
    }
}
exports.main = main;
// Run the main function
main();
