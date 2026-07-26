import type { ReactNode } from "react";
import Guard from "@/components/Guard";
import Sidebar from "@/components/Sidebar";
import Topbar from "@/components/Topbar";

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
        <Topbar />
        <main className="flex-1 px-4 sm:px-8 py-6 pb-24 lg:pb-8">
          <Guard>{children}</Guard>
        </main>
      </div>
    </div>
  );
}
