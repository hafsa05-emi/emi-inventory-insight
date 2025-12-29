import {
  ScatterChart as RechartsScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ZAxis,
  Legend,
} from "recharts";
import { ProcessedItem } from "@/lib/mcdm";

interface ScatterChartProps {
  data: ProcessedItem[];
}

const COLORS = {
  A: "hsl(173, 58%, 45%)",
  B: "hsl(38, 92%, 50%)",
  C: "hsl(280, 65%, 60%)",
};

export function ScatterPlotChart({ data }: ScatterChartProps) {
  const classA = data.filter((d) => d.Class === "A").map((d) => ({
    x: d["Unit cost"],
    y: d.TOPSIS_Score,
    id: d.id,
  }));

  const classB = data.filter((d) => d.Class === "B").map((d) => ({
    x: d["Unit cost"],
    y: d.TOPSIS_Score,
    id: d.id,
  }));

  const classC = data.filter((d) => d.Class === "C").map((d) => ({
    x: d["Unit cost"],
    y: d.TOPSIS_Score,
    id: d.id,
  }));

  return (
    <div className="w-full h-[350px]">
      <ResponsiveContainer width="100%" height="100%">
        <RechartsScatterChart margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="hsl(217, 33%, 25%)"
            opacity={0.3}
          />
          <XAxis
            type="number"
            dataKey="x"
            name="Unit Cost"
            tick={{ fill: "hsl(215, 20%, 65%)", fontSize: 12 }}
            axisLine={{ stroke: "hsl(217, 33%, 25%)" }}
            label={{
              value: "Unit Cost ($)",
              position: "bottom",
              fill: "hsl(215, 20%, 65%)",
              fontSize: 12,
            }}
          />
          <YAxis
            type="number"
            dataKey="y"
            name="TOPSIS Score"
            domain={[0, 1]}
            tick={{ fill: "hsl(215, 20%, 65%)", fontSize: 12 }}
            axisLine={{ stroke: "hsl(217, 33%, 25%)" }}
            label={{
              value: "TOPSIS Score",
              angle: -90,
              position: "insideLeft",
              fill: "hsl(215, 20%, 65%)",
              fontSize: 12,
            }}
          />
          <ZAxis range={[50, 50]} />
          <Tooltip
            contentStyle={{
              backgroundColor: "hsl(222, 47%, 14%)",
              border: "1px solid hsl(217, 33%, 25%)",
              borderRadius: "8px",
              color: "hsl(210, 40%, 98%)",
            }}
            formatter={(value: number, name: string) => [
              value.toFixed(4),
              name === "y" ? "TOPSIS Score" : "Unit Cost",
            ]}
          />
          <Legend
            wrapperStyle={{ color: "hsl(210, 40%, 98%)" }}
          />
          <Scatter name="Class A" data={classA} fill={COLORS.A} />
          <Scatter name="Class B" data={classB} fill={COLORS.B} />
          <Scatter name="Class C" data={classC} fill={COLORS.C} />
        </RechartsScatterChart>
      </ResponsiveContainer>
    </div>
  );
}
