import type { Metadata, Viewport } from "next";
import "./globals.css";
import { SwrProvider } from "@/lib/cache/swr-provider";

export const metadata: Metadata = {
  title: "CompStat Rio",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body>
        <SwrProvider>{children}</SwrProvider>
      </body>
    </html>
  );
}
