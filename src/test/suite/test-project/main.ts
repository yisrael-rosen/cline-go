import { UserService } from './user';
import { AuthService, validateEmail } from './auth';

function main() {
    const userService = new UserService();
    const authService = new AuthService(userService);

    // Register a new user
    const newUser = authService.registerUser(
        2, 
        'Jane Smith', 
        'jane.smith@example.com', 
        'securePassword123'
    );

    // Validate email
    if (validateEmail(newUser.email)) {
        console.log(`User ${newUser.name} registered successfully`);
    }

    // Attempt authentication
    const authenticatedUser = authService.authenticateUser(
        'jane.smith@example.com', 
        'securePassword123'
    );

    if (authenticatedUser) {
        console.log(`User ${authenticatedUser.name} authenticated`);
    }
}

// Run the main function
main();

export { main };
