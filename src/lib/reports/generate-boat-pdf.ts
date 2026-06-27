// Client-side only — uses jspdf + jspdf-autotable
export async function generateBoatPdf(): Promise<void> {
  const [{ default: jsPDF }, { default: autoTable }] = await Promise.all([
    import("jspdf"),
    import("jspdf-autotable"),
  ]);

  const res = await fetch("/api/reports/boat-summary");
  if (!res.ok) throw new Error("Failed to load report data");
  const data = await res.json() as {
    generatedAt: string;
    boat: { name: string; type: string | null };
    engineHours: number;
    health: Array<{
      component_name: string;
      system_name: string | null;
      status: string | null;
      predicted_due_date: string | null;
      hours_until_due: number | null;
      months_until_due: number | null;
      risk_score: number | null;
    }>;
    inventory: Array<{
      name: string;
      category: string | null;
      quantity: number;
      minimum_quantity: number | null;
      unit: string | null;
      is_critical: boolean;
      storage_location: string | null;
      manufacturer: string | null;
      sku: string | null;
    }>;
    recentTrips: Array<{
      started_at: string | null;
      ended_at: string | null;
      engine_hours_delta: number | null;
      fuel_added_litres: number | null;
      notes: string | null;
    }>;
  };

  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const margin = 16;
  const col = "#0B7EB8";
  const dark = "#0F2335";
  const muted = "#8593A0";
  const generated = new Date(data.generatedAt).toLocaleDateString(undefined, {
    day: "numeric", month: "long", year: "numeric",
  });

  // ── Header bar ──────────────────────────────────────────────────
  doc.setFillColor(11, 126, 184);
  doc.rect(0, 0, pageW, 22, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.text("NautIQ Boat Report", margin, 14);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(generated, pageW - margin, 14, { align: "right" });

  let y = 30;

  // ── Boat summary ─────────────────────────────────────────────────
  doc.setTextColor(...hexToRgb(dark));
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text(data.boat.name, margin, y);
  y += 6;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...hexToRgb(muted));
  const subtitle = [data.boat.type, `${Math.round(data.engineHours)} engine hours`]
    .filter(Boolean).join("  ·  ");
  doc.text(subtitle, margin, y);
  y += 10;

  // ── Status pills ─────────────────────────────────────────────────
  const overdueCount = data.health.filter(h => (h.status ?? "").toLowerCase() === "overdue").length;
  const dueSoonCount = data.health.filter(h => (h.status ?? "").toLowerCase() === "due soon").length;
  const okCount = data.health.filter(h => (h.status ?? "").toLowerCase() === "ok").length;
  const pills = [
    { label: "Overdue", count: overdueCount, color: "#D83A3A" },
    { label: "Due soon", count: dueSoonCount, color: "#C8841A" },
    { label: "Healthy", count: okCount, color: "#1D9B55" },
    { label: "Inventory items", count: data.inventory.length, color: col },
  ];
  let px = margin;
  for (const p of pills) {
    const rgb = hexToRgb(p.color);
    doc.setFillColor(rgb[0], rgb[1], rgb[2]);
    doc.roundedRect(px, y, 38, 12, 2, 2, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.text(`${p.count}  ${p.label}`, px + 19, y + 7.5, { align: "center" });
    px += 41;
  }
  y += 18;

  // ── Section helper ────────────────────────────────────────────────
  function sectionHeader(title: string) {
    doc.setFillColor(11, 126, 184);
    doc.rect(margin, y, 3, 5, "F");
    doc.setTextColor(...hexToRgb(dark));
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text(title, margin + 5, y + 4);
    y += 8;
  }

  // ── Maintenance schedule ─────────────────────────────────────────
  sectionHeader("Maintenance Schedule");

  if (data.health.length === 0) {
    doc.setFont("helvetica", "italic");
    doc.setFontSize(9);
    doc.setTextColor(...hexToRgb(muted));
    doc.text("No components added yet.", margin, y);
    y += 8;
  } else {
    const statusColor = (s: string | null) => {
      const v = (s ?? "").toLowerCase();
      if (v === "overdue") return [216, 58, 58] as [number, number, number];
      if (v === "due soon") return [200, 132, 26] as [number, number, number];
      if (v === "ok") return [29, 155, 85] as [number, number, number];
      return [133, 147, 160] as [number, number, number];
    };
    const statusLabel = (s: string | null) => {
      const v = (s ?? "").toLowerCase();
      if (v === "overdue") return "Overdue";
      if (v === "due soon") return "Due soon";
      if (v === "ok") return "OK";
      return "Unknown";
    };
    const formatDate = (d: string | null) =>
      d ? new Date(d).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" }) : "—";

    autoTable(doc, {
      startY: y,
      margin: { left: margin, right: margin },
      head: [["Component", "System", "Status", "Predicted Due", "Hours Until Due"]],
      body: data.health.map(h => [
        h.component_name,
        h.system_name ?? "—",
        statusLabel(h.status),
        formatDate(h.predicted_due_date),
        h.hours_until_due != null ? Math.round(h.hours_until_due).toString() : "—",
      ]),
      styles: { fontSize: 8, cellPadding: 2.5 },
      headStyles: { fillColor: [11, 126, 184], textColor: 255, fontStyle: "bold", fontSize: 8 },
      columnStyles: { 0: { fontStyle: "bold" } },
      didParseCell: (hookData) => {
        if (hookData.section === "body" && hookData.column.index === 2) {
          const status = data.health[hookData.row.index]?.status ?? null;
          const [r, g, b] = statusColor(status);
          hookData.cell.styles.textColor = [r, g, b];
          hookData.cell.styles.fontStyle = "bold";
        }
      },
    });
    y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8;
  }

  // ── Inventory ─────────────────────────────────────────────────────
  if (y > 230) { doc.addPage(); y = 20; }
  sectionHeader("Inventory");

  if (data.inventory.length === 0) {
    doc.setFont("helvetica", "italic");
    doc.setFontSize(9);
    doc.setTextColor(...hexToRgb(muted));
    doc.text("No inventory items.", margin, y);
    y += 8;
  } else {
    autoTable(doc, {
      startY: y,
      margin: { left: margin, right: margin },
      head: [["Item", "Category", "Qty", "Min", "Unit", "Location", "Critical"]],
      body: data.inventory.map(i => [
        i.name,
        i.category ?? "—",
        String(i.quantity),
        i.minimum_quantity != null ? String(i.minimum_quantity) : "—",
        i.unit ?? "—",
        i.storage_location ?? "—",
        i.is_critical ? "Yes" : "",
      ]),
      styles: { fontSize: 8, cellPadding: 2.5 },
      headStyles: { fillColor: [11, 126, 184], textColor: 255, fontStyle: "bold", fontSize: 8 },
      columnStyles: { 0: { fontStyle: "bold" } },
      didParseCell: (hookData) => {
        if (hookData.section === "body" && hookData.column.index === 6 && hookData.cell.text[0] === "Yes") {
          hookData.cell.styles.textColor = [216, 58, 58];
          hookData.cell.styles.fontStyle = "bold";
        }
        // Highlight low stock rows
        if (hookData.section === "body") {
          const item = data.inventory[hookData.row.index];
          if (item && item.minimum_quantity != null && item.quantity < item.minimum_quantity) {
            hookData.cell.styles.fillColor = [253, 240, 240];
          }
        }
      },
    });
    y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8;
  }

  // ── Recent trips ─────────────────────────────────────────────────
  if (data.recentTrips.length > 0) {
    if (y > 230) { doc.addPage(); y = 20; }
    sectionHeader("Recent Trips (last 10)");
    autoTable(doc, {
      startY: y,
      margin: { left: margin, right: margin },
      head: [["Date", "Engine hrs", "Fuel (L)", "Notes"]],
      body: data.recentTrips.map(t => {
        const date = t.started_at
          ? new Date(t.started_at).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })
          : "—";
        return [date, t.engine_hours_delta != null ? t.engine_hours_delta.toFixed(1) : "—", t.fuel_added_litres != null ? t.fuel_added_litres.toFixed(0) : "—", t.notes ?? ""];
      }),
      styles: { fontSize: 8, cellPadding: 2.5 },
      headStyles: { fillColor: [11, 126, 184], textColor: 255, fontStyle: "bold", fontSize: 8 },
    });
  }

  // ── Footer on all pages ───────────────────────────────────────────
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(...hexToRgb(muted));
    doc.text(`NautIQ  ·  Page ${i} of ${pageCount}`, pageW / 2, doc.internal.pageSize.getHeight() - 6, { align: "center" });
  }

  const filename = `${data.boat.name.replace(/\s+/g, "-")}-report-${new Date().toISOString().slice(0, 10)}.pdf`;
  doc.save(filename);
}

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}
