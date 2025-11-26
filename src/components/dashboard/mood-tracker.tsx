"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Smile, Meh, Frown, Zap, Battery, BatteryLow, TrendingUp } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Slider } from "@/components/ui/slider"
import { Button } from "@/components/ui/button"

export function MoodTracker() {
  const [mood, setMood] = useState(75)
  const [energy, setEnergy] = useState(60)
  const [saved, setSaved] = useState(false)

  const handleSave = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
    >
      <Card className="bg-gradient-to-br from-violet-50 via-purple-50 to-fuchsia-50 dark:from-violet-950/20 dark:via-purple-950/20 dark:to-fuchsia-950/20 border-violet-200 dark:border-violet-800 shadow-lg hover:shadow-xl transition-all duration-300">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <CardTitle className="text-lg font-semibold bg-gradient-to-r from-violet-600 to-fuchsia-600 bg-clip-text text-transparent">
                Daily Check-in
              </CardTitle>
              <p className="text-sm text-muted-foreground">How are you feeling today?</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 shadow-md">
              <TrendingUp className="h-6 w-6 text-white" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Mood Slider */}
          <motion.div className="space-y-3" whileHover={{ scale: 1.02 }} transition={{ duration: 0.2 }}>
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-foreground flex items-center gap-2">
                Mood Level
                <span className="text-xs font-normal text-muted-foreground">({mood}%)</span>
              </span>
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 15 }}
              >
                {mood > 66 ? (
                  <div className="flex items-center gap-1.5 rounded-full bg-green-100 dark:bg-green-900/30 px-3 py-1">
                    <Smile className="h-4 w-4 text-green-600 dark:text-green-400" />
                    <span className="text-xs font-medium text-green-700 dark:text-green-300">Great</span>
                  </div>
                ) : mood > 33 ? (
                  <div className="flex items-center gap-1.5 rounded-full bg-yellow-100 dark:bg-yellow-900/30 px-3 py-1">
                    <Meh className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                    <span className="text-xs font-medium text-yellow-700 dark:text-yellow-300">Okay</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 rounded-full bg-red-100 dark:bg-red-900/30 px-3 py-1">
                    <Frown className="h-4 w-4 text-red-600 dark:text-red-400" />
                    <span className="text-xs font-medium text-red-700 dark:text-red-300">Low</span>
                  </div>
                )}
              </motion.div>
            </div>
            <div className="relative">
              <Slider
                value={[mood]}
                onValueChange={(value) => setMood(value[0])}
                max={100}
                step={1}
                className="cursor-pointer"
              />
            </div>
          </motion.div>

          {/* Energy Slider */}
          <motion.div className="space-y-3 pt-4" whileHover={{ scale: 1.02 }} transition={{ duration: 0.2 }}>
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-foreground flex items-center gap-2">
                Energy Level
                <span className="text-xs font-normal text-muted-foreground">({energy}%)</span>
              </span>
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 15 }}
              >
                {energy > 66 ? (
                  <div className="flex items-center gap-1.5 rounded-full bg-amber-100 dark:bg-amber-900/30 px-3 py-1">
                    <Zap className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                    <span className="text-xs font-medium text-amber-700 dark:text-amber-300">High</span>
                  </div>
                ) : energy > 33 ? (
                  <div className="flex items-center gap-1.5 rounded-full bg-blue-100 dark:bg-blue-900/30 px-3 py-1">
                    <Battery className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    <span className="text-xs font-medium text-blue-700 dark:text-blue-300">Medium</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 rounded-full bg-red-100 dark:bg-red-900/30 px-3 py-1">
                    <BatteryLow className="h-4 w-4 text-red-600 dark:text-red-400" />
                    <span className="text-xs font-medium text-red-700 dark:text-red-300">Low</span>
                  </div>
                )}
              </motion.div>
            </div>
            <div className="relative">
              <Slider
                value={[energy]}
                onValueChange={(value) => setEnergy(value[0])}
                max={100}
                step={1}
                className="cursor-pointer"
              />
            </div>
          </motion.div>

          {/* Save Button */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="pt-4">
            <Button
              onClick={handleSave}
              className="w-full bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:from-violet-600 hover:to-fuchsia-600 text-white shadow-md"
            >
              {saved ? "Saved!" : "Save Check-in"}
            </Button>
          </motion.div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
