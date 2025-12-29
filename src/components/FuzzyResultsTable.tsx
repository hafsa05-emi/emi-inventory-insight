import { ProcessedItem } from "@/lib/mcdm";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

interface FuzzyResultsTableProps {
  data: ProcessedItem[];
}

export function FuzzyResultsTable({ data }: FuzzyResultsTableProps) {
  return (
    <div className="rounded-lg border border-border overflow-hidden">
      <Table>
        <TableHeader className="bg-secondary/50">
          <TableRow>
            <TableHead className="text-muted-foreground font-semibold">#</TableHead>
            <TableHead className="text-muted-foreground font-semibold">Risk</TableHead>
            <TableHead className="text-muted-foreground font-semibold">Demand Fluctuation</TableHead>
            <TableHead className="text-muted-foreground font-semibold">Unit Size</TableHead>
            <TableHead className="text-muted-foreground font-semibold text-right">
              Fuzzy TOPSIS Score
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((item, index) => (
            <TableRow
              key={item.id}
              className={cn(
                "transition-colors",
                index % 2 === 0 ? "bg-card" : "bg-secondary/20"
              )}
            >
              <TableCell className="font-mono text-sm">{index + 1}</TableCell>
              <TableCell>
                <span
                  className={cn(
                    "text-sm font-medium",
                    item.Risk === "High" && "text-destructive",
                    item.Risk === "Normal" && "text-chart-warning",
                    item.Risk === "Low" && "text-chart-success"
                  )}
                >
                  {item.Risk}
                </span>
              </TableCell>
              <TableCell className="text-sm">{item["Demand fluctuation"]}</TableCell>
              <TableCell className="text-sm">{item["Unit size"]}</TableCell>
              <TableCell className="text-right font-mono text-sm font-semibold text-primary">
                {(item.Fuzzy_TOPSIS_Score || 0).toFixed(6)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
