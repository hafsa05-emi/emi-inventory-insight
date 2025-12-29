import { useState } from "react";
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { ProcessedItem, EntropyWeights } from "@/lib/mcdm";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

interface DetailedResultsTableProps {
  data: ProcessedItem[];
  weights: EntropyWeights;
  maxRows?: number;
}

type SortField = "id" | "TOPSIS_Score" | "Fuzzy_TOPSIS_Score" | "Risk" | "Unit size";
type SortDirection = "asc" | "desc";

export function DetailedResultsTable({
  data,
  weights,
  maxRows = 50,
}: DetailedResultsTableProps) {
  const [sortField, setSortField] = useState<SortField>("TOPSIS_Score");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  const sortedData = [...data].sort((a, b) => {
    let aVal: any = a[sortField];
    let bVal: any = b[sortField];

    if (typeof aVal === "string") {
      aVal = aVal.toLowerCase();
      bVal = bVal.toLowerCase();
    }

    if (sortDirection === "asc") {
      return aVal > bVal ? 1 : -1;
    }
    return aVal < bVal ? 1 : -1;
  });

  const displayData = sortedData.slice(0, maxRows);

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-3 h-3 ml-1 opacity-50" />;
    }
    return sortDirection === "asc" ? (
      <ArrowUp className="w-3 h-3 ml-1 text-primary" />
    ) : (
      <ArrowDown className="w-3 h-3 ml-1 text-primary" />
    );
  };

  const getClassBadge = (cls: "A" | "B" | "C") => {
    const variants: Record<string, string> = {
      A: "bg-chart-a/20 text-chart-a border-chart-a/30",
      B: "bg-chart-b/20 text-chart-b border-chart-b/30",
      C: "bg-chart-c/20 text-chart-c border-chart-c/30",
    };
    return (
      <Badge variant="outline" className={`${variants[cls]} font-mono`}>
        {cls}
      </Badge>
    );
  };

  return (
    <ScrollArea className="h-[450px] rounded-lg border border-border">
      <Table>
        <TableHeader className="sticky top-0 bg-card z-10">
          <TableRow className="border-b border-border hover:bg-transparent">
            <TableHead className="w-16">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleSort("id")}
                className="h-8 px-2 text-xs font-semibold"
              >
                ID
                <SortIcon field="id" />
              </Button>
            </TableHead>
            <TableHead>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleSort("Risk")}
                className="h-8 px-2 text-xs font-semibold"
              >
                Risk
                <SortIcon field="Risk" />
              </Button>
            </TableHead>
            <TableHead>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleSort("Unit size")}
                className="h-8 px-2 text-xs font-semibold"
              >
                Size
                <SortIcon field="Unit size" />
              </Button>
            </TableHead>
            <TableHead className="text-center">
              <span className="text-xs font-semibold">Size Weight</span>
            </TableHead>
            <TableHead>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleSort("TOPSIS_Score")}
                className="h-8 px-2 text-xs font-semibold"
              >
                Crisp Score
                <SortIcon field="TOPSIS_Score" />
              </Button>
            </TableHead>
            <TableHead>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleSort("Fuzzy_TOPSIS_Score")}
                className="h-8 px-2 text-xs font-semibold"
              >
                Fuzzy Score
                <SortIcon field="Fuzzy_TOPSIS_Score" />
              </Button>
            </TableHead>
            <TableHead className="text-center">
              <span className="text-xs font-semibold">Class</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {displayData.map((item, idx) => (
            <TableRow
              key={item.id}
              className={`
                border-b border-border/50 transition-colors
                ${idx % 2 === 0 ? "bg-card" : "bg-secondary/30"}
                hover:bg-primary/5
              `}
            >
              <TableCell className="font-mono text-sm text-muted-foreground">
                #{item.id}
              </TableCell>
              <TableCell>
                <Badge
                  variant="outline"
                  className={`
                    text-xs font-medium
                    ${item.Risk === "High" ? "bg-destructive/20 text-destructive border-destructive/30" : ""}
                    ${item.Risk === "Normal" ? "bg-chart-b/20 text-chart-b border-chart-b/30" : ""}
                    ${item.Risk === "Low" ? "bg-chart-success/20 text-chart-success border-chart-success/30" : ""}
                  `}
                >
                  {item.Risk}
                </Badge>
              </TableCell>
              <TableCell>
                <span className="text-sm text-foreground">{item["Unit size"]}</span>
              </TableCell>
              <TableCell className="text-center">
                <span className="font-mono text-xs text-primary">
                  {(weights.Size_Score * 100).toFixed(2)}%
                </span>
              </TableCell>
              <TableCell>
                <span className="font-mono text-sm text-foreground">
                  {item.TOPSIS_Score.toFixed(4)}
                </span>
              </TableCell>
              <TableCell>
                <span className="font-mono text-sm text-chart-b">
                  {item.Fuzzy_TOPSIS_Score.toFixed(4)}
                </span>
              </TableCell>
              <TableCell className="text-center">
                {getClassBadge(item.Class)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </ScrollArea>
  );
}
