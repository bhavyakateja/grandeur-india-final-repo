import { useState } from "react";
import { Link } from "react-router-dom";
import { Minus, Plus, Trash2, ShoppingBag, Tag } from "lucide-react";
import { toast } from "sonner";
import { formatINR } from "@/lib/utils";
import { useStore } from "@/lib/store";
import { useApplyCoupon } from "@/hooks/use-api";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

function CartPage() {
  const { lines, setQty, removeFromCart, subtotal } = useStore();
  const [couponCode, setCouponCode] = useState("");
  const [appliedDiscount, setAppliedDiscount] = useState(0);
  const [couponApplied, setCouponApplied] = useState(false);

  const applyCouponMutation = useApplyCoupon();

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponCode.trim()) return;

    try {
      const res = await applyCouponMutation.mutateAsync({
        code: couponCode.trim(),
        subtotal,
      });

      setAppliedDiscount(Number(res.discount));
      setCouponApplied(true);
      toast.success("Coupon applied successfully");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to apply coupon");
    }
  };

  const estimatedTotal = Math.max(0, subtotal - appliedDiscount);

  if (lines.length === 0) {
    return (
      <div className="mx-auto max-w-xl px-6 py-28 text-center">
        <ShoppingBag className="mx-auto size-10 text-gold" />
        <h1 className="mt-6 font-display text-4xl">Your bag is empty</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Discover pieces made to be worn every day and passed on for generations.
        </p>
        <Link
          to="/products"
          className="mt-8 inline-block rounded-sm bg-navy px-8 py-4 text-[11px] tracking-[0.22em] text-navy-foreground uppercase"
        >
          Start shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="font-display text-4xl">Shopping Bag</h1>
      <div className="gold-rule mt-3" />

      <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,1fr)_360px]">
        <ul className="divide-y divide-border">
          {lines.map(({ product, qty, itemId }) => {
            const price = Number(product.price);
            const imageUrl = product.images?.[0]?.url || "";
            const idToUse = itemId || product.id;

            return (
              <li key={product.id} className="grid grid-cols-[96px_minmax(0,1fr)] gap-4 py-6 sm:grid-cols-[128px_minmax(0,1fr)]">
                <Link
                  to={`/product/${product.id}`}
                  className="overflow-hidden rounded-sm bg-blush"
                >
                  {imageUrl ? <img src={imageUrl} alt={product.name} loading="lazy" className="aspect-[4/5] w-full object-cover" /> : <div className="aspect-[4/5] w-full bg-gradient-blush" aria-label="Product image unavailable" />}
                </Link>
                <div className="min-w-0">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h2 className="truncate font-display text-xl">{product.name}</h2>
                      <p className="mt-0.5 text-xs tracking-[0.12em] text-muted-foreground uppercase">
                        {product.category?.name || "Jewellery"}
                      </p>
                    </div>
                    <button onClick={() => removeFromCart(idToUse)} aria-label="Remove" className="text-muted-foreground transition-colors hover:text-destructive">
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center rounded-sm border border-border">
                      <button className="grid size-9 place-items-center" onClick={() => setQty(idToUse, qty - 1)} aria-label="Decrease">
                        <Minus className="size-3.5" />
                      </button>
                      <span className="w-9 text-center text-sm">{qty}</span>
                      <button className="grid size-9 place-items-center" onClick={() => setQty(idToUse, qty + 1)} aria-label="Increase">
                        <Plus className="size-3.5" />
                      </button>
                    </div>
                    <span className="font-medium">{formatINR(price * qty)}</span>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>

        <aside className="h-fit lg:sticky lg:top-44">
          <div className="rounded-sm border border-border p-6 shadow-card">
            <h2 className="eyebrow text-navy">Order Summary</h2>

            <form onSubmit={handleApplyCoupon} className="mt-4 flex gap-2">
              <Input
                placeholder="Promo Code"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value)}
                className="text-xs h-9 uppercase"
              />
              <Button type="submit" disabled={applyCouponMutation.isPending} className="bg-navy text-navy-foreground text-xs h-9">
                Apply
              </Button>
            </form>

            <dl className="mt-5 space-y-3 text-sm">
              <Row label="Subtotal" value={formatINR(subtotal)} />
              {couponApplied && (
                <Row label="Discount" value={`-${formatINR(appliedDiscount)}`} />
              )}
              <Row label="Taxes & shipping" value="Calculated at checkout" />
              <div className="border-t border-border pt-3">
                <Row label="Cart total" value={formatINR(estimatedTotal)} strong />
              </div>
            </dl>
            <Link
              to="/checkout"
              className="mt-6 block rounded-sm bg-navy py-4 text-center text-[11px] tracking-[0.22em] text-navy-foreground uppercase transition-opacity hover:opacity-90"
            >
              Proceed to checkout
            </Link>
          </div>
        </aside>
      </div>
    </div>
  );
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex justify-between">
      <dt className={strong ? "font-display text-lg" : "text-muted-foreground"}>{label}</dt>
      <dd className={strong ? "font-display text-lg" : ""}>{value}</dd>
    </div>
  );
}

export default CartPage;
