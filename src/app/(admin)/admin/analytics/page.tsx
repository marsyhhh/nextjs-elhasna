"use client";

import { useState, useEffect, useMemo, useTransition } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { formatPrice } from "@/lib/utils";
import {
  DollarSign,
  Package,
  TrendingUp,
  FileDown,
  Printer,
} from "lucide-react";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

type FilterType = "date" | "week" | "month";

interface ExportRow {
  tanggal: string;
  noPesanan: string;
  pelanggan: string;
  mataUang: string;
  subTotal: number;
  diskon: number;
  totalPenjualan: number;
  pembayaran: number;
  lunas: boolean;
}

function pad(n: number): string {
  return n.toString().padStart(2, "0");
}

function formatPrintTime(d: Date): string {
  const days = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];
  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  return `${pad(d.getHours())}:${pad(d.getMinutes())}   ${pad(d.getDate())} ${months[d.getMonth()]}, ${d.getFullYear()}`;
}

function formatDateRangeHeader(start: Date, end: Date): string {
  const days = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];
  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  const fmt = (d: Date) =>
    `${days[d.getDay()]}, ${months[d.getMonth()]} ${pad(d.getDate())}, ${d.getFullYear()}`;
  return `${fmt(start)} - ${fmt(end)}`;
}

function formatTanggal(d: Date): string {
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
}

function formatNumber(n: number): string {
  return n.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function getWeekDateRange(val: string): { start: Date; end: Date } | null {
  const m = val.match(/^(\d{4})-W(\d{2})$/);
  if (!m) return null;
  const year = Number(m[1]);
  const week = Number(m[2]);
  const jan4 = new Date(year, 0, 4);
  const dayOffset = (jan4.getDay() + 6) % 7;
  const ms = jan4.getTime() - dayOffset * 86400000 + (week - 1) * 7 * 86400000;
  const monday = new Date(ms);
  monday.setHours(0, 0, 0, 0);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);
  return { start: monday, end: sunday };
}

function getMonthDateRange(val: string): { start: Date; end: Date } | null {
  const m = val.match(/^(\d{4})-(\d{2})$/);
  if (!m) return null;
  const year = Number(m[1]);
  const month = Number(m[2]) - 1;
  const start = new Date(year, month, 1);
  const end = new Date(year, month + 1, 0, 23, 59, 59, 999);
  return { start, end };
}

function getDefaultWeek(): string {
  const now = new Date();
  const jan4 = new Date(now.getFullYear(), 0, 4);
  const dayOffset = (jan4.getDay() + 6) % 7;
  const ms = now.getTime() - jan4.getTime() + dayOffset * 86400000;
  const week = Math.ceil(ms / (7 * 86400000));
  return `${now.getFullYear()}-W${pad(week)}`;
}

function getDefaultMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}`;
}

function getTodayISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

const statusLabels: Record<string, string> = {
  PENDING_PAYMENT: "Belum Dibayar",
  PROCESSING: "Diproses",
  SHIPPED: "Dikirim",
  DELIVERED: "Selesai",
  CANCELLED: "Dibatalkan",
}

export default function AnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    averageOrderValue: 0,
    dailyRevenue: 0,
    weeklyRevenue: 0,
    monthlyRevenue: 0,
    ordersByStatus: {} as Record<string, number>,
    monthlySummary: [] as { month: string; orders: number; revenue: number; discount: number; shipping: number }[],
    paymentSummary: [] as { method: string; orders: number; total: number }[],
    allOrders: [] as any[],
  });

  const [filterType, setFilterType] = useState<FilterType>("date");
  const [startDate, setStartDate] = useState(getTodayISO());
  const [endDate, setEndDate] = useState(getTodayISO());
  const [selectedWeek, setSelectedWeek] = useState(getDefaultWeek());
  const [selectedMonth, setSelectedMonth] = useState(getDefaultMonth());
  const [isPending, startTransition] = useTransition();

  const [chartFilter, setChartFilter] = useState<"7d" | "1m" | "date" | "week" | "month">("7d");
  const [chartStartDate, setChartStartDate] = useState(getTodayISO());
  const [chartEndDate, setChartEndDate] = useState(getTodayISO());
  const [chartWeek, setChartWeek] = useState(getDefaultWeek());
  const [chartMonth, setChartMonth] = useState(getDefaultMonth());

  const chartData = useMemo(() => {
    if (data.allOrders.length === 0) return []
    const isPaid = (o: any) => o.paymentStatus === "SUCCESS" || o.status === "DELIVERED"
    const getDate = (o: any) => o.paidAt ? new Date(o.paidAt) : o.updatedAt ? new Date(o.updatedAt) : new Date(o.createdAt)

    let start: Date, end: Date
    const now = new Date()

    if (chartFilter === "7d") {
      end = new Date(now); end.setHours(23, 59, 59, 999)
      start = new Date(now); start.setDate(start.getDate() - 6); start.setHours(0, 0, 0, 0)
    } else if (chartFilter === "1m") {
      end = new Date(now); end.setHours(23, 59, 59, 999)
      start = new Date(now); start.setMonth(start.getMonth() - 1); start.setHours(0, 0, 0, 0)
    } else if (chartFilter === "date") {
      start = new Date(chartStartDate); start.setHours(0, 0, 0, 0)
      end = new Date(chartEndDate); end.setHours(23, 59, 59, 999)
    } else if (chartFilter === "week") {
      const r = getWeekDateRange(chartWeek); if (!r) return []
      start = r.start; end = r.end
    } else {
      const r = getMonthDateRange(chartMonth); if (!r) return []
      start = r.start; end = r.end
    }

    const result: { date: string; revenue: number }[] = []
    const cur = new Date(start)
    while (cur <= end) {
      const dayStart = new Date(cur); dayStart.setHours(0, 0, 0, 0)
      const dayEnd = new Date(cur); dayEnd.setHours(23, 59, 59, 999)
      const rev = data.allOrders
        .filter(isPaid)
        .filter((o: any) => { const d = getDate(o); return d >= dayStart && d <= dayEnd })
        .reduce((s: number, o: any) => s + o.total, 0)
      result.push({
        date: cur.toLocaleDateString("id-ID", { weekday: "short", day: "numeric", month: "short" }),
        revenue: rev,
      })
      cur.setDate(cur.getDate() + 1)
    }
    return result
  }, [data.allOrders, chartFilter, chartStartDate, chartEndDate, chartWeek, chartMonth])

  useEffect(() => {
    fetchAnalytics();
  }, []);

  async function fetchAnalytics() {
    try {
      const res = await fetch("/api/orders");
      const json = await res.json();
      const orders = Array.isArray(json) ? json : [];
      const isPaid = (o: any) =>
        o.paymentStatus === "SUCCESS" || o.status === "DELIVERED";
      const paid = orders.filter(isPaid);

      const now = new Date();
      const startDay = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
      );
      const startWeek = new Date(now);
      startWeek.setDate(now.getDate() - now.getDay());
      startWeek.setHours(0, 0, 0, 0);
      const startMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      const getDate = (o: any) =>
        o.paidAt
          ? new Date(o.paidAt)
          : o.updatedAt
            ? new Date(o.updatedAt)
            : new Date(o.createdAt);

      const daily = paid
        .filter((o: any) => getDate(o) >= startDay)
        .reduce((s: number, o: any) => s + o.total, 0);
      const weekly = paid
        .filter((o: any) => getDate(o) >= startWeek)
        .reduce((s: number, o: any) => s + o.total, 0);
      const monthly = paid
        .filter((o: any) => getDate(o) >= startMonth)
        .reduce((s: number, o: any) => s + o.total, 0);
      const total = paid.reduce((s: number, o: any) => s + o.total, 0);

      const statusCount: Record<string, number> = {};
      orders.forEach((o: any) => {
        statusCount[o.status] = (statusCount[o.status] || 0) + 1;
      });

      // Monthly summary
      const monthMap = new Map<string, { orders: number; revenue: number; discount: number; shipping: number }>()
      paid.forEach((o: any) => {
        const d = getDate(o)
        const key = `${d.getFullYear()}-${pad(d.getMonth() + 1)}`
        const entry = monthMap.get(key) || { orders: 0, revenue: 0, discount: 0, shipping: 0 }
        entry.orders++
        entry.revenue += o.total
        entry.discount += o.discount || 0
        entry.shipping += o.shippingCost || 0
        monthMap.set(key, entry)
      })
      const monthlySummary = Array.from(monthMap.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([month, data]) => ({ month, ...data }))

      // Payment method summary
      const payMap = new Map<string, { orders: number; total: number }>()
      paid.forEach((o: any) => {
        const method = o.paymentMethod || "Lainnya"
        const entry = payMap.get(method) || { orders: 0, total: 0 }
        entry.orders++
        entry.total += o.total
        payMap.set(method, entry)
      })
      const paymentSummary = Array.from(payMap.entries())
        .sort(([, a], [, b]) => b.total - a.total)
        .map(([method, data]) => ({ method, ...data }))

      setData({
        totalRevenue: total,
        totalOrders: paid.length,
        averageOrderValue:
          paid.length > 0 ? Math.round(total / paid.length) : 0,
        dailyRevenue: daily,
        weeklyRevenue: weekly,
        monthlyRevenue: monthly,
        ordersByStatus: statusCount,
        monthlySummary,
        paymentSummary,
        allOrders: orders,
      });
    } catch {
      console.error("Failed to fetch analytics");
    }
    setLoading(false);
  }

  function buildExportRows(): ExportRow[] {
    const getDate = (o: any) => {
      const raw = o.paidAt || o.updatedAt || o.createdAt;
      return raw ? new Date(raw) : new Date();
    };

    let filtered = data.allOrders;
    let range: { start: Date; end: Date } | null = null;

    if (filterType === "date" && startDate && endDate) {
      const ps = startDate.split("-").map(Number);
      const pe = endDate.split("-").map(Number);
      range = {
        start: new Date(ps[0], ps[1] - 1, ps[2], 0, 0, 0, 0),
        end: new Date(pe[0], pe[1] - 1, pe[2], 23, 59, 59, 999),
      };
    } else if (filterType === "week" && selectedWeek) {
      range = getWeekDateRange(selectedWeek);
    } else if (filterType === "month" && selectedMonth) {
      range = getMonthDateRange(selectedMonth);
    }

    if (range) {
      filtered = data.allOrders.filter((o: any) => {
        const d = getDate(o);
        return d >= range!.start && d <= range!.end;
      });
    }

    return filtered.map((o: any) => {
      const total = o.total || 0;
      const isPaid = o.paymentStatus === "SUCCESS" || o.status === "DELIVERED";
      return {
        tanggal: formatTanggal(getDate(o)),
        noPesanan: o.invoiceNumber || "-",
        pelanggan: o.user?.name || o.user?.email || o.user?.phone || "-",
        mataUang: "IDR",
        subTotal: o.subtotal || 0,
        diskon: o.discount || 0,
        totalPenjualan: total,
        pembayaran: isPaid ? total : 0,
        lunas: isPaid,
      };
    });
  }

  const exportRows = buildExportRows();

  const totals = {
    subTotal: exportRows.reduce((a, r) => a + r.subTotal, 0),
    diskon: exportRows.reduce((a, r) => a + r.diskon, 0),
    totalPenjualan: exportRows.reduce((a, r) => a + r.totalPenjualan, 0),
    pembayaran: exportRows.reduce((a, r) => a + r.pembayaran, 0),
  };

  function getDateRangeLabel(): string {
    if (filterType === "date" && startDate && endDate) {
      return formatDateRangeHeader(
        new Date(startDate + "T00:00:00"),
        new Date(endDate + "T23:59:59"),
      );
    }
    if (filterType === "week" && selectedWeek) {
      const r = getWeekDateRange(selectedWeek);
      if (r) return formatDateRangeHeader(r.start, r.end);
    }
    if (filterType === "month" && selectedMonth) {
      const r = getMonthDateRange(selectedMonth);
      if (r) return formatDateRangeHeader(r.start, r.end);
    }
    return "All periods";
  }

  function exportToExcel() {
    const wb = XLSX.utils.book_new();

    const wsData: any[][] = [];
    wsData.push(["Data Contoh"]);
    wsData.push(["Penjualan - Rangkuman"]);
    wsData.push([getDateRangeLabel()]);
    wsData.push([]);

    const headers = [
      "Tanggal",
      "No. Pesanan",
      "Pelanggan",
      "Mata Uang",
      "Sub Total",
      "Diskon",
      "Total",
      "Pembayaran",
      "Lunas",
    ];
    wsData.push(headers);

    exportRows.forEach((r) => {
      wsData.push([
        r.tanggal,
        r.noPesanan,
        r.pelanggan,
        r.mataUang,
        r.subTotal,
        r.diskon,
        r.totalPenjualan,
        r.pembayaran,
        r.lunas ? "✓" : "✗",
      ]);
    });

    wsData.push([
      "",
      "",
      "",
      "IDR",
      totals.subTotal,
      totals.diskon,
      totals.totalPenjualan,
      totals.pembayaran,
      "",
    ]);

    const ws = XLSX.utils.aoa_to_sheet(wsData);

    ws["!merges"] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 8 } },
      { s: { r: 1, c: 0 }, e: { r: 1, c: 8 } },
      { s: { r: 2, c: 0 }, e: { r: 2, c: 8 } },
    ];

    const colWidths = [
      { wch: 14 },
      { wch: 20 },
      { wch: 22 },
      { wch: 8 },
      { wch: 16 },
      { wch: 14 },
      { wch: 16 },
      { wch: 16 },
      { wch: 8 },
    ];
    ws["!cols"] = colWidths;

    const range = XLSX.utils.decode_range(ws["!ref"] || "A1:I1");
    for (let R = range.s.r; R <= range.e.r; R++) {
      for (let C = range.s.c; C <= range.e.c; C++) {
        const addr = XLSX.utils.encode_cell({ r: R, c: C });
        const cell = ws[addr];
        if (!cell) continue;
        cell.s = { alignment: { horizontal: "center" } };
        if (R > 4 && [4, 5, 6, 7].includes(C)) {
          cell.t = "n";
          cell.z = "#,##0.00";
        }
        if (R === range.e.r) {
          cell.s = { font: { bold: true }, alignment: { horizontal: "center" } };
        }
      }
    }

    XLSX.utils.book_append_sheet(wb, ws, "Penjualan");
    XLSX.writeFile(
      wb,
      `laporan-penjualan-${new Date().toISOString().slice(0, 10)}.xlsx`,
    );
  }

  function exportToPDF() {
    const doc = new jsPDF("landscape", "mm", "a4");
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    let y = 10;

    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text(formatPrintTime(new Date()), 10, y, { align: "left" });

    doc.setFontSize(11);
    doc.setTextColor(120, 120, 120);
    doc.text("Data Contoh", pageWidth / 2, y + 6, { align: "center" });

    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(26, 115, 232);
    doc.text("Penjualan - Rangkuman", pageWidth / 2, y + 14, {
      align: "center",
    });

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(153, 27, 27);
    doc.text(getDateRangeLabel(), pageWidth / 2, y + 21, { align: "center" });

    y = 38;

    const tableHeaders = [
      [
        "Tanggal",
        "No. Pesanan",
        "Pelanggan",
        "Mata Uang",
        "Sub Total",
        "Diskon",
        "Total",
        "Pembayaran",
        "Lunas",
      ],
    ];

    const tableBody = exportRows.map((r) => [
      r.tanggal,
      r.noPesanan,
      r.pelanggan,
      r.mataUang,
      formatNumber(r.subTotal),
      formatNumber(r.diskon),
      formatNumber(r.totalPenjualan),
      formatNumber(r.pembayaran),
      r.lunas ? "✓" : "✗",
    ]);

    const tableFoot: string[][] = [
      [
        "",
        "",
        "",
        "IDR",
        formatNumber(totals.subTotal),
        formatNumber(totals.diskon),
        formatNumber(totals.totalPenjualan),
        formatNumber(totals.pembayaran),
        "",
      ],
    ];

    autoTable(doc, {
      startY: y,
      head: tableHeaders,
      body: tableBody,
      foot: tableFoot,
      theme: "grid",
      styles: {
        fontSize: 7,
        cellPadding: 1.5,
        lineColor: [180, 180, 180],
        lineWidth: 0.3,
        halign: "center",
      },
      headStyles: {
        fillColor: [220, 220, 220],
        textColor: [50, 50, 50],
        fontStyle: "bold",
        fontSize: 7,
        halign: "center",
      },
      footStyles: {
        fillColor: [230, 230, 230],
        textColor: [30, 30, 30],
        fontStyle: "bold",
        fontSize: 7,
        halign: "center",
      },
      columnStyles: {
        0: { cellWidth: 22 },
        1: { cellWidth: 24 },
        2: { cellWidth: 32 },
        3: { cellWidth: 14 },
        4: { cellWidth: 22 },
        5: { cellWidth: 18 },
        6: { cellWidth: 22 },
        7: { cellWidth: 22 },
        8: { cellWidth: 10 },
      },
      didDrawPage: (data: any) => {
        doc.setFontSize(7);
        doc.setTextColor(120, 120, 120);
        doc.text(`Halaman : ${data.pageNumber}`, 10, pageHeight - 10);
      },
      margin: { left: 8, right: 8 },
    });

    doc.save(`laporan-penjualan-${new Date().toISOString().slice(0, 10)}.pdf`);
  }

  if (loading)
    return <p className="text-slate-400 text-center py-8">Memuat data...</p>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Laporan Keuangan
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Ringkasan penjualan toko
          </p>
        </div>
        {/* <div className="flex gap-2 no-print">
          <Button variant="outline" size="sm" onClick={exportToPDF} className="gap-2">
            <Printer className="h-4 w-4" /> Export PDF
          </Button>
          <Button variant="outline" size="sm" onClick={exportToExcel} className="gap-2">
            <FileDown className="h-4 w-4" /> Export Excel
          </Button>
        </div> */}
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-slate-400 flex items-center gap-1">
              <DollarSign className="h-3 w-3" /> Total Pendapatan
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-bold text-slate-900">
              {formatPrice(data.totalRevenue)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-slate-400 flex items-center gap-1">
              <Package className="h-3 w-3" /> Total Pesanan
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-bold text-slate-900">
              {data.totalOrders}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-slate-400 flex items-center gap-1">
              <TrendingUp className="h-3 w-3" /> Rata-rata Pesanan
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-bold text-slate-900">
              {formatPrice(data.averageOrderValue)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-slate-400 flex items-center gap-1">
              <DollarSign className="h-3 w-3" /> Omzet Hari Ini
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-bold text-green-600">
              {formatPrice(data.dailyRevenue)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Chart + Status */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Chart */}
        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <CardTitle className="text-sm text-slate-900">Grafik Pendapatan</CardTitle>
              <div className="flex flex-wrap items-center gap-1.5">
                {(["7d", "1m", "date", "week", "month"] as const).map((opt) => {
                  const labels = { "7d": "7H", "1m": "1B", date: "Tanggal", week: "Minggu", month: "Bulan" }
                  return (
                    <Button
                      key={opt}
                      variant={chartFilter === opt ? "default" : "outline"}
                      size="sm"
                      className="h-7 text-xs px-2"
                      onClick={() => setChartFilter(opt)}
                    >{labels[opt]}</Button>
                  )
                })}
              </div>
            </div>
            {chartFilter === "date" && (
              <div className="flex flex-wrap items-center gap-3 mt-2">
                <div className="flex items-center gap-2">
                  <Label className="text-xs text-slate-400">Dari</Label>
                  <Input type="date" className="w-auto h-7 text-xs" value={chartStartDate} onChange={(e) => setChartStartDate(e.target.value)} />
                </div>
                <div className="flex items-center gap-2">
                  <Label className="text-xs text-slate-400">Sampai</Label>
                  <Input type="date" className="w-auto h-7 text-xs" value={chartEndDate} onChange={(e) => setChartEndDate(e.target.value)} />
                </div>
              </div>
            )}
            {chartFilter === "week" && (
              <div className="mt-2">
                <Input type="week" className="w-auto h-7 text-xs" value={chartWeek} onChange={(e) => setChartWeek(e.target.value)} />
              </div>
            )}
            {chartFilter === "month" && (
              <div className="mt-2">
                <Input type="month" className="w-auto h-7 text-xs" value={chartMonth} onChange={(e) => setChartMonth(e.target.value)} />
              </div>
            )}
          </CardHeader>
          <CardContent>
            {loading || chartData.length === 0 ? (
              <div className="h-64 flex items-center justify-center text-slate-400 text-sm">
                {loading ? "Memuat..." : "Belum ada data penjualan"}
              </div>
            ) : chartData.every((d) => d.revenue === 0) ? (
              <div className="h-64 flex items-center justify-center text-slate-400 text-sm">
                Belum ada data penjualan di periode ini
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="#94a3b8" interval="preserveStartEnd" />
                  <YAxis tick={{ fontSize: 11 }} stroke="#94a3b8" tickFormatter={(v: number) => formatPrice(v)} />
                  <Tooltip formatter={(v: number) => [formatPrice(v), "Pendapatan"]} />
                  <Line type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3, fill: "#3b82f6" }} activeDot={{ r: 5 }} name="Pendapatan" />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-slate-900">
              Status Pesanan
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(data.ordersByStatus).map(([status, count]) => (
                <div
                  key={status}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="text-slate-600">{statusLabels[status] || status}</span>
                  <span className="font-medium text-slate-900">{count}</span>
                </div>
              ))}
              {Object.keys(data.ordersByStatus).length === 0 && (
                <p className="text-sm text-slate-400">Belum ada data</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Orders by Period */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-slate-400">
              Omzet Hari Ini
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {formatPrice(data.dailyRevenue)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-slate-400">
              Omzet Minggu Ini
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {formatPrice(data.weeklyRevenue)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-slate-400">
              Omzet Bulan Ini
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {formatPrice(data.monthlyRevenue)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Summary + Payment Breakdown */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Monthly Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-slate-900">Ringkasan Bulanan</CardTitle>
          </CardHeader>
          <CardContent className="p-0 max-h-72 overflow-auto">
            {data.monthlySummary.length === 0 ? (
              <p className="text-sm text-slate-400 p-4">Belum ada data</p>
            ) : (
              <table className="w-full text-xs border-collapse">
                <thead className="sticky top-0 bg-slate-100">
                  <tr>
                    <th className="text-left p-2 border border-slate-200 font-semibold">Bulan</th>
                    <th className="text-center p-2 border border-slate-200 font-semibold">Pesanan</th>
                    <th className="text-right p-2 border border-slate-200 font-semibold">Revenue</th>
                    <th className="text-right p-2 border border-slate-200 font-semibold">Diskon</th>
                    <th className="text-right p-2 border border-slate-200 font-semibold">Ongkir</th>
                  </tr>
                </thead>
                <tbody>
                  {data.monthlySummary.map((r) => {
                    const [y, m] = r.month.split("-")
                    const label = `${["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"][parseInt(m) - 1]} ${y}`
                    return (
                      <tr key={r.month} className="hover:bg-slate-50">
                        <td className="p-2 border border-slate-200 font-medium">{label}</td>
                        <td className="p-2 border border-slate-200 text-center">{r.orders}</td>
                        <td className="p-2 border border-slate-200 text-right">{formatPrice(r.revenue)}</td>
                        <td className="p-2 border border-slate-200 text-right text-red-500">{formatPrice(r.discount)}</td>
                        <td className="p-2 border border-slate-200 text-right">{formatPrice(r.shipping)}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>

        {/* Payment Method Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-slate-900">Metode Pembayaran</CardTitle>
          </CardHeader>
          <CardContent className="p-0 max-h-72 overflow-auto">
            {data.paymentSummary.length === 0 ? (
              <p className="text-sm text-slate-400 p-4">Belum ada data</p>
            ) : (
              <table className="w-full text-xs border-collapse">
                <thead className="sticky top-0 bg-slate-100">
                  <tr>
                    <th className="text-left p-2 border border-slate-200 font-semibold">Metode</th>
                    <th className="text-center p-2 border border-slate-200 font-semibold">Transaksi</th>
                    <th className="text-right p-2 border border-slate-200 font-semibold">Total</th>
                    <th className="text-right p-2 border border-slate-200 font-semibold">%</th>
                  </tr>
                </thead>
                <tbody>
                  {data.paymentSummary.map((r) => {
                    const pct = data.totalRevenue > 0 ? Math.round((r.total / data.totalRevenue) * 100) : 0
                    return (
                      <tr key={r.method} className="hover:bg-slate-50">
                        <td className="p-2 border border-slate-200 font-medium capitalize">{r.method.replace(/_/g, " ")}</td>
                        <td className="p-2 border border-slate-200 text-center">{r.orders}</td>
                        <td className="p-2 border border-slate-200 text-right">{formatPrice(r.total)}</td>
                        <td className="p-2 border border-slate-200 text-right">{pct}%</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Filter Section */}
      <Card className="no-print">
        <CardHeader>
          <CardTitle className="text-sm text-slate-900">
            Filter Data Export
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-end gap-4">
            <div className="flex gap-4 items-center">
              <Label className="flex items-center gap-2 text-sm font-normal">
                <input
                  type="radio"
                  name="filterType"
                  checked={filterType === "date"}
                  onChange={() => startTransition(() => setFilterType("date"))}
                />
                Tanggal
              </Label>
              <Label className="flex items-center gap-2 text-sm font-normal">
                <input
                  type="radio"
                  name="filterType"
                  checked={filterType === "week"}
                  onChange={() => startTransition(() => setFilterType("week"))}
                />
                Minggu
              </Label>
              <Label className="flex items-center gap-2 text-sm font-normal">
                <input
                  type="radio"
                  name="filterType"
                  checked={filterType === "month"}
                  onChange={() => startTransition(() => setFilterType("month"))}
                />
                Bulan
              </Label>
            </div>

            {filterType === "date" && (
              <div className="flex items-center gap-2">
                <div>
                  <Label className="text-xs text-slate-500">Dari</Label>
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) =>
                      startTransition(() => setStartDate(e.target.value))
                    }
                    className="h-8 w-40 text-sm"
                  />
                </div>
                <span className="text-slate-400 mt-5">-</span>
                <div>
                  <Label className="text-xs text-slate-500">Sampai</Label>
                  <Input
                    type="date"
                    value={endDate}
                    onChange={(e) =>
                      startTransition(() => setEndDate(e.target.value))
                    }
                    className="h-8 w-40 text-sm"
                  />
                </div>
              </div>
            )}

            {filterType === "week" && (
              <div>
                <Label className="text-xs text-slate-500">Pilih Minggu</Label>
                <Input
                  type="week"
                  value={selectedWeek}
                  onChange={(e) =>
                    startTransition(() => setSelectedWeek(e.target.value))
                  }
                  className="h-8 w-44 text-sm"
                />
              </div>
            )}

            {filterType === "month" && (
              <div>
                <Label className="text-xs text-slate-500">Pilih Bulan</Label>
                <Input
                  type="month"
                  value={selectedMonth}
                  onChange={(e) =>
                    startTransition(() => setSelectedMonth(e.target.value))
                  }
                  className="h-8 w-44 text-sm"
                />
              </div>
            )}

            <div className="text-xs text-slate-400 ml-2">
              Menampilkan <strong>{exportRows.length}</strong> transaksi
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Export Data Preview */}
      <Card className="no-print">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-sm text-slate-900">
            Preview Data Export ({exportRows.length} transaksi)
          </CardTitle>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={exportToPDF}
              className="gap-1"
            >
              <Printer className="h-3.5 w-3.5" /> PDF
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={exportToExcel}
              className="gap-1"
            >
              <FileDown className="h-3.5 w-3.5" /> Excel
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0 overflow-auto max-h-96">
          {isPending ? (
            <div className="p-4 space-y-3">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="flex gap-4 animate-pulse">
                    <div className="h-4 bg-slate-200 rounded w-[12%]" />
                    <div className="h-4 bg-slate-200 rounded w-[18%]" />
                    <div className="h-4 bg-slate-200 rounded w-[20%]" />
                    <div className="h-4 bg-slate-200 rounded w-[8%]" />
                    <div className="h-4 bg-slate-200 rounded w-[12%]" />
                    <div className="h-4 bg-slate-200 rounded w-[10%]" />
                    <div className="h-4 bg-slate-200 rounded w-[12%]" />
                    <div className="h-4 bg-slate-200 rounded w-[12%]" />
                    <div className="h-4 bg-slate-200 rounded w-[8%]" />
                  </div>
                ))}
              </div>
          ) : (
              <table className="w-full text-xs border-collapse">
              <thead className="sticky top-0 bg-slate-100">
                <tr>
                  <th className="text-center p-2 border border-slate-200 font-semibold">
                    Tanggal
                  </th>
                  <th className="text-center p-2 border border-slate-200 font-semibold">
                    No. Pesanan
                  </th>
                  <th className="text-center p-2 border border-slate-200 font-semibold">
                    Pelanggan
                  </th>
                  <th className="text-center p-2 border border-slate-200 font-semibold">
                    Mata Uang
                  </th>
                  <th className="text-center p-2 border border-slate-200 font-semibold">
                    Sub Total
                  </th>
                  <th className="text-center p-2 border border-slate-200 font-semibold">
                    Diskon
                  </th>
                  <th className="text-center p-2 border border-slate-200 font-semibold">
                    Total
                  </th>
                  <th className="text-center p-2 border border-slate-200 font-semibold">
                    Pembayaran
                  </th>
                  <th className="text-center p-2 border border-slate-200 font-semibold">
                    Lunas
                  </th>
                </tr>
              </thead>
              <tbody>
                  {exportRows.length === 0 && (
                    <tr>
                      <td colSpan={9} className="text-center p-4 text-slate-400">
                        Tidak ada data untuk rentang yang dipilih
                      </td>
                    </tr>
                  )}
                  {exportRows.map((r, i) => (
                    <tr
                      key={i}
                      className={i % 2 === 0 ? "bg-white" : "bg-slate-50"}
                    >
                      <td className="p-2 border border-slate-200 text-center">
                        {r.tanggal}
                      </td>
                      <td className="p-2 border border-slate-200 text-center">
                        {r.noPesanan}
                      </td>
                      <td className="p-2 border border-slate-200 text-center truncate max-w-[140px]">
                        {r.pelanggan}
                      </td>
                      <td className="p-2 border border-slate-200 text-center">
                        {r.mataUang}
                      </td>
                      <td className="p-2 border border-slate-200 text-center">
                        {formatNumber(r.subTotal)}
                      </td>
                      <td className="p-2 border border-slate-200 text-center">
                        {formatNumber(r.diskon)}
                      </td>
                      <td className="p-2 border border-slate-200 text-center">
                        {formatNumber(r.totalPenjualan)}
                      </td>
                      <td className="p-2 border border-slate-200 text-center">
                        {formatNumber(r.pembayaran)}
                      </td>
                      <td className="p-2 border border-slate-200 text-center">
                        <span className={r.lunas ? "text-green-600 font-bold" : "text-red-500 font-bold"}>
                          {r.lunas ? "✓" : "✗"}
                        </span>
                      </td>
                    </tr>
                  ))}
              </tbody>
                {exportRows.length > 0 && (
                  <tfoot>
                    <tr className="bg-slate-200 font-semibold">
                      <td className="p-2 border border-slate-300 text-center" colSpan={3}>
                        Total
                      </td>
                      <td className="p-2 border border-slate-300 text-center">
                        IDR
                      </td>
                      <td className="p-2 border border-slate-300 text-center">
                        {formatNumber(totals.subTotal)}
                      </td>
                      <td className="p-2 border border-slate-300 text-center">
                        {formatNumber(totals.diskon)}
                      </td>
                      <td className="p-2 border border-slate-300 text-center">
                        {formatNumber(totals.totalPenjualan)}
                      </td>
                      <td className="p-2 border border-slate-300 text-center">
                        {formatNumber(totals.pembayaran)}
                      </td>
                      <td className="p-2 border border-slate-300"></td>
                    </tr>
                  </tfoot>
                )}
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
