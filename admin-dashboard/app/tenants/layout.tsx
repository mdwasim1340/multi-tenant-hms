import { DashboardLayout } from '@/components/dashboard-layout';

export default function TenantsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardLayout>{children}</DashboardLayout>;
}