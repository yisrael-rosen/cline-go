"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GoParser = void 0;
var child_process_1 = require("child_process");
var path = require("path");
var os = require("os");
var GoParser = /** @class */ (function () {
    function GoParser() {
        var platform = os.platform();
        var ext = platform === 'win32' ? '.exe' : '';
        this.binaryPath = path.join(__dirname, '..', 'bin', "goparser".concat(ext));
    }
    /**
     * Parse a Go file to extract symbols
     */
    GoParser.prototype.parseFile = function (filePath) {
        return __awaiter(this, void 0, void 0, function () {
            var command;
            return __generator(this, function (_a) {
                command = {
                    operation: 'parse',
                    file: filePath
                };
                return [2 /*return*/, this.runCommand(command)];
            });
        });
    };
    /**
     * Modify a symbol in a Go file
     */
    GoParser.prototype.editSymbol = function (filePath, edit) {
        return __awaiter(this, void 0, void 0, function () {
            var command;
            return __generator(this, function (_a) {
                command = {
                    operation: 'edit',
                    file: filePath,
                    edit: edit
                };
                return [2 /*return*/, this.runCommand(command)];
            });
        });
    };
    /**
     * Run a command through the Go parser binary
     */
    GoParser.prototype.runCommand = function (command) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            var process = (0, child_process_1.spawn)(_this.binaryPath, ['-input', '-']);
            var stdout = '';
            var stderr = '';
            // Send command to stdin
            process.stdin.write(JSON.stringify(command));
            process.stdin.end();
            // Collect stdout
            process.stdout.on('data', function (data) {
                stdout += data.toString();
            });
            // Collect stderr
            process.stderr.on('data', function (data) {
                stderr += data.toString();
            });
            // Handle process completion
            process.on('close', function (code) {
                if (code !== 0) {
                    reject(new Error("Parser failed with code ".concat(code, ": ").concat(stderr)));
                    return;
                }
                try {
                    var result = JSON.parse(stdout);
                    resolve(result);
                }
                catch (err) {
                    reject(new Error("Failed to parse result: ".concat(err)));
                }
            });
            // Handle process errors
            process.on('error', function (err) {
                reject(new Error("Failed to run parser: ".concat(err)));
            });
        });
    };
    return GoParser;
}());
exports.GoParser = GoParser;
// Example usage:
/*
const parser = new GoParser();

// Parse a file
const symbols = await parser.parseFile('main.go');
console.log('Symbols:', symbols);

// Edit a symbol
const result = await parser.editSymbol('main.go', {
    symbolName: 'ProcessData',
    editType: 'replace',
    newContent: 'func ProcessData(data []byte) error { return nil }'
});
console.log('Edit result:', result);
*/
