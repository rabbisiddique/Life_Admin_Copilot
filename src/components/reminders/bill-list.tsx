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
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  Filter,
  Home,
  Plus,
  Search,
  Trash2,
  X,
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
import { createBillPaidNotification } from "../../../actions/notifications";
import { useAuth } from "../../../hooks/useAuth";
import { useBillNotifications } from "../../../hooks/useBillNotifications";
import { useKpis } from "../../../hooks/useKips";
import { createClient } from "../../../lib/supabase/client";
import { Bill } from "../../../type/index.bills";
import BillsChart from "../charts/BillsChart";
import Spinner from "../Spinner/Spinner";

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

// Hook to detect mobile screens
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  return isMobile;
}

// Bill Form Component (reusable for both Dialog and Drawer)
function BillForm({
  form,
  onSubmit,
  isCreating,
  editingBill,
}: {
  form: any;
  onSubmit: (data: BillFormData) => void;
  isCreating: boolean;
  editingBill: Bill | null;
}) {
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Bill Name</FormLabel>
              <FormControl>
                <Input
                  placeholder="e.g., Netflix"
                  {...field}
                  className="h-11"
                />
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
                  className="h-11"
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
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger className="h-11">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="subscription">Subscription</SelectItem>
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
                <Input type="datetime-local" {...field} className="h-11" />
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
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger className="h-11">
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
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger className="h-11">
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

        <Button
          type="submit"
          className="w-full h-11 bg-primary hover:bg-primary/90 text-primary-foreground"
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
      </form>
    </Form>
  );
}

