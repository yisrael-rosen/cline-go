"use strict";
// Test file with various symbols for document symbol testing
Object.defineProperty(exports, "__esModule", { value: true });
exports.createUser = exports.UserService = void 0;
class UserService {
    constructor() {
        this.users = [];
        this.initializeUsers();
    }
    initializeUsers() {
        this.users.push({ id: 1, name: 'John Doe' });
    }
    getUsers() {
        return this.users;
    }
    getUserById(id) {
        return this.users.find(user => user.id === id);
    }
}
exports.UserService = UserService;
function createUser(id, name) {
    return { id, name };
}
exports.createUser = createUser;
const globalVariable = 'Test';
exports.default = UserService;
