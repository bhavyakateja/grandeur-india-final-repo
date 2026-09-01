import { useEffect, useState } from "react";
import { Save, Sliders, Store, ShieldCheck, Truck } from "lucide-react";
import { adminApi, type StoreSettings } from "@/lib/admin-api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader, Loading, ErrorState } from "./common";

export default function SettingsPage() {
  const [settings, setSettings] = useState<StoreSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const [currency, setCurrency] = useState("INR");
  const [gstRate, setGstRate] = useState<number>(18);
  const [freeShippingThreshold, setFreeShippingThreshold] = useState<number>(999);
  const [defaultShippingCharge, setDefaultShippingCharge] = useState<number>(0);
  const [codEnabled, setCodEnabled] = useState(true);
  const [internationalShippingEnabled, setInternationalShippingEnabled] = useState(false);
  const [storeEnabled, setStoreEnabled] = useState(true);

  const load = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await adminApi.settings();
      const data = (res && typeof res === "object" && "data" in res && (res as { data: StoreSettings }).data)
        ? (res as { data: StoreSettings }).data
        : res;

      setSettings(data);
      setCurrency(data.currency || "INR");
      setGstRate(Number(data.gstRate ?? 18));
      setFreeShippingThreshold(Number(data.freeShippingThreshold ?? 999));
      setDefaultShippingCharge(Number(data.defaultShippingCharge ?? 0));
      setCodEnabled(Boolean(data.codEnabled));
      setInternationalShippingEnabled(Boolean(data.internationalShippingEnabled));
      setStoreEnabled(Boolean(data.storeEnabled));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load settings.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError("");
      setNotice("");

      const res = await adminApi.updateSettings({
        currency: currency.trim().toUpperCase() || "INR",
        gstRate: Number(gstRate),
        freeShippingThreshold: Number(freeShippingThreshold),
        defaultShippingCharge: Number(defaultShippingCharge),
        codEnabled,
        internationalShippingEnabled,
        storeEnabled,
      });

      const updated = (res && typeof res === "object" && "data" in res && (res as { data: StoreSettings }).data)
        ? (res as { data: StoreSettings }).data
        : res;

      setSettings(updated);
      setNotice("Store settings saved and Redis cache invalidated successfully.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save settings.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Loading />;

  return (
    <div>
      <PageHeader
        title="Store Settings"
        description="Configure tax rates, delivery rules, checkout behavior, and store availability."
      />

      {notice && (
        <div className="mb-4 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700">
          {notice}
        </div>
      )}
      {error && (
        <div className="mb-4">
          <ErrorState message={error} retry={load} />
        </div>
      )}

      <form onSubmit={save} className="max-w-4xl space-y-6">
        {/* Store Availability */}
        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <div className="flex items-center gap-2 font-semibold text-slate-900">
            <Store className="size-5" />
            <h2>Store Status & Availability</h2>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Control whether customers can browse and place orders on the storefront.
          </p>

          <div className="mt-4 flex items-center justify-between rounded-lg border p-4 bg-slate-50">
            <div>
              <p className="text-sm font-medium">Store Enabled</p>
              <p className="text-xs text-muted-foreground">
                When disabled, customers see a store maintenance message and checkout is blocked.
              </p>
            </div>
            <label className="relative inline-flex cursor-pointer items-center">
              <input
                type="checkbox"
                checked={storeEnabled}
                onChange={(e) => setStoreEnabled(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-slate-900"></div>
            </label>
          </div>
        </div>

        {/* Taxation & Currency */}
        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <div className="flex items-center gap-2 font-semibold text-slate-900">
            <ShieldCheck className="size-5" />
            <h2>Taxes & Currency</h2>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            GST calculations are dynamically applied to every cart and checkout snapshot.
          </p>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="currency">Currency Code</Label>
              <Input
                id="currency"
                className="mt-2"
                value={currency}
                maxLength={3}
                onChange={(e) => setCurrency(e.target.value.toUpperCase())}
                placeholder="INR"
                required
              />
            </div>
            <div>
              <Label htmlFor="gstRate">GST Tax Rate (%)</Label>
              <Input
                id="gstRate"
                type="number"
                min="0"
                max="100"
                step="0.1"
                className="mt-2"
                value={gstRate}
                onChange={(e) => setGstRate(Number(e.target.value))}
                required
              />
            </div>
          </div>
        </div>

        {/* Shipping & Delivery */}
        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <div className="flex items-center gap-2 font-semibold text-slate-900">
            <Truck className="size-5" />
            <h2>Shipping & Payment Methods</h2>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Set complimentary shipping rules and allowed payment mechanisms.
          </p>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="threshold">Free Shipping Threshold (INR)</Label>
              <Input
                id="threshold"
                type="number"
                min="0"
                step="1"
                className="mt-2"
                value={freeShippingThreshold}
                onChange={(e) => setFreeShippingThreshold(Number(e.target.value))}
                required
              />
              <p className="mt-1 text-xs text-muted-foreground">
                Orders with subtotal at or above this amount receive free shipping.
              </p>
            </div>

            <div>
              <Label htmlFor="defaultCharge">Default Shipping Fee (INR)</Label>
              <Input
                id="defaultCharge"
                type="number"
                min="0"
                step="1"
                className="mt-2"
                value={defaultShippingCharge}
                onChange={(e) => setDefaultShippingCharge(Number(e.target.value))}
                required
              />
              <p className="mt-1 text-xs text-muted-foreground">
                Shipping fee applied when subtotal is below the threshold.
              </p>
            </div>
          </div>

          <div className="mt-5 space-y-3">
            <label className="flex items-center gap-3 text-sm">
              <input
                type="checkbox"
                checked={codEnabled}
                onChange={(e) => setCodEnabled(e.target.checked)}
                className="size-4 rounded border-slate-300"
              />
              <div>
                <span className="font-medium">Enable Cash on Delivery (COD)</span>
                <p className="text-xs text-muted-foreground">Allow customers to choose pay on delivery if applicable.</p>
              </div>
            </label>

            <label className="flex items-center gap-3 text-sm">
              <input
                type="checkbox"
                checked={internationalShippingEnabled}
                onChange={(e) => setInternationalShippingEnabled(e.target.checked)}
                className="size-4 rounded border-slate-300"
              />
              <div>
                <span className="font-medium">Enable International Shipping</span>
                <p className="text-xs text-muted-foreground">Accept delivery addresses outside of India.</p>
              </div>
            </label>
          </div>
        </div>

        <div className="flex justify-end">
          <Button disabled={saving} className="min-w-32">
            <Save className="mr-2 size-4" />
            {saving ? "Saving…" : "Save settings"}
          </Button>
        </div>
      </form>
    </div>
  );
}
