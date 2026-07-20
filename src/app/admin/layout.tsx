import { AdminSidebar } from "@/components/layout/admin-sidebar";
import { NexoflowFooter } from "@/components/ui/nexoflow-footer";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-background">
      <AdminSidebar />
      <div className="flex-1 min-w-0 flex flex-col overflow-auto">
        <main className="flex-1">{children}</main>
        <NexoflowFooter />
      </div>
    </div>
  );
}
