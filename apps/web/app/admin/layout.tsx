import { AdminShell } from "@/components/admin/AdminShell";
import { Providers } from "@/components/admin/Providers";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <Providers>
      <AdminShell>{children}</AdminShell>
    </Providers>
  );
}
