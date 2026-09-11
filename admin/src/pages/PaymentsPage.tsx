import { useEffect, useState } from "react";
import { Search, RotateCcw } from "lucide-react";
import {
  adminApi,
  type Payment,
  type PaymentProvider,
  type PaymentStatus,
} from "@/lib/admin-api";
import { useDebounce } from "@/lib/use-debounce";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  PageHeader,
  Loading,
  ErrorState,
  Empty,
  Badge,
  formatDate,
  formatMoney,
  statusTone,
} from "./common";

const statuses: PaymentStatus[] = ["PENDING", "PAID", "FAILED", "REFUNDED"];

export default function PaymentsPage() {
  const [data, setData] = useState<Payment[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [provider, setProvider] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refundPayment, setRefundPayment] = useState<Payment | null>(null);
  const [refundAmount, setRefundAmount] = useState("");
  const [refundReason, setRefundReason] = useState("");
  const [refundBusy, setRefundBusy] = useState(false);

  const limit = 15;
  const debouncedSearch = useDebounce(search, 300);

  const load = async (signal?: AbortSignal) => {
    try {
      setLoading(true);
      setError("");
      const r = await adminApi.payments(
        {
          page,
          limit,
          search: debouncedSearch.trim() || undefined,
          status: (status || undefined) as PaymentStatus | undefined,
          provider: (provider || undefined) as PaymentProvider | undefined,
        },
        signal,
      );
      setData(r.data);
      setTotal(r.pagination.total);
    } catch (e) {
      if (signal?.aborted) return;
      setError(e instanceof Error ? e.message : "Unable to load payments.");
    } finally {
      if (!signal?.aborted) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    const ac = new AbortController();
    void load(ac.signal);
    return () => {
      ac.abort();
    };
  }, [page, debouncedSearch, status, provider]);

  const refund = async () => {
    if (!refundPayment) return;
    try {
      setRefundBusy(true);
      setError("");
      const result = await adminApi.refundPayment(
        refundPayment.id,
        {
          amount: Number(refundAmount),
          reason: refundReason.trim() || undefined,
        },
      );
      // In-place local update without hitting backend DB for all payments
      setData((prev) =>
        prev.map((p) =>
          p.id === refundPayment.id ? { ...p, status: result.payment.status } : p,
        ),
      );
      setRefundPayment(null);
      setRefundReason("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to refund payment.");
    } finally {
      setRefundBusy(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Payments & refunds"
        description="Review payment records and issue full refunds for eligible paid payments."
      />
      {error && (
        <div className="mb-4">
          <ErrorState message={error} retry={() => void load()} />
        </div>
      )}
      <div className="mb-4 grid gap-3 md:grid-cols-[1fr_180px_160px]">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Search payment, order or customer…"
            value={search}
            onChange={(e) => {
              setPage(1);
              setSearch(e.target.value);
            }}
          />
        </div>
        <select
          className="h-9 rounded-md border px-3 text-sm"
          value={status}
          onChange={(e) => {
            setPage(1);
            setStatus(e.target.value);
          }}
        >
          <option value="">All statuses</option>
          {statuses.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
        <select
          className="h-9 rounded-md border px-3 text-sm"
          value={provider}
          onChange={(e) => {
            setPage(1);
            setProvider(e.target.value);
          }}
        >
          <option value="">All providers</option>
          <option>RAZORPAY</option>
        </select>
      </div>
      {loading ? (
        <Loading />
      ) : data.length === 0 ? (
        <Empty title="No payments found" />
      ) : (
        <div className="overflow-hidden rounded-xl border bg-card">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50">
                <tr className="text-left text-muted-foreground">
                  <th className="p-3">Payment</th>
                  <th className="p-3">Customer</th>
                  <th className="p-3">Order</th>
                  <th className="p-3">Amount</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Created</th>
                  <th className="p-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {data.map((p) => (
                  <tr key={p.id} className="border-t">
                    <td className="p-3">
                      <p className="font-medium">{p.provider}</p>
                      <p className="text-xs text-muted-foreground">
                        {p.providerPaymentId ?? p.providerOrderId ?? p.id}
                      </p>
                    </td>
                    <td className="p-3">
                      {p.user.name}
                      <p className="text-xs text-muted-foreground">
                        {p.user.email}
                      </p>
                    </td>
                    <td className="p-3">{p.order?.orderNumber ?? "—"}</td>
                    <td className="p-3 font-medium">{formatMoney(p.amount)}</td>
                    <td className="p-3">
                      <Badge tone={statusTone(p.status)}>{p.status}</Badge>
                    </td>
                    <td className="p-3">{formatDate(p.createdAt)}</td>
                    <td className="p-3 text-right">
                      {p.status === "PAID" && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setRefundPayment(p);
                            setRefundAmount(Number(p.amount).toFixed(2));
                            setRefundReason("");
                            setError("");
                          }}
                        >
                          <RotateCcw />Refund
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between border-t p-3 text-sm">
            <span>
              Page {page} of {Math.max(1, Math.ceil(total / limit))}
            </span>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                Previous
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={page >= Math.ceil(total / limit)}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        </div>
      )}

      {refundPayment && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/50 p-4">
          <div className="w-full max-w-md rounded-xl border bg-white p-6 shadow-2xl">
            <h2 className="text-lg font-semibold">Issue refund</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Choose the amount to refund for {refundPayment.order?.orderNumber ?? "this payment"} through Razorpay.
            </p>
            <label className="mt-5 block text-sm font-medium">
              Refund amount ({refundPayment.currency})
              <Input
                className="mt-2"
                type="number"
                min="0.01"
                max={Number(refundPayment.amount)}
                step="0.01"
                value={refundAmount}
                onChange={(event) => setRefundAmount(event.target.value)}
                disabled={refundBusy}
              />
              <span className="mt-1 block text-xs font-normal text-muted-foreground">
                Payment total: {formatMoney(refundPayment.amount)}. Partial refunds can be issued in multiple steps.
              </span>
            </label>
            <label className="mt-5 block text-sm font-medium">
              Reason <span className="font-normal text-muted-foreground">(optional)</span>
              <textarea
                className="mt-2 min-h-24 w-full rounded-md border px-3 py-2 text-sm outline-none focus:border-slate-900"
                value={refundReason}
                onChange={(event) => setRefundReason(event.target.value)}
                maxLength={500}
                placeholder="Add an internal refund note"
                disabled={refundBusy}
              />
            </label>
            <div className="mt-6 flex justify-end gap-2">
              <Button variant="outline" disabled={refundBusy} onClick={() => setRefundPayment(null)}>
                Cancel
              </Button>
              <Button disabled={refundBusy} onClick={() => void refund()}>
                {refundBusy ? "Processing…" : "Confirm refund"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
