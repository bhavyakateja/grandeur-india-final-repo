import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Check, Lock, Plus, CreditCard } from "lucide-react";
import { toast } from "sonner";
import { formatINR } from "@/lib/utils";
import { useStore, type Address } from "@/lib/store";
import { useAuth } from "@/context/auth-context";
import { useAddresses, useCreateAddress, useCheckout, useCreatePayment, useVerifyPayment } from "@/hooks/use-api";
import { AuthDialog } from "@/components/auth-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

const RAZORPAY_SCRIPT = "https://checkout.razorpay.com/v1/checkout.js";

function loadRazorpay() {
  if (window.Razorpay) return Promise.resolve();
  return new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${RAZORPAY_SCRIPT}"]`);
    if (existing) { existing.addEventListener("load", () => resolve(), { once: true }); existing.addEventListener("error", () => reject(new Error("Unable to load payment gateway")), { once: true }); return; }
    const script = document.createElement("script"); script.src = RAZORPAY_SCRIPT; script.async = true;
    script.onload = () => resolve(); script.onerror = () => reject(new Error("Unable to load payment gateway")); document.body.appendChild(script);
  });
}

export default function CheckoutPage() {
  const { lines } = useStore();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [authOpen, setAuthOpen] = useState(false);
  const [adding, setAdding] = useState(false);
  const [selectedAddressId, setSelectedAddressId] = useState("");
  const [couponCode, setCouponCode] = useState("");
  const [placing, setPlacing] = useState(false);
  const { data: addresses = [], isLoading: addressesLoading } = useAddresses();
  const createAddressMutation = useCreateAddress();
  const checkoutMutation = useCheckout();
  const createPaymentMutation = useCreatePayment();
  const verifyPaymentMutation = useVerifyPayment();

  useEffect(() => { if (!selectedAddressId) setSelectedAddressId(addresses.find((a) => a.isDefault)?.id || addresses[0]?.id || ""); }, [addresses, selectedAddressId]);
  const activeAddress = useMemo(() => addresses.find((a) => a.id === selectedAddressId), [addresses, selectedAddressId]);

  if (!isAuthenticated) return <div className="mx-auto max-w-xl px-6 py-28 text-center"><h1 className="font-display text-4xl">Sign in to checkout</h1><p className="mt-3 text-sm text-muted-foreground">Your cart and checkout are securely tied to your account.</p><Button onClick={() => setAuthOpen(true)} className="mt-6 bg-navy text-white">Sign in / Register</Button><AuthDialog open={authOpen} onOpenChange={setAuthOpen} /></div>;
  if (lines.length === 0) return <div className="mx-auto max-w-xl px-6 py-28 text-center"><h1 className="font-display text-4xl">Nothing to check out</h1><Link to="/products" className="mt-6 inline-block text-xs uppercase tracking-[0.2em] text-gold">Browse jewellery</Link></div>;

  const preview = checkoutMutation.data;
  const total = Number(preview?.total ?? 0);

  const previewCheckout = async () => {
    if (!selectedAddressId) { toast.error("Please select a delivery address"); return; }
    try { await checkoutMutation.mutateAsync({ addressId: selectedAddressId, ...(couponCode.trim() ? { couponCode: couponCode.trim() } : {}) }); }
    catch (error) { toast.error(error instanceof Error ? error.message : "Unable to calculate checkout total"); }
  };

  const pay = async () => {
    if (!selectedAddressId) { toast.error("Please select a delivery address"); return; }
    setPlacing(true);
    try {
      const payment = await createPaymentMutation.mutateAsync({ addressId: selectedAddressId, ...(couponCode.trim() ? { couponCode: couponCode.trim() } : {}) });
      if (payment.provider !== "RAZORPAY" || !payment.key) throw new Error("The configured payment provider is not available in this storefront.");
      await loadRazorpay();
      if (!window.Razorpay) throw new Error("Payment gateway is unavailable.");
      const gateway = new window.Razorpay({ key: payment.key, amount: Math.round(Number(payment.amount) * 100), currency: payment.currency, name: "Grandeur India", description: "Grandeur India jewellery purchase", order_id: payment.providerOrderId, prefill: activeAddress ? { name: activeAddress.fullName, contact: activeAddress.phone } : undefined, theme: { color: "#102650" }, handler: async (response) => {
        try {
          const order = await verifyPaymentMutation.mutateAsync({ providerOrderId: response.razorpay_order_id, providerPaymentId: response.razorpay_payment_id, signature: response.razorpay_signature });
          navigate(`/order-success?id=${encodeURIComponent(order.orderNumber)}`, { replace: true });
        } catch (error) { toast.error(error instanceof Error ? error.message : "Payment verification failed"); }
        finally { setPlacing(false); }
      }, modal: { ondismiss: () => setPlacing(false) } });
      gateway.open();
    } catch (error) { setPlacing(false); toast.error(error instanceof Error ? error.message : "Unable to start payment"); }
  };

  return <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8"><h1 className="font-display text-4xl">Checkout</h1><div className="gold-rule mt-3" />
    <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,1fr)_380px]">
      <div className="space-y-8">
        <section className="rounded-sm border border-border p-6"><div className="flex items-center justify-between"><div><p className="eyebrow text-gold">01</p><h2 className="mt-1 font-display text-2xl">Delivery address</h2></div><span className="text-xs text-muted-foreground">{addresses.length} saved</span></div>
          {addressesLoading ? <p className="mt-6 text-sm text-muted-foreground">Loading addresses…</p> : addresses.length === 0 ? <p className="mt-6 text-sm text-muted-foreground">Add an address to continue.</p> : <div className="mt-6 space-y-3">{addresses.map((address) => <label key={address.id} className={`block cursor-pointer rounded-sm border p-4 ${selectedAddressId === address.id ? "border-navy bg-blush/30" : "border-border"}`}><input type="radio" name="address" value={address.id} checked={selectedAddressId === address.id} onChange={() => { setSelectedAddressId(address.id); checkoutMutation.reset(); }} className="sr-only" /><div className="flex justify-between gap-3"><span className="font-medium">{address.fullName}</span>{address.isDefault && <span className="text-[10px] uppercase tracking-[0.15em] text-gold">Default</span>}</div><p className="mt-1 text-sm text-muted-foreground">{address.addressLine1}{address.addressLine2 ? `, ${address.addressLine2}` : ""}, {address.city}, {address.state} — {address.postalCode}</p><p className="mt-1 text-xs text-muted-foreground">{address.phone}</p></label>)}</div>}
          {adding ? <AddressForm onCancel={() => setAdding(false)} onSave={async (a) => { try { const created = await createAddressMutation.mutateAsync({ fullName: a.name, phone: a.phone, addressLine1: a.line1, city: a.city, state: a.state, country: "India", postalCode: a.pincode, isDefault: a.isDefault }); setSelectedAddressId(created.id); setAdding(false); toast.success("Address saved"); } catch (error) { toast.error(error instanceof Error ? error.message : "Unable to save address"); } }} /> : <button type="button" onClick={() => setAdding(true)} className="mt-5 flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-navy"><Plus className="size-4" /> Add address</button>}
        </section>

        <section className="rounded-sm border border-border p-6"><p className="eyebrow text-gold">02</p><h2 className="mt-1 font-display text-2xl">Review total</h2><div className="mt-5 grid gap-3 sm:grid-cols-[1fr_auto]"><Input value={couponCode} onChange={(e) => { setCouponCode(e.target.value.toUpperCase()); checkoutMutation.reset(); }} placeholder="Coupon code (optional)" className="uppercase" /><Button type="button" variant="outline" onClick={previewCheckout} disabled={!selectedAddressId || checkoutMutation.isPending} className="border-navy">{checkoutMutation.isPending ? "Checking…" : "Apply / calculate"}</Button></div>{preview && <dl className="mt-6 space-y-3 text-sm"><Row label="Subtotal" value={formatINR(Number(preview.subtotal))} /><Row label="Discount" value={preview.discount && Number(preview.discount) > 0 ? `-${formatINR(Number(preview.discount))}` : "—"} /><Row label="Tax" value={formatINR(Number(preview.tax))} /><Row label="Shipping" value={Number(preview.shipping) ? formatINR(Number(preview.shipping)) : "Free"} /><div className="border-t pt-3"><Row label="Total" value={formatINR(total)} strong /></div></dl>}<p className="mt-4 text-xs text-muted-foreground">Final pricing is calculated and validated by the backend from your current cart.</p></section>

        <Button type="button" onClick={pay} disabled={!selectedAddressId || placing || addresses.length === 0} className="h-14 w-full rounded-sm bg-navy text-xs uppercase tracking-[0.2em] text-white">{placing ? "Opening secure payment…" : <><Lock className="mr-2 size-4" /> Pay securely with Razorpay</>}</Button>
      </div>

      <aside className="h-fit rounded-sm border border-border p-6 lg:sticky lg:top-44"><p className="eyebrow text-navy">Your bag</p><ul className="mt-5 space-y-4">{lines.map(({ product, qty }) => <li key={product.id} className="flex gap-3"><div className="size-16 shrink-0 overflow-hidden rounded-sm bg-blush">{product.images?.[0]?.url && <img src={product.images[0].url} alt="" className="size-full object-cover" />}</div><div className="min-w-0 flex-1"><p className="truncate text-sm">{product.name}</p><p className="text-xs text-muted-foreground">Qty {qty}</p></div><span className="text-sm">{formatINR(Number(product.price) * qty)}</span></li>)}</ul><div className="mt-6 border-t pt-4"><Row label="Cart subtotal" value={formatINR(lines.reduce((sum, line) => sum + Number(line.product.price) * line.qty, 0))} /></div><div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground"><CreditCard className="size-4" /> Payment is verified by the backend before an order is created.</div></aside>
    </div>
  </div>;
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) { return <div className="flex justify-between gap-4"><dt className={strong ? "font-display text-lg" : "text-muted-foreground"}>{label}</dt><dd className={strong ? "font-display text-lg" : ""}>{value}</dd></div>; }

