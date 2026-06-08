import { ref, computed, type Ref } from 'vue';
import type { Entry } from '../types/benchmark';

/**
 * Label edit shape: per-model edits that can be made to entries
 */
export interface LabelEdit {
  parameters_b?: string; // string for input binding
  quantization?: string;
  size_gb?: string; // string for input binding
  deprecated?: boolean;
  tier_opus?: boolean;
  tier_sonnet?: boolean;
  tier_haiku?: boolean;
}

/**
 * Validation error shape: per-model, per-field error messages
 */
export type ValidationErrors = Record<string, Record<string, string[]>>;

/**
 * Validate a single field value
 * Returns array of error messages (empty if valid)
 */
export function validateEditField(field: string, value: any): string[] {
  const errors: string[] = [];

  if (field === 'parameters_b') {
    if (value !== '' && value !== null && value !== undefined) {
      const num = parseFloat(value);
      if (isNaN(num)) {
        errors.push('Parameters must be a number');
      } else if (num < 0) {
        errors.push('Parameters must be >= 0');
      }
    }
  }

  if (field === 'size_gb') {
    if (value !== '' && value !== null && value !== undefined) {
      const num = parseFloat(value);
      if (isNaN(num)) {
        errors.push('Size must be a number');
      } else if (num < 0) {
        errors.push('Size must be >= 0');
      }
    }
  }

  // quantization: any non-empty string is valid, or null
  if (field === 'quantization') {
    // all values are valid
  }

  // tiers, deprecated: all booleans are valid
  if (['deprecated', 'tier_opus', 'tier_sonnet', 'tier_haiku'].includes(field)) {
    // all values are valid
  }

  return errors;
}

/**
 * useLabeling composable - Manage entry labeling (inline editing) state
 *
 * Provides:
 * - Labeling mode toggle
 * - Dirty flag tracking
 * - Per-model label edits with validation
 * - Functions to update, commit, and cancel edits
 */
export function useLabeling(mutableEntries?: Ref<Entry[]>) {
  // State refs
  const isLabelingMode = ref<boolean>(false);
  const isDirty = ref<boolean>(false);
  const labelEdits = ref<Record<string, LabelEdit>>({});

  /**
   * Validation errors computed: per-model, per-field error messages
   */
  const validationErrors = computed<ValidationErrors>(() => {
    const errors: ValidationErrors = {};

    for (const [model, edit] of Object.entries(labelEdits.value)) {
      const modelErrors: Record<string, string[]> = {};

      // Validate each field in the edit
      for (const [field, value] of Object.entries(edit)) {
        const fieldErrors = validateEditField(field, value);
        if (fieldErrors.length > 0) {
          modelErrors[field] = fieldErrors;
        }
      }

      if (Object.keys(modelErrors).length > 0) {
        errors[model] = modelErrors;
      }
    }

    return errors;
  });

  /**
   * Has validation errors computed
   */
  const hasValidationErrors = computed<boolean>(() => {
    return Object.keys(validationErrors.value).length > 0;
  });

  /**
   * Set isDirty flag explicitly (called when Import Apply merges entries)
   */
  function setDirty(): void {
    isDirty.value = true;
  }

  /**
   * Update a label edit field and trigger validation
   */
  function updateLabelEdit(modelName: string, field: string, value: any): void {
    if (!labelEdits.value[modelName]) {
      labelEdits.value[modelName] = {};
    }
    labelEdits.value[modelName][field as keyof LabelEdit] = value;
  }

  /**
   * Commit label edits to mutable entries
   * Converts string fields to numbers, applies all edits to entries, clears labelEdits
   */
  function commitLabelEdits(entries: Ref<Entry[]>): void {
    if (hasValidationErrors.value) return;

    // Apply edits to mutableEntries
    entries.value = entries.value.map(entry => {
      const edit = labelEdits.value[entry.model];
      if (!edit || Object.keys(edit).length === 0) return entry;

      // Build updated entry with edits applied
      const updated: Entry = {
        ...entry,
        spec: { ...entry.spec },
        tiers: { ...(entry.tiers ?? { opus: false, sonnet: false, haiku: false }) },
      };

      // Apply spec edits
      if (edit.parameters_b !== undefined) {
        updated.spec.parameters_b = edit.parameters_b !== '' ? parseFloat(edit.parameters_b!) : null;
      }
      if (edit.quantization !== undefined) {
        updated.spec.quantization = edit.quantization ?? entry.spec.quantization;
      }
      if (edit.size_gb !== undefined) {
        updated.spec.size_gb = edit.size_gb !== '' ? parseFloat(edit.size_gb!) : null;
      }

      // Apply deprecated edit
      if (edit.deprecated !== undefined) {
        updated.deprecated = edit.deprecated ?? entry.deprecated ?? false;
      }

      // Apply tiers edits
      if (edit.tier_opus !== undefined || edit.tier_sonnet !== undefined || edit.tier_haiku !== undefined) {
        updated.tiers = {
          opus: edit.tier_opus !== undefined ? edit.tier_opus : (entry.tiers?.opus ?? false),
          sonnet: edit.tier_sonnet !== undefined ? edit.tier_sonnet : (entry.tiers?.sonnet ?? false),
          haiku: edit.tier_haiku !== undefined ? edit.tier_haiku : (entry.tiers?.haiku ?? false),
        };
      }

      return updated;
    });

    // Clear edits and exit mode, keep isDirty true
    labelEdits.value = {};
    isLabelingMode.value = false;
  }

  /**
   * Cancel label edits: discard labelEdits and exit mode, keep isDirty unchanged
   */
  function cancelLabelEdits(): void {
    labelEdits.value = {};
    isLabelingMode.value = false;
  }

  /**
   * Toggle labeling mode on/off
   * When entering: initialize labelEdits from current entries
   * When exiting: discard labelEdits and reset
   */
  function toggleLabelingMode(entries?: Ref<Entry[]> | Entry[]): void {
    if (isLabelingMode.value) {
      // Exiting: discard edits
      labelEdits.value = {};
      isLabelingMode.value = false;
    } else {
      // Entering: initialize labelEdits from current entries.
      // Resolve to a plain array, tolerating: a Ref (tests), an already-unwrapped
      // array (Vue templates auto-unwrap refs, so `toggleLabelingMode(mutableEntries)`
      // in a template passes the array), or fall back to the closure's mutableEntries.
      const resolved: Entry[] =
        (Array.isArray(entries) ? entries : entries?.value) ??
        mutableEntries?.value ??
        [];
      const edits: Record<string, LabelEdit> = {};

      for (const entry of resolved) {
        edits[entry.model] = {
          parameters_b: entry.spec.parameters_b?.toString() ?? '',
          quantization: entry.spec.quantization ?? '',
          size_gb: entry.spec.size_gb?.toString() ?? '',
          deprecated: entry.deprecated ?? false,
          tier_opus: entry.tiers?.opus ?? false,
          tier_sonnet: entry.tiers?.sonnet ?? false,
          tier_haiku: entry.tiers?.haiku ?? false,
        };
      }

      labelEdits.value = edits;
      isLabelingMode.value = true;
    }
  }

  return {
    // State refs
    isLabelingMode,
    isDirty,
    labelEdits,

    // Computed
    validationErrors,
    hasValidationErrors,

    // Methods
    setDirty,
    updateLabelEdit,
    commitLabelEdits,
    cancelLabelEdits,
    toggleLabelingMode,

    // Exported for testing
    validateEditField,
  };
}
