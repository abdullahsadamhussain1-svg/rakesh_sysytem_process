import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Siddha Varmam Assessment",
  description: "Siddha Varmam Clinical Software",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "AafiyaClinic",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: "#ffffff",
};


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <header className="border-b sticky top-0 bg-white z-50 shadow-sm">
          <div className="container mx-auto flex h-14 sm:h-16 items-center justify-between px-3 sm:px-4">
            <Link href="/" className="flex items-center gap-2 sm:gap-3">
              <div className="relative w-10 h-10 sm:w-12 sm:h-12 rounded-full overflow-hidden border-2 border-primary flex-shrink-0 bg-[#f4fce3]">
                <img
                  src="/logo.jpeg"
                  alt="Aafiya Siddha Varmam Clinic"
                  className="w-full h-full object-contain p-1"
                />
              </div>
              <span className="text-lg sm:text-2xl font-bold text-primary">
                Aafiya Clinic
              </span>
            </Link>
            <nav className="flex items-center gap-1.5 sm:gap-3">
              <Button asChild variant="outline" size="sm" className="hidden sm:inline-flex rounded-xl font-black text-[10px] sm:text-xs h-8 sm:h-9 px-3 sm:px-4 shadow-sm border-slate-200">
                <Link href="/">DASHBOARD</Link>
              </Button>
              <Button asChild size="sm" className="rounded-xl font-black text-[10px] sm:text-xs h-8 sm:h-9 px-4 sm:px-6 shadow-md bg-slate-900 hover:bg-black transition-all text-white">
                <Link href="/new">NEW</Link>
              </Button>
            </nav>
          </div>
        </header>
        <main className="container mx-auto py-4 sm:py-8 px-3 sm:px-4 max-w-7xl">
          {children}
        </main>
      </body>
    </html>
  );
}
