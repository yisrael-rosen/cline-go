import * as assert from 'assert';
import { TemplateManager, builtInTemplates, PromptTemplate } from '../../../core/prompts/templates';

const TEST_TAGS = process.env.TEST_TAGS?.split(',') || [];

// Only run these tests when templates tag is present
if (!TEST_TAGS.length || TEST_TAGS.includes('templates')) {
  suite('TemplateManager', () => {
    let manager: TemplateManager;

    setup(() => {
      manager = new TemplateManager();
    });

    test('should initialize with built-in templates when no config provided', () => {
      assert.deepStrictEqual(manager.getAllTemplates(), builtInTemplates);
    });

    test('should initialize with provided config', () => {
      const customTemplate: PromptTemplate = {
        id: 'custom',
        name: 'Custom Template',
        description: 'Test template',
        content: 'Test content'
      };
      
      const config = {
        activeTemplateId: 'custom',
        templates: [customTemplate]
      };
      
      manager = new TemplateManager(config);
      assert.deepStrictEqual(manager.getAllTemplates(), [customTemplate]);
      assert.deepStrictEqual(manager.getActiveTemplate(), customTemplate);
    });

    suite('template operations', () => {
      test('should add new template', () => {
        const template = {
          name: 'New Template',
          description: 'Test description',
          content: 'Test content'
        };

        const id = manager.addTemplate(template);
        const added = manager.getTemplate(id);
        
        assert.ok(added);
        assert.deepStrictEqual(added, {
          id,
          ...template
        });
      });

      test('should update existing template', () => {
        const template = {
          name: 'Template',
          description: 'Original description',
          content: 'Original content'
        };

        const id = manager.addTemplate(template);
        const update = {
          description: 'Updated description',
          content: 'Updated content'
        };

        const success = manager.updateTemplate(id, update);
        const updated = manager.getTemplate(id);

        assert.strictEqual(success, true);
        assert.deepStrictEqual(updated, {
          id,
          ...template,
          ...update
        });
      });

      test('should not delete built-in templates', () => {
        const builtInId = builtInTemplates[0].id;
        const success = manager.deleteTemplate(builtInId);
        
        assert.strictEqual(success, false);
        assert.ok(manager.getTemplate(builtInId));
      });

      test('should delete custom template', () => {
        const id = manager.addTemplate({
          name: 'Custom',
          description: 'To be deleted',
          content: 'Test content'
        });

        const success = manager.deleteTemplate(id);
        assert.strictEqual(success, true);
        assert.strictEqual(manager.getTemplate(id), undefined);
      });

      test('should clear active template when deleted', () => {
        const id = manager.addTemplate({
          name: 'Active Template',
          description: 'Test',
          content: 'Test'
        });

        manager.setActiveTemplate(id);
        assert.strictEqual(manager.getActiveTemplate()?.id, id);

        manager.deleteTemplate(id);
        assert.strictEqual(manager.getActiveTemplate(), undefined);
      });
    });

    suite('active template management', () => {
      test('should set and get active template', () => {
        const id = manager.addTemplate({
          name: 'Test',
          description: 'Test',
          content: 'Test'
        });

        const success = manager.setActiveTemplate(id);
        assert.strictEqual(success, true);
        assert.strictEqual(manager.getActiveTemplate()?.id, id);
      });

      test('should handle setting invalid template id', () => {
        const success = manager.setActiveTemplate('invalid_id');
        assert.strictEqual(success, false);
        assert.strictEqual(manager.getActiveTemplate(), undefined);
      });

      test('should allow clearing active template', () => {
        const id = manager.addTemplate({
          name: 'Test',
          description: 'Test',
          content: 'Test'
        });

        manager.setActiveTemplate(id);
        assert.ok(manager.getActiveTemplate());

        const success = manager.setActiveTemplate(undefined);
        assert.strictEqual(success, true);
        assert.strictEqual(manager.getActiveTemplate(), undefined);
      });
    });
  });
}
