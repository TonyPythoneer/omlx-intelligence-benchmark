/**
 * Benchmark data schema for oMLX Intelligence Benchmark
 * Defines the TypeScript interfaces for all benchmark-related data structures
 */

export interface ScoreLeaf {
  accuracy: number;
  samples: number;
  time_s: number;
}

export type Scores = Record<string, ScoreLeaf>;

export interface Spec {
  parameters_b: number | null;
  quantization: string;
  size_gb: number | null;
}

export interface Tiers {
  opus: boolean;
  sonnet: boolean;
  haiku: boolean;
}

export interface Abilities {
  thinking: boolean;
  mtp: boolean;
}

export interface Entry {
  model: string;
  date: string;
  spec: Spec;
  deprecated: boolean;
  tiers: Tiers;
  scores: Scores;
  scores_no_thinking?: Scores;
  labelling?: {
    tiers: Tiers;
  };
  abilities?: Abilities;
  starred?: boolean;
}
