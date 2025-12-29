// MCDM (Multi-Criteria Decision Making) Logic
// Implements TOPSIS with Entropy Weights and Fuzzy TOPSIS

export interface InventoryItem {
  id: number;
  Risk: string;
  "Demand fluctuation": string;
  "Average stock": number;
  "Daily usage": number;
  "Unit cost": number;
  "Lead time": number;
  "Consignment stock": string;
  "Unit size": string;
}

export interface ProcessedItem extends InventoryItem {
  Risk_Score: number;
  Fluctuation_Score: number;
  Consignment_Score: number;
  Size_Score: number;
  Norm_Usage: number;
  Norm_Stock: number;
  Norm_LeadTime: number;
  Criticality_Agg: number;
  Demand_Agg: number;
  Supply_Agg: number;
  TOPSIS_Score: number;
  Class: "A" | "B" | "C";
  Fuzzy_TOPSIS_Score?: number;
}

// Step A: Numerical Mapping (Table 1)
export const RISK_MAP: Record<string, number> = {
  High: 0.47,
  Normal: 0.35,
  Low: 0.18,
};

export const DEMAND_FLUCTUATION_MAP: Record<string, number> = {
  Increasing: 0.36,
  Stable: 0.28,
  Unknown: 0.20,
  Decreasing: 0.16,
  Ending: 0.00,
};

export const CONSIGNMENT_MAP: Record<string, number> = {
  No: 0.80,
  Yes: 0.20,
};

export const UNIT_SIZE_MAP: Record<string, number> = {
  Large: 0.53,
  Medium: 0.31,
  Small: 0.13,
};

// Pre-calculated Entropy Weights (from Python results)
export const ENTROPY_WEIGHTS = {
  Criticality_Agg: 0.1855,
  Demand_Agg: 0.1035,
  Supply_Agg: 0.1344,
  Unit_cost: 0.1707,
  Size_Score: 0.4059,
};

// Fuzzy Triangular Numbers for Fuzzy TOPSIS
export const FUZZY_RISK: Record<string, [number, number, number]> = {
  High: [0.7, 0.9, 1.0],
  Normal: [0.3, 0.5, 0.7],
  Low: [0.0, 0.1, 0.3],
};

export const FUZZY_SIZE: Record<string, [number, number, number]> = {
  Large: [0.6, 0.8, 1.0],
  Medium: [0.3, 0.5, 0.7],
  Small: [0.0, 0.2, 0.4],
};

export const FUZZY_DEMAND: Record<string, [number, number, number]> = {
  Increasing: [0.7, 0.85, 1.0],
  Stable: [0.4, 0.55, 0.7],
  Unknown: [0.3, 0.45, 0.6],
  Decreasing: [0.1, 0.25, 0.4],
  Ending: [0.0, 0.0, 0.1],
};

// MinMax Normalization
function minMaxNormalize(values: number[]): number[] {
  const min = Math.min(...values);
  const max = Math.max(...values);
  if (max === min) return values.map(() => 0.5);
  return values.map((v) => (v - min) / (max - min));
}

// Vector Normalization for TOPSIS
function vectorNormalize(matrix: number[][]): number[][] {
  const numCols = matrix[0].length;
  const result: number[][] = matrix.map((row) => [...row]);

  for (let j = 0; j < numCols; j++) {
    const colValues = matrix.map((row) => row[j]);
    const sumOfSquares = colValues.reduce((sum, v) => sum + v * v, 0);
    const norm = Math.sqrt(sumOfSquares);
    if (norm > 0) {
      for (let i = 0; i < matrix.length; i++) {
        result[i][j] = matrix[i][j] / norm;
      }
    }
  }
  return result;
}

