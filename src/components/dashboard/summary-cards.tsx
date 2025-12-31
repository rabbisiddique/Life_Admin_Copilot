"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { motion } from "framer-motion";
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  CreditCard,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { GetAllBillsAction } from "../../../actions/bills";
import { useKpis } from "../../../hooks/useKips";
import { createClient } from "../../../lib/supabase/client";
import { Bill } from "../../../type/index.bills";
import { Document } from "../../../type/index.documents";

export function SummaryCards() {
  const [isLoading, setIsLoading] = useState(false);
  const [bills, setBills] = useState<Bill[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const { upcomingBills } = useKpis(bills);
  const supabase = createClient();
  const calculateStatus = (
    expiryDate: string
  ): "valid" | "expiring" | "expired" => {
    if (!expiryDate) return "valid";
    const today = new Date();
    const expiry = new Date(expiryDate);
    const daysUntil = Math.ceil(
      (expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysUntil < 0) return "expired";
    if (daysUntil <= 30) return "expiring";
    return "valid";
  };

  const getDaysUntilExpiry = (expiryDate: string): number => {
    if (!expiryDate) return Infinity;
    const today = new Date();
    const expiry = new Date(expiryDate);
    return Math.ceil(
      (expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );
  };

  const attentionDocuments = documents
    .filter((doc) => {
      const status = calculateStatus(doc.expiry_date);
      return status === "expiring" || status === "expired";
    })
    .sort(
      (a, b) =>
        getDaysUntilExpiry(a.expiry_date) - getDaysUntilExpiry(b.expiry_date)
    )
    .slice(0, 2);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const billsRes = await GetAllBillsAction();

        if (billsRes.success) {
          setBills(billsRes?.data!);
        }
      } catch (error) {
        console.log(error);
        toast.error("Failed to load data");
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        setIsLoading(true);
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          toast.error("Please login first");
          return;
        }

        const { data, error } = await supabase
          .from("documents")
          .select("*")
          .eq("user_id", user.id)
          .order("upload_date", { ascending: false });

        if (error) throw error;

        // Calculate status for each document
        const docsWithStatus = (data || []).map((doc) => ({
          ...doc,
          status: calculateStatus(doc.expiry_date),
        }));

        setDocuments(docsWithStatus);
      } catch (err) {
        console.error("Fetch error:", err);
        toast.error("Failed to load documents");
      } finally {
        setIsLoading(false);
      }
    };
    fetchDocuments();
  }, []);

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
      >
        <Link href="/tasks" className="block h-full">
          <Card className="h-full bg-gradient-to-br from-card via-card to-accent/20 border-border/60 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer hover:border-primary/40 hover:-translate-y-1">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-semibold text-muted-foreground">
                Daily Progress
              </CardTitle>
              <div className="rounded-full bg-primary/10 p-2">
                <CheckCircle2 className="h-5 w-5 text-primary" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">8/12</div>
              <p className="text-sm text-muted-foreground mb-5">
                Tasks & habits completed
              </p>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium">67% Complete</span>
                  <span className="text-primary font-semibold">
                    Keep it up!
                  </span>
                </div>
                <Progress value={67} className="h-2.5" />
              </div>
            </CardContent>
          </Card>
        </Link>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1, ease: "easeOut" }}
      >
        <Link href="/bills" className="block h-full">
          <Card className="h-full bg-gradient-to-br from-card via-card to-orange-500/10 border-border/60 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer hover:border-orange-500/40 hover:-translate-y-1">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-semibold text-muted-foreground">
                Upcoming Bills
              </CardTitle>
              <div className="rounded-full bg-orange-500/10 p-2">
                <CreditCard className="h-5 w-5 text-orange-500" />
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-sm text-muted-foreground">Loading...</div>
              ) : (
                <>
                  <div className="text-3xl font-bold">
                    {" "}
                    $
                    {upcomingBills
                      .slice(0, 2)
                      .reduce((sum, bill) => sum + bill.amount, 0)
                      .toFixed(2)}
                  </div>
                  <p className="text-sm text-muted-foreground mb-5">
                    Due in next 7 days
                  </p>
                  <div className="space-y-3">
                    {upcomingBills.slice(0, 2).map((bill, index) => {
                      const daysUntil = getDaysUntilExpiry(bill.due_date);
                      const isUrgent = daysUntil <= 3;
                      return (
                        <div
                          key={bill.id || index}
                          className="flex items-center justify-between text-sm"
                        >
                          <div className="flex items-center gap-2">
                            <div
                              className={`h-2 w-2 rounded-full ${
                                isUrgent ? "bg-red-500" : "bg-orange-500"
                              } shadow-sm`}
                            />
                            <span className="font-medium">{bill.title}</span>
                          </div>
                          <span className="font-bold">
                            ${bill.amount.toFixed(2)}
                          </span>
                        </div>
                      );
                    })}
                    {upcomingBills.length === 0 && (
                      <p className="text-sm text-muted-foreground">
                        No upcoming bills
                      </p>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full h-8 text-xs mt-2 font-medium hover:bg-orange-500/10"
                    >
                      View all <ArrowRight className="ml-1 h-3 w-3" />
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </Link>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2, ease: "easeOut" }}
      >
        <Link href="/documents" className="block h-full">
          <Card className="h-full bg-gradient-to-br from-card via-card to-destructive/10 border-border/60 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer hover:border-destructive/40 hover:-translate-y-1">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-semibold text-muted-foreground">
                Attention Needed
              </CardTitle>
              <div className="rounded-full bg-destructive/10 p-2">
                <AlertCircle className="h-5 w-5 text-destructive" />
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-sm text-muted-foreground">Loading...</div>
              ) : (
                <>
                  <div className="text-3xl font-bold">
                    {attentionDocuments.length}{" "}
                    {attentionDocuments.length === 1 ? "Item" : "Items"}
                  </div>
                  <p className="text-sm text-muted-foreground mb-5">
                    Expiring soon
                  </p>
                  <div className="space-y-3">
                    {attentionDocuments.length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        All documents are up to date
                      </p>
                    ) : (
                      attentionDocuments.map((doc) => {
                        const daysUntil = getDaysUntilExpiry(doc.expiry_date);
                        const status = calculateStatus(doc.expiry_date);
                        const isExpired = status === "expired";
                        const isUrgent = daysUntil <= 14 && !isExpired;

                        return (
                          <div
                            key={doc.id}
                            className={`flex items-center gap-3 rounded-xl p-3 border ${
                              isExpired
                                ? "bg-destructive/10 border-destructive/20"
                                : isUrgent
                                ? "bg-yellow-500/10 border-yellow-500/20"
                                : "bg-orange-500/10 border-orange-500/20"
                            }`}
                          >
                            <AlertCircle
                              className={`h-4 w-4 flex-shrink-0 ${
                                isExpired
                                  ? "text-destructive"
                                  : isUrgent
                                  ? "text-yellow-600 dark:text-yellow-500"
                                  : "text-orange-500"
                              }`}
                            />
                            <div className="flex-1 text-sm">
                              <p
                                className={`font-semibold ${
                                  isExpired
                                    ? "text-destructive"
                                    : isUrgent
                                    ? "text-yellow-700 dark:text-yellow-400"
                                    : "text-orange-700 dark:text-orange-400"
                                }`}
                              >
                                {doc.title}
                              </p>
                              <p
                                className={`text-xs ${
                                  isExpired
                                    ? "text-destructive/80"
                                    : isUrgent
                                    ? "text-yellow-600/80 dark:text-yellow-400/80"
                                    : "text-orange-600/80 dark:text-orange-400/80"
                                }`}
                              >
                                {isExpired
                                  ? `Expired ${Math.abs(daysUntil)} days ago`
                                  : `${
                                      daysUntil === 0
                                        ? "Expires today"
                                        : `Expires in ${daysUntil} ${
                                            daysUntil === 1 ? "day" : "days"
                                          }`
                                    }`}
                              </p>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </Link>
      </motion.div>
    </div>
  );
}
