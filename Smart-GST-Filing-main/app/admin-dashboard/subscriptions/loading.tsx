import { AdminLayout } from "@/components/admin-layout"

export default function AdminSubscriptionsLoading() {
  return (
    <AdminLayout>
      <div className="space-y-4">
        <div className="h-32 rounded-2xl bg-slate-200 animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="h-24 rounded-xl bg-slate-200 animate-pulse" />
          <div className="h-24 rounded-xl bg-slate-200 animate-pulse" />
          <div className="h-24 rounded-xl bg-slate-200 animate-pulse" />
          <div className="h-24 rounded-xl bg-slate-200 animate-pulse" />
        </div>
        <div className="h-96 rounded-xl bg-slate-200 animate-pulse" />
      </div>
    </AdminLayout>
  )
}
