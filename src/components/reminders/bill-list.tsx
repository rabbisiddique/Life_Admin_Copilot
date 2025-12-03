"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Title,
  Tooltip,
} from "chart.js";
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  Clock,
  CreditCard,
  DollarSign,
  Edit2,
  FileText,
  Home,
  Plus,
  Search,
  Trash2,
  Zap,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { z } from "zod";
import {
  CreateBillsAction,
  DeleteBillsAction,
  GetAllBillsAction,
  UpdateBillsAction,
} from "../../../actions/bills";
import { createClient } from "../../../lib/supabase/client";
import { Bill } from "../../../type/index.bills";
import Spinner from "../Spinner/Spinner";
import BillsChart from "../charts/BillsChart";

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);
// Zod Schema
export const billSchema = z.object({
  title: z.string().min(1, "Bill name is required"),
  amount: z.coerce
    .number({ invalid_type_error: "Amount must be a number" })
    .positive("Amount must be positive"),
  category: z.enum(["subscription", "utility", "rent", "insurance", "other"]),
  due_date: z
    .string()
    .min(1, "Due date is required")
    .refine((date) => !isNaN(Date.parse(date)), "Invalid date format"),
  recurrence: z.enum(["monthly", "yearly", "one-time"]).optional(),
  status: z.enum(["paid", "pending", "overdue"]),
});

export type BillFormData = z.infer<typeof billSchema>;

const categoryIcons = {
  subscription: FileText,
  utility: Zap,
  rent: Home,
  insurance: CreditCard,
  other: DollarSign,
};

