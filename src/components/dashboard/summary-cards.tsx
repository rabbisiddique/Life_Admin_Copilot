"use client"

import { CheckCircle2, AlertCircle, CreditCard, ArrowRight } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"
import Link from "next/link"

export function SummaryCards() {
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
              <CardTitle className="text-sm font-semibold text-muted-foreground">Daily Progress</CardTitle>
              <div className="rounded-full bg-primary/10 p-2">
                <CheckCircle2 className="h-5 w-5 text-primary" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">8/12</div>
              <p className="text-sm text-muted-foreground mb-5">Tasks & habits completed</p>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium">67% Complete</span>
                  <span className="text-primary font-semibold">Keep it up!</span>
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
              <CardTitle className="text-sm font-semibold text-muted-foreground">Upcoming Bills</CardTitle>
              <div className="rounded-full bg-orange-500/10 p-2">
                <CreditCard className="h-5 w-5 text-orange-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">$142.00</div>
              <p className="text-sm text-muted-foreground mb-5">Due in next 7 days</p>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-red-500 shadow-sm" />
                    <span className="font-medium">Netflix</span>
                  </div>
                  <span className="font-bold">$15.00</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-orange-500 shadow-sm" />
                    <span className="font-medium">Internet</span>
                  </div>
                  <span className="font-bold">$89.00</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full h-8 text-xs mt-2 font-medium hover:bg-orange-500/10"
                >
                  View all <ArrowRight className="ml-1 h-3 w-3" />
                </Button>
              </div>
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
              <CardTitle className="text-sm font-semibold text-muted-foreground">Attention Needed</CardTitle>
              <div className="rounded-full bg-destructive/10 p-2">
                <AlertCircle className="h-5 w-5 text-destructive" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">2 Items</div>
              <p className="text-sm text-muted-foreground mb-5">Expiring soon</p>
              <div className="space-y-3">
                <div className="flex items-center gap-3 rounded-xl bg-destructive/10 p-3 border border-destructive/20">
                  <AlertCircle className="h-4 w-4 text-destructive flex-shrink-0" />
                  <div className="flex-1 text-sm">
                    <p className="font-semibold text-destructive">Passport</p>
                    <p className="text-xs text-destructive/80">Expires in 28 days</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-xl bg-yellow-500/10 p-3 border border-yellow-500/20">
                  <AlertCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-500 flex-shrink-0" />
                  <div className="flex-1 text-sm">
                    <p className="font-semibold text-yellow-700 dark:text-yellow-400">Car Insurance</p>
                    <p className="text-xs text-yellow-600/80 dark:text-yellow-400/80">Renew in 45 days</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
      </motion.div>
    </div>
  )
}
