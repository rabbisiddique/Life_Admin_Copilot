import { AnimatePresence, motion } from "framer-motion";
import {
  AlertCircle,
  ArrowRight,
  ChevronRight,
  CreditCard,
  FileText,
  MessageCircle,
  Moon,
  Play,
  Sparkles,
  Sun,
  X,
} from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

const HomeShowcase = () => {
  const [taskProgress, setTaskProgress] = useState(0);
  const [habitProgress, setHabitProgress] = useState(0);
  const [currentSuggestion, setCurrentSuggestion] = useState(0);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const { theme, setTheme } = useTheme();

  const suggestions = [
    "Your Netflix bill is due tomorrow.",
    "Don't forget your workout today.",
    "Passport expires in 30 days.",
  ];

  const bills = [
    {
      name: "Netflix",
      icon: "🎬",
      status: "Due Tomorrow",
      color: "text-red-600 dark:text-red-400",
      bg: "bg-red-50 dark:bg-red-900/20",
    },
    {
      name: "Spotify",
      icon: "🎵",
      status: "Due in 3 days",
      color: "text-green-600 dark:text-green-400",
      bg: "bg-green-50 dark:bg-green-900/20",
    },
    {
      name: "Electricity",
      icon: "⚡",
      status: "Paid",
      color: "text-blue-600 dark:text-blue-400",
      bg: "bg-blue-50 dark:bg-blue-900/20",
    },
    {
      name: "Rent",
      icon: "🏠",
      status: "Due in 5 days",
      color: "text-purple-600 dark:text-purple-400",
      bg: "bg-purple-50 dark:bg-purple-900/20",
    },
  ];

  const documents = [
    { name: "Passport", icon: "🛂", expiry: "30 days", urgent: true },
    { name: "NID Card", icon: "🪪", expiry: "180 days", urgent: false },
    { name: "Driver License", icon: "🚗", expiry: "90 days", urgent: false },
  ];

  const tasks = [
    { title: "Finish Q4 Report", status: "today" },
    { title: "Team Meeting", status: "today" },
    { title: "Review PRs", status: "tomorrow" },
    { title: "Plan Sprint", status: "upcoming" },
  ];

  useEffect(() => {
    const taskTimer = setInterval(() => {
      setTaskProgress((prev) => (prev >= 75 ? 0 : prev + 1));
    }, 50);

    const habitTimer = setInterval(() => {
      setHabitProgress((prev) => (prev >= 85 ? 0 : prev + 1));
    }, 50);

    const suggestionTimer = setInterval(() => {
      setCurrentSuggestion((prev) => (prev + 1) % suggestions.length);
    }, 3000);

    return () => {
      clearInterval(taskTimer);
      clearInterval(habitTimer);
      clearInterval(suggestionTimer);
    };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-slate-900 dark:via-blue-950 dark:to-purple-950 overflow-hidden transition-colors duration-300">
      {/* Animated Background Orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-48 w-96 h-96 bg-blue-300 dark:bg-blue-600 rounded-full mix-blend-multiply dark:mix-blend-soft-light filter blur-3xl opacity-20 dark:opacity-10 animate-blob"></div>
        <div className="absolute top-1/3 -right-48 w-96 h-96 bg-purple-300 dark:bg-purple-600 rounded-full mix-blend-multiply dark:mix-blend-soft-light filter blur-3xl opacity-20 dark:opacity-10 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-32 left-1/3 w-96 h-96 bg-pink-300 dark:bg-pink-600 rounded-full mix-blend-multiply dark:mix-blend-soft-light filter blur-3xl opacity-20 dark:opacity-10 animate-blob animation-delay-4000"></div>
      </div>

      {/* Video Modal */}
      <AnimatePresence>
        {showVideoModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
            onClick={() => setShowVideoModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-4xl bg-slate-900 rounded-2xl overflow-hidden shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setShowVideoModal(false)}
                className="absolute top-4 right-4 z-10 w-10 h-10 bg-white/10 hover:bg-white/20 backdrop-blur-xl rounded-full flex items-center justify-center transition-colors"
              >
                <X className="text-white" size={20} />
              </button>
              <div className="relative pt-[56.25%]">
                <video
                  className="absolute inset-0 w-full h-full"
                  controls
                  autoPlay
                  src="/Life_Admin_Copilot.mp4"
                >
                  Your browser does not support the video tag.
                </video>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Fixed Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border-b border-white/40 dark:border-slate-700/40">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center">
              <Sparkles className="text-white" size={20} />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Life Admin Copilot
            </span>
          </div>

          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="rounded-xl p-2.5 hover:bg-accent transition-colors"
          >
            <AnimatePresence mode="wait">
              {theme === "dark" ? (
                <Sun className="h-5 w-5 text-yellow-500" />
              ) : (
                <Moon className="h-5 w-5 text-black" />
              )}
            </AnimatePresence>
          </motion.button>
        </div>
      </header>

      <div className="relative z-10 pt-20">
        {/* Hero Section */}
        <section className="min-h-screen flex items-center justify-center px-6 py-20">
          <div className="max-w-7xl mx-auto text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl border border-white/40 dark:border-slate-700/40 rounded-full text-sm font-medium mb-8 shadow-lg">
              <Sparkles
                size={16}
                className="text-blue-600 dark:text-blue-400"
              />
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                AI-Powered Life Management
              </span>
            </div>

            {/* Main Headline */}
            <h1 className="text-6xl md:text-7xl lg:text-8xl font-bold mb-6 leading-tight">
              <span className="text-slate-900 dark:text-white">Your Life,</span>
              <br />
              <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                Organized in One Place
              </span>
            </h1>

            <p className="text-xl md:text-2xl text-slate-600 dark:text-slate-300 mb-12 max-w-3xl mx-auto leading-relaxed">
              Manage tasks, build habits, track bills, organize documents, and
              let AI guide you—all in one beautiful dashboard.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
              <button className="group px-10 py-5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-2xl hover:shadow-2xl transition-all duration-300 font-semibold text-lg flex items-center gap-3">
                Enter Dashboard
                <ArrowRight
                  className="group-hover:translate-x-1 transition-transform"
                  size={20}
                />
              </button>
              <button
                className="px-10 py-5 bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl border-2 border-white/60 dark:border-slate-700/60 text-slate-700 dark:text-slate-200 rounded-2xl hover:bg-white/80 dark:hover:bg-slate-800/80 transition-all duration-300 font-semibold text-lg flex items-center gap-3"
                onClick={() => setShowVideoModal(true)}
              >
                <Play size={20} />
                Watch Demo
              </button>
            </div>

            {/* Dashboard Mockup */}
            <div className="relative max-w-6xl mx-auto">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl blur-3xl opacity-30 dark:opacity-20"></div>
              <div className="relative bg-white/40 dark:bg-slate-800/40 backdrop-blur-2xl rounded-3xl border border-white/50 dark:border-slate-700/50 shadow-2xl p-8 animate-float">
                {/* Mockup Header */}
                <div className="flex items-center justify-between mb-6 pb-6 border-b border-white/30 dark:border-slate-700/30">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center">
                      <Sparkles className="text-white" size={24} />
                    </div>
                    <div className="text-left">
                      <h3 className="font-bold text-slate-900 dark:text-white">
                        Life Admin Copilot
                      </h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        Your AI Assistant
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-400"></div>
                    <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                    <div className="w-3 h-3 rounded-full bg-green-400"></div>
                  </div>
                </div>

                {/* Mockup Content - Teaser Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {/* Tasks Card */}
                  <div className="bg-white/50 dark:bg-slate-800/50 backdrop-blur-xl rounded-2xl p-6 border border-white/40 dark:border-slate-700/40 shadow-lg hover:scale-105 transition-transform">
                    <div className="relative w-20 h-20 mx-auto mb-4">
                      <svg
                        className="transform -rotate-90"
                        width="80"
                        height="80"
                      >
                        <circle
                          cx="40"
                          cy="40"
                          r="35"
                          stroke="#e5e7eb"
                          className="dark:stroke-slate-700"
                          strokeWidth="6"
                          fill="none"
                        />
                        <circle
                          cx="40"
                          cy="40"
                          r="35"
                          stroke="url(#blueGradient)"
                          strokeWidth="6"
                          fill="none"
                          strokeDasharray={`${2 * Math.PI * 35}`}
                          strokeDashoffset={`${
                            2 * Math.PI * 35 * (1 - taskProgress / 100)
                          }`}
                          className="transition-all duration-300"
                        />
                        <defs>
                          <linearGradient
                            id="blueGradient"
                            x1="0%"
                            y1="0%"
                            x2="100%"
                            y2="100%"
                          >
                            <stop offset="0%" stopColor="#3b82f6" />
                            <stop offset="100%" stopColor="#8b5cf6" />
                          </linearGradient>
                        </defs>
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-lg font-bold text-slate-900 dark:text-white">
                          {taskProgress}%
                        </span>
                      </div>
                    </div>
                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 text-center">
                      Tasks Today
                    </p>
                  </div>

                  {/* Habits Card */}
                  <div className="bg-white/50 dark:bg-slate-800/50 backdrop-blur-xl rounded-2xl p-6 border border-white/40 dark:border-slate-700/40 shadow-lg hover:scale-105 transition-transform">
                    <div className="h-20 flex items-end justify-center gap-1 mb-4">
                      {[20, 40, 60, 80, habitProgress].map((height, idx) => (
                        <div
                          key={idx}
                          className="w-3 bg-gradient-to-t from-purple-500 to-pink-500 rounded-full transition-all duration-500"
                          style={{ height: `${Math.min(height, 100)}%` }}
                        ></div>
                      ))}
                    </div>
                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 text-center">
                      Habit Streak
                    </p>
                  </div>

                  {/* Bills Card */}
                  <div className="bg-white/50 dark:bg-slate-800/50 backdrop-blur-xl rounded-2xl p-6 border border-white/40 dark:border-slate-700/40 shadow-lg hover:scale-105 transition-transform relative overflow-hidden">
                    <div className="absolute top-2 right-2">
                      <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
                    </div>
                    <CreditCard
                      className="mx-auto mb-4 text-orange-500"
                      size={40}
                    />
                    <div className="text-center">
                      <p className="text-2xl font-bold text-slate-900 dark:text-white mb-1">
                        3
                      </p>
                      <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                        Bills Due
                      </p>
                    </div>
                  </div>

                  {/* Documents Card */}
                  <div className="bg-white/50 dark:bg-slate-800/50 backdrop-blur-xl rounded-2xl p-6 border border-white/40 dark:border-slate-700/40 shadow-lg hover:scale-105 transition-transform relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-red-500/10 to-orange-500/10 rounded-2xl animate-pulse"></div>
                    <AlertCircle
                      className="mx-auto mb-4 text-red-500 relative"
                      size={40}
                    />
                    <div className="text-center relative">
                      <p className="text-2xl font-bold text-slate-900 dark:text-white mb-1">
                        2
                      </p>
                      <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                        Expiring Soon
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Smart Reminders Preview */}
        <section className="px-6 py-20">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-4">
                Never Miss a{" "}
                <span className="bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                  Payment
                </span>
              </h2>
              <p className="text-xl text-slate-600 dark:text-slate-300">
                Smart reminders for all your bills and subscriptions
              </p>
            </div>

            <div className="bg-white/40 dark:bg-slate-800/40 backdrop-blur-2xl rounded-3xl border border-white/50 dark:border-slate-700/50 shadow-2xl p-8">
              <div className="space-y-4">
                {bills.map((bill, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-6 bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl rounded-2xl border border-white/40 dark:border-slate-700/40 shadow-lg hover:shadow-xl transition-shadow duration-300"
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={`w-14 h-14 ${bill.bg} rounded-xl flex items-center justify-center text-2xl`}
                      >
                        {bill.icon}
                      </div>
                      <div>
                        <p className="font-bold text-slate-900 dark:text-white">
                          {bill.name}
                        </p>
                        <p className={`text-sm font-medium ${bill.color}`}>
                          {bill.status}
                        </p>
                      </div>
                    </div>
                    <ChevronRight
                      className="text-slate-400 dark:text-slate-500"
                      size={24}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Document Scanner Preview */}
        <section className="px-6 py-20">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-4">
                AI-Powered{" "}
                <span className="bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                  Document Tracking
                </span>
              </h2>
              <p className="text-xl text-slate-600 dark:text-slate-300">
                Automatically extract expiry dates and set reminders
              </p>
            </div>

            <div className="bg-white/40 dark:bg-slate-800/40 backdrop-blur-2xl rounded-3xl border border-white/50 dark:border-slate-700/50 shadow-2xl p-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {documents.map((doc, idx) => (
                  <div
                    key={idx}
                    className={`p-6 rounded-2xl border-2 ${
                      doc.urgent
                        ? "bg-red-50/80 dark:bg-red-900/20 border-red-300 dark:border-red-700 animate-pulse"
                        : "bg-white/60 dark:bg-slate-800/60 border-white/40 dark:border-slate-700/40"
                    } backdrop-blur-xl shadow-lg`}
                  >
                    <div className="text-4xl mb-3 text-center">{doc.icon}</div>
                    <p className="font-semibold text-slate-900 dark:text-white text-center mb-2">
                      {doc.name}
                    </p>
                    <p
                      className={`text-sm text-center font-medium ${
                        doc.urgent
                          ? "text-red-600 dark:text-red-400"
                          : "text-slate-600 dark:text-slate-400"
                      }`}
                    >
                      Expires in {doc.expiry}
                    </p>
                  </div>
                ))}
              </div>

              <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl p-12 text-center bg-white/30 dark:bg-slate-800/30 backdrop-blur-xl hover:border-blue-400 dark:hover:border-blue-600 hover:bg-blue-50/50 dark:hover:bg-blue-900/20 transition-all cursor-pointer group">
                <div className="relative inline-block">
                  <FileText
                    className="mx-auto text-slate-400 dark:text-slate-500 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors mb-4"
                    size={48}
                  />
                  <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center">
                    <Sparkles className="text-white" size={14} />
                  </div>
                </div>
                <p className="text-lg font-semibold text-slate-700 dark:text-slate-300 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors mb-2">
                  Drop documents here
                </p>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Let AI track your renewals for you
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Task & Habit System Preview */}
        <section className="px-6 py-20">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-4">
                Stay{" "}
                <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Productive
                </span>
              </h2>
              <p className="text-xl text-slate-600 dark:text-slate-300">
                Organize tasks with elegant simplicity
              </p>
            </div>

            <div className="bg-white/40 dark:bg-slate-800/40 backdrop-blur-2xl rounded-3xl border border-white/50 dark:border-slate-700/50 shadow-2xl p-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {["Today", "Tomorrow", "Upcoming"].map((column, colIdx) => (
                  <div key={column} className="space-y-3">
                    <h3 className="font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                      <div
                        className={`w-2 h-2 rounded-full ${
                          colIdx === 0
                            ? "bg-blue-500"
                            : colIdx === 1
                            ? "bg-purple-500"
                            : "bg-pink-500"
                        }`}
                      ></div>
                      {column}
                    </h3>
                    {tasks
                      .filter(
                        (task) =>
                          (colIdx === 0 && task.status === "today") ||
                          (colIdx === 1 && task.status === "tomorrow") ||
                          (colIdx === 2 && task.status === "upcoming")
                      )
                      .map((task, idx) => (
                        <div
                          key={idx}
                          className="p-4 bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl rounded-xl border border-white/40 dark:border-slate-700/40 shadow-lg hover:scale-105 transition-transform cursor-pointer"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-5 h-5 rounded-md border-2 border-slate-300 dark:border-slate-600"></div>
                            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                              {task.title}
                            </p>
                          </div>
                        </div>
                      ))}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="px-6 py-20">
          <div className="max-w-4xl mx-auto">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl blur-2xl opacity-30 dark:opacity-20"></div>
              <div className="relative bg-white/40 dark:bg-slate-800/40 backdrop-blur-2xl rounded-3xl border border-white/50 dark:border-slate-700/50 shadow-2xl p-12 text-center">
                <h2 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-6">
                  Ready to Get Started?
                </h2>
                <p className="text-xl text-slate-600 dark:text-slate-300 mb-10 max-w-2xl mx-auto">
                  Join thousands who've transformed their productivity with AI
                  assistance
                </p>
                <button className="px-12 py-5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-2xl hover:shadow-2xl transition-all duration-300 font-bold text-lg inline-flex items-center gap-3 group">
                  Enter Your Dashboard
                  <ArrowRight
                    className="group-hover:translate-x-1 transition-transform"
                    size={20}
                  />
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="px-6 py-12 border-t border-white/30 dark:border-slate-700/30">
          <div className="max-w-6xl mx-auto">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center">
                  <Sparkles className="text-white" size={20} />
                </div>
                <span className="font-bold text-slate-900 dark:text-white">
                  Life Admin Copilot
                </span>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-slate-600 dark:text-slate-400">
                <a
                  href="#"
                  className="hover:text-slate-900 dark:hover:text-white transition-colors"
                >
                  Pricing
                </a>
                <a
                  href="#"
                  className="hover:text-slate-900 dark:hover:text-white transition-colors"
                >
                  Support
                </a>
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                © 2024 Life Admin. All rights reserved.
              </p>
            </div>
          </div>
        </footer>
      </div>

      {/* AI Copilot Floating Widget */}
      <div className="fixed bottom-8 right-8 z-50 animate-float">
        <div className="relative">
          {/* Chat Bubble */}
          <div className="absolute bottom-20 right-0 w-64 bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl rounded-2xl border border-white/50 dark:border-slate-700/50 shadow-2xl p-4 mb-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center flex-shrink-0">
                <Sparkles className="text-white" size={16} />
              </div>
              <div className="flex-1">
                <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                  {suggestions[currentSuggestion]}
                </p>
              </div>
            </div>
          </div>

          {/* Floating Button */}
          <button className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full shadow-2xl flex items-center justify-center hover:scale-110 transition-transform group">
            <MessageCircle
              className="text-white group-hover:scale-110 transition-transform"
              size={28}
            />
          </button>
        </div>
      </div>

      <style jsx>{`
        @keyframes float {
          0%,
          100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-20px);
          }
        }
        @keyframes blob {
          0%,
          100% {
            transform: translate(0, 0) scale(1);
          }
          25% {
            transform: translate(20px, -50px) scale(1.1);
          }
          50% {
            transform: translate(-20px, 20px) scale(0.9);
          }
          75% {
            transform: translate(50px, 50px) scale(1.05);
          }
        }
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
        .animate-blob {
          animation: blob 20s ease-in-out infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  );
};

export default HomeShowcase;
