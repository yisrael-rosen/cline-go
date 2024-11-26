import * as vscode from 'vscode';
import { EditRequest } from '../../parser/types';
import { Edit } from '../../parser';

export function activate(context: vscode.ExtensionContext) {
    // Register command to add context parameter
    let addContextCommand = vscode.commands.registerCommand('goeditor.addContext', async () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            return;
        }

        // Get the selected symbol
        const symbol = await vscode.window.showInputBox({
            prompt: 'Enter method name to add context to'
        });

        if (!symbol) {
            return;
        }

        // Create edit request
        const req: EditRequest = {
            Path: editor.document.uri.fsPath,
            Symbol: symbol,
            Content: `func (s *Service) ${symbol}(ctx context.Context) error {
                select {
                case <-ctx.Done():
                    return ctx.Err()
                default:
                    return s.${symbol.toLowerCase()}()
                }
            }`
        };

        // Perform edit
        const result = await Edit(req);
        if (!result.Success) {
            vscode.window.showErrorMessage(`Failed to add context: ${result.Error}`);
            return;
        }

        // Show success message
        vscode.window.showInformationMessage('Successfully added context parameter');
    });

    // Register command to add field tags
    let addTagsCommand = vscode.commands.registerCommand('goeditor.addTags', async () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            return;
        }

        // Get the selected struct name
        const symbol = await vscode.window.showInputBox({
            prompt: 'Enter struct name to add tags to'
        });

        if (!symbol) {
            return;
        }

        // Get the tag type
        const tagType = await vscode.window.showQuickPick(['json', 'db', 'both'], {
            placeHolder: 'Select tag type'
        });

        if (!tagType) {
            return;
        }

        // Create edit request
        const req: EditRequest = {
            Path: editor.document.uri.fsPath,
            Symbol: symbol,
            Content: generateStructWithTags(symbol, tagType)
        };

        // Perform edit
        const result = await Edit(req);
        if (!result.Success) {
            vscode.window.showErrorMessage(`Failed to add tags: ${result.Error}`);
            return;
        }

        // Show success message
        vscode.window.showInformationMessage('Successfully added field tags');
    });

    // Register command to implement interface
    let implementInterfaceCommand = vscode.commands.registerCommand('goeditor.implementInterface', async () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            return;
        }

        // Get the interface name
        const interfaceName = await vscode.window.showInputBox({
            prompt: 'Enter interface name to implement'
        });

        if (!interfaceName) {
            return;
        }

        // Get the struct name
        const structName = await vscode.window.showInputBox({
            prompt: 'Enter struct name that will implement the interface'
        });

        if (!structName) {
            return;
        }

        // Create edit request
        const req: EditRequest = {
            Path: editor.document.uri.fsPath,
            Symbol: structName,
            Position: 'after',
            Content: generateInterfaceImplementation(interfaceName, structName)
        };

        // Perform edit
        const result = await Edit(req);
        if (!result.Success) {
            vscode.window.showErrorMessage(`Failed to implement interface: ${result.Error}`);
            return;
        }

        // Show success message
        vscode.window.showInformationMessage('Successfully implemented interface');
    });

    context.subscriptions.push(addContextCommand);
    context.subscriptions.push(addTagsCommand);
    context.subscriptions.push(implementInterfaceCommand);
}

function generateStructWithTags(structName: string, tagType: string): string {
    let tags = '';
    switch (tagType) {
        case 'json':
            tags = 'json:"field"';
            break;
        case 'db':
            tags = 'db:"field"';
            break;
        case 'both':
            tags = 'json:"field" db:"field"';
            break;
    }

    return `type ${structName} struct {
        ID        int       \`${tags.replace('field', 'id')}\`
        Name      string    \`${tags.replace('field', 'name')}\`
        Email     string    \`${tags.replace('field', 'email')}\`
        CreatedAt time.Time \`${tags.replace('field', 'created_at')}\`
    }`;
}

function generateInterfaceImplementation(interfaceName: string, structName: string): string {
    return `func (s *${structName}) Process(ctx context.Context) error {
        // TODO: Implement interface method
        return nil
    }

    func (s *${structName}) Close() error {
        // TODO: Implement cleanup
        return nil
    }`;
}
