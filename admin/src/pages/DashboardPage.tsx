import { useEffect, useState } from "react";
import { BarChart3, Boxes, Clock3, IndianRupee, ShoppingBag, Users } from "lucide-react";
import { adminApi, type DashboardData } from "@/lib/admin-api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ErrorState, Loading, PageHeader, Badge, formatDate, formatMoney, statusTone } from "./common";

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState("");
  const load = async () => { try { setError(""); setData(await adminApi.dashboard()); } catch (e) { setError(e instanceof Error ? e.message : "Unable to load dashboard."); } };
  useEffect(() => { void load(); }, []);
  if (error) return <><PageHeader title="Dashboard" /><ErrorState message={error} retry={load} /></>;
  if (!data) return <><PageHeader title="Dashboard" /><Loading /></>;

  const kpis = [
    ["Customers", data.kpis.totalCustomers, Users],
    ["Products", data.kpis.totalProducts, Boxes],
    ["Orders", data.kpis.totalOrders, ShoppingBag],
    ["Pending orders", data.kpis.pendingOrders, Clock3],
    ["Revenue", formatMoney(data.kpis.totalRevenue), IndianRupee],
  ] as const;

  return <div>
    <PageHeader title="Dashboard" description="Live store performance from the production API." />
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
      {kpis.map(([label,value,Icon]) => <Card key={label}><CardContent className="flex items-center justify-between p-5"><div><p className="text-sm text-muted-foreground">{label}</p><p className="mt-2 text-2xl font-semibold">{value}</p></div><Icon className="size-5 text-muted-foreground" /></CardContent></Card>)}
    </div>
    <div className="mt-6 grid gap-6 xl:grid-cols-2">
      <Card><CardHeader><CardTitle>Recent orders</CardTitle></CardHeader><CardContent className="p-0">
        <div className="divide-y">{data.recentOrders.length ? data.recentOrders.map(order => <div key={order.id} className="flex items-center justify-between gap-4 px-6 py-4"><div><p className="font-medium">{order.orderNumber}</p><p className="text-xs text-muted-foreground">{order.user.email} · {formatDate(order.createdAt)}</p></div><div className="text-right"><Badge tone={statusTone(order.status)}>{order.status}</Badge><p className="mt-1 text-sm font-medium">{formatMoney(order.total)}</p></div></div>) : <div className="p-8 text-center text-sm text-muted-foreground">No orders yet.</div>}</div>
      </CardContent></Card>
      <Card><CardHeader><CardTitle>Order status</CardTitle></CardHeader><CardContent className="space-y-3">{data.orderStatusCounts.length ? data.orderStatusCounts.map(item => <div key={item.status} className="flex items-center justify-between"><span className="text-sm">{item.status}</span><Badge tone={statusTone(item.status)}>{item.count}</Badge></div>) : <p className="text-sm text-muted-foreground">No status data.</p>}</CardContent></Card>
    </div>
    <Card className="mt-6"><CardHeader><CardTitle>Top selling products</CardTitle></CardHeader><CardContent>{data.topSellingProducts.length ? <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-b text-left text-muted-foreground"><th className="p-3">Product</th><th className="p-3">Units</th><th className="p-3">Revenue</th></tr></thead><tbody>{data.topSellingProducts.map(p => <tr key={p.productId} className="border-b last:border-0"><td className="p-3">{p.productName}</td><td className="p-3">{p.quantitySold}</td><td className="p-3">{formatMoney(p.revenue)}</td></tr>)}</tbody></table></div> : <p className="text-sm text-muted-foreground">No sales data available.</p>}</CardContent></Card>
    <div className="mt-6 flex items-center gap-2 text-xs text-muted-foreground"><BarChart3 className="size-4" /> Dashboard metrics are calculated by the backend.</div>
  </div>;
}
