import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "CA Site Platform",
    template: "%s | CA Site Platform"
  },
  description:
    "A guided multi-tenant website platform for Chartered Accountant firms in India.",
  icons: {
    icon: "/api/brand/favicon?name=CA%20Site%20Platform"
  }
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
