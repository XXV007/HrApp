import "./globals.css";
import type { ReactNode } from "react";
export const metadata = {
  title: "Talent Radar — Recruiter workspace",
  description: "Search and shortlist exceptional candidates.",
};
export default function Layout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
