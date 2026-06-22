"use client";

import { useState, useEffect, useTransition } from "react";
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
  reference: string;
  noPesanan: string;
  pelanggan: string;
  mataUang: string;
  subTotal: number;
  diskon: number;
  totalPenjualan: number;
  pembayaran: number;
  saldo: number;
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

export default function AnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    averageOrderValue: 0,
    dailyRevenue: 0,
    weeklyRevenue: 0,
    monthlyRevenue: 0,
    revenueChart: [] as { date: string; revenue: number }[],
    ordersByStatus: {} as Record<string, number>,
    allOrders: [] as any[],
  });

  const [filterType, setFilterType] = useState<FilterType>("date");
  const [startDate, setStartDate] = useState(getTodayISO());
  const [endDate, setEndDate] = useState(getTodayISO());
  const [selectedWeek, setSelectedWeek] = useState(getDefaultWeek());
  const [selectedMonth, setSelectedMonth] = useState(getDefaultMonth());
  const [isPending, startTransition] = useTransition();

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

      const chart: { date: string; revenue: number }[] = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(d.getDate() - i);
        d.setHours(0, 0, 0, 0);
        const next = new Date(d);
        next.setDate(d.getDate() + 1);
        const rev = paid
          .filter((o: any) => getDate(o) >= d && getDate(o) < next)
          .reduce((s: number, o: any) => s + o.total, 0);
        chart.push({
          date: d.toLocaleDateString("id-ID", {
            weekday: "short",
            day: "numeric",
          }),
          revenue: rev,
        });
      }

      setData({
        totalRevenue: total,
        totalOrders: paid.length,
        averageOrderValue:
          paid.length > 0 ? Math.round(total / paid.length) : 0,
        dailyRevenue: daily,
        weeklyRevenue: weekly,
        monthlyRevenue: monthly,
        revenueChart: chart,
        ordersByStatus: statusCount,
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
        reference: o.invoiceNumber || "-",
        noPesanan: "-",
        pelanggan: o.user?.name || o.user?.email || o.user?.phone || "-",
        mataUang: "IDR",
        subTotal: o.subtotal || 0,
        diskon: o.discount || 0,
        totalPenjualan: total,
        pembayaran: isPaid ? total : 0,
        saldo: isPaid ? 0 : total,
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
    saldo: exportRows.reduce((a, r) => a + r.saldo, 0),
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
      "Reference",
      "No. Pesanan",
      "Pelanggan",
      "Mata Uang",
      "Sub Total",
      "Diskon",
      "Total Penjualan",
      "Pembayaran",
      "Saldo",
      "Lunas",
    ];
    wsData.push(headers);

    exportRows.forEach((r) => {
      wsData.push([
        r.tanggal,
        r.reference,
        r.noPesanan,
        r.pelanggan,
        r.mataUang,
        r.subTotal,
        r.diskon,
        r.totalPenjualan,
        r.pembayaran,
        r.saldo,
        r.lunas ? "✓" : "",
      ]);
    });

    wsData.push([
      "",
      "",
      "",
      "",
      "IDR",
      totals.subTotal,
      totals.diskon,
      totals.totalPenjualan,
      totals.pembayaran,
      totals.saldo,
      "",
    ]);

    const ws = XLSX.utils.aoa_to_sheet(wsData);

    ws["!merges"] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 10 } },
      { s: { r: 1, c: 0 }, e: { r: 1, c: 10 } },
      { s: { r: 2, c: 0 }, e: { r: 2, c: 10 } },
    ];

    const colWidths = [
      { wch: 14 },
      { wch: 14 },
      { wch: 14 },
      { wch: 22 },
      { wch: 8 },
      { wch: 16 },
      { wch: 14 },
      { wch: 16 },
      { wch: 16 },
      { wch: 14 },
      { wch: 8 },
    ];
    ws["!cols"] = colWidths;

    const range = XLSX.utils.decode_range(ws["!ref"] || "A1:K1");
    for (let R = range.s.r; R <= range.e.r; R++) {
      for (let C = range.s.c; C <= range.e.c; C++) {
        const addr = XLSX.utils.encode_cell({ r: R, c: C });
        const cell = ws[addr];
        if (!cell) continue;
        if (R > 4 && [5, 6, 7, 8, 9].includes(C)) {
          cell.t = "n";
          cell.z = "#,##0.00";
        }
        if (R === range.e.r) {
          cell.s = { font: { bold: true } };
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
        "Reference",
        "No. Pesanan",
        "Pelanggan",
        "Mata Uang",
        "Sub Total",
        "Diskon",
        "Total Penjualan",
        "Pembayaran",
        "Saldo",
        "",
      ],
    ];

    const tableBody = exportRows.map((r) => [
      r.tanggal,
      r.reference,
      r.noPesanan,
      r.pelanggan,
      r.mataUang,
      formatNumber(r.subTotal),
      formatNumber(r.diskon),
      formatNumber(r.totalPenjualan),
      formatNumber(r.pembayaran),
      formatNumber(r.saldo),
      r.lunas ? "✓" : "",
    ]);

    const tableFoot: string[][] = [
      [
        "",
        "",
        "",
        "",
        "IDR",
        formatNumber(totals.subTotal),
        formatNumber(totals.diskon),
        formatNumber(totals.totalPenjualan),
        formatNumber(totals.pembayaran),
        formatNumber(totals.saldo),
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
      },
      columnStyles: {
        0: { halign: "left", cellWidth: 22 },
        1: { halign: "left", cellWidth: 20 },
        2: { halign: "left", cellWidth: 18 },
        3: { halign: "left", cellWidth: 32 },
        4: { halign: "center", cellWidth: 14 },
        5: { halign: "right", cellWidth: 22 },
        6: { halign: "right", cellWidth: 18 },
        7: { halign: "right", cellWidth: 22 },
        8: { halign: "right", cellWidth: 22 },
        9: { halign: "right", cellWidth: 18 },
        10: { halign: "center", cellWidth: 8 },
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

  const maxChart = Math.max(...data.revenueChart.map((d) => d.revenue), 1);
  const chartHeight = 200;

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
            <CardTitle className="text-sm text-slate-900">
              Grafik Pendapatan 7 Hari Terakhir
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.revenueChart.every((d) => d.revenue === 0) ? (
              <div className="h-48 flex items-center justify-center text-slate-400 text-sm">
                Belum ada data penjualan dalam 7 hari terakhir
              </div>
            ) : (
              <div
                className="flex items-end gap-2"
                style={{ height: chartHeight }}
              >
                {data.revenueChart.map((day, i) => {
                  const barH = Math.max(
                    (day.revenue / maxChart) * (chartHeight - 40),
                    8,
                  );
                  return (
                    <div
                      key={i}
                      className="flex-1 flex flex-col items-center gap-1 h-full justify-end"
                    >
                      <div
                        className="relative w-full group cursor-pointer"
                        style={{ height: barH }}
                      >
                        <div
                          className="w-full rounded-t bg-gradient-to-t from-primary to-pink-400 transition-all duration-300 group-hover:opacity-80"
                          style={{ height: "100%" }}
                        />
                        <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                          {formatPrice(day.revenue)}
                        </div>
                      </div>
                      <span className="text-[10px] text-slate-400 text-center leading-tight">
                        {day.date}
                      </span>
                    </div>
                  );
                })}
              </div>
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
                  <span className="text-slate-600">{status}</span>
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
                    onChange={(e) => startTransition(() => setStartDate(e.target.value))}
                    className="h-8 w-40 text-sm"
                  />
                </div>
                <span className="text-slate-400 mt-5">-</span>
                <div>
                  <Label className="text-xs text-slate-500">Sampai</Label>
                  <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => startTransition(() => setEndDate(e.target.value))}
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
                  onChange={(e) => startTransition(() => setSelectedWeek(e.target.value))}
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
                  onChange={(e) => startTransition(() => setSelectedMonth(e.target.value))}
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
                <div
                  key={i}
                  className="flex gap-4 animate-pulse"
                >
                  <div className="h-4 bg-slate-200 rounded w-[12%]" />
                  <div className="h-4 bg-slate-200 rounded w-[12%]" />
                  <div className="h-4 bg-slate-200 rounded w-[10%]" />
                  <div className="h-4 bg-slate-200 rounded w-[20%]" />
                  <div className="h-4 bg-slate-200 rounded w-[6%]" />
                  <div className="h-4 bg-slate-200 rounded w-[12%]" />
                  <div className="h-4 bg-slate-200 rounded w-[10%]" />
                  <div className="h-4 bg-slate-200 rounded w-[12%]" />
                  <div className="h-4 bg-slate-200 rounded w-[12%]" />
                  <div className="h-4 bg-slate-200 rounded w-[10%]" />
                  <div className="h-4 bg-slate-200 rounded w-[5%]" />
                </div>
              ))}
            </div>
          ) : (
            <table className="w-full text-xs border-collapse">
              <thead className="sticky top-0 bg-slate-100">
                <tr>
                  <th className="text-left p-2 border border-slate-200 font-semibold">
                    Tanggal
                  </th>
                  <th className="text-left p-2 border border-slate-200 font-semibold">
                    Reference
                  </th>
                  <th className="text-left p-2 border border-slate-200 font-semibold">
                    No. Pesanan
                  </th>
                  <th className="text-left p-2 border border-slate-200 font-semibold">
                    Pelanggan
                  </th>
                  <th className="text-center p-2 border border-slate-200 font-semibold">
                    Mata Uang
                  </th>
                  <th className="text-right p-2 border border-slate-200 font-semibold">
                    Sub Total
                  </th>
                  <th className="text-right p-2 border border-slate-200 font-semibold">
                    Diskon
                  </th>
                  <th className="text-right p-2 border border-slate-200 font-semibold">
                    Total
                  </th>
                  <th className="text-right p-2 border border-slate-200 font-semibold">
                    Pembayaran
                  </th>
                  <th className="text-right p-2 border border-slate-200 font-semibold">
                    Saldo
                  </th>
                  <th className="text-center p-2 border border-slate-200 font-semibold">
                    Lunas
                  </th>
                </tr>
              </thead>
              <tbody>
                {exportRows.length === 0 && (
                  <tr>
                    <td colSpan={11} className="text-center p-4 text-slate-400">
                      Tidak ada data untuk rentang yang dipilih
                    </td>
                  </tr>
                )}
                {exportRows.map((r, i) => (
                  <tr
                    key={i}
                    className={i % 2 === 0 ? "bg-white" : "bg-slate-50"}
                  >
                    <td className="p-2 border border-slate-200">{r.tanggal}</td>
                    <td className="p-2 border border-slate-200">{r.reference}</td>
                    <td className="p-2 border border-slate-200">{r.noPesanan}</td>
                    <td className="p-2 border border-slate-200 truncate max-w-[140px]">
                      {r.pelanggan}
                    </td>
                    <td className="p-2 border border-slate-200 text-center">
                      {r.mataUang}
                    </td>
                    <td className="p-2 border border-slate-200 text-right">
                      {formatNumber(r.subTotal)}
                    </td>
                    <td className="p-2 border border-slate-200 text-right">
                      {formatNumber(r.diskon)}
                    </td>
                    <td className="p-2 border border-slate-200 text-right">
                      {formatNumber(r.totalPenjualan)}
                    </td>
                    <td className="p-2 border border-slate-200 text-right">
                      {formatNumber(r.pembayaran)}
                    </td>
                    <td className="p-2 border border-slate-200 text-right">
                      {formatNumber(r.saldo)}
                    </td>
                    <td className="p-2 border border-slate-200 text-center text-green-600">
                      {r.lunas ? "✓" : ""}
                    </td>
                  </tr>
                ))}
              </tbody>
              {exportRows.length > 0 && (
                <tfoot>
                  <tr className="bg-slate-200 font-semibold">
                    <td className="p-2 border border-slate-300" colSpan={4}>
                      Total
                    </td>
                    <td className="p-2 border border-slate-300 text-center">
                      IDR
                    </td>
                    <td className="p-2 border border-slate-300 text-right">
                      {formatNumber(totals.subTotal)}
                    </td>
                    <td className="p-2 border border-slate-300 text-right">
                      {formatNumber(totals.diskon)}
                    </td>
                    <td className="p-2 border border-slate-300 text-right">
                      {formatNumber(totals.totalPenjualan)}
                    </td>
                    <td className="p-2 border border-slate-300 text-right">
                      {formatNumber(totals.pembayaran)}
                    </td>
                    <td className="p-2 border border-slate-300 text-right">
                      {formatNumber(totals.saldo)}
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
