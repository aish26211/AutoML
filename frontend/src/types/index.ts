export interface DatasetInfo {
  structure: Record<string, string>;
  missing: Record<string, number>;
  shape: [number, number];
}

export interface ModelResult {
  model: string;
  accuracy?: number;
  mse?: number;
  r2_score?: number;
  classification_report?: any;
  meta: {
    task: 'classification' | 'regression';
    model: string;
    train_size: number;
    test_size: number;
    classes?: string[];
    target_range?: [number, number];
  };
}

export interface FeatureImportance {
  feature: string;
  importance: number;
}

export interface CleaningOptions {
  handleMissing: 'drop' | 'fill';
  fillStrategy?: 'mean' | 'median' | 'mode';
  removeDuplicates: boolean;
  scaler?: 'standard' | 'minmax' | 'robust';
  encoder?: 'onehot' | 'label';
}