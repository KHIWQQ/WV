"use client";

import { useCallback, useState } from "react";
import { Header } from "./header";
import { Sidebar } from "./sidebar";

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  const handleToggleSidebar = useCallback(() => setSidebarOpen((prev) => !prev), []);
  const handleCloseSidebar = useCallback(() => setSidebarOpen(false), []);
  const handleToggleCollapse = useCallback(() => setCollapsed((prev) => !prev), []);

  return (
    <div className="min-h-screen bg-muted/20 relative overflow-clip">
      {/* Premium Background Mesh / Gradients */}
      <div className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80" aria-hidden="true">
        <div className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-gold-300 to-navy-500 opacity-20 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]" style={{ clipPath: 'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)' }}></div>
      </div>

      <Header onToggleSidebar={handleToggleSidebar} />
      <Sidebar
        open={sidebarOpen}
        onClose={handleCloseSidebar}
        collapsed={collapsed}
        onToggleCollapse={handleToggleCollapse}
      />
      <main className={collapsed ? "lg:pl-16 transition-all duration-300 z-10 relative" : "lg:pl-64 transition-all duration-300 z-10 relative"}>
        <div className="mx-auto max-w-7xl px-4 py-8 md:px-6 lg:px-8 xl:py-10 animate-fade-in">{children}</div>
      </main>
    </div>
  );
}
