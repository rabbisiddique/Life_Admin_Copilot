"use client"

import { motion } from "framer-motion"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from "recharts"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowUpRight, ArrowDownRight, TrendingUp, DollarSign, Activity, Target, Calendar } from "lucide-react"

const spendingData = [
  { name: "Jan", amount: 1200 },
  { name: "Feb", amount: 1900 },
  { name: "Mar", amount: 1500 },
  { name: "Apr", amount: 2100 },
  { name: "May", amount: 1800 },
  { name: "Jun", amount: 2400 },
]

const categoryData = [
  { name: "Rent", value: 1200, color: "#f97316" }, // Orange-500
  { name: "Utilities", value: 300, color: "#3b82f6" }, // Blue-500
  { name: "Groceries", value: 450, color: "#10b981" }, // Emerald-500
  { name: "Entertainment", value: 200, color: "#8b5cf6" }, // Violet-500
  { name: "Transport", value: 150, color: "#ec4899" }, // Pink-500
]

const habitData = [
  { day: "Mon", completed: 4 },
  { day: "Tue", completed: 3 },
  { day: "Wed", completed: 5 },
  { day: "Thu", completed: 4 },
  { day: "Fri", completed: 5 },
  { day: "Sat", completed: 2 },
  { day: "Sun", completed: 3 },
]

export default function AnalyticsPage() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  }

  return (
    <div className="space-y-8 p-8 pt-6">
      <div className="flex items-center justify-between">
        <div>
          <motion.h2
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent"
          >
            Analytics & Insights
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="text-muted-foreground mt-2"
          >
            Track your productivity and financial health with detailed visualizations
          </motion.p>
        </div>
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Last 6 months</span>
        </motion.div>
      </div>

      <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <motion.div variants={itemVariants} whileHover={{ scale: 1.02, y: -4 }} transition={{ duration: 0.2 }}>
            <Card className="border-orange-500/20 bg-gradient-to-br from-orange-500/5 to-transparent hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Spending</CardTitle>
                <div className="h-8 w-8 rounded-full bg-orange-500/10 flex items-center justify-center">
                  <DollarSign className="h-4 w-4 text-orange-500" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">$2,400.00</div>
                <p className="text-xs text-muted-foreground flex items-center mt-1">
                  <ArrowUpRight className="mr-1 h-4 w-4 text-red-500" />
                  <span className="text-red-500 font-medium">+12%</span> from last month
                </p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={itemVariants} whileHover={{ scale: 1.02, y: -4 }} transition={{ duration: 0.2 }}>
            <Card className="border-green-500/20 bg-gradient-to-br from-green-500/5 to-transparent hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Habit Completion</CardTitle>
                <div className="h-8 w-8 rounded-full bg-green-500/10 flex items-center justify-center">
                  <Activity className="h-4 w-4 text-green-500" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">85%</div>
                <p className="text-xs text-muted-foreground flex items-center mt-1">
                  <ArrowUpRight className="mr-1 h-4 w-4 text-green-500" />
                  <span className="text-green-500 font-medium">+5%</span> from last week
                </p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={itemVariants} whileHover={{ scale: 1.02, y: -4 }} transition={{ duration: 0.2 }}>
            <Card className="border-blue-500/20 bg-gradient-to-br from-blue-500/5 to-transparent hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Productivity Score</CardTitle>
                <div className="h-8 w-8 rounded-full bg-blue-500/10 flex items-center justify-center">
                  <TrendingUp className="h-4 w-4 text-blue-500" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">92</div>
                <p className="text-xs text-muted-foreground flex items-center mt-1">
                  <ArrowDownRight className="mr-1 h-4 w-4 text-red-500" />
                  <span className="text-red-500 font-medium">-2</span> from yesterday
                </p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={itemVariants} whileHover={{ scale: 1.02, y: -4 }} transition={{ duration: 0.2 }}>
            <Card className="border-purple-500/20 bg-gradient-to-br from-purple-500/5 to-transparent hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Goals Achieved</CardTitle>
                <div className="h-8 w-8 rounded-full bg-purple-500/10 flex items-center justify-center">
                  <Target className="h-4 w-4 text-purple-500" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">12/15</div>
                <p className="text-xs text-muted-foreground flex items-center mt-1">
                  <ArrowUpRight className="mr-1 h-4 w-4 text-green-500" />
                  <span className="text-green-500 font-medium">80%</span> success rate
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        <Tabs defaultValue="financial" className="space-y-4">
          <TabsList className="bg-muted/50 p-1">
            <TabsTrigger
              value="financial"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              Financial
            </TabsTrigger>
            <TabsTrigger
              value="habits"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              Habits & Tasks
            </TabsTrigger>
          </TabsList>

          <TabsContent value="financial" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
              <motion.div variants={itemVariants} className="col-span-4">
                <Card className="border-primary/20 hover:shadow-xl transition-shadow">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                      Monthly Spending
                    </CardTitle>
                    <CardDescription>Your spending trend over the last 6 months</CardDescription>
                  </CardHeader>
                  <CardContent className="pl-2">
                    <ResponsiveContainer width="100%" height={350}>
                      <BarChart data={spendingData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-muted" />
                        <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis
                          stroke="#888888"
                          fontSize={12}
                          tickLine={false}
                          axisLine={false}
                          tickFormatter={(value) => `$${value}`}
                        />
                        <Tooltip
                          cursor={{ fill: "hsl(var(--primary) / 0.1)" }}
                          contentStyle={{
                            borderRadius: "12px",
                            border: "1px solid hsl(var(--border))",
                            boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
                            background: "hsl(var(--background))",
                          }}
                        />
                        <Bar dataKey="amount" fill="currentColor" radius={[8, 8, 0, 0]} className="fill-primary" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div variants={itemVariants} className="col-span-3">
                <Card className="border-primary/20 hover:shadow-xl transition-shadow">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                      Spending by Category
                    </CardTitle>
                    <CardDescription>Where your money went this month</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={categoryData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {categoryData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            borderRadius: "12px",
                            border: "1px solid hsl(var(--border))",
                            boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
                            background: "hsl(var(--background))",
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="mt-6 space-y-3">
                      {categoryData.map((item, index) => (
                        <motion.div
                          key={index}
                          whileHover={{ x: 4 }}
                          className="flex items-center justify-between text-sm p-2 rounded-lg hover:bg-accent/50 transition-colors cursor-pointer"
                        >
                          <div className="flex items-center gap-3">
                            <div className="h-4 w-4 rounded-full shadow-sm" style={{ backgroundColor: item.color }} />
                            <span className="font-medium">{item.name}</span>
                          </div>
                          <span className="font-bold">${item.value}</span>
                        </motion.div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </TabsContent>

          <TabsContent value="habits" className="space-y-4">
            <motion.div variants={itemVariants}>
              <Card className="border-primary/20 hover:shadow-xl transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                    Weekly Habit Performance
                  </CardTitle>
                  <CardDescription>Number of habits completed per day this week</CardDescription>
                </CardHeader>
                <CardContent className="pl-2">
                  <ResponsiveContainer width="100%" height={350}>
                    <LineChart data={habitData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-muted" />
                      <XAxis dataKey="day" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                      <Tooltip
                        contentStyle={{
                          borderRadius: "12px",
                          border: "1px solid hsl(var(--border))",
                          boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
                          background: "hsl(var(--background))",
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="completed"
                        stroke="hsl(var(--primary))"
                        strokeWidth={3}
                        dot={{ r: 6, fill: "hsl(var(--primary))", strokeWidth: 2, stroke: "hsl(var(--background))" }}
                        activeDot={{ r: 8 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  )
}
