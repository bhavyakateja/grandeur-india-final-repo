import { useEffect, useState } from "react";
import { adminApi, type AnalyticsData } from "@/lib/admin-api";
import { PageHeader, Loading, ErrorState, Empty, formatMoney } from "./common";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const startDate = (offsetDays: number) =>
  new Date(Date.now() - offsetDays * 86400000).toISOString().slice(0, 10);

export default function AnalyticsPage() {
  const [from, setFrom] = useState(startDate(29));
  const [to, setTo] = useState(new Date().toISOString().slice(0, 10));
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      setLoading(true);
      setError("");
      setData(await adminApi.analytics(from, to));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to load analytics.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  return (
    <div>
      <PageHeader title="Analytics" description="Backend-calculated sales analytics." />

      <div className="mb-6 flex flex-wrap items-end gap-3">
        <label className="text-sm">
          From
          <input
            type="date"
            className="mt-1 block h-9 rounded-md border px-3"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
          />
        </label>
        <label className="text-sm">
          To
          <input
            type="date"
            className="mt-1 block h-9 rounded-md border px-3"
            value={to}
            onChange={(e) => setTo(e.target.value)}
          />
        </label>
        <button
          className="h-9 rounded-md bg-slate-900 px-4 text-sm text-white"
          onClick={() => void load()}
        >
          Apply
        </button>
      </div>

      {error && <ErrorState message={error} retry={load} />}

      {loading ? (
        <Loading />
      ) : data ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Card>
              <CardContent className="p-5">
                <p className="text-sm text-muted-foreground">Customers</p>
                <p className="mt-2 text-2xl font-semibold">{data.kpis.totalCustomers}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-5">
                <p className="text-sm text-muted-foreground">Products</p>
                <p className="mt-2 text-2xl font-semibold">{data.kpis.totalProducts}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-5">
                <p className="text-sm text-muted-foreground">Orders</p>
                <p className="mt-2 text-2xl font-semibold">{data.kpis.totalOrders}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-5">
                <p className="text-sm text-muted-foreground">Paid revenue</p>
                <p className="mt-2 text-2xl font-semibold">{formatMoney(data.kpis.totalRevenue)}</p>
              </CardContent>
            </Card>
          </div>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Sales by day</CardTitle>
            </CardHeader>
            <CardContent>
              {data.salesByDay.length ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-left text-muted-foreground">
                        <th className="p-3">Date</th>
                        <th className="p-3">Orders</th>
                        <th className="p-3">Revenue</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.salesByDay.map((d) => (
                        <tr className="border-b last:border-0" key={d.date}>
                          <td className="p-3">
                            {new Date(d.date).toLocaleDateString("en-IN")}
                          </td>
                          <td className="p-3">{d.orders}</td>
                          <td className="p-3">{formatMoney(d.revenue)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <Empty title="No sales in this period" />
              )}
            </CardContent>
          </Card>
        </>
      ) : null}
    </div>
  );
}
