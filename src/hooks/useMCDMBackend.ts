import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { InventoryItem, ProcessedItem, EntropyWeights, FuzzyEntropyWeights } from '@/lib/mcdm';
import { toast } from 'sonner';

interface AnalysisResult {
  analysisId: string;
  processedItems: ProcessedItem[];
  crispWeights: EntropyWeights;
  fuzzyWeights: FuzzyEntropyWeights;
  totalItems: number;
}

interface SavedAnalysis {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
  thresholds_a: number;
  thresholds_b: number;
  total_items: number;
  crisp_weights: EntropyWeights | null;
  fuzzy_weights: FuzzyEntropyWeights | null;
}

export function useMCDMBackend() {
  const [isLoading, setIsLoading] = useState(false);
  const [lastAnalysisId, setLastAnalysisId] = useState<string | null>(null);
  const [savedAnalyses, setSavedAnalyses] = useState<SavedAnalysis[]>([]);

  const analyzeData = useCallback(
    async (
      items: InventoryItem[],
      thresholds: { A: number; B: number }
    ): Promise<AnalysisResult | null> => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase.functions.invoke('mcdm-analyze', {
          body: {
            action: 'analyze',
            data: items,
            thresholds,
          },
        });

        if (error) {
          console.error('Backend analysis error:', error);
          toast.error(`Backend error: ${error.message}`);
          return null;
        }

        if (data?.success) {
          setLastAnalysisId(data.analysisId);
          toast.success(`Analysis saved with ID: ${data.analysisId.slice(0, 8)}...`);
          return {
            analysisId: data.analysisId,
            processedItems: data.processedItems,
            crispWeights: data.crispWeights,
            fuzzyWeights: data.fuzzyWeights,
            totalItems: data.totalItems,
          };
        }

        toast.error('Analysis failed: Unknown error');
        return null;
      } catch (err) {
        console.error('MCDM Backend Error:', err);
        toast.error('Failed to connect to backend');
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const getAnalysis = useCallback(
    async (analysisId: string) => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase.functions.invoke('mcdm-analyze', {
          body: {
            action: 'getAnalysis',
            analysisId,
          },
        });

        if (error) {
          console.error('Get analysis error:', error);
          toast.error(`Error loading analysis: ${error.message}`);
          return null;
        }

        return data;
      } catch (err) {
        console.error('Get Analysis Error:', err);
        toast.error('Failed to load analysis');
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const listAnalyses = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('mcdm-analyze', {
        body: {
          action: 'listAnalyses',
        },
      });

      if (error) {
        console.error('List analyses error:', error);
        toast.error(`Error listing analyses: ${error.message}`);
        return [];
      }

      if (data?.success && Array.isArray(data.analyses)) {
        setSavedAnalyses(data.analyses);
        return data.analyses;
      }

      return [];
    } catch (err) {
      console.error('List Analyses Error:', err);
      toast.error('Failed to list analyses');
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    isLoading,
    lastAnalysisId,
    savedAnalyses,
    analyzeData,
    getAnalysis,
    listAnalyses,
  };
}
