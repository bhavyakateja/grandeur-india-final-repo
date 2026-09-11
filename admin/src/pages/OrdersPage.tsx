import { useEffect, useState } from "react";
import { ArrowLeft, Eye, Package, Truck, ExternalLink, RefreshCw, Search, Printer, Globe } from "lucide-react";
import { adminApi, type AdminOrder, type OrderStatus, type ShippingInfo } from "@/lib/admin-api";
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

const statuses: OrderStatus[] = [
  "PENDING",
  "CONFIRMED",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
];

/* -------------------------------------------------------------------------- */
/* Shipping badge helpers                                                      */
/* -------------------------------------------------------------------------- */
function shippingBadgeTone(status?: string | null) {
  if (!status) return "default" as const;
  const s = status.toUpperCase();
  if (s === "DELIVERED") return "green" as const;
  if (s === "IN_TRANSIT" || s === "OUT_FOR_DELIVERY") return "blue" as const;
  if (s === "MANIFESTED" || s === "DISPATCHED") return "amber" as const;
  if (s.startsWith("PENDING")) return "default" as const;
  return "default" as const;
}

/* -------------------------------------------------------------------------- */
/* Shipping Panel (inside order detail)                                       */
/* -------------------------------------------------------------------------- */
function ShippingPanel({ order, onOrderUpdated }: { order: AdminOrder; onOrderUpdated: (o: AdminOrder) => void }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [tracking, setTracking] = useState<ShippingInfo | null>(null);
  const [trackingLoading, setTrackingLoading] = useState(false);
  const [showManual, setShowManual] = useState(false);
  const [manualCourier, setManualCourier] = useState(order.courier ?? "");
  const [manualWaybill, setManualWaybill] = useState(order.waybill ?? "");
  const [manualTrackingUrl, setManualTrackingUrl] = useState(order.trackingUrl ?? "");
  const [manualStatus, setManualStatus] = useState(order.shippingStatus ?? "DISPATCHED");

  const isInternational = order.isInternational ?? false;
  const hasWaybill = !!order.waybill;
  const canCreateShipment = !isInternational && !hasWaybill && (order.status === "CONFIRMED" || order.status === "SHIPPED");

  const createShipment = async () => {
    try {
      setBusy(true);
      setError("");
      const result = await adminApi.createShipment(order.id);
      onOrderUpdated({
        ...order,
        waybill: result.waybill ?? order.waybill,
        shippingStatus: result.shippingStatus ?? order.shippingStatus,
        trackingUrl: result.trackingUrl ?? order.trackingUrl,
        courier: result.courier ?? order.courier,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create shipment");
    } finally {
      setBusy(false);
    }
  };

  const saveManual = async () => {
    try {
      setBusy(true);
      setError("");
      const updated = isInternational
        ? await adminApi.shipInternational(order.id, {
          courier: manualCourier,
          waybill: manualWaybill,
          trackingUrl: manualTrackingUrl || undefined,
        })
        : await adminApi.updateShipment(order.id, {
          courier: manualCourier || undefined,
          waybill: manualWaybill || undefined,
          shippingStatus: manualStatus || undefined,
          trackingUrl: manualTrackingUrl || undefined,
        });
      onOrderUpdated(updated);
      setShowManual(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to update shipment");
    } finally {
      setBusy(false);
    }
  };

  const loadTracking = async () => {
    try {
      setTrackingLoading(true);
      setError("");
      const result = await adminApi.trackOrder(order.id);
      setTracking(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load tracking");
    } finally {
      setTrackingLoading(false);
    }
  };

  const openPackingSlip = async () => {
    try {
      setBusy(true);
      setError("");
      const { slipUrl } = await adminApi.packingSlip(order.id);
      window.open(slipUrl, "_blank", "noopener,noreferrer");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to get packing slip");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="rounded-xl border bg-card p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {isInternational ? (
            <Globe className="size-4 text-blue-500" />
          ) : (
            <Truck className="size-4 text-emerald-600" />
          )}
          <h2 className="font-semibold">
            {isInternational ? "International Shipping" : "Delhivery B2C"}
          </h2>
        </div>
        {order.shippingStatus && (
          <Badge tone={shippingBadgeTone(order.shippingStatus)}>
            {order.shippingStatus}
          </Badge>
        )}
      </div>

      {error && (
        <p className="text-sm text-destructive bg-destructive/10 rounded px-3 py-2">{error}</p>
      )}

      {/* Current waybill */}
      {hasWaybill && (
        <div className="rounded-lg border bg-muted/40 p-3 space-y-1">
          <p className="text-xs text-muted-foreground uppercase tracking-wide">
            {order.courier ?? "Courier"} Waybill
          </p>
          <p className="font-mono text-sm font-semibold">{order.waybill}</p>
          {order.trackingUrl && (
            <a
              href={order.trackingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline"
            >
              Track live <ExternalLink className="size-3" />
            </a>
          )}
        </div>
      )}

      {/* Action buttons */}
      <div className="flex flex-wrap gap-2">
        {canCreateShipment && (
          <Button
            size="sm"
            disabled={busy}
            onClick={createShipment}
            className="gap-1.5"
          >
            <Package className="size-3.5" />
            {busy ? "Creating…" : "Create Delhivery Shipment"}
          </Button>
        )}

        {hasWaybill && order.courier === "DELHIVERY" && (
          <>
            <Button
              size="sm"
              variant="outline"
              disabled={trackingLoading}
              onClick={loadTracking}
              className="gap-1.5"
            >
              <RefreshCw className={`size-3.5 ${trackingLoading ? "animate-spin" : ""}`} />
              Refresh Tracking
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={busy}
              onClick={openPackingSlip}
              className="gap-1.5"
            >
              <Printer className="size-3.5" />
              Packing Slip
            </Button>
          </>
        )}

        <Button
          size="sm"
          variant="outline"
          onClick={() => setShowManual(!showManual)}
        >
          {showManual ? "Cancel" : isInternational ? "Dispatch International Order" : "Manual Override"}
        </Button>
      </div>

      {/* Manual update form */}
      {showManual && (
        <div className="rounded-lg border p-4 space-y-3">
          <p className="text-sm font-medium">
            {isInternational ? "International Courier Details" : "Manual Shipment Override"}
          </p>
          <div className="grid gap-2 sm:grid-cols-2">
            <div>
              <label className="text-xs text-muted-foreground">Courier Name</label>
              <Input
                size={1}
                className="mt-1 h-8 text-sm"
                placeholder="e.g. DHL, FedEx, Aramex"
                value={manualCourier}
                onChange={(e) => setManualCourier(e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Waybill / AWB</label>
              <Input
                size={1}
                className="mt-1 h-8 text-sm font-mono"
                placeholder="Tracking number"
                value={manualWaybill}
                onChange={(e) => setManualWaybill(e.target.value)}
              />
            </div>
            {!isInternational && <div>
              <label className="text-xs text-muted-foreground">Shipping Status</label>
              <Input
                size={1}
                className="mt-1 h-8 text-sm"
                placeholder="e.g. MANIFESTED, IN_TRANSIT"
                value={manualStatus}
                onChange={(e) => setManualStatus(e.target.value)}
              />
            </div>}
            <div>
              <label className="text-xs text-muted-foreground">Tracking URL</label>
              <Input
                size={1}
                className="mt-1 h-8 text-sm"
                placeholder="https://..."
                value={manualTrackingUrl}
                onChange={(e) => setManualTrackingUrl(e.target.value)}
              />
            </div>
          </div>
          <Button size="sm" disabled={busy} onClick={saveManual}>
            {busy ? "Saving…" : isInternational ? "Dispatch International Order" : "Save Shipment Details"}
          </Button>
        </div>
      )}

      {/* Tracking timeline */}
      {tracking?.tracking && (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground uppercase tracking-wide">Tracking Timeline</p>
          {tracking.tracking.expectedDeliveryDate && (
            <p className="text-xs text-emerald-700 font-medium">
              Expected delivery: {new Date(tracking.tracking.expectedDeliveryDate).toLocaleDateString("en-IN")}
            </p>
          )}
          <div className="space-y-1.5 max-h-52 overflow-y-auto">
            {tracking.tracking.scans.map((scan, i) => (
              <div key={i} className="flex gap-3 text-xs">
                <div className="shrink-0 mt-0.5 size-2 rounded-full bg-primary/30" />
                <div>
                  <p className="font-medium">{scan.scan}</p>
                  <p className="text-muted-foreground">
                    {scan.location} · {new Date(scan.scanDateTime).toLocaleString("en-IN")}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {!isInternational && !hasWaybill && order.status !== "SHIPPED" && (
        <p className="text-xs text-muted-foreground">
          Confirmed domestic orders can be manifested with Delhivery here, or auto-created when moved to <strong>SHIPPED</strong>.
        </p>
      )}
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* Order Detail                                                                */
/* -------------------------------------------------------------------------- */
function OrderDetail({
  id,
  initialOrder,
  onBack,
  onUpdated,
}: {
  id: string;
  initialOrder?: AdminOrder;
  onBack: () => void;
  onUpdated: (order: AdminOrder) => void;
}) {
  const [o, setO] = useState<AdminOrder | null>(initialOrder ?? null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<OrderStatus | null>(null);

  const load = async (signal?: AbortSignal) => {
    try {
      setError("");
      const order = await adminApi.order(id, signal);
      setO(order);
    } catch (e) {
      if (signal?.aborted) return;
      setError(e instanceof Error ? e.message : "Unable to load order.");
    }
  };

  useEffect(() => {
    const ac = new AbortController();
    if (!initialOrder || !initialOrder.items) {
      void load(ac.signal);
    }
    return () => { ac.abort(); };
  }, [id]);

  const update = async (status: OrderStatus) => {
    if (!o) return;
    try {
      setBusy(true);
      setError("");
      const updated = await adminApi.updateOrderStatus(o.id, status);
      setO(updated);
      onUpdated(updated);
      setPendingStatus(null);
      // Re-fetch after a brief delay to pick up auto-created waybill
      setTimeout(() => { void load(); }, 1500);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to update order status.");
    } finally {
      setBusy(false);
    }
  };

  if (error && !o) {
    return (
      <>
        <Button variant="outline" onClick={onBack}><ArrowLeft />Back</Button>
        <div className="mt-4"><ErrorState message={error} retry={() => void load()} /></div>
      </>
    );
  }

  if (!o) return <Loading />;

  const next: Record<OrderStatus, OrderStatus[]> = {
    PENDING: ["CONFIRMED", "CANCELLED"],
    CONFIRMED: ["SHIPPED", "CANCELLED"],
    SHIPPED: ["DELIVERED"],
    DELIVERED: [],
    CANCELLED: [],
  };

  return (
    <div>
      <Button variant="outline" onClick={onBack}><ArrowLeft />Orders</Button>
      <PageHeader
        title={o.orderNumber}
        description={`Placed ${formatDate(o.createdAt)}${o.isInternational ? " · 🌐 International" : " · 🇮🇳 Domestic"}`}
      />
      {error && (
        <div className="mb-4"><ErrorState message={error} /></div>
      )}
      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          {/* Items */}
          <section className="rounded-xl border bg-card">
            <div className="border-b p-5">
              <h2 className="font-semibold">Items</h2>
            </div>
            <div className="divide-y">
              {o.items?.map((item) => (
                <div key={item.id} className="flex justify-between gap-4 p-5">
                  <div>
                    <p className="font-medium">{item.productName}</p>
                    <p className="text-sm text-muted-foreground">
                      Qty {item.quantity} · {formatMoney(item.price)} each
                    </p>
                  </div>
                  <p className="font-medium">
                    {formatMoney(Number(item.price) * item.quantity)}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* Delivery address */}
          <section className="rounded-xl border bg-card p-5">
            <h2 className="font-semibold mb-3">Delivery Address</h2>
            <p className="font-medium">{o.fullName}</p>
            {o.phone && <p className="text-sm text-muted-foreground">{o.phone}</p>}
            <p className="text-sm text-muted-foreground mt-1">
              {[o.addressLine1, o.addressLine2, o.city, o.state, o.postalCode, o.country]
                .filter(Boolean)
                .join(", ")}
            </p>
          </section>

          {/* Customer */}
          <section className="rounded-xl border bg-card p-5">
            <h2 className="font-semibold">Customer</h2>
            <p className="mt-3">{o.user?.name ?? o.fullName}</p>
            <p className="text-sm text-muted-foreground">{o.user?.email}</p>
          </section>

          {/* Shipping panel */}
          <ShippingPanel
            order={o}
            onOrderUpdated={(updated) => {
              setO(updated);
              onUpdated(updated);
            }}
          />
        </div>

        {/* Sidebar */}
        <aside className="rounded-xl border bg-card p-5">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Order status</h2>
            <Badge tone={statusTone(o.status)}>{o.status}</Badge>
          </div>
          <div className="mt-5 space-y-2">
            {next[o.status].length ? (
              <>
                {next[o.status].map((s) => (
                  <Button
                    key={s}
                    disabled={busy}
                    className="w-full"
                    variant={s === "CANCELLED" ? "destructive" : "default"}
                    onClick={() => setPendingStatus(s)}
                  >
                    Move to {s}
                  </Button>
                ))}
              </>
            ) : (
              <p className="text-sm text-muted-foreground">
                No further status transitions are allowed.
              </p>
            )}
          </div>
          <div className="mt-6 border-t pt-5">
            <div className="flex justify-between">
              <span>Payment</span>
              <Badge tone={statusTone(o.paymentStatus)}>{o.paymentStatus}</Badge>
            </div>
            <div className="mt-4 flex justify-between text-lg font-semibold">
              <span>Total</span>
              <span>{formatMoney(o.total)}</span>
            </div>
          </div>
        </aside>
      </div>

      {/* Confirm dialog */}
      {pendingStatus && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/50 p-4">
          <div className="w-full max-w-md rounded-xl border bg-white p-6 shadow-2xl">
            <h2 className="text-lg font-semibold">Change order status?</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Move {o.orderNumber} from <strong>{o.status}</strong> to <strong>{pendingStatus}</strong>?
              {pendingStatus === "CANCELLED" && " This may restore the reserved stock."}
              {pendingStatus === "SHIPPED" && !o.isInternational && " A Delhivery shipment will be auto-created."}
            </p>
            <div className="mt-6 flex justify-end gap-2">
              <Button variant="outline" disabled={busy} onClick={() => setPendingStatus(null)}>
                Keep current status
              </Button>
              <Button
                variant={pendingStatus === "CANCELLED" ? "destructive" : "default"}
                disabled={busy}
                onClick={() => void update(pendingStatus)}
              >
                {busy ? "Updating…" : `Move to ${pendingStatus}`}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Orders list page                                                            */
/* -------------------------------------------------------------------------- */
export default function OrdersPage() {
  const [data, setData] = useState<AdminOrder[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<string | null>(null);

  const limit = 15;
  const debouncedSearch = useDebounce(search, 300);

  const load = async (signal?: AbortSignal) => {
    try {
      setLoading(true);
      setError("");
      const r = await adminApi.orders(
        {
          page,
          limit,
          search: debouncedSearch.trim() || undefined,
          status: (status || undefined) as OrderStatus | undefined,
        },
        signal,
      );
      setData(r.data);
      setTotal(r.pagination.total);
    } catch (e) {
      if (signal?.aborted) return;
      setError(e instanceof Error ? e.message : "Unable to load orders.");
    } finally {
      if (!signal?.aborted) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    const ac = new AbortController();
    void load(ac.signal);
    return () => { ac.abort(); };
  }, [page, debouncedSearch, status]);

  if (selected) {
    const activeOrder = data.find((o) => o.id === selected);
    return (
      <OrderDetail
        id={selected}
        initialOrder={activeOrder}
        onBack={() => setSelected(null)}
        onUpdated={(updatedOrder) => {
          setData((prev) =>
            prev.map((item) => (item.id === updatedOrder.id ? updatedOrder : item)),
          );
        }}
      />
    );
  }

  return (
    <div>
      <PageHeader title="Orders" description={`${total} orders.`} />
      {error && (
        <div className="mb-4">
          <ErrorState message={error} retry={() => void load()} />
        </div>
      )}
      <div className="mb-4 grid gap-3 md:grid-cols-[1fr_200px]">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Search order, customer or phone…"
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
      </div>
      {loading ? (
        <Loading />
      ) : data.length === 0 ? (
        <Empty title="No orders found" />
      ) : (
        <div className="overflow-hidden rounded-xl border bg-card">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50">
                <tr className="text-left text-muted-foreground">
                  <th className="p-3">Order</th>
                  <th className="p-3">Customer</th>
                  <th className="p-3">Total</th>
                  <th className="p-3">Payment</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Shipping</th>
                  <th className="p-3">Placed</th>
                  <th className="p-3 text-right">View</th>
                </tr>
              </thead>
              <tbody>
                {data.map((o) => (
                  <tr key={o.id} className="border-t">
                    <td className="p-3 font-medium">
                      <div className="flex items-center gap-1.5">
                        {o.isInternational ? (
                          <Globe className="size-3 text-blue-500" />
                        ) : (
                          <Truck className="size-3 text-emerald-600" />
                        )}
                        {o.orderNumber}
                      </div>
                    </td>
                    <td className="p-3">
                      <p>{o.fullName}</p>
                      <p className="text-xs text-muted-foreground">{o.user?.email}</p>
                    </td>
                    <td className="p-3">{formatMoney(o.total)}</td>
                    <td className="p-3">
                      <Badge tone={statusTone(o.paymentStatus)}>
                        {o.paymentStatus}
                      </Badge>
                    </td>
                    <td className="p-3">
                      <Badge tone={statusTone(o.status)}>{o.status}</Badge>
                    </td>
                    <td className="p-3">
                      {o.waybill ? (
                        <span className="font-mono text-xs text-muted-foreground">
                          {o.waybill}
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground/50">—</span>
                      )}
                    </td>
                    <td className="p-3">{formatDate(o.createdAt)}</td>
                    <td className="p-3 text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSelected(o.id)}
                      >
                        <Eye />View
                      </Button>
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
    </div>
  );
}
