"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createUser = exports.UserService = void 0;
class UserService {
    constructor() {
        this.users = [];
        this.initializeDefaultUsers();
    }
    initializeDefaultUsers() {
        this.users.push({
            id: 1,
            name: 'John Doe',
            email: 'john.doe@example.com'
        });
    }
    addUser(user) {
        this.users.push(user);
    }
    getUserById(id) {
        return this.users.find(user => user.id === id);
    }
    getAllUsers() {
        return [...this.users];
    }
}
exports.UserService = UserService;
function createUser(id, name, email) {
    return { id, name, email };
}
exports.createUser = createUser;
