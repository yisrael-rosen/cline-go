export interface TestInterface {
    id: number;
    name: string;
}

export class TestClass {
    private items: TestInterface[] = [];

    constructor() {
        this.initialize();
    }

    private initialize(): void {
        this.items.push({
            id: 1,
            name: 'test'
        });
    }

    public getItems(): TestInterface[] {
        return [...this.items];
    }

    public addItem(item: TestInterface): void {
        this.items.push(item);
    }
}

export function helperFunction(id: number, name: string): TestInterface {
    return { id, name };
}
