"use client";

import { useState } from "react";
import { Download } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { exportWorkoutsCSV } from "@/server/actions/export";

export function ExportButton() {
  const [busy, setBusy] = useState(false);

  async function run() {
    setBusy(true);
    try {
      const csv = await exportWorkoutsCSV();
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `gymbuddy-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error("Export failed. Try again online.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Button
      size="sm"
      variant="outline"
      onClick={run}
      disabled={busy}
      className="gap-1.5"
    >
      <Download className="size-4" />
      {busy ? "Exporting…" : "Export CSV"}
    </Button>
  );
}
