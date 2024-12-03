import * as vscode from 'vscode';
import { StateAgent, MinimalTaskState } from './StateAgent';
import { ApiHandler, buildApiHandler } from '../../api';
import { ApiConfiguration } from '../../shared/api';

export class StateAgentManager {
  private stateAgent: StateAgent;
  private currentState: MinimalTaskState;
  private disposables: vscode.Disposable[] = [];

  constructor(api: ApiHandler) {
    // Create a new API handler specifically for StateAgent with haiku model
    const stateAgentConfig: ApiConfiguration = {
      apiProvider: "anthropic",
      apiModelId: "claude-3-5-haiku-20241022",
      apiKey: (api as any).options?.apiKey,
      anthropicBaseUrl: (api as any).options?.anthropicBaseUrl
    };
    
    // Build a new API handler with haiku model
    const stateAgentApi = buildApiHandler(stateAgentConfig);
    this.stateAgent = new StateAgent(stateAgentApi);
    
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
    this.disposables.forEach(d => d.dispose());
    this.disposables = [];
  }

  public getCurrentState(): MinimalTaskState {
    return { ...this.currentState };
  }

  public async setMainGoal(goal: string) {
    const result = await this.stateAgent.handleNewTask(goal);
    this.currentState = result.newState;
    return result;
  }

  public async handleNewTask(taskText: string) {
    const result = await this.stateAgent.handleNewTask(taskText);
    this.currentState = result.newState;
    return result;
  }

  public async handleUserMessage(message: string) {
    const result = await this.stateAgent.handleUserMessage(this.currentState, message);
    this.currentState = result.newState;
    return result;
  }

  public async handleAssistantMessage(message: string) {
    const result = await this.stateAgent.handleAssistantMessage(this.currentState, message);
    this.currentState = result.newState;
    return result;
  }

  private async handleDocumentChange(event: vscode.TextDocumentChangeEvent) {
    if (event.contentChanges.length === 0) return;

    const result = await this.stateAgent.handleEvent(
      this.currentState,
      `Document changed: ${event.document.fileName}`
    );
    this.currentState = result.newState;
  }

  private async handleEditorChange(editor: vscode.TextEditor | undefined) {
    if (!editor) return;

    const result = await this.stateAgent.handleEvent(
      this.currentState,
      `Editor changed to: ${editor.document.fileName}`
    );
    this.currentState = result.newState;
  }

  private async handleTaskStart(event: vscode.TaskStartEvent) {
    const result = await this.stateAgent.handleEvent(
      this.currentState,
      `Task started: ${event.execution.task.name}`
    );
    this.currentState = result.newState;
  }

  private async handleTaskEnd(event: vscode.TaskEndEvent) {
    const result = await this.stateAgent.handleEvent(
      this.currentState,
      `Task completed: ${event.execution.task.name}`
    );
    this.currentState = result.newState;
  }
}
