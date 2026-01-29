-- Table pour stocker les sessions d'analyse MCDM
CREATE TABLE public.mcdm_analyses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  thresholds_a INTEGER NOT NULL DEFAULT 20,
  thresholds_b INTEGER NOT NULL DEFAULT 50,
  total_items INTEGER NOT NULL DEFAULT 0,
  crisp_weights JSONB,
  fuzzy_weights JSONB
);

-- Table pour stocker les items d'inventaire
CREATE TABLE public.inventory_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  analysis_id UUID NOT NULL REFERENCES public.mcdm_analyses(id) ON DELETE CASCADE,
  item_number INTEGER NOT NULL,
  risk TEXT NOT NULL,
  demand_fluctuation TEXT NOT NULL,
  average_stock NUMERIC NOT NULL,
  daily_usage NUMERIC NOT NULL,
  unit_cost NUMERIC NOT NULL,
  lead_time INTEGER NOT NULL,
  consignment_stock TEXT NOT NULL,
  unit_size TEXT NOT NULL,
  -- Scores calculés
  risk_score NUMERIC,
  fluctuation_score NUMERIC,
  consignment_score NUMERIC,
  size_score NUMERIC,
  norm_usage NUMERIC,
  norm_stock NUMERIC,
  norm_lead_time NUMERIC,
  norm_cost NUMERIC,
  criticality_agg NUMERIC,
  demand_agg NUMERIC,
  supply_agg NUMERIC,
  topsis_score NUMERIC,
  fuzzy_topsis_score NUMERIC,
  class TEXT,
  fuzzy_class TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security (public pour le moment, pas d'auth requis)
ALTER TABLE public.mcdm_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;

-- Policies publiques (lecture/écriture pour tous)
CREATE POLICY "Allow public read access on analyses"
  ON public.mcdm_analyses FOR SELECT
  USING (true);

CREATE POLICY "Allow public insert on analyses"
  ON public.mcdm_analyses FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow public update on analyses"
  ON public.mcdm_analyses FOR UPDATE
  USING (true);

CREATE POLICY "Allow public delete on analyses"
  ON public.mcdm_analyses FOR DELETE
  USING (true);

CREATE POLICY "Allow public read access on items"
  ON public.inventory_items FOR SELECT
  USING (true);

CREATE POLICY "Allow public insert on items"
  ON public.inventory_items FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow public update on items"
  ON public.inventory_items FOR UPDATE
  USING (true);

CREATE POLICY "Allow public delete on items"
  ON public.inventory_items FOR DELETE
  USING (true);

-- Trigger pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_mcdm_analyses_updated_at
  BEFORE UPDATE ON public.mcdm_analyses
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Index pour améliorer les performances
CREATE INDEX idx_inventory_items_analysis_id ON public.inventory_items(analysis_id);
CREATE INDEX idx_inventory_items_class ON public.inventory_items(class);
CREATE INDEX idx_inventory_items_topsis_score ON public.inventory_items(topsis_score DESC);