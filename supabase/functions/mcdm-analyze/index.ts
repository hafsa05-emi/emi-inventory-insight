import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Mappings pour les variables qualitatives
const RISK_MAP: Record<string, number> = {
  High: 0.47,
  Normal: 0.35,
  Low: 0.18,
};

const DEMAND_FLUCTUATION_MAP: Record<string, number> = {
  Increasing: 0.36,
  Stable: 0.28,
  Unknown: 0.20,
  Decreasing: 0.16,
  Ending: 0.00,
};

const CONSIGNMENT_MAP: Record<string, number> = {
  No: 0.80,
  Yes: 0.20,
};

const UNIT_SIZE_MAP: Record<string, number> = {
  Large: 0.53,
  Medium: 0.31,
  Small: 0.13,
};

// Fuzzy Triangular Numbers (TFN)
const FUZZY_RISK: Record<string, [number, number, number]> = {
  High: [0.7, 0.9, 1.0],
  Normal: [0.3, 0.5, 0.7],
  Low: [0.0, 0.1, 0.3],
};

const FUZZY_DEMAND: Record<string, [number, number, number]> = {
  Increasing: [0.7, 0.85, 1.0],
  Stable: [0.4, 0.55, 0.7],
  Unknown: [0.3, 0.45, 0.6],
  Decreasing: [0.1, 0.25, 0.4],
  Ending: [0.0, 0.0, 0.1],
};

const FUZZY_SIZE: Record<string, [number, number, number]> = {
  Large: [0.6, 0.8, 1.0],
  Medium: [0.3, 0.5, 0.7],
  Small: [0.0, 0.2, 0.4],
};

const FUZZY_CONSIGNMENT: Record<string, [number, number, number]> = {
  No: [0.6, 0.8, 1.0],
  Yes: [0.0, 0.2, 0.4],
};

interface InventoryItem {
  Risk: string;
  "Demand fluctuation": string;
  "Average stock": number;
  "Daily usage": number;
  "Unit cost": number;
  "Lead time": number;
  "Consignment stock": string;
  "Unit size": string;
}

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

