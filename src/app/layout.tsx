import type { Metadata } from "next";
import { Geist, DM_Sans } from "next/font/google";
import "./globals.css";

const geist = Geist({ subsets: ["latin"], variable: "--font-geist", weight: ["400", "500", "600"] });
const dmSans = DM_Sans({ subsets: ["latin"], variable: "--font-dm-sans", weight: ["600", "700", "800"] });

export const metadata: Metadata = {
  title: "Aegis — Checklist de Empilhadeiras",
  description: "Inspeção operacional. Registro. Rastreabilidade. Segurança.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${geist.variable} ${dmSans.variable}`}>
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
