import { TrendingUp } from "lucide-react";
import { useMemo } from "react";
import { Line } from "react-chartjs-2";
import { Bill } from "../../../type/index.bills";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";

const BillsChart = ({ bills }: { bills: Bill[] }) => {
  const getMonthlySpendingData = (bills: Bill[]) => {
    const months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];

    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    // Get last 6 months including current
    const last6Months = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date(currentYear, currentMonth - i, 1);
      last6Months.push({
        month: months[date.getMonth()],
        year: date.getFullYear(),
        monthIndex: date.getMonth(),
      });
    }

    // Calculate spending for each month
    const monthlyData = last6Months.map(({ month, year, monthIndex }) => {
      const monthBills = bills.filter((bill) => {
        const billDate = new Date(bill.due_date);
        return (
          billDate.getMonth() === monthIndex && billDate.getFullYear() === year
        );
      });

      const total = monthBills.reduce((sum, bill) => sum + bill.amount, 0);
      const paid = monthBills
        .filter((b) => b.status === "paid")
        .reduce((sum, b) => sum + b.amount, 0);
      const pending = monthBills
        .filter((b) => b.status === "pending")
        .reduce((sum, b) => sum + b.amount, 0);

      return {
        label: `${month} ${year}`,
        shortLabel: month, // For mobile
        total,
        paid,
        pending,
      };
    });

    return monthlyData;
  };

  const chartData = useMemo(() => getMonthlySpendingData(bills), [bills]);

  // Get CSS variable colors for theme compatibility
  const getColor = (cssVar: string) => {
    if (typeof window === "undefined") return "#000";
    return getComputedStyle(document.documentElement)
      .getPropertyValue(cssVar)
      .trim();
  };

  // Convert HSL to RGBA for backgrounds
  const hslToRgba = (hsl: string, alpha: number) => {
    if (hsl.startsWith("#")) {
      const r = parseInt(hsl.slice(1, 3), 16);
      const g = parseInt(hsl.slice(3, 5), 16);
      const b = parseInt(hsl.slice(5, 7), 16);
      return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }

    const [h, s, l] = hsl.split(" ").map((v) => parseFloat(v));
    const sDecimal = s / 100;
    const lDecimal = l / 100;

    const c = (1 - Math.abs(2 * lDecimal - 1)) * sDecimal;
    const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
    const m = lDecimal - c / 2;

    let r = 0,
      g = 0,
      b = 0;
    if (h < 60) {
      r = c;
      g = x;
      b = 0;
    } else if (h < 120) {
      r = x;
      g = c;
      b = 0;
    } else if (h < 180) {
      r = 0;
      g = c;
      b = x;
    } else if (h < 240) {
      r = 0;
      g = x;
      b = c;
    } else if (h < 300) {
      r = x;
      g = 0;
      b = c;
    } else {
      r = c;
      g = 0;
      b = x;
    }

    return `rgba(${Math.round((r + m) * 255)}, ${Math.round(
      (g + m) * 255
    )}, ${Math.round((b + m) * 255)}, ${alpha})`;
  };

  const primaryColor = `hsl(${getColor("--primary")})`;
  const foregroundColor = `hsl(${getColor("--foreground")})`;
  const mutedForegroundColor = `hsl(${getColor("--muted-foreground")})`;
  const borderColor = `hsl(${getColor("--border")})`;

  // Calculate stats
  const avgMonthly =
    chartData.reduce((sum, d) => sum + d.total, 0) / chartData.length;
  const highestMonth = Math.max(...chartData.map((d) => d.total));
  const thisMonth = chartData[chartData.length - 1]?.total || 0;
  const totalPaid = chartData.reduce((sum, d) => sum + d.paid, 0);
  const totalPending = chartData.reduce((sum, d) => sum + d.pending, 0);

  return (
    <Card className="border-border bg-card overflow-hidden w-full max-w-full">
      <CardHeader className="p-3 sm:p-4 md:p-6 pb-2 sm:pb-3">
        <div className="flex flex-col gap-3 sm:gap-4">
          {/* Title and Legend */}
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
            <div className="space-y-1">
              <CardTitle className="flex items-center gap-2 text-foreground text-base sm:text-lg md:text-xl">
                <div className="p-1.5 sm:p-2 rounded-lg bg-primary/10">
                  <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                </div>
                Spending Overview
              </CardTitle>
              <CardDescription className="text-muted-foreground text-xs sm:text-sm">
                Last 6 months spending trends
              </CardDescription>
            </div>

            {/* Legend - Desktop */}
            <div className="hidden sm:flex items-center gap-3 lg:gap-4">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-primary"></div>
                <span className="text-xs text-muted-foreground">Total</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                <span className="text-xs text-muted-foreground">Paid</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                <span className="text-xs text-muted-foreground">Pending</span>
              </div>
            </div>
          </div>

          {/* Legend - Mobile (Compact) */}
          <div className="flex sm:hidden items-center justify-center gap-4 pb-2 border-b border-border">
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-primary"></div>
              <span className="text-xs text-muted-foreground">Total</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500"></div>
              <span className="text-xs text-muted-foreground">Paid</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-amber-500"></div>
              <span className="text-xs text-muted-foreground">Pending</span>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-3 sm:p-4 md:p-6 pt-2 sm:pt-3">
        {bills.length === 0 ? (
          <div className="h-48 sm:h-64 flex items-center justify-center border-2 border-dashed border-border rounded-lg bg-muted/20">
            <div className="text-center px-4">
              <TrendingUp className="w-10 h-10 sm:w-12 sm:h-12 text-muted-foreground/50 mx-auto mb-2 sm:mb-3" />
              <p className="text-muted-foreground text-sm sm:text-base font-medium">
                No data to display yet
              </p>
              <p className="text-muted-foreground/70 text-xs sm:text-sm mt-1">
                Add bills to see your spending trends
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Chart */}
            <div className="h-48 sm:h-64 md:h-80 mb-4 sm:mb-6">
              <Line
                data={{
                  labels: chartData.map((d) => d.shortLabel),
                  datasets: [
                    {
                      label: "Total Spending",
                      data: chartData.map((d) => d.total),
                      borderColor: primaryColor,
                      backgroundColor: hslToRgba(getColor("--primary"), 0.1),
                      borderWidth: 2,
                      tension: 0.4,
                      fill: true,
                      pointRadius: 3,
                      pointHoverRadius: 6,
                      pointBackgroundColor: primaryColor,
                      pointBorderColor: foregroundColor,
                      pointBorderWidth: 2,
                      pointHoverBackgroundColor: primaryColor,
                      pointHoverBorderColor: foregroundColor,
                      pointHoverBorderWidth: 2,
                    },
                    {
                      label: "Paid",
                      data: chartData.map((d) => d.paid),
                      borderColor: "#10b981",
                      backgroundColor: "rgba(16, 185, 129, 0.05)",
                      borderWidth: 2,
                      tension: 0.4,
                      fill: true,
                      pointRadius: 2,
                      pointHoverRadius: 5,
                      pointBackgroundColor: "#10b981",
                      pointBorderColor: foregroundColor,
                      pointBorderWidth: 1,
                    },
                    {
                      label: "Pending",
                      data: chartData.map((d) => d.pending),
                      borderColor: "#f59e0b",
                      backgroundColor: "rgba(245, 158, 11, 0.05)",
                      borderWidth: 2,
                      tension: 0.4,
                      fill: true,
                      pointRadius: 2,
                      pointHoverRadius: 5,
                      pointBackgroundColor: "#f59e0b",
                      pointBorderColor: foregroundColor,
                      pointBorderWidth: 1,
                    },
                  ],
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  interaction: {
                    mode: "index" as const,
                    intersect: false,
                  },
                  plugins: {
                    legend: {
                      display: false,
                    },
                    tooltip: {
                      enabled: true,
                      backgroundColor: "rgba(0, 0, 0, 0.9)",
                      padding: 8,
                      titleColor: "#fff",
                      bodyColor: "#fff",
                      titleFont: {
                        size: 12,
                      },
                      bodyFont: {
                        size: 11,
                      },
                      borderColor: primaryColor,
                      borderWidth: 1,
                      displayColors: true,
                      boxPadding: 4,
                      usePointStyle: true,
                      callbacks: {
                        title: function (context) {
                          return chartData[context[0].dataIndex].label;
                        },
                        label: function (context) {
                          let label = context.dataset.label || "";
                          if (label) {
                            label += ": ";
                          }
                          if (context.parsed.y !== null) {
                            label += "$" + context.parsed.y.toFixed(2);
                          }
                          return label;
                        },
                      },
                    },
                  },
                  scales: {
                    x: {
                      grid: {
                        display: false,
                      },
                      ticks: {
                        color: mutedForegroundColor,
                        font: {
                          size: 10,
                        },
                        maxRotation: 0,
                        minRotation: 0,
                      },
                      border: {
                        display: false,
                      },
                    },
                    y: {
                      beginAtZero: true,
                      grid: {
                        color: borderColor,
                        lineWidth: 1,
                      },
                      ticks: {
                        color: mutedForegroundColor,
                        font: {
                          size: 10,
                        },
                        callback: function (tickValue) {
                          return "$" + tickValue;
                        },
                        maxTicksLimit: 5,
                      },
                      border: {
                        display: false,
                      },
                    },
                  },
                }}
              />
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3 pt-3 sm:pt-4 border-t border-border">
              <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
                <CardContent className="p-2 sm:p-3 text-center">
                  <p className="text-[10px] sm:text-xs text-muted-foreground mb-1">
                    Avg. Monthly
                  </p>
                  <p className="text-sm sm:text-base md:text-lg font-bold text-primary">
                    ${avgMonthly.toFixed(2)}
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-card to-muted/30 border-border/50">
                <CardContent className="p-2 sm:p-3 text-center">
                  <p className="text-[10px] sm:text-xs text-muted-foreground mb-1">
                    Highest
                  </p>
                  <p className="text-sm sm:text-base md:text-lg font-bold text-foreground">
                    ${highestMonth.toFixed(2)}
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-card to-muted/30 border-border/50 col-span-2 sm:col-span-1">
                <CardContent className="p-2 sm:p-3 text-center">
                  <p className="text-[10px] sm:text-xs text-muted-foreground mb-1">
                    This Month
                  </p>
                  <p className="text-sm sm:text-base md:text-lg font-bold text-foreground">
                    ${thisMonth.toFixed(2)}
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-emerald-500/5 to-emerald-500/10 border-emerald-500/20">
                <CardContent className="p-2 sm:p-3 text-center">
                  <p className="text-[10px] sm:text-xs text-muted-foreground mb-1">
                    Total Paid
                  </p>
                  <p className="text-sm sm:text-base md:text-lg font-bold text-emerald-600 dark:text-emerald-400">
                    ${totalPaid.toFixed(2)}
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-amber-500/5 to-amber-500/10 border-amber-500/20">
                <CardContent className="p-2 sm:p-3 text-center">
                  <p className="text-[10px] sm:text-xs text-muted-foreground mb-1">
                    Total Pending
                  </p>
                  <p className="text-sm sm:text-base md:text-lg font-bold text-amber-600 dark:text-amber-400">
                    ${totalPending.toFixed(2)}
                  </p>
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default BillsChart;
