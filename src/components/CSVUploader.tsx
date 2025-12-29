import { useCallback, useState } from "react";
import { Upload, FileSpreadsheet, X, CheckCircle } from "lucide-react";
import Papa from "papaparse";
import { InventoryItem } from "@/lib/mcdm";
import { Button } from "@/components/ui/button";

interface CSVUploaderProps {
  onDataLoaded: (data: InventoryItem[]) => void;
}

export function CSVUploader({ onDataLoaded }: CSVUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFile = useCallback(
    (file: File) => {
      setError(null);
      setFileName(file.name);

      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          try {
            const data = results.data.map((row: any, idx) => ({
              id: idx + 1,
              Risk: row.Risk?.trim() || "Normal",
              "Demand fluctuation": row["Demand fluctuation"]?.trim() || "Stable",
              "Average stock": parseFloat(row["Average stock"]) || 0,
              "Daily usage": parseFloat(row["Daily usage"]) || 0,
              "Unit cost": parseFloat(row["Unit cost"]) || 0,
              "Lead time": parseInt(row["Lead time"]) || 0,
              "Consignment stock": row["Consignment stock"]?.trim() || "No",
              "Unit size": row["Unit size"]?.trim() || "Medium",
            })) as InventoryItem[];

            onDataLoaded(data);
          } catch (err) {
            setError("Failed to parse CSV. Please check the format.");
          }
        },
        error: () => {
          setError("Failed to read file.");
        },
      });
    },
    [onDataLoaded]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file && file.name.endsWith(".csv")) {
        handleFile(file);
      } else {
        setError("Please upload a CSV file.");
      }
    },
    [handleFile]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleClick = useCallback(() => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".csv";
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) handleFile(file);
    };
    input.click();
  }, [handleFile]);

  const handleClear = useCallback(() => {
    setFileName(null);
    setError(null);
  }, []);

  return (
    <div className="w-full">
      <div
        className={`
          relative border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
          transition-all duration-300 ease-out
          ${isDragging 
            ? "border-primary bg-primary/10 scale-[1.02]" 
            : "border-border hover:border-primary/50 hover:bg-secondary/50"
          }
          ${fileName ? "bg-primary/5 border-primary/30" : ""}
        `}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={!fileName ? handleClick : undefined}
      >
        {!fileName ? (
          <div className="space-y-4">
            <div className="mx-auto w-16 h-16 rounded-full bg-secondary flex items-center justify-center">
              <Upload className="w-8 h-8 text-primary" />
            </div>
            <div>
              <p className="text-lg font-medium text-foreground">
                Drop your CSV file here
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                or click to browse
              </p>
            </div>
            <p className="text-xs text-muted-foreground">
              Expected columns: Risk, Demand fluctuation, Average stock, Daily usage, Unit cost, Lead time, Consignment stock, Unit size
            </p>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center">
                <FileSpreadsheet className="w-6 h-6 text-primary" />
              </div>
              <div className="text-left">
                <p className="font-medium text-foreground">{fileName}</p>
                <p className="text-sm text-primary flex items-center gap-1">
                  <CheckCircle className="w-4 h-4" />
                  Loaded successfully
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation();
                handleClear();
              }}
              className="hover:bg-destructive/20"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        )}
      </div>
      {error && (
        <p className="mt-2 text-sm text-destructive flex items-center gap-1">
          <X className="w-4 h-4" />
          {error}
        </p>
      )}
    </div>
  );
}
