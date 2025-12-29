import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

interface ABCChartProps {
  data: { A: number; B: number; C: number };
}

const COLORS = {
  A: "hsl(173, 58%, 45%)",
  B: "hsl(38, 92%, 50%)",
  C: "hsl(280, 65%, 60%)",
};

export function ABCChart({ data }: ABCChartProps) {
  const chartData = [
    { class: "Class A", count: data.A, fill: COLORS.A },
    { class: "Class B", count: data.B, fill: COLORS.B },
    { class: "Class C", count: data.C, fill: COLORS.C },
  ];

  return (
    <div className="w-full h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="hsl(217, 33%, 25%)"
            opacity={0.3}
          />
          <XAxis
            dataKey="class"
            tick={{ fill: "hsl(215, 20%, 65%)", fontSize: 12 }}
            axisLine={{ stroke: "hsl(217, 33%, 25%)" }}
          />
          <YAxis
            tick={{ fill: "hsl(215, 20%, 65%)", fontSize: 12 }}
            axisLine={{ stroke: "hsl(217, 33%, 25%)" }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "hsl(222, 47%, 14%)",
              border: "1px solid hsl(217, 33%, 25%)",
              borderRadius: "8px",
              color: "hsl(210, 40%, 98%)",
            }}
            formatter={(value: number) => [`${value} items`, "Count"]}
          />
          <Bar dataKey="count" radius={[8, 8, 0, 0]} maxBarSize={80}>
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.fill} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
