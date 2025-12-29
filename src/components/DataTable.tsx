import { InventoryItem } from "@/lib/mcdm";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

interface DataTableProps {
  data: InventoryItem[];
  maxRows?: number;
}

export function DataTable({ data, maxRows = 15 }: DataTableProps) {
  const displayData = data.slice(0, maxRows);

  return (
    <div className="rounded-lg border border-border overflow-hidden">
      <div className="max-h-[400px] overflow-auto">
        <Table>
          <TableHeader className="bg-secondary/50 sticky top-0">
            <TableRow>
              <TableHead className="text-muted-foreground font-semibold">ID</TableHead>
              <TableHead className="text-muted-foreground font-semibold">Risk</TableHead>
              <TableHead className="text-muted-foreground font-semibold">Demand</TableHead>
              <TableHead className="text-muted-foreground font-semibold">Avg Stock</TableHead>
              <TableHead className="text-muted-foreground font-semibold">Daily Usage</TableHead>
              <TableHead className="text-muted-foreground font-semibold">Unit Cost</TableHead>
              <TableHead className="text-muted-foreground font-semibold">Lead Time</TableHead>
              <TableHead className="text-muted-foreground font-semibold">Consign.</TableHead>
              <TableHead className="text-muted-foreground font-semibold">Size</TableHead>
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
                <TableCell className="text-sm">{item["Demand fluctuation"]}</TableCell>
                <TableCell className="font-mono text-sm">
                  {item["Average stock"].toFixed(2)}
                </TableCell>
                <TableCell className="font-mono text-sm">
                  {item["Daily usage"].toFixed(2)}
                </TableCell>
                <TableCell className="font-mono text-sm">
                  ${item["Unit cost"].toFixed(2)}
                </TableCell>
                <TableCell className="font-mono text-sm">{item["Lead time"]}d</TableCell>
                <TableCell className="text-sm">{item["Consignment stock"]}</TableCell>
                <TableCell className="text-sm">{item["Unit size"]}</TableCell>
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
