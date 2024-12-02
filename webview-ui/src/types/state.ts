export interface MinimalTaskState {
    mainGoal: string;
    status: 'active' | 'blocked' | 'completed';
    currentStep?: string;
    lastAction?: string;
}
