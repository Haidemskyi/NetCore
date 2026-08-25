import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "NETCORE CRM | NetCore LLC",
  description: "NetCore CRM - Broadband Infrastructure & Fleet Management System",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} h-full antialiased dark`}
    >
      <body className="min-h-full flex flex-col font-sans bg-[#121316] text-[#e8eaed] selection:bg-[#1a73e8] selection:text-white">
        {children}
      </body>
    </html>
  );
}

