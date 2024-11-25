export interface TestInterface {
    id: number;
    name: string;
}

export class TestClass {
    private items: TestInterface[] = [];

    constructor() {
}

    public getItems(): TestInterface[] {
        return this.items.filter(item => item.id > 0);
    }

    public addItem(item: TestInterface): void {
        this.items.push(item);
    }
}

export function helperFunction(id: number, name: string): TestInterface {
    return { id, name };
}
