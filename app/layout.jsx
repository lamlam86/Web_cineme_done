import "./globals.css";
import { Inter } from "next/font/google";
import ClientProviders from "@/components/ClientProviders";

const inter = Inter({ subsets: ["latin"], weight: ["400", "600", "700"] });

export const metadata = {
  title: "LMK Cinema — Đặt vé xem phim trực tuyến",
  description: "Đặt vé xem phim nhanh chóng, nhiều khuyến mãi.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="vi">
      <body className={inter.className}>
        <ClientProviders>
          {children}
        </ClientProviders>
      </body>
    </html>
  );
}