// TOPSIS Algorithm
function calculateTOPSIS(
  matrix: number[][],
  weights: number[],
  benefitCriteria: boolean[]
): number[] {
  // Step 1: Vector normalization
  const normalizedMatrix = vectorNormalize(matrix);

  // Step 2: Apply weights
  const weightedMatrix = normalizedMatrix.map((row) =>
    row.map((val, j) => val * weights[j])
  );

  // Step 3: Determine ideal and anti-ideal solutions
  const numCols = matrix[0].length;
  const idealSolution: number[] = [];
  const antiIdealSolution: number[] = [];

  for (let j = 0; j < numCols; j++) {
    const colValues = weightedMatrix.map((row) => row[j]);
    if (benefitCriteria[j]) {
      idealSolution.push(Math.max(...colValues));
      antiIdealSolution.push(Math.min(...colValues));
    } else {
      idealSolution.push(Math.min(...colValues));
      antiIdealSolution.push(Math.max(...colValues));
    }
  }

  // Step 4: Calculate distances
  const scores: number[] = [];
  for (let i = 0; i < weightedMatrix.length; i++) {
    let dPlus = 0;
    let dMinus = 0;
    for (let j = 0; j < numCols; j++) {
      dPlus += Math.pow(weightedMatrix[i][j] - idealSolution[j], 2);
      dMinus += Math.pow(weightedMatrix[i][j] - antiIdealSolution[j], 2);
    }
    dPlus = Math.sqrt(dPlus);
    dMinus = Math.sqrt(dMinus);

    // Relative closeness to ideal solution
    const score = dMinus / (dPlus + dMinus);
    scores.push(isNaN(score) ? 0 : score);
  }

  return scores;
}

// Vertex Method Distance for Fuzzy Numbers
function fuzzyDistance(
  a: [number, number, number],
  b: [number, number, number]
): number {
  return Math.sqrt(
    (1 / 3) *
      (Math.pow(a[0] - b[0], 2) +
        Math.pow(a[1] - b[1], 2) +
        Math.pow(a[2] - b[2], 2))
  );
}

// Fuzzy TOPSIS
function calculateFuzzyTOPSIS(items: InventoryItem[]): number[] {
  // Convert to fuzzy decision matrix
  const fuzzyMatrix: [number, number, number][][] = items.map((item) => [
    FUZZY_RISK[item.Risk] || [0.3, 0.5, 0.7],
    FUZZY_DEMAND[item["Demand fluctuation"]] || [0.3, 0.45, 0.6],
    FUZZY_SIZE[item["Unit size"]] || [0.3, 0.5, 0.7],
  ]);

  // Fuzzy weights (equal for simplicity)
  const weights: [number, number, number][] = [
    [0.3, 0.4, 0.5], // Risk weight
    [0.2, 0.3, 0.4], // Demand weight
    [0.3, 0.4, 0.5], // Size weight
  ];

  // Apply weights to fuzzy matrix
  const weightedFuzzyMatrix = fuzzyMatrix.map((row) =>
    row.map((tfn, j) => [
      tfn[0] * weights[j][0],
      tfn[1] * weights[j][1],
      tfn[2] * weights[j][2],
    ] as [number, number, number])
  );

  // Ideal and anti-ideal fuzzy solutions (for benefit criteria)
  const idealSolution: [number, number, number][] = [
    [1.0, 1.0, 1.0],
    [1.0, 1.0, 1.0],
    [1.0, 1.0, 1.0],
  ];
  const antiIdealSolution: [number, number, number][] = [
    [0.0, 0.0, 0.0],
    [0.0, 0.0, 0.0],
    [0.0, 0.0, 0.0],
  ];

  // Calculate fuzzy TOPSIS scores
  const scores: number[] = [];
  for (let i = 0; i < weightedFuzzyMatrix.length; i++) {
    let dPlus = 0;
    let dMinus = 0;
    for (let j = 0; j < 3; j++) {
      dPlus += fuzzyDistance(weightedFuzzyMatrix[i][j], idealSolution[j]);
      dMinus += fuzzyDistance(weightedFuzzyMatrix[i][j], antiIdealSolution[j]);
    }

    const score = dMinus / (dPlus + dMinus);
    scores.push(isNaN(score) ? 0 : score);
  }

  return scores;
}

