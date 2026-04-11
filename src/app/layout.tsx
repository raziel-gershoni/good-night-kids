import type { Metadata } from "next";
import { Heebo } from "next/font/google";
import "./globals.css";

const heebo = Heebo({
  variable: "--font-heebo",
  subsets: ["hebrew", "latin"],
});

export const metadata: Metadata = {
  title: "לילה טוב ילדים",
  description: "סיפורי שינה לילדים מהמסורת היהודית",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="he" dir="rtl" className={`${heebo.variable} h-full`}>
      <body className="min-h-full flex flex-col bg-[#0f0a2a] text-white font-[family-name:var(--font-heebo)]">
        {children}
      </body>
    </html>
  );
}