export default function BillList() {
  const [bills, setBills] = useState<Bill[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [editingBill, setEditingBill] = useState<Bill | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const supabase = createClient();
  const { user } = useAuth();
  const isMobile = useIsMobile();

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
  const { totalAmount, paidCount, unpaidCount, upcomingBills } = useKpis(bills);

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

  useEffect(() => {
    if (bills.length === 0 && isLoading) return;

    const channel = supabase
      .channel("bills-changes")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "bills" },
        (payload) => {
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
          setBills((prev) => [payload.new as Bill, ...prev]);
        }
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "bills" },
        (payload) => {
          setBills((prev) => prev.filter((b) => b.id !== payload.old.id));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isLoading]);

  const handleMarkPaid = async (id: string) => {
    try {
      setBills((prev) =>
        prev.map((b) => (b.id === id ? { ...b, status: "paid" as const } : b))
      );

      const { data: updatedBill, error } = await supabase
        .from("bills")
        .update({ status: "paid" })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;

      await createBillPaidNotification(
        user?.id!,
        updatedBill.title,
        updatedBill.id
      );
      toast.success("Bill marked as paid!");
    } catch (err: any) {
      console.error("Error marking bill as paid:", err);
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

  const handleAdd = () => {
    setEditingBill(null);
    form.reset();
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

  useBillNotifications(bills, user?.id!);

  if (isLoading) {
    return <Spinner title={"Loading bills..."} />;
  }

  const BillFormModal = isMobile ? (
    <Drawer open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
      <DrawerTrigger asChild>
        <Button size="default" onClick={handleAdd} className="h-11 gap-2">
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Add Bill</span>
        </Button>
      </DrawerTrigger>
      <DrawerContent>
        <div className="mx-auto w-full max-w-sm">
          <DrawerHeader>
            <DrawerTitle>
              {editingBill ? "Edit Bill" : "Add New Bill"}
            </DrawerTitle>
            <DrawerDescription>
              {editingBill
                ? "Update bill information"
                : "Enter the details of your new bill"}
            </DrawerDescription>
          </DrawerHeader>
          <div className="px-4">
            <BillForm
              form={form}
              onSubmit={onSubmit}
              isCreating={isCreating}
              editingBill={editingBill}
            />
          </div>
          <DrawerFooter className="mt-[-6px]">
            <DrawerClose asChild>
              <Button variant="outline" className="h-11">
                Cancel
              </Button>
            </DrawerClose>
          </DrawerFooter>
        </div>
      </DrawerContent>
    </Drawer>
  ) : (
    <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
      <DialogTrigger asChild>
        <Button size="sm" onClick={handleAdd} className="gap-2">
          <Plus className="w-4 h-4" />
          Add Bill
        </Button>
      </DialogTrigger>
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
        <BillForm
          form={form}
          onSubmit={onSubmit}
          isCreating={isCreating}
          editingBill={editingBill}
        />
      </DialogContent>
    </Dialog>
  );

  const activeFilters = [
    filterCategory !== "all" && "category",
    filterStatus !== "all" && "status",
  ].filter(Boolean).length;

  return (
    <div className="space-y-4 sm:space-y-6 sm:p-4 md:p-6 mx-auto max-w-7xl w-full overflow-x-hidden">
      {/* Page Header */}
      <div className="space-y-1">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
          Bills Dashboard
        </h1>
        <p className="text-muted-foreground text-sm sm:text-base">
          Manage your finances efficiently
        </p>
      </div>

      {/* KPI Cards - Responsive Grid */}
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
              ${totalAmount.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {paidCount} bills
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
              {paidCount}
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
              {unpaidCount}
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
            {upcomingBills.length > 0 ? (
              upcomingBills.map((bill) => (
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

      {/* Bills List */}
      <Card>
        <CardHeader className="p-4 sm:p-6">
          <div className="space-y-4">
            {/* Title and Description */}
            <div>
              <CardTitle className="text-lg sm:text-xl">Your Bills</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Track and manage all your payments
              </p>
            </div>

            {/* Search and Actions - Mobile Optimized */}
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              {/* Search Bar */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search bills..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-11 md:h-10"
                />
                {searchQuery && (
                  <Button
                    size="icon"
                    variant="ghost"
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
                    onClick={() => setSearchQuery("")}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>

              {/* Filter and Add Button */}
              <div className="flex gap-2">
                {/* Mobile: Filter Toggle Button */}
                <Button
                  variant="outline"
                  size="default"
                  onClick={() => setShowFilters(!showFilters)}
                  className="sm:hidden h-11 flex-1"
                >
                  <Filter className="mr-2 h-4 w-4" />
                  Filter
                  {activeFilters > 0 && (
                    <span className="ml-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
                      {activeFilters}
                    </span>
                  )}
                </Button>

                {/* Desktop: Filter Dropdowns */}
                <div className="hidden sm:flex gap-2">
                  <Select
                    value={filterCategory}
                    onValueChange={setFilterCategory}
                  >
                    <SelectTrigger className="w-[140px] h-10">
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
                    <SelectTrigger className="w-[140px] h-10">
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

                {BillFormModal}
              </div>
            </div>

            {/* Mobile Filter Panel */}
            {showFilters && isMobile && (
              <Card className="p-4 border-2">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-semibold">Filters</Label>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowFilters(false)}
                      className="h-8 w-8 p-0"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <Label className="text-xs text-muted-foreground mb-1.5 block">
                        Category
                      </Label>
                      <Select
                        value={filterCategory}
                        onValueChange={setFilterCategory}
                      >
                        <SelectTrigger className="h-11">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Categories</SelectItem>
                          <SelectItem value="subscription">
                            Subscription
                          </SelectItem>
                          <SelectItem value="utility">Utility</SelectItem>
                          <SelectItem value="rent">Rent</SelectItem>
                          <SelectItem value="insurance">Insurance</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground mb-1.5 block">
                        Status
                      </Label>
                      <Select
                        value={filterStatus}
                        onValueChange={setFilterStatus}
                      >
                        <SelectTrigger className="h-11">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Status</SelectItem>
                          <SelectItem value="paid">Paid</SelectItem>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="overdue">Overdue</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  {activeFilters > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setFilterCategory("all");
                        setFilterStatus("all");
                        setShowFilters(false);
                      }}
                      className="w-full"
                    >
                      Clear Filters
                    </Button>
                  )}
                </div>
              </Card>
            )}
          </div>
        </CardHeader>

        <CardContent className="p-3 sm:p-6 pt-0">
          {/* Bills Grid */}
          {filteredBills.length === 0 ? (
            <div className="text-center py-12 sm:py-16 text-muted-foreground px-4">
              <div className="flex flex-col items-center gap-2">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <FileText className="w-8 h-8 sm:w-10 sm:h-10 text-primary" />
                </div>
                <h3 className="text-lg sm:text-xl font-semibold mb-2 text-foreground">
                  No bills found
                </h3>
                <p className="text-sm sm:text-base">
                  {searchQuery || activeFilters > 0
                    ? "Try adjusting your filters or search query"
                    : "Get started by adding your first bill"}
                </p>
                {(searchQuery || activeFilters > 0) && (
                  <Button
                    variant="link"
                    onClick={() => {
                      setSearchQuery("");
                      setFilterCategory("all");
                      setFilterStatus("all");
                    }}
                    className="text-sm mt-2"
                  >
                    Clear filters
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {filteredBills.map((bill) => (
                <Card
                  key={bill.id}
                  className="border-border bg-card hover:shadow-xl transition-all duration-300 hover:-translate-y-1 overflow-hidden"
                >
                  <CardHeader className="pb-3 p-3 sm:p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-base sm:text-lg font-semibold text-foreground truncate">
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
                        className={`${getStatusColor(
                          bill.status
                        )} ml-2 shrink-0 text-xs`}
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
                        <span className="hidden sm:inline">
                          {bill.status.charAt(0).toUpperCase() +
                            bill.status.slice(1)}
                        </span>
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="p-3 sm:p-4 pt-0">
                    <div className="space-y-2 sm:space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">
                          Amount
                        </span>
                        <span className="text-xl sm:text-2xl font-bold text-primary">
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
                      <div className="flex items-center justify-between pt-2 sm:pt-3 border-t border-border">
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
        </CardContent>
      </Card>

      {/* Analytics Chart */}
      <BillsChart bills={bills} />
    </div>
  );
}
