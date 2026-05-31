import type { PostureLabel } from "../types/postureTypes";

type DenseLayer = {
  activation: "relu" | "softmax" | "linear";
  weights: number[][];
  bias: number[];
};

export type BrowserModel = {
  schema_version: string;
  model_name: string;
  labels: PostureLabel[];
  feature_columns: string[];
  scaler: {
    mean: number[];
    scale: number[];
  };
  layers: DenseLayer[];
};

export type ModelPrediction = {
  label: PostureLabel;
  confidence: number;
  probabilities: Record<string, number>;
};

export async function loadBrowserModel(url: string): Promise<BrowserModel> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Unable to load model JSON: ${response.status}`);
  }

  const model = (await response.json()) as BrowserModel;
  if (
    !Array.isArray(model.feature_columns) ||
    !Array.isArray(model.scaler.mean) ||
    !Array.isArray(model.scaler.scale) ||
    !Array.isArray(model.layers)
  ) {
    throw new Error("Browser model JSON is missing required fields.");
  }

  return model;
}

export function predictPosture(
  model: BrowserModel,
  featureValues: Record<string, number>
): ModelPrediction {
  const input = model.feature_columns.map((column, index) => {
    const rawValue = featureValues[column];
    const safeValue = Number.isFinite(rawValue) ? rawValue : 0;
    const scale = model.scaler.scale[index] || 1;
    return (safeValue - model.scaler.mean[index]) / scale;
  });

  const output = model.layers.reduce((values, layer) => runDenseLayer(values, layer), input);
  const probabilities = model.labels.reduce<Record<string, number>>((accumulator, label, index) => {
    accumulator[label] = output[index] ?? 0;
    return accumulator;
  }, {});
  const bestIndex = output.reduce(
    (best, value, index) => (value > output[best] ? index : best),
    0
  );

  return {
    label: model.labels[bestIndex] ?? "uncertain",
    confidence: output[bestIndex] ?? 0,
    probabilities
  };
}

function runDenseLayer(input: number[], layer: DenseLayer): number[] {
  const output = layer.bias.map((biasValue, unitIndex) => {
    let value = biasValue;
    for (let inputIndex = 0; inputIndex < input.length; inputIndex += 1) {
      value += input[inputIndex] * (layer.weights[inputIndex]?.[unitIndex] ?? 0);
    }
    return value;
  });

  if (layer.activation === "relu") {
    return output.map((value) => Math.max(0, value));
  }

  if (layer.activation === "softmax") {
    return softmax(output);
  }

  return output;
}

function softmax(values: number[]) {
  const maxValue = Math.max(...values);
  const exponentials = values.map((value) => Math.exp(value - maxValue));
  const total = exponentials.reduce((sum, value) => sum + value, 0);
  return exponentials.map((value) => value / total);
}
