import type { Metadata } from "next";
import { Header } from "@/components/layout/header";
import { AppProviders } from "@/components/providers/app-providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "Saved Gigs",
  description: "Bookmark gigs on the marketplace",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <AppProviders>
          <Header />
          <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
        </AppProviders>
      </body>
    </html>
  );
}