export function AddressForm({ initial, onSave, onCancel }: { initial?: Address; onSave: (a: Address) => void | Promise<void>; onCancel: () => void }) {
  const [form, setForm] = useState<Address>(initial ?? { id: "", label: "Address", name: "", phone: "", line1: "", city: "", state: "", pincode: "", isDefault: false });
  const set = (key: keyof Address) => (e: React.ChangeEvent<HTMLInputElement>) => setForm((current) => ({ ...current, [key]: e.target.value }));
  return <form onSubmit={(e) => { e.preventDefault(); void onSave(form); }} className="mt-5 grid gap-4 rounded-sm border border-border p-5 sm:grid-cols-2"><TextField label="Full name" value={form.name} onChange={set("name")} required /><TextField label="Phone" value={form.phone} onChange={set("phone")} required inputMode="numeric" pattern="[6-9][0-9]{9}" /><TextField label="Pincode" value={form.pincode} onChange={set("pincode")} required inputMode="numeric" pattern="[0-9]{6}" /><TextField label="Address" value={form.line1} onChange={set("line1")} required className="sm:col-span-2" /><TextField label="City" value={form.city} onChange={set("city")} required /><TextField label="State" value={form.state} onChange={set("state")} required /><label className="flex items-center gap-2 text-sm sm:col-span-2"><input type="checkbox" checked={form.isDefault} onChange={(e) => setForm((current) => ({ ...current, isDefault: e.target.checked }))} /> Make this the default address</label><div className="flex gap-3 sm:col-span-2"><Button type="submit" className="bg-navy text-white">Save address</Button><Button type="button" variant="outline" onClick={onCancel}>Cancel</Button></div></form>;
}
function TextField({ label, className, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) { return <div className={className}><Label className="text-xs uppercase tracking-[0.14em] text-muted-foreground">{label}</Label><Input {...props} className="mt-2 rounded-sm" /></div>; }
