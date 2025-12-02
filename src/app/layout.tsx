// app/layout.tsx
import ClientLayout from "@/components/ClientLayout";
import { ThemeProvider } from "@/components/theme-provider";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import React from "react";
import { Toaster } from "react-hot-toast";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Life-Admin Copilot",
  description:
    "Your AI-powered productivity assistant for managing tasks, bills, documents, and habits",
  icons: {
    icon: [{ url: "/logo.jpg" }],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <Toaster
            position="top-center"
            toastOptions={{
              duration: 3000,
              style: {
                background: "#ffffff",
                padding: "12px 24px",
                borderRadius: "100px",
                boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
                fontSize: "13px",
                fontWeight: "600",
              },
              success: {
                style: {
                  background: "#ecfdf5",
                  color: "#065f46",
                  border: "1px solid #a7f3d0",
                },
                iconTheme: { primary: "#10b981", secondary: "#ecfdf5" },
              },
              error: {
                style: {
                  background: "#fef2f2",
                  color: "#7f1d1d",
                  border: "1px solid #fecaca",
                },
                iconTheme: { primary: "#ef4444", secondary: "#fef2f2" },
              },
            }}
          />
          <ClientLayout>{children}</ClientLayout>
        </ThemeProvider>
      </body>
    </html>
  );
}
