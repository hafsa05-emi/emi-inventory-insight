import { useState, useMemo, useCallback } from "react";
import {
  Database,
  BarChart3,
  Brain,
  Package,
  Target,
  TrendingUp,
  Settings,
  Sparkles,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { CSVUploader } from "@/components/CSVUploader";
import { KPICard } from "@/components/KPICard";
import { ABCChart } from "@/components/ABCChart";
import { ScatterPlotChart } from "@/components/ScatterChart";
import { ResultsTable } from "@/components/ResultsTable";
import { FuzzyResultsTable } from "@/components/FuzzyResultsTable";
import { DataTable } from "@/components/DataTable";
import {
  ClassificationReportChart,
  FeatureImportanceChart,
} from "@/components/MLReportChart";
import {
  InventoryItem,
  ProcessedItem,
  processInventoryData,
  getABCDistribution,
  getTopFuzzyResults,
  ENTROPY_WEIGHTS,
} from "@/lib/mcdm";
import { generateSampleData } from "@/lib/sampleData";

export default function Index() {
  const [rawData, setRawData] = useState<InventoryItem[]>(() => generateSampleData(700));
  const [thresholds, setThresholds] = useState({ A: 20, B: 50 });
  const [fuzzyMode, setFuzzyMode] = useState(false);

  const processedData = useMemo(() => {
    return processInventoryData(rawData, thresholds);
  }, [rawData, thresholds]);

  const abcDistribution = useMemo(() => {
    return getABCDistribution(processedData);
  }, [processedData]);

  const topFuzzyResults = useMemo(() => {
    return getTopFuzzyResults(processedData, 10);
  }, [processedData]);

  const topScore = processedData[0]?.TOPSIS_Score || 0;

  const handleDataLoaded = useCallback((data: InventoryItem[]) => {
    setRawData(data);
  }, []);

  const handleThresholdAChange = useCallback((value: number[]) => {
    setThresholds((prev) => ({ ...prev, A: value[0] }));
  }, []);

  const handleThresholdBChange = useCallback((value: number[]) => {
    setThresholds((prev) => ({ ...prev, B: value[0] }));
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg gradient-primary flex items-center justify-center shadow-glow">
                <Package className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">
                  EMI Inventory Analytics
                </h1>
                <p className="text-sm text-muted-foreground">
                  Projet ABC Multi-Attributs
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Switch
                  id="fuzzy-mode"
                  checked={fuzzyMode}
                  onCheckedChange={setFuzzyMode}
                />
                <Label htmlFor="fuzzy-mode" className="text-sm text-muted-foreground">
                  Fuzzy Mode
                </Label>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <Tabs defaultValue="analysis" className="space-y-6">
          <TabsList className="bg-secondary/50 p-1">
            <TabsTrigger
              value="data"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <Database className="w-4 h-4 mr-2" />
              Data & Settings
            </TabsTrigger>
            <TabsTrigger
              value="analysis"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <BarChart3 className="w-4 h-4 mr-2" />
              Analysis Results
            </TabsTrigger>
            <TabsTrigger
              value="ml"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <Brain className="w-4 h-4 mr-2" />
              ML Report
            </TabsTrigger>
          </TabsList>

          {/* Tab 1: Data & Settings */}
          <TabsContent value="data" className="space-y-6 animate-fade-in">
            <div className="grid lg:grid-cols-3 gap-6">
              {/* CSV Upload */}
              <Card className="lg:col-span-2 bg-card border-border">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Database className="w-5 h-5 text-primary" />
                    Data Import
                  </CardTitle>
                  <CardDescription>
                    Upload your inventory CSV or use sample data (700 items loaded)
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <CSVUploader onDataLoaded={handleDataLoaded} />
                </CardContent>
              </Card>

              {/* Settings */}
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="w-5 h-5 text-primary" />
                    ABC Thresholds
                  </CardTitle>
                  <CardDescription>
                    Adjust classification boundaries
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <Label>Class A (Top)</Label>
                      <span className="font-mono text-primary">{thresholds.A}%</span>
                    </div>
                    <Slider
                      value={[thresholds.A]}
                      onValueChange={handleThresholdAChange}
                      min={5}
                      max={40}
                      step={5}
                      className="w-full"
                    />
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <Label>Class B (Next)</Label>
                      <span className="font-mono text-primary">
                        {thresholds.B - thresholds.A}%
                      </span>
                    </div>
                    <Slider
                      value={[thresholds.B]}
                      onValueChange={handleThresholdBChange}
                      min={thresholds.A + 10}
                      max={70}
                      step={5}
                      className="w-full"
                    />
                  </div>
                  <div className="pt-4 border-t border-border">
                    <p className="text-sm text-muted-foreground">
                      Class C: Bottom{" "}
                      <span className="font-mono text-primary">
                        {100 - thresholds.B}%
                      </span>
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Raw Data Table */}
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle>Raw Inventory Data</CardTitle>
                <CardDescription>
                  {rawData.length} items loaded • 8 attributes per item
                </CardDescription>
              </CardHeader>
              <CardContent>
                <DataTable data={rawData} maxRows={15} />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab 2: Analysis Results */}
          <TabsContent value="analysis" className="space-y-6 animate-fade-in">
            {/* KPI Cards */}
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              <KPICard
                title="Total Items"
                value={rawData.length}
                subtitle="Inventory records"
                icon={Package}
                variant="default"
                delay={0}
              />
              <KPICard
                title="ML Accuracy"
                value="94%"
                subtitle="Random Forest classifier"
                icon={Brain}
                variant="success"
                delay={100}
              />
              <KPICard
                title="Top Score"
                value={topScore.toFixed(3)}
                subtitle="Highest TOPSIS score"
                icon={Target}
                variant="primary"
                delay={200}
              />
              <KPICard
                title="Top Entropy Driver"
                value={`${(ENTROPY_WEIGHTS.Size_Score * 100).toFixed(2)}%`}
                subtitle="Unit Size weight"
                icon={TrendingUp}
                variant="warning"
                delay={300}
              />
            </div>

            {/* Charts */}
            <div className="grid lg:grid-cols-2 gap-6">
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle>ABC Distribution</CardTitle>
                  <CardDescription>
                    Items classified by TOPSIS ranking
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ABCChart data={abcDistribution} />
                  <div className="grid grid-cols-3 gap-4 mt-4">
                    <div className="text-center p-3 rounded-lg bg-chart-a/10 border border-chart-a/20">
                      <p className="text-2xl font-bold font-mono text-chart-a">
                        {abcDistribution.A}
                      </p>
                      <p className="text-xs text-muted-foreground">Class A</p>
                    </div>
                    <div className="text-center p-3 rounded-lg bg-chart-b/10 border border-chart-b/20">
                      <p className="text-2xl font-bold font-mono text-chart-b">
                        {abcDistribution.B}
                      </p>
                      <p className="text-xs text-muted-foreground">Class B</p>
                    </div>
                    <div className="text-center p-3 rounded-lg bg-chart-c/10 border border-chart-c/20">
                      <p className="text-2xl font-bold font-mono text-chart-c">
                        {abcDistribution.C}
                      </p>
                      <p className="text-xs text-muted-foreground">Class C</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle>TOPSIS Score vs Unit Cost</CardTitle>
                  <CardDescription>
                    Scatter plot colored by ABC class
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ScatterPlotChart data={processedData} />
                </CardContent>
              </Card>
            </div>

            {/* Results Table */}
            {!fuzzyMode ? (
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-primary" />
                    TOPSIS Results
                  </CardTitle>
                  <CardDescription>
                    Items ranked by proximity to ideal solution
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResultsTable data={processedData} maxRows={25} />
                </CardContent>
              </Card>
            ) : (
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-primary" />
                    Fuzzy TOPSIS Results (Top 10)
                  </CardTitle>
                  <CardDescription>
                    Using Triangular Fuzzy Numbers & Vertex Method
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <FuzzyResultsTable data={topFuzzyResults} />
                  <div className="mt-4 p-4 rounded-lg bg-primary/10 border border-primary/20">
                    <p className="text-sm text-foreground">
                      <strong>Observation:</strong> High Risk + Large Size items dominate
                      the top rankings in Fuzzy TOPSIS, aligning with the expected
                      behavior where these attributes have the highest fuzzy weights.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Tab 3: ML Report */}
          <TabsContent value="ml" className="space-y-6 animate-fade-in">
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Classification Report */}
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle>Classification Report</CardTitle>
                  <CardDescription>
                    Random Forest performance metrics
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ClassificationReportChart />
                  <div className="mt-4 p-4 rounded-lg bg-secondary/50 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Overall Accuracy</span>
                      <span className="font-mono font-bold text-chart-success">94%</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Macro Avg F1</span>
                      <span className="font-mono font-bold text-primary">94%</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Test Set Size</span>
                      <span className="font-mono">210 samples</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Feature Importance */}
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle>Entropy Weights (Feature Importance)</CardTitle>
                  <CardDescription>
                    Weights derived from Shannon entropy method
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <FeatureImportanceChart />
                  <div className="mt-4 p-4 rounded-lg bg-primary/10 border border-primary/20">
                    <p className="text-sm text-foreground">
                      <strong>Key Insight:</strong> Size_Score dominates with 40.59%
                      weight, indicating that unit size is the most discriminating
                      factor in the entropy-based TOPSIS analysis.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Methodology Summary */}
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle>Methodology Summary</CardTitle>
                <CardDescription>
                  Multi-Criteria Decision Making Pipeline
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-4 gap-4">
                  <div className="p-4 rounded-lg bg-secondary/50 border border-border">
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center mb-3">
                      <span className="font-bold text-primary">1</span>
                    </div>
                    <h4 className="font-semibold text-foreground mb-1">
                      Data Transformation
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      Categorical to numerical mapping using Table 1 scores
                    </p>
                  </div>
                  <div className="p-4 rounded-lg bg-secondary/50 border border-border">
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center mb-3">
                      <span className="font-bold text-primary">2</span>
                    </div>
                    <h4 className="font-semibold text-foreground mb-1">
                      Criteria Aggregation
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      Weighted combination per Table 2 (Criticality, Demand, Supply)
                    </p>
                  </div>
                  <div className="p-4 rounded-lg bg-secondary/50 border border-border">
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center mb-3">
                      <span className="font-bold text-primary">3</span>
                    </div>
                    <h4 className="font-semibold text-foreground mb-1">
                      TOPSIS + Entropy
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      Ranking by proximity to ideal solution with entropy weights
                    </p>
                  </div>
                  <div className="p-4 rounded-lg bg-secondary/50 border border-border">
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center mb-3">
                      <span className="font-bold text-primary">4</span>
                    </div>
                    <h4 className="font-semibold text-foreground mb-1">
                      ABC Classification
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      Strategic categorization: A (20%), B (30%), C (50%)
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-card/30 py-4 mt-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          EMI Rabat • Prof. Lamrani • Smart Inventory Decision Platform
        </div>
      </footer>
    </div>
  );
}
