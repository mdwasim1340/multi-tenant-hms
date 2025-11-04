import { TenantList } from '@/components/tenants/tenant-list';

export default function TenantsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Tenant Management</h1>
        <p className="text-gray-600 mt-2">
          Manage all hospital tenants, their subscriptions, and usage analytics
        </p>
      </div>
      <TenantList />
    </div>
  );
}