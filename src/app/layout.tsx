import type { Metadata } from "next";
// <CHANGE> Using Inter font as specified in the theme
import ClientLayout from "@/components/ClientLayout";
import { ThemeProvider } from "@/components/theme-provider";
import { Inter } from "next/font/google";
import React from "react";
import { Toaster } from "react-hot-toast";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  // <CHANGE> Updated metadata for Life-Admin Copilot
  title: "Life-Admin Copilot",
  description:
    "Your AI-powered productivity assistant for managing tasks, bills, documents, and habits",
  icons: {
    icon: [{ url: "/logo.jpg" }], // <-- use `url` instead of `href`
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
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
