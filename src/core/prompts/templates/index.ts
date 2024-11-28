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
    category?: string;
    variables?: Record<string, {
      type: 'string' | 'number' | 'boolean';
      description?: string;
      required?: boolean;
      default?: any;
    }>;
    parent?: string; // ID of parent template if this extends another
    createdAt?: Date;
    updatedAt?: Date;
  };
}

export interface TemplateConfig {
  activeTemplateId?: string;
  templates: PromptTemplate[];
  categories?: Record<string, {
    name: string;
    description?: string;
  }>;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
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
      tags: ["testing", "tdd", "best-practices"],
      category: "Testing",
      createdAt: new Date(),
      updatedAt: new Date()
    }
  }
];

export class TemplateManager {
  private config: TemplateConfig;

  constructor(config?: TemplateConfig) {
    this.config = config || {
      templates: [...builtInTemplates],
      categories: {
        "Testing": {
          name: "Testing",
          description: "Templates for test-driven development and testing practices"
        }
      }
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

  validateTemplate(template: Partial<PromptTemplate>): ValidationResult {
    const errors: string[] = [];

    if (!template.name?.trim()) {
      errors.push("Template name is required");
    }

    if (!template.content?.trim()) {
      errors.push("Template content is required");
    }

    if (template.metadata?.parent) {
      const parentExists = this.getTemplate(template.metadata.parent);
      if (!parentExists) {
        errors.push(`Parent template ${template.metadata.parent} does not exist`);
      }
    }

    if (template.metadata?.variables) {
      Object.entries(template.metadata.variables).forEach(([name, config]) => {
        if (!['string', 'number', 'boolean'].includes(config.type)) {
          errors.push(`Invalid type for variable ${name}: ${config.type}`);
        }
        if (config.required && config.default === undefined) {
          errors.push(`Required variable ${name} should have a default value`);
        }
      });
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  addTemplate(template: Omit<PromptTemplate, "id">): string {
    const validation = this.validateTemplate(template);
    if (!validation.isValid) {
      throw new Error(`Invalid template: ${validation.errors.join(", ")}`);
    }

    const id = this.generateTemplateId();
    const now = new Date();
    const newTemplate: PromptTemplate = {
      ...template,
      id,
      metadata: {
        ...template.metadata,
        version: "1.0.0",
        createdAt: now,
        updatedAt: now
      }
    };

    this.config.templates.push(newTemplate);
    return id;
  }

  updateTemplate(id: string, updates: Partial<Omit<PromptTemplate, "id">>): boolean {
    const index = this.config.templates.findIndex(t => t.id === id);
    if (index === -1) return false;

    const currentTemplate = this.config.templates[index];
    const updatedTemplate: PromptTemplate = {
      ...currentTemplate,
      ...updates,
      metadata: {
        ...currentTemplate.metadata,
        ...updates.metadata,
        version: this.incrementVersion(currentTemplate.metadata?.version || "1.0.0"),
        updatedAt: new Date()
      }
    };

    const validation = this.validateTemplate(updatedTemplate);
    if (!validation.isValid) {
      throw new Error(`Invalid template update: ${validation.errors.join(", ")}`);
    }

    this.config.templates[index] = updatedTemplate;
    return true;
  }

  deleteTemplate(id: string): boolean {
    const index = this.config.templates.findIndex(t => t.id === id);
    if (index === -1) return false;

    // Don't allow deleting built-in templates
    if (builtInTemplates.some(t => t.id === id)) {
      return false;
    }

    // Check if any templates extend this one
    const hasChildren = this.config.templates.some(
      t => t.metadata?.parent === id
    );
    if (hasChildren) {
      throw new Error("Cannot delete template that is extended by other templates");
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

  // Template versioning
  private incrementVersion(version: string): string {
    const [major, minor, patch] = version.split(".").map(Number);
    return `${major}.${minor}.${patch + 1}`;
  }

  // Template export/import
  exportTemplate(id: string): string {
    const template = this.getTemplate(id);
    if (!template) throw new Error(`Template ${id} not found`);
    return JSON.stringify(template, null, 2);
  }

  importTemplate(templateJson: string): string {
    try {
      const template = JSON.parse(templateJson) as PromptTemplate;
      const validation = this.validateTemplate(template);
      if (!validation.isValid) {
        throw new Error(`Invalid template: ${validation.errors.join(", ")}`);
      }
      return this.addTemplate(template);
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to import template: ${error.message}`);
      }
      throw new Error('Failed to import template: Unknown error');
    }
  }

  // Template categories
  addCategory(name: string, description?: string): void {
    if (this.config.categories?.[name]) {
      throw new Error(`Category ${name} already exists`);
    }
    this.config.categories = {
      ...this.config.categories,
      [name]: { name, description }
    };
  }

  getTemplatesByCategory(category: string): PromptTemplate[] {
    return this.config.templates.filter(
      t => t.metadata?.category === category
    );
  }

  private generateTemplateId(): string {
    return `template_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