export default function BillList() {
  const [bills, setBills] = useState<Bill[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [editingBill, setEditingBill] = useState<Bill | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const supabase = createClient();

  // React Hook Form with Zod
  const form = useForm<BillFormData>({
    resolver: zodResolver(billSchema),
    defaultValues: {
      title: "",
      amount: 0,
      category: "subscription",
      due_date: "",
      recurrence: "monthly",
      status: "pending",
    },
  });

  // Calculate KPIs
  const kpis = useMemo(() => {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    const thisMonthBills = bills.filter((bill) => {
      const billDate = new Date(bill.due_date);
      return (
        billDate.getMonth() === currentMonth &&
        billDate.getFullYear() === currentYear
      );
    });

    const totalAmount = thisMonthBills.reduce(
      (sum, bill) => sum + bill.amount,
      0
    );
    const paidCount = thisMonthBills.filter((b) => b.status === "paid").length;
    const unpaidCount = thisMonthBills.filter(
      (b) => b.status !== "paid"
    ).length;

    const upcomingBills = bills
      .filter((b) => b.status !== "paid" && new Date(b.due_date) >= new Date())
      .sort(
        (a, b) =>
          new Date(a.due_date).getTime() - new Date(b.due_date).getTime()
      )
      .slice(0, 3);

    return { totalAmount, paidCount, unpaidCount, upcomingBills };
  }, [bills]);

  // Filtered bills
  const filteredBills = useMemo(() => {
    return bills.filter((bill) => {
      const matchesSearch = bill.title
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
      const matchesCategory =
        filterCategory === "all" || bill.category === filterCategory;
      const matchesStatus =
        filterStatus === "all" || bill.status === filterStatus;
      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [bills, searchQuery, filterCategory, filterStatus]);

  // Handlers
  const onSubmit = async (data: BillFormData) => {
    setIsCreating(true);
    try {
      if (!editingBill) {
        const res = await CreateBillsAction(data);
        if (res.success) {
          toast.success(res.message);
          handleCloseModal();
          form.reset();
        }
      } else {
        const res = await UpdateBillsAction(data, editingBill.id);
        if (res.success) {
          toast.success(res.message);
          handleCloseModal();
        }
      }
    } catch (error) {
      console.log(error);
    } finally {
      setIsCreating(false);
    }
  };

  useEffect(() => {
    const loadBills = async () => {
      setIsLoading(true);
      try {
        const res = await GetAllBillsAction();
        if (res.success) {
          setBills(res?.data!);
        }
      } catch (error) {
        console.log(error);
        toast.error("Failed to load bills");
      } finally {
        setIsLoading(false);
      }
    };
    loadBills();
  }, []);

  // 2. Then set up real-time subscription (runs after initial load)
  useEffect(() => {
    // Don't set up real-time until we have initial data
    if (bills.length === 0 && isLoading) return;

    const channel = supabase
      .channel("bills-changes")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "bills" },
        (payload) => {
          console.log("Realtime UPDATE payload:", payload);

          // Use payload.new directly - it contains the updated bill
          setBills((prev) =>
            prev.map((b) =>
              b.id === payload.new.id ? (payload.new as Bill) : b
            )
          );
        }
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "bills" },
        (payload) => {
          console.log("Realtime INSERT payload:", payload);
          setBills((prev) => [payload.new as Bill, ...prev]);
        }
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "bills" },
        (payload) => {
          console.log("Realtime DELETE payload:", payload);
          setBills((prev) => prev.filter((b) => b.id !== payload.old.id));
        }
      )
      .subscribe((status) => {
        console.log("Channel subscription status:", status);
        if (status === "SUBSCRIBED") {
          console.log("Successfully subscribed to bills changes");
        }
      });

    return () => {
      console.log("Cleaning up real-time subscription");
      supabase.removeChannel(channel);
    };
  }, [isLoading]); // Only re-subscribe if loading state changes

  // 3. Fixed handleMarkPaid function
  const handleMarkPaid = async (id: string) => {
    try {
      // Optimistically update UI first for better UX
      setBills((prev) =>
        prev.map((b) => (b.id === id ? { ...b, status: "paid" as const } : b))
      );

      // Call API to update bill
      const { data: updatedBill, error } = await supabase
        .from("bills")
        .update({ status: "paid" })
        .eq("id", id)
        .select()
        .single();

      if (error) {
        // Revert optimistic update on error
        throw error;
      }

      // Real-time will handle the update, but we already updated optimistically
      toast.success("Bill marked as paid!");
    } catch (err: any) {
      console.error("Error marking bill as paid:", err);

      // Revert the optimistic update
      const res = await GetAllBillsAction();
      if (res.success) {
        setBills(res?.data!);
      }

      toast.error(err.message || "Failed to mark bill as paid");
    }
  };

  const handleCloseModal = () => {
    setIsAddModalOpen(false);
    setEditingBill(null);
    form.reset();
  };

  const handleEdit = (bill: Bill) => {
    setEditingBill(bill);
    setIsAddModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await DeleteBillsAction(id);
      if (res.success) {
        toast.success(res.message);
      }
    } catch (error) {
      console.log(error);
    }
  };

  const getStatusColor = (status: Bill["status"]) => {
    switch (status) {
      case "paid":
        return "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:text-emerald-400";
      case "overdue":
        return "bg-red-500/10 text-red-600 border-red-500/20 dark:text-red-400";
      default:
        return "bg-amber-500/10 text-amber-600 border-amber-500/20 dark:text-amber-400";
    }
  };

  const getCategoryIcon = (category: Bill["category"]) => {
    const Icon = categoryIcons[category];
    return <Icon className="w-4 h-4" />;
  };

  useEffect(() => {
    if (editingBill) {
      form.reset({
        title: editingBill.title,
        amount: editingBill.amount,
        category: editingBill.category,
        due_date: editingBill.due_date,
        recurrence: editingBill.recurrence || "monthly",
        status: editingBill.status,
      });
    } else {
      form.reset({
        title: "",
        amount: 0,
        category: "subscription",
        due_date: "",
        recurrence: "monthly",
        status: "pending",
      });
    }
  }, [editingBill, form]);

  if (isLoading) {
    return (
      <>
        <Spinner title={"Loading bills..."} />
      </>
    );
  }

  return (
    <>
      {/* Header */}
      <header className="border-b border-border bg-card/80 backdrop-blur-lg">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 sm:p-3 rounded-xl bg-primary shadow-lg shadow-primary/30">
                <DollarSign className="w-5 h-5 sm:w-6 sm:h-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-primary">
                  Bills Dashboard
                </h1>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Manage your finances efficiently
                </p>
              </div>
            </div>
            <Button
              onClick={() => {
                form.reset();
                setEditingBill(null);
                setIsAddModalOpen(true);
              }}
              className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/30"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Add Bill</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-12">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <Card className="border-border bg-card hover:shadow-xl hover:shadow-primary/10 transition-all duration-300 hover:-translate-y-1">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total This Month
              </CardTitle>
              <div className="p-2 rounded-lg bg-primary/10">
                <DollarSign className="w-4 h-4 text-primary" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl sm:text-3xl font-bold text-primary">
                ${kpis.totalAmount.toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {kpis.paidCount} bills
              </p>
            </CardContent>
          </Card>

          <Card className="border-border bg-card hover:shadow-xl hover:shadow-emerald-500/10 transition-all duration-300 hover:-translate-y-1">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Paid Bills
              </CardTitle>
              <div className="p-2 rounded-lg bg-emerald-500/10">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl sm:text-3xl font-bold text-emerald-600 dark:text-emerald-400">
                {kpis.paidCount}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Completed payments
              </p>
            </CardContent>
          </Card>

          <Card className="border-border bg-card hover:shadow-xl hover:shadow-amber-500/10 transition-all duration-300 hover:-translate-y-1">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Unpaid Bills
              </CardTitle>
              <div className="p-2 rounded-lg bg-amber-500/10">
                <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl sm:text-3xl font-bold text-amber-600 dark:text-amber-400">
                {kpis.unpaidCount}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Pending payments
              </p>
            </CardContent>
          </Card>

          <Card className="border-border bg-card hover:shadow-xl hover:shadow-primary/10 transition-all duration-300 hover:-translate-y-1">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Next Due
              </CardTitle>
              <div className="p-2 rounded-lg bg-primary/10">
                <Calendar className="w-4 h-4 text-primary" />
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {kpis.upcomingBills.length > 0 ? (
                kpis.upcomingBills.map((bill) => (
                  <div
                    key={bill.id}
                    className="flex justify-between items-center"
                  >
                    <span className="text-sm font-medium text-foreground truncate">
                      {bill.title}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(bill.due_date).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-sm text-muted-foreground">
                  No upcoming bills
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
        <Card className="mb-6 border-border bg-card">
          <CardContent className="pt-4 sm:pt-6">
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search bills..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 border-input focus:border-ring focus:ring-ring"
                />
              </div>
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="subscription">Subscription</SelectItem>
                  <SelectItem value="utility">Utility</SelectItem>
                  <SelectItem value="rent">Rent</SelectItem>
                  <SelectItem value="insurance">Insurance</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Bills Grid */}
        {filteredBills.length === 0 ? (
          <Card className="border-dashed border-2 border-border bg-card/50">
            <CardContent className="flex flex-col items-center justify-center py-12 sm:py-16">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <FileText className="w-8 h-8 sm:w-10 sm:h-10 text-primary" />
              </div>
              <h3 className="text-lg sm:text-xl font-semibold mb-2 text-foreground">
                No bills found
              </h3>
              <p className="text-muted-foreground text-center mb-6 max-w-sm text-sm sm:text-base px-4">
                {searchQuery ||
                filterCategory !== "all" ||
                filterStatus !== "all"
                  ? "Try adjusting your filters or search query"
                  : "Get started by adding your first bill to track your expenses"}
              </p>
              <Button
                onClick={() => setIsAddModalOpen(true)}
                className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                <Plus className="w-4 h-4" />
                Add Your First Bill
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {filteredBills.map((bill) => (
              <Card
                key={bill.id}
                className="border-border bg-card hover:shadow-xl transition-all duration-300 hover:-translate-y-1 overflow-hidden"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg font-semibold text-foreground truncate">
                        {bill.title}
                      </CardTitle>
                      <div className="flex items-center gap-2 mt-2">
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          {getCategoryIcon(bill.category)}
                          <span className="capitalize">{bill.category}</span>
                        </div>
                      </div>
                    </div>
                    <Badge
                      variant="outline"
                      className={`${getStatusColor(bill.status)} ml-2 shrink-0`}
                    >
                      {bill.status === "paid" && (
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                      )}
                      {bill.status === "overdue" && (
                        <AlertCircle className="w-3 h-3 mr-1" />
                      )}
                      {bill.status === "pending" && (
                        <Clock className="w-3 h-3 mr-1" />
                      )}
                      {bill.status.charAt(0).toUpperCase() +
                        bill.status.slice(1)}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">
                        Amount
                      </span>
                      <span className="text-2xl font-bold text-primary">
                        ${bill.amount.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">
                        Due Date
                      </span>
                      <span className="text-sm font-medium text-foreground">
                        {new Date(bill.due_date).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </span>
                    </div>
                    <div className="flex items-center justify-between pt-3 border-t border-border">
                      <span className="text-xs text-muted-foreground capitalize">
                        {bill.recurrence} payment
                      </span>
                      <div className="flex items-center gap-1">
                        {bill.status !== "paid" && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleMarkPaid(bill.id)}
                            className="h-8 w-8 p-0 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-500/10"
                            title="Mark as paid"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleEdit(bill)}
                          className="h-8 w-8 p-0 hover:bg-accent hover:text-accent-foreground"
                          title="Edit bill"
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDelete(bill.id)}
                          className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-500/10"
                          title="Delete bill"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Analytics Chart Placeholder */}
        <BillsChart bills={bills} />
      </main>

      {/* Add/Edit Bill Modal with React Hook Form */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingBill ? "Edit Bill" : "Add New Bill"}
            </DialogTitle>
            <DialogDescription>
              {editingBill
                ? "Update bill information"
                : "Enter the details of your new bill"}
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bill Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Netflix" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="subscription">
                          Subscription
                        </SelectItem>
                        <SelectItem value="utility">Utility</SelectItem>
                        <SelectItem value="rent">Rent</SelectItem>
                        <SelectItem value="insurance">Insurance</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="due_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Due Date</FormLabel>
                    <FormControl>
                      <Input type="datetime-local" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="recurrence"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Recurrence</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="monthly">Monthly</SelectItem>
                        <SelectItem value="yearly">Yearly</SelectItem>
                        <SelectItem value="one-time">One-time</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="paid">Paid</SelectItem>
                        <SelectItem value="overdue">Overdue</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex gap-3 justify-end pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCloseModal}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="bg-primary hover:bg-primary/90 text-primary-foreground"
                  disabled={isCreating}
                >
                  {isCreating
                    ? editingBill
                      ? "Updating..."
                      : "Creating..."
                    : editingBill
                    ? "Update Bill"
                    : "Add Bill"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  );
}
