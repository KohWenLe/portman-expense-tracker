import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useStore } from "@/lib/store";
import { useToast } from "@/components/Toast";
import { CATEGORIES, ExpenseCategory, ParsedTransaction } from "@/lib/mock-data";
import { formatRM, formatDate } from "@/lib/format";
import { UploadCloud, Loader2, FileText, RotateCcw } from "lucide-react";

export const Route = createFileRoute("/import")({
  head: () => ({ meta: [{ title: "PDF Import — ExpenseTrack" }] }),
  component: ImportPage,
});

function ImportPage() {
  const { projects, addExpenses, parsePDF } = useStore();
  const toast = useToast();
  const fileRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [pid, setPid] = useState<string>(projects[0]?.id ?? "");
  const [parsing, setParsing] = useState(false);
  const [parsed, setParsed] = useState<ParsedTransaction[] | null>(null);
  const [importing, setImporting] = useState(false);
  const [alreadyImported, setAlreadyImported] = useState(false);

  useEffect(() => {
    if (!pid && projects.length > 0) {
      setPid(projects[0].id);
    }
  }, [pid, projects]);

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f && f.type === "application/pdf") setFile(f);
  };

  const parsePdf = async () => {
    if (!file || !pid) return;
    setParsing(true);
    try {
      const result = await parsePDF(file);
      setAlreadyImported(result.alreadyImported);
      setParsed(result.transactions.map((t) => ({ ...t })));
    } finally {
      setParsing(false);
    }
  };

  const reset = () => { setFile(null); setParsed(null); setAlreadyImported(false); if (fileRef.current) fileRef.current.value = ""; };

  const projectName = projects.find((p) => p.id === pid)?.name ?? "";

  const importSelected = async () => {
    if (!parsed) return;
    const sel = parsed.filter((t) => t.selected);
    if (sel.length === 0) { toast("error", "Select at least one transaction"); return; }
    setImporting(true);
    const savedCount = await addExpenses(pid, sel.map((t) => ({
      projectId: pid,
      date: t.date,
      description: t.description,
      amount: t.amount,
      currency: t.currency,
      amountRM: t.amountRM,
      category: t.category,
      isClaimed: false,
      source: "PDF" as const,
      sourceReference: file?.name,
    })), file?.name ?? "uploaded_statement.pdf");
    const skippedCount = sel.length - savedCount;
    if (savedCount === 0 && skippedCount > 0) {
      toast("success", `No new transactions imported to ${projectName}. ${skippedCount} duplicate${skippedCount > 1 ? "s were" : " was"} skipped.`);
    } else if (skippedCount > 0) {
      toast("success", `${savedCount} transaction${savedCount > 1 ? "s" : ""} imported to ${projectName}. ${skippedCount} duplicate${skippedCount > 1 ? "s were" : " was"} skipped.`);
    } else {
      toast("success", `${savedCount} transaction${savedCount > 1 ? "s" : ""} imported to ${projectName}`);
    }
    setImporting(false);
    reset();
  };

  return (
    <div className="px-8 py-8">
      <header className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">PDF Import</h1>
        <p className="text-sm text-muted-foreground">Upload a credit card statement to extract expenses automatically.</p>
      </header>

      {!parsed && (
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <div
            onDrop={onDrop}
            onDragOver={(e) => e.preventDefault()}
            onClick={() => fileRef.current?.click()}
            className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-border bg-muted/30 px-6 py-16 text-center transition hover:border-primary hover:bg-accent/50"
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
              <UploadCloud className="h-7 w-7" />
            </div>
            <p className="mt-4 text-sm font-medium">
              {file ? file.name : "Drop your credit card statement PDF here, or click to browse"}
            </p>
            {file ? (
              <p className="mt-1 text-xs text-muted-foreground">{(file.size / 1024).toFixed(1)} KB</p>
            ) : (
              <p className="mt-1 text-xs text-muted-foreground">Only .pdf files are accepted</p>
            )}
            <input
              ref={fileRef}
              type="file"
              accept="application/pdf"
              className="hidden"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
          </div>

          <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="block">
              <span className="mb-1 block text-sm font-medium">Assign to Project <span className="text-destructive">*</span></span>
              <select value={pid} onChange={(e) => setPid(e.target.value)} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </label>
            <div className="flex items-end justify-end">
              <button
                onClick={parsePdf}
                disabled={!file || !pid || parsing}
                className="inline-flex items-center gap-2 rounded-md bg-primary px-5 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {parsing && <Loader2 className="h-4 w-4 animate-spin" />}
                {parsing ? "Parsing..." : "Parse PDF"}
              </button>
            </div>
          </div>
        </div>
      )}

      {parsed && (
        <div className="rounded-xl border border-border bg-card shadow-sm">
          {alreadyImported && (
            <div className="mx-6 mt-5 rounded-md border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              This statement has been imported before - duplicates will be skipped automatically.
            </div>
          )}
          <div className="flex items-center justify-between border-b border-border px-6 py-4">
            <div>
              <h2 className="font-semibold">Found {parsed.length} transactions — review and select which to import</h2>
              <p className="text-xs text-muted-foreground mt-0.5 inline-flex items-center gap-1">
                <FileText className="h-3.5 w-3.5" /> {file?.name} → {projectName}
              </p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setParsed((p) => p?.map((t) => ({ ...t, selected: true })) ?? null)} className="text-sm text-primary hover:underline">Select All</button>
              <span className="text-muted-foreground">·</span>
              <button onClick={() => setParsed((p) => p?.map((t) => ({ ...t, selected: false })) ?? null)} className="text-sm text-primary hover:underline">Deselect All</button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-border bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="w-10 px-3 py-3"></th>
                  <th className="px-3 py-3 text-left">Date</th>
                  <th className="px-3 py-3 text-left">Description</th>
                  <th className="px-3 py-3 text-right">Amount (RM)</th>
                  <th className="px-3 py-3 text-left">Original</th>
                  <th className="px-3 py-3 text-right">FX Rate</th>
                  <th className="px-3 py-3 text-left">Category</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {parsed.map((t) => (
                  <tr key={t.id} className={t.selected ? "" : "opacity-50"}>
                    <td className="px-3 py-3">
                      <input
                        type="checkbox"
                        checked={t.selected}
                        onChange={() => setParsed((p) => p?.map((x) => x.id === t.id ? { ...x, selected: !x.selected } : x) ?? null)}
                        className="h-4 w-4 rounded"
                      />
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap text-muted-foreground">{formatDate(t.date)}</td>
                    <td className="px-3 py-3 font-medium">{t.description}</td>
                    <td className="px-3 py-3 text-right font-semibold tabular-nums">{formatRM(t.amountRM)}</td>
                    <td className="px-3 py-3 text-xs text-muted-foreground">
                      {t.currency !== "MYR" ? (
                        <span className="inline-flex items-center rounded bg-amber-50 px-1.5 py-0.5 ring-1 ring-amber-600/20 text-amber-800">
                          {t.currency} {t.amount.toFixed(2)}
                        </span>
                      ) : "—"}
                    </td>
                    <td className="px-3 py-3 text-right text-xs text-muted-foreground tabular-nums">
                      {t.exchangeRate ? t.exchangeRate.toFixed(2) : "—"}
                    </td>
                    <td className="px-3 py-3">
                      <select
                        value={t.category}
                        onChange={(e) => setParsed((p) => p?.map((x) => x.id === t.id ? { ...x, category: e.target.value as ExpenseCategory } : x) ?? null)}
                        className="rounded-md border border-input bg-background px-2 py-1 text-sm"
                      >
                        {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between border-t border-border px-6 py-4">
            <button onClick={reset} className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-4 py-2 text-sm font-medium hover:bg-muted">
              <RotateCcw className="h-4 w-4" /> Start Over
            </button>
            <button
              onClick={importSelected}
              disabled={importing}
              className="inline-flex items-center gap-2 rounded-md bg-primary px-5 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
            >
              {importing && <Loader2 className="h-4 w-4 animate-spin" />}
              Import {parsed.filter((t) => t.selected).length} selected transactions
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
