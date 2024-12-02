import * as vscode from 'vscode';
import { StateAgentManager } from '../StateAgentManager';
import { ApiHandler } from '../../../api';
import { MinimalTaskState } from '../StateAgent';

// Mock VSCode API
jest.mock('vscode', () => ({
  workspace: {
    onDidChangeTextDocument: jest.fn()
  },
  window: {
    onDidChangeActiveTextEditor: jest.fn()
  },
  tasks: {
    onDidStartTask: jest.fn(),
    onDidEndTask: jest.fn()
  },
  Disposable: jest.fn()
}));

describe('StateAgentManager', () => {
  let manager: StateAgentManager;
  let mockApi: jest.Mocked<ApiHandler>;
  let mockDisposable: jest.Mock;

  beforeEach(() => {
    // Reset mocks
    mockDisposable = jest.fn();
    (vscode.workspace.onDidChangeTextDocument as jest.Mock).mockReturnValue(mockDisposable);
    (vscode.window.onDidChangeActiveTextEditor as jest.Mock).mockReturnValue(mockDisposable);
    (vscode.tasks.onDidStartTask as jest.Mock).mockReturnValue(mockDisposable);
    (vscode.tasks.onDidEndTask as jest.Mock).mockReturnValue(mockDisposable);

    // Create mock API
    mockApi = {
      createMessage: jest.fn().mockResolvedValue([{ 
        type: 'text', 
        text: JSON.stringify({
          newState: {
            mainGoal: 'Test goal',
            status: 'active',
            currentStep: 'Testing'
          },
          reason: 'Test update'
        })
      }])
    } as any;

    manager = new StateAgentManager(mockApi);
  });

  test('starts and stops event listeners', () => {
    manager.start();
    
    expect(vscode.workspace.onDidChangeTextDocument).toHaveBeenCalled();
    expect(vscode.window.onDidChangeActiveTextEditor).toHaveBeenCalled();
    expect(vscode.tasks.onDidStartTask).toHaveBeenCalled();
    expect(vscode.tasks.onDidEndTask).toHaveBeenCalled();

    manager.stop();
    expect(mockDisposable).toHaveBeenCalledTimes(4);
  });

  test('sets main goal and updates state', async () => {
    const goal = 'Create a new feature';
    await manager.setMainGoal(goal);

    const state = manager.getCurrentState();
    expect(state.mainGoal).toBe('Test goal');
    expect(state.status).toBe('active');
  });

  test('maintains current state', () => {
    const initialState = manager.getCurrentState();
    expect(initialState).toEqual({
      mainGoal: '',
      status: 'active'
    });
  });
});
