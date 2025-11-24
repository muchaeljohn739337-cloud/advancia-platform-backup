'use client';
import AdminNav from '@/components/AdminNav';
import UsersTable from '@/components/admin/UsersTable';

export default function AdminUsersPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-900">
      <AdminNav />
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          <UsersTable />
        </div>
      </div>
    </div>
  );
}
