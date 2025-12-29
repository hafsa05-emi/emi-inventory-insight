import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { EntropyWeights } from "@/lib/mcdm";

interface WeightsPieChartProps {
  weights: EntropyWeights;
}

const COLORS = [
  "hsl(173, 58%, 45%)", // primary/teal
  "hsl(38, 92%, 50%)",  // amber
  "hsl(280, 65%, 60%)", // purple
  "hsl(199, 89%, 48%)", // blue
  "hsl(142, 71%, 45%)", // green
];

const labelMap: Record<keyof EntropyWeights, string> = {
  Criticality_Agg: "Criticality",
  Demand_Agg: "Demand",
  Supply_Agg: "Supply",
  Unit_cost: "Unit Cost",
  Size_Score: "Unit Size",
};

export function WeightsPieChart({ weights }: WeightsPieChartProps) {
  const data = Object.entries(weights).map(([key, value], index) => ({
    name: labelMap[key as keyof EntropyWeights],
    value: parseFloat((value * 100).toFixed(2)),
    color: COLORS[index % COLORS.length],
  }));

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
          <p className="text-sm font-medium text-foreground">{payload[0].name}</p>
          <p className="text-sm text-primary font-mono">{payload[0].value.toFixed(2)}%</p>
        </div>
      );
    }
    return null;
  };

  return (
    <ResponsiveContainer width="100%" height={280}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={90}
          paddingAngle={3}
          dataKey="value"
          label={({ name, value }) => `${value.toFixed(1)}%`}
          labelLine={false}
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} stroke="transparent" />
          ))}
        </Pie>
        <Tooltip content={<CustomTooltip />} />
        <Legend
          formatter={(value) => <span className="text-sm text-muted-foreground">{value}</span>}
          iconType="circle"
          wrapperStyle={{ paddingTop: 20 }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
