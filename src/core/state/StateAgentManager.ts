import * as vscode from 'vscode';
import { StateAgent, MinimalTaskState, StateUpdateInput } from './StateAgent';
import { ApiHandler } from '../../api';

export class StateAgentManager {
  private stateAgent: StateAgent;
  private currentState: MinimalTaskState;
  private disposables: vscode.Disposable[] = [];

  constructor(api: ApiHandler) {
    this.stateAgent = new StateAgent(api);
    this.currentState = {
      mainGoal: '',
      status: 'active'
    };
  }

  public start() {
    // Listen for relevant VSCode events
    this.disposables.push(
      vscode.workspace.onDidChangeTextDocument(this.handleDocumentChange.bind(this)),
      vscode.window.onDidChangeActiveTextEditor(this.handleEditorChange.bind(this)),
      vscode.tasks.onDidStartTask(this.handleTaskStart.bind(this)),
      vscode.tasks.onDidEndTask(this.handleTaskEnd.bind(this))
    );
  }

  public stop() {
    // Clean up event listeners
    this.disposables.forEach(d => d.dispose());
    this.disposables = [];
  }

  public getCurrentState(): MinimalTaskState {
    return { ...this.currentState };
  }

  public async setMainGoal(goal: string) {
    const input: StateUpdateInput = {
      currentState: this.currentState,
      newEvent: 'Set main goal',
      lastMessage: goal
    };

    const result = await this.stateAgent.updateState(input);
    this.currentState = result.newState;
    return result;
  }

  private async handleDocumentChange(event: vscode.TextDocumentChangeEvent) {
    if (event.contentChanges.length === 0) return;

    const input: StateUpdateInput = {
      currentState: this.currentState,
      newEvent: 'Document changed',
      lastMessage: `Changes in ${event.document.fileName}`
    };

    const result = await this.stateAgent.updateState(input);
    this.currentState = result.newState;
  }

  private async handleEditorChange(editor: vscode.TextEditor | undefined) {
    if (!editor) return;

    const input: StateUpdateInput = {
      currentState: this.currentState,
      newEvent: 'Editor changed',
      lastMessage: `Switched to ${editor.document.fileName}`
    };

    const result = await this.stateAgent.updateState(input);
    this.currentState = result.newState;
  }

  private async handleTaskStart(event: vscode.TaskStartEvent) {
    const input: StateUpdateInput = {
      currentState: this.currentState,
      newEvent: 'Task started',
      lastMessage: `Started task: ${event.execution.task.name}`
    };

    const result = await this.stateAgent.updateState(input);
    this.currentState = result.newState;
  }

  private async handleTaskEnd(event: vscode.TaskEndEvent) {
    const input: StateUpdateInput = {
      currentState: this.currentState,
      newEvent: 'Task ended',
      lastMessage: `Completed task: ${event.execution.task.name}`
    };

    const result = await this.stateAgent.updateState(input);
    this.currentState = result.newState;
  }
}
