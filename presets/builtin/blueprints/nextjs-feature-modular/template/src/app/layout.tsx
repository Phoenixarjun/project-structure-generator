import React from "react";
import "./globals.css";

export const metadata = {
  title: "{{projectName}}",
  description: "Built with Next.js Feature-Modular Architecture",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