// Dynamic Entropy Weight Calculation
function calculateEntropyWeights(matrix: number[][]): number[] {
  const n = matrix.length;
  const m = matrix[0].length;
  const epsilon = 0.0001;
  const k = 1 / Math.log(n);

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

  const diversity = entropy.map((e) => 1 - e);
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
  const normalizedMatrix = vectorNormalize(matrix);
  const weightedMatrix = normalizedMatrix.map((row) =>
    row.map((val, j) => val * weights[j])
  );

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

function crispToTFN(value: number): [number, number, number] {
  return [value, value, value];
}

function weightTFN(tfn: [number, number, number], weight: number): [number, number, number] {
  return [tfn[0] * weight, tfn[1] * weight, tfn[2] * weight];
}

// Fuzzy TOPSIS with Dynamic Entropy Weights
function calculateFuzzyTOPSIS(
  items: InventoryItem[],
  normStock: number[],
  normUsage: number[],
  normCost: number[],
  normLeadTime: number[]
): { scores: number[]; weights: Record<string, number> } {
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

  const fuzzyWeightsArray = calculateEntropyWeights(crispMatrix);
  const fuzzyWeights = {
    Risk: fuzzyWeightsArray[0],
    Fluctuation: fuzzyWeightsArray[1],
    Stock: fuzzyWeightsArray[2],
    Usage: fuzzyWeightsArray[3],
    Cost: fuzzyWeightsArray[4],
    LeadTime: fuzzyWeightsArray[5],
    Consignment: fuzzyWeightsArray[6],
    Size: fuzzyWeightsArray[7],
  };

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

  const weightedFuzzyMatrix = fuzzyMatrix.map((row) =>
    row.map((tfn, j) => weightTFN(tfn, fuzzyWeightsArray[j]))
  );

  const idealSolution: [number, number, number] = [1.0, 1.0, 1.0];
  const antiIdealSolution: [number, number, number] = [0.0, 0.0, 0.0];

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

// Assign ABC Class
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
function processInventoryData(
  items: InventoryItem[],
  thresholds: { A: number; B: number } = { A: 20, B: 50 }
) {
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

  const usageValues = mapped.map((m) => m["Daily usage"]);
  const stockValues = mapped.map((m) => m["Average stock"]);
  const leadTimeValues = mapped.map((m) => m["Lead time"]);
  const costValues = mapped.map((m) => m["Unit cost"]);

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
  const crispWeights = {
    Criticality_Agg: dynamicWeights[0],
    Demand_Agg: dynamicWeights[1],
    Supply_Agg: dynamicWeights[2],
    Unit_cost: dynamicWeights[3],
    Size_Score: dynamicWeights[4],
  };

  // Phase D: Calculate Crisp TOPSIS scores
  const benefitCriteria = [true, true, true, true, true];
  const topsisScores = calculateTOPSIS(topsisMatrix, dynamicWeights, benefitCriteria);

  // Phase E: Calculate Fuzzy TOPSIS scores
  const { scores: fuzzyScores, weights: fuzzyWeights } = calculateFuzzyTOPSIS(
    items,
    normStock,
    normUsage,
    normCost,
    normLeadTime
  );

  const withScores = withAggregates.map((item, i) => ({
    ...item,
    TOPSIS_Score: topsisScores[i],
    Fuzzy_TOPSIS_Score: fuzzyScores[i],
  }));

  const sortedByCrispIndices = withScores
    .map((_, i) => i)
    .sort((a, b) => withScores[b].TOPSIS_Score - withScores[a].TOPSIS_Score);

  const sortedByFuzzyIndices = withScores
    .map((_, i) => i)
    .sort((a, b) => withScores[b].Fuzzy_TOPSIS_Score - withScores[a].Fuzzy_TOPSIS_Score);

  const crispClasses = assignClass(sortedByCrispIndices, items.length, thresholds);
  const fuzzyClasses = assignClass(sortedByFuzzyIndices, items.length, thresholds);

  const processedItems = sortedByCrispIndices.map((originalIdx) => ({
    ...withScores[originalIdx],
    Class: crispClasses[originalIdx],
    Fuzzy_Class: fuzzyClasses[originalIdx],
  }));

  return { processedItems, crispWeights, fuzzyWeights };
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { action, data, analysisId, thresholds } = await req.json();

    console.log(`MCDM Analyze - Action: ${action}`);

    if (action === 'analyze') {
      const items: InventoryItem[] = data;
      const thresholdConfig = thresholds || { A: 20, B: 50 };
      
      const { processedItems, crispWeights, fuzzyWeights } = processInventoryData(items, thresholdConfig);

      // Create analysis record
      const { data: analysis, error: analysisError } = await supabase
        .from('mcdm_analyses')
        .insert({
          name: `Analysis ${new Date().toISOString()}`,
          thresholds_a: thresholdConfig.A,
          thresholds_b: thresholdConfig.B,
          total_items: items.length,
          crisp_weights: crispWeights,
          fuzzy_weights: fuzzyWeights,
        })
        .select()
        .single();

      if (analysisError) {
        console.error('Error creating analysis:', analysisError);
        throw analysisError;
      }

      // Insert inventory items
      const inventoryItems = processedItems.map((item) => ({
        analysis_id: analysis.id,
        item_number: item.id,
        risk: item.Risk,
        demand_fluctuation: item["Demand fluctuation"],
        average_stock: item["Average stock"],
        daily_usage: item["Daily usage"],
        unit_cost: item["Unit cost"],
        lead_time: item["Lead time"],
        consignment_stock: item["Consignment stock"],
        unit_size: item["Unit size"],
        risk_score: item.Risk_Score,
        fluctuation_score: item.Fluctuation_Score,
        consignment_score: item.Consignment_Score,
        size_score: item.Size_Score,
        norm_usage: item.Norm_Usage,
        norm_stock: item.Norm_Stock,
        norm_lead_time: item.Norm_LeadTime,
        norm_cost: item.Norm_Cost,
        criticality_agg: item.Criticality_Agg,
        demand_agg: item.Demand_Agg,
        supply_agg: item.Supply_Agg,
        topsis_score: item.TOPSIS_Score,
        fuzzy_topsis_score: item.Fuzzy_TOPSIS_Score,
        class: item.Class,
        fuzzy_class: item.Fuzzy_Class,
      }));

      const { error: itemsError } = await supabase
        .from('inventory_items')
        .insert(inventoryItems);

      if (itemsError) {
        console.error('Error inserting items:', itemsError);
        throw itemsError;
      }

      console.log(`Analysis created: ${analysis.id} with ${processedItems.length} items`);

      return new Response(
        JSON.stringify({
          success: true,
          analysisId: analysis.id,
          processedItems,
          crispWeights,
          fuzzyWeights,
          totalItems: items.length,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'getAnalysis') {
      const { data: analysis, error } = await supabase
        .from('mcdm_analyses')
        .select('*')
        .eq('id', analysisId)
        .single();

      if (error) throw error;

      const { data: items, error: itemsError } = await supabase
        .from('inventory_items')
        .select('*')
        .eq('analysis_id', analysisId)
        .order('topsis_score', { ascending: false });

      if (itemsError) throw itemsError;

      return new Response(
        JSON.stringify({ success: true, analysis, items }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'listAnalyses') {
      const { data: analyses, error } = await supabase
        .from('mcdm_analyses')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      return new Response(
        JSON.stringify({ success: true, analyses }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Unknown action' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('MCDM Analyze Error:', errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
