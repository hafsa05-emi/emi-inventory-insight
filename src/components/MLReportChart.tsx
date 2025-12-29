import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

const classificationData = [
  { class: "Class A", precision: 96, recall: 90, f1: 93 },
  { class: "Class B", precision: 91, recall: 91, f1: 91 },
  { class: "Class C", precision: 96, recall: 99, f1: 97 },
];

const featureImportance = [
  { feature: "Size_Score", importance: 40.59 },
  { feature: "Criticality_Agg", importance: 18.55 },
  { feature: "Unit_cost", importance: 17.07 },
  { feature: "Supply_Agg", importance: 13.44 },
  { feature: "Demand_Agg", importance: 10.35 },
];

export function ClassificationReportChart() {
  return (
    <div className="w-full h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={classificationData}
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
            domain={[80, 100]}
            tick={{ fill: "hsl(215, 20%, 65%)", fontSize: 12 }}
            axisLine={{ stroke: "hsl(217, 33%, 25%)" }}
            label={{
              value: "Percentage (%)",
              angle: -90,
              position: "insideLeft",
              fill: "hsl(215, 20%, 65%)",
              fontSize: 12,
            }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "hsl(222, 47%, 14%)",
              border: "1px solid hsl(217, 33%, 25%)",
              borderRadius: "8px",
              color: "hsl(210, 40%, 98%)",
            }}
          />
          <Legend wrapperStyle={{ color: "hsl(210, 40%, 98%)" }} />
          <Bar dataKey="precision" name="Precision" fill="hsl(173, 58%, 45%)" radius={[4, 4, 0, 0]} />
          <Bar dataKey="recall" name="Recall" fill="hsl(38, 92%, 50%)" radius={[4, 4, 0, 0]} />
          <Bar dataKey="f1" name="F1-Score" fill="hsl(280, 65%, 60%)" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function FeatureImportanceChart() {
  return (
    <div className="w-full h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={featureImportance}
          layout="vertical"
          margin={{ top: 20, right: 30, left: 100, bottom: 20 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="hsl(217, 33%, 25%)"
            opacity={0.3}
          />
          <XAxis
            type="number"
            domain={[0, 50]}
            tick={{ fill: "hsl(215, 20%, 65%)", fontSize: 12 }}
            axisLine={{ stroke: "hsl(217, 33%, 25%)" }}
            label={{
              value: "Weight (%)",
              position: "bottom",
              fill: "hsl(215, 20%, 65%)",
              fontSize: 12,
            }}
          />
          <YAxis
            type="category"
            dataKey="feature"
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
            formatter={(value: number) => [`${value}%`, "Entropy Weight"]}
          />
          <Bar
            dataKey="importance"
            fill="hsl(173, 58%, 45%)"
            radius={[0, 8, 8, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
