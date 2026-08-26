// Client-side only — uses jspdf + jspdf-autotable
import { formatDate } from "@/lib/format-date";

// ── V2 palette ────────────────────────────────────────────────────────────────
const NAVY   = "#0B2942";
const AMBER  = "#FFC730";
const CYAN   = "#0B7EB8";
const MUTED  = "#8FB3CC";
const BG     = "#F4F7FA";
const BORDER = "#DBE3EA";

function rgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  return [parseInt(h.slice(0,2),16), parseInt(h.slice(2,4),16), parseInt(h.slice(4,6),16)];
}

/** Draw the NautIQ anchor icon at (cx, cy) with the given radius for the icon box. */
function drawAnchorIcon(doc: import("jspdf").jsPDF, cx: number, cy: number, size: number) {
  const s = size / 100; // scale factor (icon viewBox is 0 0 100 100)

  // Amber dot at top
  doc.setFillColor(...rgb(AMBER));
  doc.circle(cx, cy - 32 * s, 9 * s, "F");

  // White stroke for stem, crossbar, arc
  doc.setDrawColor(255, 255, 255);
  doc.setLineWidth(7 * s);
  doc.setLineCap("round");

  // Vertical stem
  doc.line(cx, cy - 23 * s, cx, cy + 34 * s);
  // Crossbar
  doc.line(cx - 24 * s, cy - 7 * s, cx + 24 * s, cy - 7 * s);

  // Curved base — approximate bezier with lines
  const steps = 20;
  const pts: [number, number][] = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    // Cubic bezier: M16,56 C16,76 32,86 50,86 C68,86 84,76 84,56
    // Split into two halves: left (0→0.5) and right (0.5→1)
    let bx: number, by: number;
    if (t <= 0.5) {
      const tt = t * 2;
      bx = (1-tt)**3*16 + 3*(1-tt)**2*tt*16 + 3*(1-tt)*tt**2*32 + tt**3*50;
      by = (1-tt)**3*56 + 3*(1-tt)**2*tt*76 + 3*(1-tt)*tt**2*86 + tt**3*86;
    } else {
      const tt = (t - 0.5) * 2;
      bx = (1-tt)**3*50 + 3*(1-tt)**2*tt*68 + 3*(1-tt)*tt**2*84 + tt**3*84;
      by = (1-tt)**3*86 + 3*(1-tt)**2*tt*86 + 3*(1-tt)*tt**2*76 + tt**3*56;
    }
    // map from viewBox coords (0-100, centred at 50,50) to page coords
    pts.push([cx + (bx - 50) * s, cy + (by - 50) * s]);
  }
  for (let i = 0; i < pts.length - 1; i++) {
    doc.line(pts[i][0], pts[i][1], pts[i+1][0], pts[i+1][1]);
  }
}

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
    maintenanceHistory: Array<{
      performed_at: string | null;
      work_done: string | null;
      vendor: string | null;
      engine_hours_at_service: number | null;
      notes: string | null;
      components: { name: string } | null;
    }>;
  };

  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const margin = 16;
  const generated = new Date(data.generatedAt).toLocaleDateString(undefined, {
    day: "numeric", month: "long", year: "numeric",
  });

  // ── Header bar ────────────────────────────────────────────────────────────
  const headerH = 26;
  doc.setFillColor(...rgb(NAVY));
  doc.rect(0, 0, pageW, headerH, "F");

  // Anchor icon
  drawAnchorIcon(doc, margin + 7, headerH / 2 + 1, 14);

  // "Naut" in white
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  const nautW = doc.getTextWidth("Naut");
  doc.text("Naut", margin + 17, headerH / 2 + 2);

  // "IQ" in amber
  doc.setTextColor(...rgb(AMBER));
  doc.text("IQ", margin + 17 + nautW, headerH / 2 + 2);

  // Generated date right-aligned
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...rgb(MUTED));
  doc.text(generated, pageW - margin, headerH / 2 + 2, { align: "right" });

  let y = headerH + 10;

  // ── Boat summary ──────────────────────────────────────────────────────────
  doc.setTextColor(...rgb(NAVY));
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text(data.boat.name, margin, y);
  y += 6;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...rgb(MUTED));
  const subtitle = [data.boat.type, `${Math.round(data.engineHours)} engine hours`]
    .filter(Boolean).join("  ·  ");
  doc.text(subtitle, margin, y);
  y += 10;

  // ── Stat pills ────────────────────────────────────────────────────────────
  const overdueCount  = data.health.filter(h => (h.status ?? "").toLowerCase() === "overdue").length;
  const dueSoonCount  = data.health.filter(h => (h.status ?? "").toLowerCase() === "due soon").length;
  const okCount       = data.health.filter(h => (h.status ?? "").toLowerCase() === "ok").length;
  const pills = [
    { label: "Overdue",         count: overdueCount,        bg: "#FDECEA", fg: "#E0342A" },
    { label: "Due soon",        count: dueSoonCount,        bg: "#FFF6DF", fg: "#D9A300" },
    { label: "Healthy",         count: okCount,             bg: "#E6F6EC", fg: "#0E7A3D" },
    { label: "Inventory items", count: data.inventory.length, bg: "#EBF4FA", fg: CYAN    },
  ];
  let px = margin;
  for (const p of pills) {
    doc.setFillColor(...rgb(p.bg));
    doc.setDrawColor(...rgb(BORDER));
    doc.setLineWidth(0.3);
    doc.roundedRect(px, y, 40, 13, 2, 2, "FD");
    doc.setTextColor(...rgb(p.fg));
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text(String(p.count), px + 20, y + 6.5, { align: "center" });
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.5);
    doc.setTextColor(...rgb(MUTED));
    doc.text(p.label.toUpperCase(), px + 20, y + 11, { align: "center" });
    px += 43;
  }
  y += 20;

  // ── Amber divider ─────────────────────────────────────────────────────────
  doc.setFillColor(...rgb(AMBER));
  doc.rect(margin, y, pageW - margin * 2, 1, "F");
  y += 5;

  // ── Section heading helper ────────────────────────────────────────────────
  function sectionHeader(title: string) {
    if (y > 240) { doc.addPage(); y = 20; }
    doc.setFillColor(...rgb(AMBER));
    doc.rect(margin, y, 3, 5.5, "F");
    doc.setTextColor(...rgb(NAVY));
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text(title, margin + 6, y + 4.5);
    y += 10;
  }

  // ── Table defaults ────────────────────────────────────────────────────────
  const tableHead = { fillColor: rgb(NAVY), textColor: [255,255,255] as [number,number,number], fontStyle: "bold" as const, fontSize: 8 };
  const tableStyle = { fontSize: 8, cellPadding: 2.5 };

  // ── Maintenance schedule ──────────────────────────────────────────────────
  sectionHeader("Maintenance Schedule");

  if (data.health.length === 0) {
    doc.setFont("helvetica", "italic");
    doc.setFontSize(9);
    doc.setTextColor(...rgb(MUTED));
    doc.text("No components added yet.", margin, y);
    y += 8;
  } else {
    const statusColor = (s: string | null): [number,number,number] => {
      const v = (s ?? "").toLowerCase();
      if (v === "overdue")  return rgb("#E0342A");
      if (v === "due soon") return rgb("#D9A300");
      if (v === "ok")       return rgb("#0E7A3D");
      return rgb(MUTED);
    };
    const statusLabel = (s: string | null) => {
      const v = (s ?? "").toLowerCase();
      if (v === "overdue")  return "Overdue";
      if (v === "due soon") return "Due soon";
      if (v === "ok")       return "OK";
      return "Unknown";
    };
    autoTable(doc, {
      startY: y,
      margin: { left: margin, right: margin },
      head: [["Component", "System", "Status", "Predicted Due", "Hrs Until Due"]],
      body: data.health.map(h => [
        h.component_name,
        h.system_name ?? "—",
        statusLabel(h.status),
        formatDate(h.predicted_due_date),
        h.hours_until_due != null ? Math.round(h.hours_until_due).toString() : "—",
      ]),
      styles: tableStyle,
      headStyles: tableHead,
      columnStyles: { 0: { fontStyle: "bold" } },
      alternateRowStyles: { fillColor: rgb(BG) },
      didParseCell: (hookData) => {
        if (hookData.section === "body" && hookData.column.index === 2) {
          const [r,g,b2] = statusColor(data.health[hookData.row.index]?.status ?? null);
          hookData.cell.styles.textColor = [r,g,b2];
          hookData.cell.styles.fontStyle = "bold";
        }
      },
    });
    y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;
  }

  // ── Inventory ─────────────────────────────────────────────────────────────
  sectionHeader("Inventory");

  if (data.inventory.length === 0) {
    doc.setFont("helvetica", "italic");
    doc.setFontSize(9);
    doc.setTextColor(...rgb(MUTED));
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
      styles: tableStyle,
      headStyles: tableHead,
      columnStyles: { 0: { fontStyle: "bold" } },
      alternateRowStyles: { fillColor: rgb(BG) },
      didParseCell: (hookData) => {
        if (hookData.section === "body" && hookData.column.index === 6 && hookData.cell.text[0] === "Yes") {
          hookData.cell.styles.textColor = rgb("#E0342A");
          hookData.cell.styles.fontStyle = "bold";
        }
        if (hookData.section === "body") {
          const item = data.inventory[hookData.row.index];
          if (item?.minimum_quantity != null && item.quantity < item.minimum_quantity) {
            hookData.cell.styles.fillColor = rgb("#FDECEA");
          }
        }
      },
    });
    y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;
  }

  // ── Recent trips ──────────────────────────────────────────────────────────
  if (data.recentTrips.length > 0) {
    sectionHeader("Recent Trips (last 10)");
    autoTable(doc, {
      startY: y,
      margin: { left: margin, right: margin },
      head: [["Date", "Engine hrs", "Fuel (L)", "Notes"]],
      body: data.recentTrips.map(t => [
        t.started_at
          ? new Date(t.started_at).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })
          : "—",
        t.engine_hours_delta != null ? t.engine_hours_delta.toFixed(1) : "—",
        t.fuel_added_litres  != null ? t.fuel_added_litres.toFixed(0)  : "—",
        t.notes ?? "",
      ]),
      styles: tableStyle,
      headStyles: tableHead,
      alternateRowStyles: { fillColor: rgb(BG) },
    });
    y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;
  }

  // ── Maintenance history ───────────────────────────────────────────────────
  if (data.maintenanceHistory.length > 0) {
    sectionHeader("Maintenance History (last 50)");
    autoTable(doc, {
      startY: y,
      margin: { left: margin, right: margin },
      head: [["Date", "Component", "Work Done", "Engine hrs", "Vendor"]],
      body: data.maintenanceHistory.map(m => [
        m.performed_at
          ? new Date(m.performed_at).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })
          : "—",
        m.components?.name ?? "—",
        m.work_done ?? "—",
        m.engine_hours_at_service != null ? m.engine_hours_at_service.toFixed(1) : "—",
        m.vendor ?? "—",
      ]),
      styles: tableStyle,
      headStyles: tableHead,
      columnStyles: { 2: { cellWidth: 60 } },
      alternateRowStyles: { fillColor: rgb(BG) },
    });
  }

  // ── Footer on every page ──────────────────────────────────────────────────
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    const pageH = doc.internal.pageSize.getHeight();

    // Thin amber footer rule
    doc.setFillColor(...rgb(AMBER));
    doc.rect(0, pageH - 10, pageW, 0.5, "F");

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(...rgb(MUTED));
    doc.text(`NautIQ  ·  ${data.boat.name}  ·  Page ${i} of ${pageCount}`, pageW / 2, pageH - 5, { align: "center" });
  }

  const filename = `${data.boat.name.replace(/\s+/g, "-")}-report-${new Date().toISOString().slice(0, 10)}.pdf`;
  doc.save(filename);
}
