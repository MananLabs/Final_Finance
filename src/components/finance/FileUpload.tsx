import { useRef, useState } from "react";
import * as XLSX from "xlsx";
import Papa from "papaparse";
import { Upload, FileSpreadsheet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cleanRows, type Transaction } from "@/lib/finance";
import { toast } from "sonner";

interface Props {
  onLoaded: (txns: Transaction[], filename: string) => void;
}

export function FileUpload({ onLoaded }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [busy, setBusy] = useState(false);

  const handleFile = async (file: File) => {
    setBusy(true);
    try {
      let rows: Record<string, unknown>[] = [];
      const ext = file.name.split(".").pop()?.toLowerCase();
      if (ext === "csv") {
        const text = await file.text();
        const parsed = Papa.parse<Record<string, unknown>>(text, {
          header: true,
          skipEmptyLines: true,
        });
        rows = parsed.data;
      } else if (ext === "xlsx" || ext === "xls") {
        const buf = await file.arrayBuffer();
        const wb = XLSX.read(buf, { type: "array", cellDates: true });
        const sheet = wb.Sheets[wb.SheetNames[0]];
        rows = XLSX.utils.sheet_to_json(sheet, { defval: "" });
      } else {
        toast.error("Unsupported file. Use CSV or Excel.");
        return;
      }

      const { txns, skipped } = cleanRows(rows);
      if (txns.length === 0) {
        toast.error("No valid rows found. Check columns: Date, Type, Amount, Category.");
        return;
      }
      if (skipped > 0) {
        toast.warning(`${skipped} row(s) skipped due to invalid data.`);
      }
      toast.success(`Loaded ${txns.length} transactions.`);
      onLoaded(txns, file.name);
    } catch (e) {
      console.error(e);
      toast.error("Failed to parse file.");
    } finally {
      setBusy(false);
    }
  };

  const loadSample = () => {
    const today = new Date();
    const txns: Transaction[] = [];
    const cats = { rev: ["Subscriptions", "Services", "Consulting"], exp: ["Salaries", "Marketing", "Tools", "Office"] };
    for (let i = 5; i >= 0; i--) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const baseR = 150000 + i * 8000 + Math.random() * 20000;
      const baseE = 170000 + i * 5000 + Math.random() * 15000;
      cats.rev.forEach((c, j) => {
        txns.push({
          date: new Date(d.getFullYear(), d.getMonth(), 5 + j * 3).toISOString().slice(0, 10),
          type: "Revenue",
          amount: Math.round(baseR / 3),
          category: c,
        });
      });
      cats.exp.forEach((c, j) => {
        txns.push({
          date: new Date(d.getFullYear(), d.getMonth(), 7 + j * 2).toISOString().slice(0, 10),
          type: "Expense",
          amount: Math.round(baseE / 4),
          category: c,
        });
      });
    }
    toast.success("Loaded sample data.");
    onLoaded(txns, "sample-data.csv");
  };

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragOver(false);
        const f = e.dataTransfer.files?.[0];
        if (f) handleFile(f);
      }}
      className={`relative rounded-2xl border-2 border-dashed bg-card p-10 text-center transition-all ${
        dragOver ? "border-primary bg-accent/40" : "border-border"
      }`}
    >
      <div className="flex flex-col items-center gap-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Upload className="h-7 w-7" />
        </div>
        <div>
          <h3 className="text-lg font-semibold">Upload financial data</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            CSV or Excel with columns: <span className="font-mono">Date, Type, Amount, Category</span>
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Button onClick={() => inputRef.current?.click()} disabled={busy}>
            <FileSpreadsheet className="mr-2 h-4 w-4" />
            {busy ? "Processing..." : "Choose file"}
          </Button>
          <Button variant="outline" onClick={loadSample} disabled={busy}>
            Try sample data
          </Button>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept=".csv,.xlsx,.xls"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleFile(f);
            e.target.value = "";
          }}
        />
      </div>
    </div>
  );
}
