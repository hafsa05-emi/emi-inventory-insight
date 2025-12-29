import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ZAxis,
} from "recharts";
import { ProcessedItem } from "@/lib/mcdm";

interface FuzzyCrispScatterProps {
  data: ProcessedItem[];
}

export function FuzzyCrispScatter({ data }: FuzzyCrispScatterProps) {
  const classAData = data.filter((d) => d.Class === "A").map((d) => ({
    x: d.TOPSIS_Score,
    y: d.Fuzzy_TOPSIS_Score,
    id: d.id,
    class: "A",
  }));

  const classBData = data.filter((d) => d.Class === "B").map((d) => ({
    x: d.TOPSIS_Score,
    y: d.Fuzzy_TOPSIS_Score,
    id: d.id,
    class: "B",
  }));

  const classCData = data.filter((d) => d.Class === "C").map((d) => ({
    x: d.TOPSIS_Score,
    y: d.Fuzzy_TOPSIS_Score,
    id: d.id,
    class: "C",
  }));

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
          <p className="text-sm font-medium text-foreground">Item #{data.id}</p>
          <p className="text-xs text-muted-foreground">
            Crisp: <span className="font-mono text-primary">{data.x.toFixed(4)}</span>
          </p>
          <p className="text-xs text-muted-foreground">
            Fuzzy: <span className="font-mono text-chart-b">{data.y.toFixed(4)}</span>
          </p>
          <p className="text-xs text-muted-foreground">
            Class: <span className="font-semibold">{data.class}</span>
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <ResponsiveContainer width="100%" height={300}>
      <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
        <XAxis
          type="number"
          dataKey="x"
          name="Crisp Score"
          domain={[0, 1]}
          tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
          axisLine={{ stroke: "hsl(var(--border))" }}
          label={{ value: "Crisp TOPSIS Score", position: "bottom", offset: 0, fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
        />
        <YAxis
          type="number"
          dataKey="y"
          name="Fuzzy Score"
          domain={[0, 1]}
          tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
          axisLine={{ stroke: "hsl(var(--border))" }}
          label={{ value: "Fuzzy Score", angle: -90, position: "insideLeft", fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
        />
        <ZAxis range={[30, 30]} />
        <Tooltip content={<CustomTooltip />} />
        <Legend
          formatter={(value) => <span className="text-sm text-muted-foreground">{value}</span>}
          iconType="circle"
        />
        <Scatter name="Class A" data={classAData} fill="hsl(var(--chart-a))" />
        <Scatter name="Class B" data={classBData} fill="hsl(var(--chart-b))" />
        <Scatter name="Class C" data={classCData} fill="hsl(var(--chart-c))" />
      </ScatterChart>
    </ResponsiveContainer>
  );
}
