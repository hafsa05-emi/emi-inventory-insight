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
  Upload,
  Percent,
  Award,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { CSVUploader } from "@/components/CSVUploader";
import { KPICard } from "@/components/KPICard";
import { ABCChart } from "@/components/ABCChart";
import { WeightsPieChart } from "@/components/WeightsPieChart";
import { FuzzyCrispScatter } from "@/components/FuzzyCrispScatter";
import { DetailedResultsTable } from "@/components/DetailedResultsTable";
import { DataTable } from "@/components/DataTable";
import {
  InventoryItem,
  ProcessedItem,
  EntropyWeights,
  FuzzyEntropyWeights,
  processInventoryData,
  getABCDistribution,
  getFuzzyCrispMatch,
  getTopItem,
  getTopWeightCriterion,
} from "@/lib/mcdm";
import { generateSampleData } from "@/lib/sampleData";

export default function Index() {
  const [rawData, setRawData] = useState<InventoryItem[]>(() => generateSampleData(700));
  const [thresholds, setThresholds] = useState({ A: 20, B: 50 });
  const [currentView, setCurrentView] = useState("crisp");

  const { processedItems, crispWeights, fuzzyWeights } = useMemo(() => {
    return processInventoryData(rawData, thresholds);
  }, [rawData, thresholds]);

  const abcDistribution = useMemo(() => {
    return getABCDistribution(processedItems);
  }, [processedItems]);

  const fuzzyCrispMatch = useMemo(() => {
    return getFuzzyCrispMatch(processedItems);
  }, [processedItems]);

  const topCrispItem = useMemo(() => {
    return getTopItem(processedItems, false);
  }, [processedItems]);

  const topWeightCriterion = useMemo(() => {
    return getTopWeightCriterion(crispWeights);
  }, [crispWeights]);

  const handleDataLoaded = useCallback((data: InventoryItem[]) => {
    setRawData(data);
  }, []);

  const handleThresholdAChange = useCallback((value: number[]) => {
    setThresholds((prev) => ({ ...prev, A: value[0] }));
  }, []);

  const handleThresholdBChange = useCallback((value: number[]) => {
    setThresholds((prev) => ({ ...prev, B: value[0] }));
  }, []);

  const renderContent = () => {
    switch (currentView) {
      case "upload":
        return (
          <div className="space-y-6 animate-fade-in">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-foreground">Upload Data</h2>
              <p className="text-muted-foreground">
                Import your inventory CSV file for MCDM analysis
              </p>
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Upload className="w-5 h-5 text-primary" />
                    CSV Import
                  </CardTitle>
                  <CardDescription>
                    Upload your inventory data or use sample data ({rawData.length} items loaded)
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <CSVUploader onDataLoaded={handleDataLoaded} />
                </CardContent>
              </Card>

              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle>Expected Columns</CardTitle>
                  <CardDescription>Your CSV should contain these columns</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      "Risk",
                      "Demand fluctuation",
                      "Average stock",
                      "Daily usage",
                      "Unit cost",
                      "Lead time",
                      "Consignment stock",
                      "Unit size",
                    ].map((col) => (
                      <div
                        key={col}
                        className="px-3 py-2 bg-secondary/50 rounded-lg text-sm text-foreground font-mono"
                      >
                        {col}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle>Data Preview</CardTitle>
                <CardDescription>
                  {rawData.length} items loaded • 8 attributes per item
                </CardDescription>
              </CardHeader>
              <CardContent>
                <DataTable data={rawData} maxRows={15} />
              </CardContent>
            </Card>
          </div>
        );

      case "crisp":
        return (
          <div className="space-y-6 animate-fade-in">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-foreground">Crisp TOPSIS Analysis</h2>
              <p className="text-muted-foreground">
                Multi-criteria decision analysis with dynamic entropy weights
              </p>
            </div>

            {/* KPI Cards */}
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              <KPICard
                title="Best Asset (Crisp)"
                value={topCrispItem ? `#${topCrispItem.id}` : "N/A"}
                subtitle={topCrispItem ? `Score: ${topCrispItem.TOPSIS_Score.toFixed(4)}` : "No data"}
                icon={Award}
                variant="primary"
                delay={0}
              />
              <KPICard
                title="Top Weight Factor"
                value={topWeightCriterion.name}
                subtitle={`Weight: ${(topWeightCriterion.value * 100).toFixed(2)}%`}
                icon={TrendingUp}
                variant="warning"
                delay={100}
              />
              <KPICard
                title="Fuzzy vs Crisp Match"
                value={`${fuzzyCrispMatch.toFixed(1)}%`}
                subtitle="Same class in both methods"
                icon={Percent}
                variant="success"
                delay={200}
              />
              <KPICard
                title="Total Items"
                value={rawData.length}
                subtitle="Inventory records"
                icon={Package}
                variant="default"
                delay={300}
              />
            </div>

            {/* Charts Row */}
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
                  <CardTitle>Entropy Weight Distribution</CardTitle>
                  <CardDescription>
                    Dynamically calculated weights for 5 criteria
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <WeightsPieChart weights={crispWeights} />
                </CardContent>
              </Card>
            </div>

            {/* Scatter Plot */}
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle>Fuzzy vs Crisp Score Comparison</CardTitle>
                <CardDescription>
                  X-axis = Crisp TOPSIS Score, Y-axis = Fuzzy TOPSIS Score
                </CardDescription>
              </CardHeader>
              <CardContent>
                <FuzzyCrispScatter data={processedItems} />
              </CardContent>
            </Card>

            {/* Results Table */}
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-primary" />
                  Detailed Results
                </CardTitle>
                <CardDescription>
                  Sortable table with crisp and fuzzy scores
                </CardDescription>
              </CardHeader>
              <CardContent>
                <DetailedResultsTable data={processedItems} weights={crispWeights} maxRows={50} />
              </CardContent>
            </Card>
          </div>
        );

      case "fuzzy":
        return (
          <div className="space-y-6 animate-fade-in">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-foreground">Fuzzy TOPSIS Analysis</h2>
              <p className="text-muted-foreground">
                Triangular Fuzzy Numbers with Vertex Method distance calculation
              </p>
            </div>

            {/* Fuzzy KPIs */}
            <div className="grid md:grid-cols-3 gap-4">
              <KPICard
                title="Best Fuzzy Asset"
                value={(() => {
                  const topFuzzy = [...processedItems].sort(
                    (a, b) => b.Fuzzy_TOPSIS_Score - a.Fuzzy_TOPSIS_Score
                  )[0];
                  return topFuzzy ? `#${topFuzzy.id}` : "N/A";
                })()}
                subtitle={(() => {
                  const topFuzzy = [...processedItems].sort(
                    (a, b) => b.Fuzzy_TOPSIS_Score - a.Fuzzy_TOPSIS_Score
                  )[0];
                  return topFuzzy ? `Fuzzy Score: ${topFuzzy.Fuzzy_TOPSIS_Score.toFixed(4)}` : "";
                })()}
                icon={Sparkles}
                variant="primary"
                delay={0}
              />
              <KPICard
                title="Fuzzy Weight - Risk"
                value={`${(fuzzyWeights.Risk * 100).toFixed(2)}%`}
                subtitle="Entropy weight for Risk criterion"
                icon={Target}
                variant="warning"
                delay={100}
              />
              <KPICard
                title="Fuzzy Weight - Size"
                value={`${(fuzzyWeights.Size * 100).toFixed(2)}%`}
                subtitle="Entropy weight for Unit Size"
                icon={TrendingUp}
                variant="success"
                delay={200}
              />
            </div>

            {/* Fuzzy Method Explanation */}
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle>Fuzzy TOPSIS Methodology</CardTitle>
                <CardDescription>
                  How Triangular Fuzzy Numbers are used
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-lg bg-secondary/50 border border-border">
                    <h4 className="font-semibold text-foreground mb-2">Fuzzification</h4>
                    <p className="text-sm text-muted-foreground mb-3">
                      Categorical variables are converted to Triangular Fuzzy Numbers [L, M, U]:
                    </p>
                    <div className="space-y-1 font-mono text-xs">
                      <p>Risk (High): [0.7, 0.9, 1.0]</p>
                      <p>Size (Large): [0.6, 0.8, 1.0]</p>
                      <p>Quantitative: [x, x, x] (crisp)</p>
                    </div>
                  </div>
                  <div className="p-4 rounded-lg bg-secondary/50 border border-border">
                    <h4 className="font-semibold text-foreground mb-2">Vertex Method</h4>
                    <p className="text-sm text-muted-foreground mb-3">
                      Distance calculated using the formula:
                    </p>
                    <div className="font-mono text-xs bg-background/50 p-2 rounded">
                      d(A,B) = √(1/3 × [(l₁-l₂)² + (m₁-m₂)² + (u₁-u₂)²])
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Fuzzy Weights Breakdown */}
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle>Fuzzy Entropy Weights (8 Criteria)</CardTitle>
                <CardDescription>
                  Weights calculated from raw column values
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {Object.entries(fuzzyWeights).map(([key, value]) => (
                    <div
                      key={key}
                      className="p-4 rounded-lg bg-secondary/50 border border-border text-center"
                    >
                      <p className="text-sm text-muted-foreground capitalize">{key}</p>
                      <p className="text-xl font-bold font-mono text-primary">
                        {(value * 100).toFixed(2)}%
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Top Fuzzy Results */}
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-primary" />
                  Top 10 Fuzzy TOPSIS Results
                </CardTitle>
                <CardDescription>
                  Items ranked by Fuzzy Closeness Coefficient
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">Rank</th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">ID</th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">Risk</th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">Size</th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">Demand</th>
                        <th className="text-right py-3 px-4 text-sm font-semibold text-muted-foreground">Fuzzy Score</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[...processedItems]
                        .sort((a, b) => b.Fuzzy_TOPSIS_Score - a.Fuzzy_TOPSIS_Score)
                        .slice(0, 10)
                        .map((item, idx) => (
                          <tr
                            key={item.id}
                            className={`border-b border-border/50 ${idx % 2 === 0 ? "bg-card" : "bg-secondary/30"}`}
                          >
                            <td className="py-3 px-4 font-mono text-sm text-muted-foreground">
                              #{idx + 1}
                            </td>
                            <td className="py-3 px-4 font-mono text-sm text-foreground">
                              {item.id}
                            </td>
                            <td className="py-3 px-4">
                              <span
                                className={`text-sm font-medium ${
                                  item.Risk === "High"
                                    ? "text-destructive"
                                    : item.Risk === "Normal"
                                    ? "text-chart-b"
                                    : "text-chart-success"
                                }`}
                              >
                                {item.Risk}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-sm text-foreground">{item["Unit size"]}</td>
                            <td className="py-3 px-4 text-sm text-foreground">{item["Demand fluctuation"]}</td>
                            <td className="py-3 px-4 font-mono text-sm text-primary text-right">
                              {item.Fuzzy_TOPSIS_Score.toFixed(4)}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
                <div className="mt-4 p-4 rounded-lg bg-primary/10 border border-primary/20">
                  <p className="text-sm text-foreground">
                    <strong>Observation:</strong> High Risk + Large Size items tend to rank
                    higher in Fuzzy TOPSIS due to their higher TFN upper bounds.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case "settings":
        return (
          <div className="space-y-6 animate-fade-in">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-foreground">Settings</h2>
              <p className="text-muted-foreground">
                Configure ABC classification thresholds
              </p>
            </div>

            <Card className="bg-card border-border max-w-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5 text-primary" />
                  ABC Thresholds
                </CardTitle>
                <CardDescription>
                  Adjust classification boundaries for inventory items
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <Label>Class A (Top Strategic Items)</Label>
                    <span className="font-mono text-primary font-semibold">{thresholds.A}%</span>
                  </div>
                  <Slider
                    value={[thresholds.A]}
                    onValueChange={handleThresholdAChange}
                    min={5}
                    max={40}
                    step={5}
                    className="w-full"
                  />
                  <p className="text-xs text-muted-foreground">
                    Top {thresholds.A}% of items by TOPSIS score
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <Label>Class B Boundary</Label>
                    <span className="font-mono text-primary font-semibold">
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
                  <p className="text-xs text-muted-foreground">
                    Next {thresholds.B - thresholds.A}% of items
                  </p>
                </div>

                <div className="pt-4 border-t border-border">
                  <div className="flex justify-between text-sm">
                    <Label>Class C (Remaining)</Label>
                    <span className="font-mono text-primary font-semibold">
                      {100 - thresholds.B}%
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Bottom {100 - thresholds.B}% of items by TOPSIS score
                  </p>
                </div>

                <div className="mt-6 p-4 rounded-lg bg-secondary/50 border border-border">
                  <h4 className="font-semibold text-foreground mb-2">Current Distribution</h4>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="text-lg font-bold font-mono text-chart-a">{abcDistribution.A}</p>
                      <p className="text-xs text-muted-foreground">Class A</p>
                    </div>
                    <div>
                      <p className="text-lg font-bold font-mono text-chart-b">{abcDistribution.B}</p>
                      <p className="text-xs text-muted-foreground">Class B</p>
                    </div>
                    <div>
                      <p className="text-lg font-bold font-mono text-chart-c">{abcDistribution.C}</p>
                      <p className="text-xs text-muted-foreground">Class C</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar currentView={currentView} onViewChange={setCurrentView} />

        <div className="flex-1 flex flex-col min-h-screen">
          {/* Header */}
          <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-40">
            <div className="flex items-center gap-4 px-6 py-4">
              <SidebarTrigger className="text-muted-foreground hover:text-foreground" />
              <div className="flex-1">
                <h1 className="text-lg font-semibold text-foreground">InventoryMind</h1>
                <p className="text-xs text-muted-foreground">
                  Advanced MCDM Platform for Inventory Management
                </p>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="px-2 py-1 rounded bg-primary/20 text-primary font-mono">
                  {rawData.length} items
                </span>
              </div>
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 p-6 overflow-auto">{renderContent()}</main>
        </div>
      </div>
    </SidebarProvider>
  );
}
