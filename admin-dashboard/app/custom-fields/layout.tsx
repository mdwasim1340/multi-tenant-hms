import { DashboardLayout } from '@/components/dashboard-layout';

export default function CustomFieldsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardLayout>{children}</DashboardLayout>;
}