import { describe, it, expect, beforeEach } from 'vitest';
import { useLabeling, validateEditField, type ValidationErrors } from './useLabeling';
import { ref, type Ref } from 'vue';
import type { Entry } from '../types/benchmark';

describe('useLabeling', () => {
  describe('validateEditField', () => {
    it('should validate valid parameters_b values', () => {
      expect(validateEditField('parameters_b', '0')).toEqual([]);
      expect(validateEditField('parameters_b', '7')).toEqual([]);
      expect(validateEditField('parameters_b', '35')).toEqual([]);
      expect(validateEditField('parameters_b', null)).toEqual([]);
      expect(validateEditField('parameters_b', '')).toEqual([]);
    });

    it('should reject invalid parameters_b values', () => {
      expect(validateEditField('parameters_b', '-5')).toContain('Parameters must be >= 0');
      expect(validateEditField('parameters_b', 'abc')).toContain('Parameters must be a number');
    });

    it('should validate valid size_gb values', () => {
      expect(validateEditField('size_gb', '0')).toEqual([]);
      expect(validateEditField('size_gb', '19.5')).toEqual([]);
      expect(validateEditField('size_gb', null)).toEqual([]);
      expect(validateEditField('size_gb', '')).toEqual([]);
    });

    it('should reject invalid size_gb values', () => {
      expect(validateEditField('size_gb', '-10')).toContain('Size must be >= 0');
      expect(validateEditField('size_gb', 'xyz')).toContain('Size must be a number');
    });

    it('should accept all values for quantization', () => {
      expect(validateEditField('quantization', '4bit')).toEqual([]);
      expect(validateEditField('quantization', 'fp16')).toEqual([]);
      expect(validateEditField('quantization', null)).toEqual([]);
      expect(validateEditField('quantization', '')).toEqual([]);
    });

    it('should accept all boolean values for abilities and tiers', () => {
      expect(validateEditField('thinking', true)).toEqual([]);
      expect(validateEditField('thinking', false)).toEqual([]);
      expect(validateEditField('mtp', true)).toEqual([]);
      expect(validateEditField('mtp', false)).toEqual([]);
      expect(validateEditField('deprecated', true)).toEqual([]);
      expect(validateEditField('deprecated', false)).toEqual([]);
      expect(validateEditField('tier_opus', true)).toEqual([]);
      expect(validateEditField('tier_sonnet', false)).toEqual([]);
      expect(validateEditField('tier_haiku', true)).toEqual([]);
    });
  });

  describe('useLabeling state management', () => {
    let labeling: ReturnType<typeof useLabeling>;

    beforeEach(() => {
      labeling = useLabeling();
    });

    it('should initialize with correct default state', () => {
      expect(labeling.isLabelingMode.value).toBe(false);
      expect(labeling.isDirty.value).toBe(false);
      expect(labeling.labelEdits.value).toEqual({});
      expect(labeling.validationErrors.value).toEqual({});
      expect(labeling.hasValidationErrors.value).toBe(false);
    });

    it('should toggle labeling mode', () => {
      const mockEntries = ref<Entry[]>([]);

      labeling.toggleLabelingMode(mockEntries);
      expect(labeling.isLabelingMode.value).toBe(true);

      labeling.toggleLabelingMode();
      expect(labeling.isLabelingMode.value).toBe(false);
    });

    it('should update label edits and trigger validation', () => {
      labeling.updateLabelEdit('model-1', 'parameters_b', '-5');

      expect(labeling.labelEdits.value['model-1'].parameters_b).toBe('-5');
      expect(labeling.validationErrors.value['model-1']).toBeDefined();
      expect(labeling.validationErrors.value['model-1'].parameters_b).toContain('Parameters must be >= 0');
      expect(labeling.hasValidationErrors.value).toBe(true);
    });

    it('should accept valid label edit values', () => {
      labeling.updateLabelEdit('model-1', 'parameters_b', '35');
      labeling.updateLabelEdit('model-1', 'quantization', '4bit');
      labeling.updateLabelEdit('model-1', 'size_gb', '19.5');

      expect(labeling.validationErrors.value['model-1']).toBeUndefined();
      expect(labeling.hasValidationErrors.value).toBe(false);
    });

    it('should set dirty flag explicitly', () => {
      expect(labeling.isDirty.value).toBe(false);

      labeling.setDirty();

      expect(labeling.isDirty.value).toBe(true);
    });

    it('should initialize labelEdits from entries when entering labeling mode', () => {
      const entries: Entry[] = [
        {
          model: 'test-model-1',
          date: '2026-05-25',
          spec: { parameters_b: 35, quantization: '4bit', size_gb: 19.5 },
          deprecated: false,
          tiers: { opus: true, sonnet: false, haiku: false },
          scores: {},
          abilities: { thinking: true, mtp: false },
        },
        {
          model: 'test-model-2',
          date: '2026-05-25',
          spec: { parameters_b: 7, quantization: 'fp16', size_gb: 3.5 },
          deprecated: false,
          tiers: { opus: false, sonnet: true, haiku: false },
          scores: {},
          abilities: { thinking: false, mtp: true },
        },
      ];

      const mutableEntries = ref<Entry[]>(entries);
      labeling.toggleLabelingMode(mutableEntries);

      expect(labeling.isLabelingMode.value).toBe(true);
      expect(Object.keys(labeling.labelEdits.value)).toHaveLength(2);
      expect(labeling.labelEdits.value['test-model-1'].parameters_b).toBe('35');
      expect(labeling.labelEdits.value['test-model-1'].quantization).toBe('4bit');
      expect(labeling.labelEdits.value['test-model-1'].size_gb).toBe('19.5');
      expect(labeling.labelEdits.value['test-model-1'].thinking).toBe(true);
      expect(labeling.labelEdits.value['test-model-1'].tier_opus).toBe(true);
      expect(labeling.labelEdits.value['test-model-2'].thinking).toBe(false);
    });

    it('should discard labelEdits when canceling labeling mode', () => {
      labeling.updateLabelEdit('model-1', 'parameters_b', '50');
      labeling.updateLabelEdit('model-1', 'thinking', true);

      labeling.cancelLabelEdits();

      expect(labeling.isLabelingMode.value).toBe(false);
      expect(labeling.labelEdits.value).toEqual({});
    });

    it('should apply valid label edits to entries', () => {
      const entries: Entry[] = [
        {
          model: 'test-model',
          date: '2026-05-25',
          spec: { parameters_b: 7, quantization: 'fp16', size_gb: 3.5 },
          deprecated: false,
          tiers: { opus: false, sonnet: true, haiku: false },
          scores: {},
          abilities: { thinking: false, mtp: false },
        },
      ];

      const mutableEntries = ref<Entry[]>(entries);

      labeling.isLabelingMode.value = true;
      labeling.updateLabelEdit('test-model', 'parameters_b', '35');
      labeling.updateLabelEdit('test-model', 'quantization', '4bit');
      labeling.updateLabelEdit('test-model', 'thinking', true);
      labeling.updateLabelEdit('test-model', 'tier_opus', true);

      labeling.commitLabelEdits(mutableEntries);

      expect(mutableEntries.value[0].spec.parameters_b).toBe(35);
      expect(mutableEntries.value[0].spec.quantization).toBe('4bit');
      expect(mutableEntries.value[0].abilities!.thinking).toBe(true);
      expect(mutableEntries.value[0].tiers!.opus).toBe(true);
      expect(labeling.isLabelingMode.value).toBe(false);
      expect(labeling.labelEdits.value).toEqual({});
    });

    it('should prevent commit if validation errors exist', () => {
      const entries: Entry[] = [
        {
          model: 'test-model',
          date: '2026-05-25',
          spec: { parameters_b: 7, quantization: 'fp16', size_gb: 3.5 },
          deprecated: false,
          tiers: { opus: false, sonnet: false, haiku: false },
          scores: {},
          abilities: { thinking: false, mtp: false },
        },
      ];

      const mutableEntries = ref<Entry[]>(entries);

      labeling.updateLabelEdit('test-model', 'parameters_b', '-5'); // Invalid

      labeling.commitLabelEdits(mutableEntries);

      // Entry should NOT be modified
      expect(mutableEntries.value[0].spec.parameters_b).toBe(7);
    });

    it('should handle multiple entries with mixed valid and invalid edits', () => {
      labeling.updateLabelEdit('model-1', 'parameters_b', '35'); // Valid
      labeling.updateLabelEdit('model-2', 'parameters_b', '-5'); // Invalid
      labeling.updateLabelEdit('model-2', 'size_gb', '19.5'); // Valid for model-2

      expect(labeling.hasValidationErrors.value).toBe(true);
      expect(Object.keys(labeling.validationErrors.value)).toContain('model-2');
      expect(Object.keys(labeling.validationErrors.value)).not.toContain('model-1');
    });

    it('should convert string inputs to numbers on commit', () => {
      const entries: Entry[] = [
        {
          model: 'test-model',
          date: '2026-05-25',
          spec: { parameters_b: null, quantization: '', size_gb: null },
          deprecated: false,
          tiers: { opus: false, sonnet: false, haiku: false },
          scores: {},
          abilities: { thinking: false, mtp: false },
        },
      ];

      const mutableEntries = ref<Entry[]>(entries);

      labeling.updateLabelEdit('test-model', 'parameters_b', '7.5');
      labeling.updateLabelEdit('test-model', 'size_gb', '3.2');

      labeling.commitLabelEdits(mutableEntries);

      expect(typeof mutableEntries.value[0].spec.parameters_b).toBe('number');
      expect(mutableEntries.value[0].spec.parameters_b).toBe(7.5);
      expect(typeof mutableEntries.value[0].spec.size_gb).toBe('number');
      expect(mutableEntries.value[0].spec.size_gb).toBe(3.2);
    });

    it('should handle empty string inputs as null for numeric fields', () => {
      const entries: Entry[] = [
        {
          model: 'test-model',
          date: '2026-05-25',
          spec: { parameters_b: 35, quantization: '4bit', size_gb: 19.5 },
          deprecated: false,
          tiers: { opus: false, sonnet: false, haiku: false },
          scores: {},
          abilities: { thinking: false, mtp: false },
        },
      ];

      const mutableEntries = ref<Entry[]>(entries);

      labeling.updateLabelEdit('test-model', 'parameters_b', '');
      labeling.updateLabelEdit('test-model', 'size_gb', '');

      labeling.commitLabelEdits(mutableEntries);

      expect(mutableEntries.value[0].spec.parameters_b).toBeNull();
      expect(mutableEntries.value[0].spec.size_gb).toBeNull();
    });

    it('should preserve unedited fields when committing edits', () => {
      const entries: Entry[] = [
        {
          model: 'test-model',
          date: '2026-05-25',
          spec: { parameters_b: 7, quantization: 'fp16', size_gb: 3.5 },
          deprecated: false,
          tiers: { opus: false, sonnet: true, haiku: false },
          scores: { MMLU: { accuracy: 95, samples: 100, time_s: 10 } },
          abilities: { thinking: false, mtp: true },
        },
      ];

      const mutableEntries = ref<Entry[]>(entries);

      // Only edit parameters_b
      labeling.updateLabelEdit('test-model', 'parameters_b', '35');

      labeling.commitLabelEdits(mutableEntries);

      // Check that unedited fields are preserved
      expect(mutableEntries.value[0].spec.quantization).toBe('fp16');
      expect(mutableEntries.value[0].spec.size_gb).toBe(3.5);
      expect(mutableEntries.value[0].deprecated).toBe(false);
      expect(mutableEntries.value[0].tiers!.sonnet).toBe(true);
      expect(mutableEntries.value[0].abilities!.mtp).toBe(true);
      expect(mutableEntries.value[0].scores).toEqual({ MMLU: { accuracy: 95, samples: 100, time_s: 10 } });
    });
  });

  describe('integration tests', () => {
    it('should handle full edit workflow: enter mode -> edit -> validate -> commit', () => {
      const entries: Entry[] = [
        {
          model: 'llama-70b',
          date: '2026-05-25',
          spec: { parameters_b: 70, quantization: 'fp16', size_gb: 140 },
          deprecated: false,
          tiers: { opus: true, sonnet: false, haiku: false },
          scores: {},
          abilities: { thinking: true, mtp: false },
        },
        {
          model: 'gpt-4-turbo',
          date: '2026-05-25',
          spec: { parameters_b: null, quantization: 'unknown', size_gb: null },
          deprecated: false,
          tiers: { opus: true, sonnet: true, haiku: false },
          scores: {},
          abilities: { thinking: true, mtp: true },
        },
      ];

      const mutableEntries = ref<Entry[]>(entries);
      const labeling = useLabeling(mutableEntries);

      // Enter labeling mode
      labeling.toggleLabelingMode(mutableEntries);
      expect(labeling.isLabelingMode.value).toBe(true);
      expect(Object.keys(labeling.labelEdits.value)).toHaveLength(2);

      // Edit first entry
      labeling.updateLabelEdit('llama-70b', 'thinking', false);
      labeling.updateLabelEdit('llama-70b', 'tier_sonnet', true);

      // Edit second entry with one invalid value
      labeling.updateLabelEdit('gpt-4-turbo', 'parameters_b', '100');
      labeling.updateLabelEdit('gpt-4-turbo', 'deprecated', true);

      // Should have no validation errors (100 is valid)
      expect(labeling.hasValidationErrors.value).toBe(false);

      // Commit
      labeling.commitLabelEdits(mutableEntries);

      // Verify changes
      expect(mutableEntries.value[0].abilities!.thinking).toBe(false);
      expect(mutableEntries.value[0].tiers!.sonnet).toBe(true);
      expect(mutableEntries.value[1].spec.parameters_b).toBe(100);
      expect(mutableEntries.value[1].deprecated).toBe(true);
      expect(labeling.isLabelingMode.value).toBe(false);
    });
  });
});
