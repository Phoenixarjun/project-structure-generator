import React from "react";
import "./globals.css";

export const metadata = {
  title: "my-nextjs-app",
  description: "Built with Next.js Feature-Modular Architecture",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
