import { ToolUseName } from "../../../shared/ExtensionMessage";

export interface PromptTemplate {
  id: string;
  name: string;
  description: string;
  content: string;
  metadata?: {
    author?: string;
    version?: string;
    tags?: string[];
    enabledTools?: ToolUseName[];
  };
}

export interface TemplateConfig {
  activeTemplateId?: string;
  templates: PromptTemplate[];
}

// Built-in templates that ship with the extension
export const builtInTemplates: PromptTemplate[] = [
  {
    id: "tdd",
    name: "Test Driven Development",
    description: "Optimized for TDD workflow with testing best practices",
    content: `
TEST-DRIVEN DEVELOPMENT (TDD) INSTRUCTIONS

When developing code using TDD, follow these steps for each component/function:

1. Start with a failing test:
   - Use descriptive names: should_[expected]_when_[condition]
   - Cover: happy path, edge cases, error conditions
   - Write minimal test code to verify ONE behavior

2. Write minimal code to make test pass:
   - Implement only what's needed to pass the current test
   - Avoid premature optimization
   - Keep implementation focused on test requirements

3. Refactor while maintaining green tests:
   - Improve code structure/readability
   - Follow SOLID principles
   - Ensure tests remain passing

4. Follow FIRST principles:
   - Fast: Tests should run quickly
   - Isolated: No dependencies between tests
   - Repeatable: Same results each run
   - Self-validating: Pass/fail without manual checks
   - Timely: Write tests before implementation`,
    metadata: {
      author: "Cline",
      version: "1.0.0",
      tags: ["testing", "tdd", "best-practices"]
    }
  }
];

export class TemplateManager {
  private config: TemplateConfig;

  constructor(config?: TemplateConfig) {
    this.config = config || {
      templates: [...builtInTemplates]
    };
  }

  getTemplate(id: string): PromptTemplate | undefined {
    return this.config.templates.find(t => t.id === id);
  }

  getActiveTemplate(): PromptTemplate | undefined {
    if (!this.config.activeTemplateId) return undefined;
    return this.getTemplate(this.config.activeTemplateId);
  }

  getAllTemplates(): PromptTemplate[] {
    return [...this.config.templates];
  }

  addTemplate(template: Omit<PromptTemplate, "id">): string {
    const id = this.generateTemplateId();
    const newTemplate: PromptTemplate = { ...template, id };
    this.config.templates.push(newTemplate);
    return id;
  }

  updateTemplate(id: string, updates: Partial<Omit<PromptTemplate, "id">>): boolean {
    const index = this.config.templates.findIndex(t => t.id === id);
    if (index === -1) return false;

    this.config.templates[index] = {
      ...this.config.templates[index],
      ...updates
    };
    return true;
  }

  deleteTemplate(id: string): boolean {
    const index = this.config.templates.findIndex(t => t.id === id);
    if (index === -1) return false;

    // Don't allow deleting built-in templates
    if (builtInTemplates.some(t => t.id === id)) {
      return false;
    }

    this.config.templates.splice(index, 1);
    if (this.config.activeTemplateId === id) {
      this.config.activeTemplateId = undefined;
    }
    return true;
  }

  setActiveTemplate(id: string | undefined): boolean {
    if (id && !this.config.templates.some(t => t.id === id)) return false;
    this.config.activeTemplateId = id;
    return true;
  }

  getConfig(): TemplateConfig {
    return { ...this.config };
  }

  private generateTemplateId(): string {
    return `template_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
