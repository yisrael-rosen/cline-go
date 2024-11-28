import * as assert from 'assert';
import { TemplateManager, PromptTemplate } from '../../../core/prompts/templates';

suite('[templates] TemplateManager', () => {
  let manager: TemplateManager;

  setup(() => {
    manager = new TemplateManager();
  });

  const createSampleTemplate = (): Omit<PromptTemplate, 'id'> => ({
    name: 'Sample Template',
    description: 'A sample template for testing',
    content: 'Sample content with {{variable}}',
    metadata: {
      author: 'Test Author',
      tags: ['test'],
      category: 'Testing',
      variables: {
        variable: {
          type: 'string',
          description: 'A test variable',
          required: true,
          default: 'default value'
        }
      }
    }
  });

  suite('Template CRUD', () => {
    test('should create a new template', () => {
      const id = manager.addTemplate(createSampleTemplate());
      const template = manager.getTemplate(id);
      
      assert.ok(template);
      assert.strictEqual(template.name, 'Sample Template');
      assert.strictEqual(template.metadata?.version, '1.0.0');
      assert.ok(template.metadata?.createdAt instanceof Date);
    });

    test('should update a template', () => {
      const id = manager.addTemplate(createSampleTemplate());
      const success = manager.updateTemplate(id, {
        name: 'Updated Template'
      });

      const template = manager.getTemplate(id);
      assert.strictEqual(success, true);
      assert.strictEqual(template?.name, 'Updated Template');
      assert.strictEqual(template?.metadata?.version, '1.0.1');
      assert.ok(template?.metadata?.updatedAt instanceof Date);
    });

    test('should not delete built-in templates', () => {
      const tddTemplate = manager.getTemplate('tdd');
      assert.ok(tddTemplate);
      
      const success = manager.deleteTemplate('tdd');
      assert.strictEqual(success, false);
      assert.ok(manager.getTemplate('tdd'));
    });

    test('should delete custom templates', () => {
      const id = manager.addTemplate(createSampleTemplate());
      const success = manager.deleteTemplate(id);
      assert.strictEqual(success, true);
      assert.strictEqual(manager.getTemplate(id), undefined);
    });

    test('should not delete template with children', async () => {
      // Create parent template
      const parentId = manager.addTemplate(createSampleTemplate());

      // Create child template
      const childTemplate = createSampleTemplate();
      childTemplate.metadata = {
        ...childTemplate.metadata,
        parent: parentId
      };
      manager.addTemplate(childTemplate);

      // Attempt to delete parent
      assert.throws(() => manager.deleteTemplate(parentId),
        /Cannot delete template that is extended by other templates/);
    });
  });

  suite('Template Validation', () => {
    test('should validate required fields', () => {
      const template = createSampleTemplate();
      delete (template as any).name;
      
      assert.throws(() => manager.addTemplate(template),
        /Template name is required/);
    });

    test('should validate variable types', () => {
      const template = createSampleTemplate();
      template.metadata!.variables!.invalid = {
        type: 'invalid' as any,
        required: true,
        default: 'value'
      };

      assert.throws(() => manager.addTemplate(template),
        /Invalid type for variable invalid/);
    });

    test('should validate parent template existence', () => {
      const template = createSampleTemplate();
      template.metadata!.parent = 'non-existent-template';

      assert.throws(() => manager.addTemplate(template),
        /Parent template non-existent-template does not exist/);
    });
  });

  suite('Template Categories', () => {
    test('should add a new category', () => {
      manager.addCategory('Development', 'Templates for development');
      const config = manager.getConfig();
      assert.ok(config.categories?.Development);
      assert.strictEqual(config.categories?.Development.description,
        'Templates for development');
    });

    test('should not add duplicate categories', () => {
      // First addition should succeed
      manager.addCategory('NewCategory', 'New description');
      
      // Second addition should throw
      assert.throws(
        () => manager.addCategory('NewCategory', 'Another description'),
        /Category NewCategory already exists/
      );
    });

    test('should get templates by category', () => {
      const id = manager.addTemplate(createSampleTemplate());
      const templates = manager.getTemplatesByCategory('Testing');
      assert.ok(templates.length > 0);
      assert.ok(templates.some(t => t.id === id));
    });
  });

  suite('Template Export/Import', () => {
    test('should export a template', () => {
      const id = manager.addTemplate(createSampleTemplate());
      const exported = manager.exportTemplate(id);
      const parsed = JSON.parse(exported);
      assert.strictEqual(parsed.name, 'Sample Template');
      assert.strictEqual(parsed.metadata.variables.variable.type, 'string');
    });

    test('should import a valid template', () => {
      const id = manager.addTemplate(createSampleTemplate());
      const exported = manager.exportTemplate(id);
      const importedId = manager.importTemplate(exported);
      const template = manager.getTemplate(importedId);
      assert.strictEqual(template?.name, 'Sample Template');
    });

    test('should reject invalid template import', () => {
      const invalidTemplate = JSON.stringify({
        description: 'Missing required name field',
        content: 'Some content'
      });

      assert.throws(() => manager.importTemplate(invalidTemplate),
        /Invalid template: Template name is required/);
    });
  });

  suite('Active Template Management', () => {
    test('should set and get active template', () => {
      const id = manager.addTemplate(createSampleTemplate());
      assert.strictEqual(manager.setActiveTemplate(id), true);
      assert.strictEqual(manager.getActiveTemplate()?.id, id);
    });

    test('should clear active template', () => {
      const id = manager.addTemplate(createSampleTemplate());
      manager.setActiveTemplate(id);
      assert.strictEqual(manager.setActiveTemplate(undefined), true);
      assert.strictEqual(manager.getActiveTemplate(), undefined);
    });

    test('should not set non-existent template as active', () => {
      assert.strictEqual(manager.setActiveTemplate('non-existent-id'), false);
    });
  });
});
