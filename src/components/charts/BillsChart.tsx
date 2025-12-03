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
    // If it's already an RGB value, convert directly
    if (hsl.startsWith("#")) {
      const r = parseInt(hsl.slice(1, 3), 16);
      const g = parseInt(hsl.slice(3, 5), 16);
      const b = parseInt(hsl.slice(5, 7), 16);
      return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }

    // Parse HSL values
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

  return (
    <Card className="mt-6 sm:mt-8 border-border bg-card shadow-lg">
      <CardHeader className="pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <CardTitle className="flex items-center gap-2 text-foreground text-lg sm:text-xl">
              <TrendingUp className="w-5 h-5 text-primary" />
              Spending Overview
            </CardTitle>
            <CardDescription className="text-muted-foreground mt-1">
              Last 6 months spending trends
            </CardDescription>
          </div>
          <div className="flex items-center gap-4 text-xs sm:text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-primary"></div>
              <span className="text-muted-foreground">Total</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
              <span className="text-muted-foreground">Paid</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-amber-500"></div>
              <span className="text-muted-foreground">Pending</span>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {bills.length === 0 ? (
          <div className="h-64 flex items-center justify-center border-2 border-dashed border-border rounded-lg bg-muted/20">
            <div className="text-center">
              <TrendingUp className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
              <p className="text-muted-foreground text-sm">
                No data to display yet
              </p>
              <p className="text-muted-foreground/70 text-xs mt-1">
                Add bills to see your spending trends
              </p>
            </div>
          </div>
        ) : (
          <div className="h-64 sm:h-80 p-2 sm:p-4">
            <Line
              data={{
                labels: chartData.map((d) => d.label),
                datasets: [
                  {
                    label: "Total Spending",
                    data: chartData.map((d) => d.total),
                    borderColor: primaryColor,
                    backgroundColor: hslToRgba(getColor("--primary"), 0.1),
                    borderWidth: 3,
                    tension: 0.4,
                    fill: true,
                    pointRadius: 6,
                    pointHoverRadius: 8,
                    pointBackgroundColor: primaryColor,
                    pointBorderColor: foregroundColor,
                    pointBorderWidth: 2,
                    pointHoverBackgroundColor: primaryColor,
                    pointHoverBorderColor: foregroundColor,
                    pointHoverBorderWidth: 3,
                  },
                  {
                    label: "Paid",
                    data: chartData.map((d) => d.paid),
                    borderColor: "#10b981",
                    backgroundColor: "rgba(16, 185, 129, 0.1)",
                    borderWidth: 2,
                    tension: 0.4,
                    fill: true,
                    pointRadius: 5,
                    pointHoverRadius: 7,
                    pointBackgroundColor: "#10b981",
                    pointBorderColor: foregroundColor,
                    pointBorderWidth: 2,
                  },
                  {
                    label: "Pending",
                    data: chartData.map((d) => d.pending),
                    borderColor: "#f59e0b",
                    backgroundColor: "rgba(245, 158, 11, 0.1)",
                    borderWidth: 2,
                    tension: 0.4,
                    fill: true,
                    pointRadius: 5,
                    pointHoverRadius: 7,
                    pointBackgroundColor: "#f59e0b",
                    pointBorderColor: foregroundColor,
                    pointBorderWidth: 2,
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
                    padding: 12,
                    titleColor: "#fff",
                    bodyColor: "#fff",
                    borderColor: primaryColor,
                    borderWidth: 1,
                    displayColors: true,
                    boxPadding: 6,
                    usePointStyle: true,
                    callbacks: {
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
                        size: 11,
                      },
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
                        size: 11,
                      },
                      callback: function (tickValue) {
                        return "$" + tickValue;
                      },
                    },
                    border: {
                      display: false,
                    },
                  },
                },
              }}
            />
          </div>
        )}

        {/* Quick Stats Below Chart */}
        {bills.length > 0 && (
          <div className="grid grid-cols-3 gap-3 mt-6 pt-4 border-t border-border">
            <div className="text-center">
              <p className="text-xs text-muted-foreground mb-1">Avg. Monthly</p>
              <p className="text-lg font-bold text-primary">
                $
                {(
                  chartData.reduce((sum, d) => sum + d.total, 0) /
                  chartData.length
                ).toFixed(2)}
              </p>
            </div>
            <div className="text-center">
              <p className="text-xs text-muted-foreground mb-1">
                Highest Month
              </p>
              <p className="text-lg font-bold text-foreground">
                ${Math.max(...chartData.map((d) => d.total)).toFixed(2)}
              </p>
            </div>
            <div className="text-center">
              <p className="text-xs text-muted-foreground mb-1">This Month</p>
              <p className="text-lg font-bold text-foreground">
                ${chartData[chartData.length - 1]?.total.toFixed(2) || "0.00"}
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default BillsChart;