// Main processing function
export function processInventoryData(
  items: InventoryItem[],
  thresholds: { A: number; B: number } = { A: 20, B: 50 }
): ProcessedItem[] {
  if (items.length === 0) return [];

  // Step A: Apply numerical mapping
  const mapped = items.map((item, idx) => ({
    ...item,
    id: idx + 1,
    Risk_Score: RISK_MAP[item.Risk] || 0.35,
    Fluctuation_Score: DEMAND_FLUCTUATION_MAP[item["Demand fluctuation"]] || 0.20,
    Consignment_Score: CONSIGNMENT_MAP[item["Consignment stock"]] || 0.80,
    Size_Score: UNIT_SIZE_MAP[item["Unit size"]] || 0.31,
  }));

  // Extract quantitative values for normalization
  const usageValues = mapped.map((m) => m["Daily usage"]);
  const stockValues = mapped.map((m) => m["Average stock"]);
  const leadTimeValues = mapped.map((m) => m["Lead time"]);

  // MinMax normalize quantitative columns
  const normUsage = minMaxNormalize(usageValues);
  const normStock = minMaxNormalize(stockValues);
  const normLeadTime = minMaxNormalize(leadTimeValues);

  // Step B: Calculate aggregated criteria
  const withAggregates = mapped.map((item, i) => {
    const Norm_Usage = normUsage[i];
    const Norm_Stock = normStock[i];
    const Norm_LeadTime = normLeadTime[i];

    return {
      ...item,
      Norm_Usage,
      Norm_Stock,
      Norm_LeadTime,
      Criticality_Agg: 0.78 * item.Risk_Score + 0.22 * item.Fluctuation_Score,
      Demand_Agg: 0.71 * Norm_Usage + 0.29 * Norm_Stock,
      Supply_Agg: 0.75 * Norm_LeadTime + 0.25 * item.Consignment_Score,
    };
  });

  // Step C: Prepare TOPSIS matrix
  // Criteria: Criticality_Agg, Demand_Agg, Supply_Agg, Unit_cost, Size_Score
  const topsisMatrix = withAggregates.map((item) => [
    item.Criticality_Agg,
    item.Demand_Agg,
    item.Supply_Agg,
    item["Unit cost"],
    item.Size_Score,
  ]);

  const weights = [
    ENTROPY_WEIGHTS.Criticality_Agg,
    ENTROPY_WEIGHTS.Demand_Agg,
    ENTROPY_WEIGHTS.Supply_Agg,
    ENTROPY_WEIGHTS.Unit_cost,
    ENTROPY_WEIGHTS.Size_Score,
  ];

  // All are benefit criteria (higher is better for classification)
  const benefitCriteria = [true, true, true, true, true];

  const topsisScores = calculateTOPSIS(topsisMatrix, weights, benefitCriteria);

  // Step D: Calculate Fuzzy TOPSIS scores
  const fuzzyScores = calculateFuzzyTOPSIS(items);

  // Add scores to items
  const withScores = withAggregates.map((item, i) => ({
    ...item,
    TOPSIS_Score: topsisScores[i],
    Fuzzy_TOPSIS_Score: fuzzyScores[i],
  }));

  // Sort by TOPSIS score descending
  const sorted = [...withScores].sort((a, b) => b.TOPSIS_Score - a.TOPSIS_Score);

  // Step E: ABC Classification based on thresholds
  const totalItems = sorted.length;
  const classAThreshold = Math.floor((thresholds.A / 100) * totalItems);
  const classBThreshold = Math.floor(((thresholds.A + thresholds.B - thresholds.A) / 100) * totalItems) + classAThreshold;

  const withClasses: ProcessedItem[] = sorted.map((item, index) => {
    let classLabel: "A" | "B" | "C";
    if (index < classAThreshold) {
      classLabel = "A";
    } else if (index < classBThreshold) {
      classLabel = "B";
    } else {
      classLabel = "C";
    }
    return {
      ...item,
      Class: classLabel,
    };
  });

  return withClasses;
}

// Get ABC distribution
export function getABCDistribution(items: ProcessedItem[]): {
  A: number;
  B: number;
  C: number;
} {
  return {
    A: items.filter((i) => i.Class === "A").length,
    B: items.filter((i) => i.Class === "B").length,
    C: items.filter((i) => i.Class === "C").length,
  };
}

// Get scatter plot data
export function getScatterData(items: ProcessedItem[]) {
  return items.map((item) => ({
    id: item.id,
    TOPSIS_Score: item.TOPSIS_Score,
    "Unit cost": item["Unit cost"],
    Class: item.Class,
  }));
}

// Get top Fuzzy results
export function getTopFuzzyResults(items: ProcessedItem[], count: number = 5) {
  return [...items]
    .sort((a, b) => (b.Fuzzy_TOPSIS_Score || 0) - (a.Fuzzy_TOPSIS_Score || 0))
    .slice(0, count);
}
