import React from "react";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "react-hot-toast";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "生产管理系统",
  description: "智能生产排程与人员排班管理系统",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className={inter.className} suppressHydrationWarning>
        <Toaster position="top-center" reverseOrder={false} />
        <main>{children}</main>
      </body>
    </html>
  );
}