// MCDM (Multi-Criteria Decision Making) Logic
// Implements TOPSIS with Dynamic Entropy Weights and Fuzzy TOPSIS

export interface InventoryItem {
  id?: number;
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
  id: number;
  Risk_Score: number;
  Fluctuation_Score: number;
  Consignment_Score: number;
  Size_Score: number;
  Norm_Usage: number;
  Norm_Stock: number;
  Norm_LeadTime: number;
  Norm_Cost: number;
  Criticality_Agg: number;
  Demand_Agg: number;
  Supply_Agg: number;
  TOPSIS_Score: number;
  Fuzzy_TOPSIS_Score: number;
  Class: "A" | "B" | "C";
  Fuzzy_Class: "A" | "B" | "C";
}

export interface EntropyWeights {
  Criticality_Agg: number;
  Demand_Agg: number;
  Supply_Agg: number;
  Unit_cost: number;
  Size_Score: number;
}

export interface FuzzyEntropyWeights {
  Risk: number;
  Fluctuation: number;
  Stock: number;
  Usage: number;
  Cost: number;
  LeadTime: number;
  Consignment: number;
  Size: number;
}

// Phase A: Numerical Mapping (Table 1)
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

// Fuzzy Triangular Numbers (TFN) for Fuzzy TOPSIS
export const FUZZY_RISK: Record<string, [number, number, number]> = {
  High: [0.7, 0.9, 1.0],
  Normal: [0.3, 0.5, 0.7],
  Low: [0.0, 0.1, 0.3],
};

export const FUZZY_DEMAND: Record<string, [number, number, number]> = {
  Increasing: [0.7, 0.85, 1.0],
  Stable: [0.4, 0.55, 0.7],
  Unknown: [0.3, 0.45, 0.6],
  Decreasing: [0.1, 0.25, 0.4],
  Ending: [0.0, 0.0, 0.1],
};

export const FUZZY_SIZE: Record<string, [number, number, number]> = {
  Large: [0.6, 0.8, 1.0],
  Medium: [0.3, 0.5, 0.7],
  Small: [0.0, 0.2, 0.4],
};

export const FUZZY_CONSIGNMENT: Record<string, [number, number, number]> = {
  No: [0.6, 0.8, 1.0],
  Yes: [0.0, 0.2, 0.4],
};

// MinMax Normalization (0 to 1)
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

// Phase C: Dynamic Entropy Weight Calculation
export function calculateEntropyWeights(matrix: number[][]): number[] {
  const n = matrix.length;
  const m = matrix[0].length;
  const epsilon = 0.0001;
  const k = 1 / Math.log(n);

  // Step 1: Normalize each column (add epsilon to avoid log(0))
  const normalizedMatrix: number[][] = [];
  for (let i = 0; i < n; i++) {
    normalizedMatrix.push([]);
  }

  for (let j = 0; j < m; j++) {
    const colSum = matrix.reduce((sum, row) => sum + row[j] + epsilon, 0);
    for (let i = 0; i < n; i++) {
      normalizedMatrix[i][j] = (matrix[i][j] + epsilon) / colSum;
    }
  }

  // Step 2: Calculate Entropy for each criterion
  const entropy: number[] = [];
  for (let j = 0; j < m; j++) {
    let ej = 0;
    for (let i = 0; i < n; i++) {
      const pij = normalizedMatrix[i][j];
      if (pij > 0) {
        ej -= k * pij * Math.log(pij);
      }
    }
    entropy.push(ej);
  }

  // Step 3: Calculate Diversity (1 - Entropy)
  const diversity = entropy.map((e) => 1 - e);

  // Step 4: Calculate Weights
  const diversitySum = diversity.reduce((sum, d) => sum + d, 0);
  const weights = diversity.map((d) => (diversitySum > 0 ? d / diversitySum : 1 / m));

  return weights;
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

  // Step 4: Calculate distances and scores
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

    const score = dMinus / (dPlus + dMinus);
    scores.push(isNaN(score) ? 0 : score);
  }

  return scores;
}

