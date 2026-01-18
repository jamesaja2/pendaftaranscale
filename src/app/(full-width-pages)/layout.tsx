import AppFooter from "@/layout/AppFooter";
import React from "react";

export default function FullWidthPageLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col min-h-screen">
      <div className="flex-grow">{children}</div>
      <AppFooter />
    </div>
  );
}
