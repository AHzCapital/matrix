import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "We are the Matrix.",
  description: "We are the Matrix.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