// Vertex Method Distance for Fuzzy Numbers
function fuzzyVertexDistance(
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

// Create crisp TFN from normalized value [x, x, x]
function crispToTFN(value: number): [number, number, number] {
  return [value, value, value];
}

// Multiply TFN by scalar weight
function weightTFN(tfn: [number, number, number], weight: number): [number, number, number] {
  return [tfn[0] * weight, tfn[1] * weight, tfn[2] * weight];
}

// Phase E: Fuzzy TOPSIS with Dynamic Entropy Weights
function calculateFuzzyTOPSIS(
  items: InventoryItem[],
  normStock: number[],
  normUsage: number[],
  normCost: number[],
  normLeadTime: number[]
): { scores: number[]; weights: FuzzyEntropyWeights } {
  // Build crisp matrix for 8 raw columns for entropy weight calculation
  const crispMatrix: number[][] = items.map((item, i) => [
    RISK_MAP[item.Risk] || 0.35,
    DEMAND_FLUCTUATION_MAP[item["Demand fluctuation"]] || 0.20,
    normStock[i],
    normUsage[i],
    normCost[i],
    normLeadTime[i],
    CONSIGNMENT_MAP[item["Consignment stock"]] || 0.80,
    UNIT_SIZE_MAP[item["Unit size"]] || 0.31,
  ]);

  // Calculate entropy weights for 8 criteria
  const fuzzyWeightsArray = calculateEntropyWeights(crispMatrix);
  const fuzzyWeights: FuzzyEntropyWeights = {
    Risk: fuzzyWeightsArray[0],
    Fluctuation: fuzzyWeightsArray[1],
    Stock: fuzzyWeightsArray[2],
    Usage: fuzzyWeightsArray[3],
    Cost: fuzzyWeightsArray[4],
    LeadTime: fuzzyWeightsArray[5],
    Consignment: fuzzyWeightsArray[6],
    Size: fuzzyWeightsArray[7],
  };

  // Build fuzzy decision matrix (8 criteria with TFNs)
  const fuzzyMatrix: [number, number, number][][] = items.map((item, i) => [
    FUZZY_RISK[item.Risk] || [0.3, 0.5, 0.7],
    FUZZY_DEMAND[item["Demand fluctuation"]] || [0.3, 0.45, 0.6],
    crispToTFN(normStock[i]),
    crispToTFN(normUsage[i]),
    crispToTFN(normCost[i]),
    crispToTFN(normLeadTime[i]),
    FUZZY_CONSIGNMENT[item["Consignment stock"]] || [0.6, 0.8, 1.0],
    FUZZY_SIZE[item["Unit size"]] || [0.3, 0.5, 0.7],
  ]);

  // Apply weights to fuzzy matrix
  const weightedFuzzyMatrix = fuzzyMatrix.map((row) =>
    row.map((tfn, j) => weightTFN(tfn, fuzzyWeightsArray[j]))
  );

  // Ideal Fuzzy Solution [1,1,1] and Anti-Ideal [0,0,0] for each criterion
  const idealSolution: [number, number, number] = [1.0, 1.0, 1.0];
  const antiIdealSolution: [number, number, number] = [0.0, 0.0, 0.0];

  // Calculate fuzzy TOPSIS scores using Vertex Method
  const scores: number[] = [];
  for (let i = 0; i < weightedFuzzyMatrix.length; i++) {
    let dPlus = 0;
    let dMinus = 0;
    for (let j = 0; j < 8; j++) {
      dPlus += fuzzyVertexDistance(weightedFuzzyMatrix[i][j], idealSolution);
      dMinus += fuzzyVertexDistance(weightedFuzzyMatrix[i][j], antiIdealSolution);
    }

    const score = dMinus / (dPlus + dMinus);
    scores.push(isNaN(score) ? 0 : score);
  }

  return { scores, weights: fuzzyWeights };
}

// Assign ABC Class based on thresholds
function assignClass(
  sortedIndices: number[],
  totalItems: number,
  thresholds: { A: number; B: number }
): ("A" | "B" | "C")[] {
  const classACount = Math.floor((thresholds.A / 100) * totalItems);
  const classBCount = Math.floor(((thresholds.B - thresholds.A) / 100) * totalItems);

  const classes: ("A" | "B" | "C")[] = new Array(totalItems);
  
  sortedIndices.forEach((originalIndex, rank) => {
    if (rank < classACount) {
      classes[originalIndex] = "A";
    } else if (rank < classACount + classBCount) {
      classes[originalIndex] = "B";
    } else {
      classes[originalIndex] = "C";
    }
  });

  return classes;
}

// Main processing function
export function processInventoryData(
  items: InventoryItem[],
  thresholds: { A: number; B: number } = { A: 20, B: 50 }
): {
  processedItems: ProcessedItem[];
  crispWeights: EntropyWeights;
  fuzzyWeights: FuzzyEntropyWeights;
} {
  if (items.length === 0) {
    return {
      processedItems: [],
      crispWeights: { Criticality_Agg: 0, Demand_Agg: 0, Supply_Agg: 0, Unit_cost: 0, Size_Score: 0 },
      fuzzyWeights: { Risk: 0, Fluctuation: 0, Stock: 0, Usage: 0, Cost: 0, LeadTime: 0, Consignment: 0, Size: 0 },
    };
  }

  // Phase A: Apply numerical mapping
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
  const costValues = mapped.map((m) => m["Unit cost"]);

  // MinMax normalize quantitative columns
  const normUsage = minMaxNormalize(usageValues);
  const normStock = minMaxNormalize(stockValues);
  const normLeadTime = minMaxNormalize(leadTimeValues);
  const normCost = minMaxNormalize(costValues);

  // Phase B: Calculate aggregated criteria
  const withAggregates = mapped.map((item, i) => ({
    ...item,
    Norm_Usage: normUsage[i],
    Norm_Stock: normStock[i],
    Norm_LeadTime: normLeadTime[i],
    Norm_Cost: normCost[i],
    Criticality_Agg: 0.78 * item.Risk_Score + 0.22 * item.Fluctuation_Score,
    Demand_Agg: 0.71 * normUsage[i] + 0.29 * normStock[i],
    Supply_Agg: 0.75 * normLeadTime[i] + 0.25 * item.Consignment_Score,
  }));

  // Phase C: Build TOPSIS matrix and calculate dynamic Entropy weights
  const topsisMatrix = withAggregates.map((item) => [
    item.Criticality_Agg,
    item.Demand_Agg,
    item.Supply_Agg,
    item["Unit cost"],
    item.Size_Score,
  ]);

  const dynamicWeights = calculateEntropyWeights(topsisMatrix);
  const crispWeights: EntropyWeights = {
    Criticality_Agg: dynamicWeights[0],
    Demand_Agg: dynamicWeights[1],
    Supply_Agg: dynamicWeights[2],
    Unit_cost: dynamicWeights[3],
    Size_Score: dynamicWeights[4],
  };

  // Phase D: Calculate Crisp TOPSIS scores
  const benefitCriteria = [true, true, true, true, true];
  const topsisScores = calculateTOPSIS(topsisMatrix, dynamicWeights, benefitCriteria);

  // Phase E: Calculate Fuzzy TOPSIS scores with dynamic weights
  const { scores: fuzzyScores, weights: fuzzyWeights } = calculateFuzzyTOPSIS(
    items,
    normStock,
    normUsage,
    normCost,
    normLeadTime
  );

  // Combine all data
  const withScores = withAggregates.map((item, i) => ({
    ...item,
    TOPSIS_Score: topsisScores[i],
    Fuzzy_TOPSIS_Score: fuzzyScores[i],
  }));

  // Sort by TOPSIS score descending and get sorted indices
  const sortedByCrispIndices = withScores
    .map((_, i) => i)
    .sort((a, b) => withScores[b].TOPSIS_Score - withScores[a].TOPSIS_Score);

  const sortedByFuzzyIndices = withScores
    .map((_, i) => i)
    .sort((a, b) => withScores[b].Fuzzy_TOPSIS_Score - withScores[a].Fuzzy_TOPSIS_Score);

  // Assign classes
  const crispClasses = assignClass(sortedByCrispIndices, items.length, thresholds);
  const fuzzyClasses = assignClass(sortedByFuzzyIndices, items.length, thresholds);

  // Final processed items (sorted by Crisp TOPSIS score)
  const processedItems: ProcessedItem[] = sortedByCrispIndices.map((originalIdx) => ({
    ...withScores[originalIdx],
    Class: crispClasses[originalIdx],
    Fuzzy_Class: fuzzyClasses[originalIdx],
  }));

  return { processedItems, crispWeights, fuzzyWeights };
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

// Get Fuzzy vs Crisp match percentage (items in Class A in both methods)
export function getFuzzyCrispMatch(items: ProcessedItem[]): number {
  if (items.length === 0) return 0;
  const matchCount = items.filter((item) => item.Class === item.Fuzzy_Class).length;
  return (matchCount / items.length) * 100;
}

// Get top item by score
export function getTopItem(items: ProcessedItem[], useFuzzy: boolean = false): ProcessedItem | null {
  if (items.length === 0) return null;
  if (useFuzzy) {
    return [...items].sort((a, b) => b.Fuzzy_TOPSIS_Score - a.Fuzzy_TOPSIS_Score)[0];
  }
  return items[0]; // Already sorted by TOPSIS_Score
}

// Get top weight criterion name
export function getTopWeightCriterion(weights: EntropyWeights): { name: string; value: number } {
  const entries = Object.entries(weights) as [keyof EntropyWeights, number][];
  const sorted = entries.sort((a, b) => b[1] - a[1]);
  const nameMap: Record<keyof EntropyWeights, string> = {
    Criticality_Agg: "Criticality",
    Demand_Agg: "Demand",
    Supply_Agg: "Supply",
    Unit_cost: "Unit Cost",
    Size_Score: "Unit Size",
  };
  return { name: nameMap[sorted[0][0]], value: sorted[0][1] };
}
