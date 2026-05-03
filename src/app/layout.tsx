import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { QueryProvider } from "@/components/providers/QueryProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "T2M-App | Hệ thống Quản lý Bảo trì Xe Container C.H.L",
    template: "%s | T2M-App"
  },
  description: "Giải pháp số hóa quy trình bảo trì, sửa chữa xe đầu kéo và rơ-moóc. Tối ưu chi phí, chống gian lận vật tư và theo dõi vòng đời tài sản.",
  keywords: ["quản lý bảo trì", "sửa chữa xe container", "xe đầu kéo", "rơ-moóc", "quy trình gara", "vận tải", "CHL Maintenance"],
  authors: [{ name: "CHL Logistics Team" }],
  viewport: "width=device-width, initial-scale=1, maximum-scale=5",
  themeColor: "#0f172a",
  robots: "index, follow",
  openGraph: {
    title: "T2M-App | Quản lý Bảo trì Xe Container",
    description: "Hệ thống quản lý bảo trì chuyên nghiệp cho doanh nghiệp vận tải.",
    url: "https://t2m-app.vercel.app",
    siteName: "T2M-App",
    locale: "vi_VN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "T2M-App | Quản lý Bảo trì Xe Container",
    description: "Hệ thống quản lý bảo trì chuyên nghiệp cho doanh nghiệp vận tải.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" className="dark">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}>
        <QueryProvider>
          {children}
          <Toaster position="top-center" richColors />
        </QueryProvider>
      </body>
    </html>
  );
}
