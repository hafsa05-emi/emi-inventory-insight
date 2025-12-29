import { ProcessedItem } from "@/lib/mcdm";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface ResultsTableProps {
  data: ProcessedItem[];
  maxRows?: number;
}

const classBadgeStyles = {
  A: "bg-chart-a/20 text-chart-a border-chart-a/30",
  B: "bg-chart-b/20 text-chart-b border-chart-b/30",
  C: "bg-chart-c/20 text-chart-c border-chart-c/30",
};

export function ResultsTable({ data, maxRows = 20 }: ResultsTableProps) {
  const displayData = data.slice(0, maxRows);

  return (
    <div className="rounded-lg border border-border overflow-hidden">
      <div className="max-h-[500px] overflow-auto">
        <Table>
          <TableHeader className="bg-secondary/50 sticky top-0">
            <TableRow>
              <TableHead className="text-muted-foreground font-semibold">ID</TableHead>
              <TableHead className="text-muted-foreground font-semibold">Risk</TableHead>
              <TableHead className="text-muted-foreground font-semibold">Size</TableHead>
              <TableHead className="text-muted-foreground font-semibold">Unit Cost</TableHead>
              <TableHead className="text-muted-foreground font-semibold text-right">TOPSIS Score</TableHead>
              <TableHead className="text-muted-foreground font-semibold text-center">Class</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {displayData.map((item, index) => (
              <TableRow
                key={item.id}
                className={cn(
                  "transition-colors",
                  index % 2 === 0 ? "bg-card" : "bg-secondary/20"
                )}
              >
                <TableCell className="font-mono text-sm">{item.id}</TableCell>
                <TableCell>
                  <span
                    className={cn(
                      "text-sm",
                      item.Risk === "High" && "text-destructive",
                      item.Risk === "Normal" && "text-chart-warning",
                      item.Risk === "Low" && "text-chart-success"
                    )}
                  >
                    {item.Risk}
                  </span>
                </TableCell>
                <TableCell className="text-sm">{item["Unit size"]}</TableCell>
                <TableCell className="font-mono text-sm">
                  ${item["Unit cost"].toFixed(2)}
                </TableCell>
                <TableCell className="text-right font-mono text-sm font-semibold text-primary">
                  {item.TOPSIS_Score.toFixed(6)}
                </TableCell>
                <TableCell className="text-center">
                  <Badge
                    variant="outline"
                    className={cn("font-bold", classBadgeStyles[item.Class])}
                  >
                    {item.Class}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      {data.length > maxRows && (
        <div className="px-4 py-3 bg-secondary/30 border-t border-border text-sm text-muted-foreground text-center">
          Showing {maxRows} of {data.length} items
        </div>
      )}
    </div>
  );
}
