import { Link } from "react-router-dom";
import {
  ArrowRight,
  Minus,
  Plus,
  ShoppingBag,
  Trash2,
} from "lucide-react";

import { formatINR } from "@/lib/utils";
import { useStore } from "@/lib/store";
import { useWishlist } from "@/hooks/use-api";
import { ProductCard } from "@/components/product-card";
import { useAuth } from "@/context/auth-context";

function CartPage() {
  const {
    lines,
    setQty,
    removeFromCart,
  } = useStore();

  const { isAuthenticated } = useAuth();

  const {
    data: wishlistData = [],
    isLoading: wishlistLoading,
  } = useWishlist();

  const wishlistProducts = wishlistData
    .map((item) => item.product)
    .filter(Boolean)
    .slice(0, 4);

  const subtotal = lines.reduce(
    (sum, line) =>
      sum + Number(line.product.price) * line.qty,
    0,
  );

  if (lines.length === 0) {
    return (
      <main className="bg-white">
        <section className="mx-auto max-w-2xl px-5 py-24 text-center sm:py-32">
          <div className="mx-auto flex size-16 items-center justify-center rounded-full border border-[#c89a4b]/25 bg-[#fdf7f4]">
            <ShoppingBag className="size-5 text-[#c89a4b]" />
          </div>

          <p className="mt-7 text-[9px] font-medium uppercase tracking-[0.3em] text-[#c89a4b]">
            Your selection
          </p>

          <h1 className="mt-3 font-display text-4xl text-[#102650] sm:text-5xl">
            Your bag is empty
          </h1>

          <div className="mx-auto mt-4 h-px w-12 bg-[#c89a4b]/60" />

          <p className="mx-auto mt-6 max-w-md text-sm leading-7 text-[#102650]/60">
            Discover pieces made to be worn every day,
            treasured for years, and passed on through
            generations.
          </p>

          <Link
            to="/products"
            className="group mt-9 inline-flex h-13 items-center gap-3 bg-[#102650] px-8 py-4 text-[10px] font-medium uppercase tracking-[0.23em] text-white transition-colors hover:bg-[#18325f]"
          >
            Explore the collection
            <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-1" />
          </Link>
        </section>

        <WishlistSection
          products={wishlistProducts}
          loading={wishlistLoading}
          authenticated={isAuthenticated}
        />
      </main>
    );
  }

  return (
    <main className="bg-white">
      {/* Page introduction */}
      <section className="mx-auto max-w-7xl px-5 pb-8 pt-12 sm:px-8 sm:pt-16 lg:px-12">
        <div className="flex items-end justify-between gap-6">
          <div>
            <p className="text-[9px] font-medium uppercase tracking-[0.3em] text-[#c89a4b]">
              Your selection
            </p>

            <h1 className="mt-3 font-display text-4xl text-[#102650] sm:text-5xl">
              Shopping Bag
            </h1>

            <div className="mt-4 h-px w-12 bg-[#c89a4b]/60" />

            <p className="mt-5 text-xs tracking-[0.08em] text-[#102650]/60">
              {lines.length}{" "}
              {lines.length === 1 ? "piece" : "pieces"} selected
            </p>
          </div>

          <Link
            to="/products"
            className="group hidden items-center gap-2 pb-1 text-[9px] font-medium uppercase tracking-[0.2em] text-[#102650]/60 transition-colors hover:text-[#102650] sm:flex"
          >
            Continue shopping
            <ArrowRight className="size-3 text-[#c89a4b] transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </section>

      {/* Cart */}
      <section className="mx-auto max-w-7xl px-5 pb-20 sm:px-8 lg:px-12">
        <div className="grid items-start gap-10 lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-20">
          <div>
            <div className="hidden border-b border-[#102650]/10 pb-3 text-[9px] font-medium uppercase tracking-[0.22em] text-[#102650]/50 sm:grid sm:grid-cols-[1fr_150px]">
              <span>Piece</span>
              <span className="text-right">Total</span>
            </div>

            <ul className="divide-y divide-[#102650]/10">
              {lines.map(({ product, qty, itemId }) => {
                const price = Number(product.price) || 0;
                const imageUrl =
                  product.images?.[0]?.url || "";
                const idToUse =
                  itemId || product.id;

                const maxQuantity = Math.max(
                  1,
                  Number(product.stock) || 1,
                );

                return (
                  <li
                    key={product.id}
                    className="py-6 sm:py-8"
                  >
                    {/* Consistent 3-column structural layout for mobile, tablet, and desktop */}
                    <div className="grid grid-cols-[88px_minmax(0,1fr)_120px] gap-4 sm:grid-cols-[132px_minmax(0,1fr)_160px] sm:gap-7 items-start">
                      <Link
                        to={`/product/${product.id}`}
                        className="group block overflow-hidden bg-[#fdf0ef]"
                      >
                        <div className="aspect-[4/5] overflow-hidden">
                          {imageUrl ? (
                            <img
                              src={imageUrl}
                              alt={product.name}
                              loading="lazy"
                              className="size-full object-cover transition-transform duration-700 group-hover:scale-[1.035]"
                            />
                          ) : (
                            <div className="flex size-full items-center justify-center bg-[#fdf0ef]">
                              <ShoppingBag className="size-5 text-[#102650]/15" />
                            </div>
                          )}
                        </div>
                      </Link>

                      {/* Middle Column: Item Details + Quantity Selector */}
                      <div className="flex min-w-0 flex-col justify-between self-stretch py-0.5">
                        <div>
                          <p className="mb-1 text-[9px] font-medium uppercase tracking-[0.2em] text-[#c89a4b]">
                            {product.category?.name ||
                              "Jewellery"}
                          </p>

                          <Link
                            to={`/product/${product.id}`}
                            className="font-display text-base leading-tight text-[#102650] transition-colors hover:text-[#c89a4b] sm:text-2xl"
                          >
                            {product.name}
                          </Link>

                          <p className="mt-1 text-[11px] text-[#102650]/60 sm:text-xs">
                            {formatINR(price)} each
                          </p>
                        </div>

                        <div className="mt-4 flex items-center sm:mt-6">
                          <div className="flex h-8 sm:h-9 items-center border border-[#102650]/20 bg-white">
                            <button
                              type="button"
                              disabled={qty <= 1}
                              onClick={() =>
                                setQty(
                                  idToUse,
                                  Math.max(1, qty - 1),
                                )
                              }
                              aria-label="Decrease quantity"
                              className="grid size-7 sm:size-8 place-items-center text-[#102650]/60 transition-colors hover:text-[#102650] disabled:opacity-25"
                            >
                              <Minus className="size-3" />
                            </button>

                            <span className="w-6 sm:w-7 text-center text-xs font-medium text-[#102650]">
                              {qty}
                            </span>

                            <button
                              type="button"
                              disabled={qty >= maxQuantity}
                              onClick={() =>
                                setQty(
                                  idToUse,
                                  Math.min(
                                    maxQuantity,
                                    qty + 1,
                                  ),
                                )
                              }
                              aria-label="Increase quantity"
                              className="grid size-7 sm:size-8 place-items-center text-[#102650]/60 transition-colors hover:text-[#102650] disabled:opacity-25"
                            >
                              <Plus className="size-3" />
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Right Column: Price at top, Remove button below it, perfectly right-aligned across all screens */}
                      <div className="flex flex-col items-end py-0.5 text-right self-stretch justify-between">
                        <span className="font-display text-lg sm:text-xl text-[#102650]">
                          {formatINR(price * qty)}
                        </span>

                        <button
                          type="button"
                          onClick={() =>
                            removeFromCart(idToUse)
                          }
                          aria-label={`Remove ${product.name} from bag`}
                          className="inline-flex items-center gap-1 text-[9px] uppercase tracking-[0.16em] text-[#102650]/50 transition-colors hover:text-[#102650]"
                        >
                          <Trash2 className="size-3 sm:size-3.5" />
                          <span>Remove</span>
                        </button>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>

            <Link
              to="/products"
              className="group mt-7 flex items-center gap-2 text-[9px] font-medium uppercase tracking-[0.2em] text-[#102650]/60 transition-colors hover:text-[#102650] sm:hidden"
            >
              <ArrowRight className="size-3 rotate-180 text-[#c89a4b]" />
              Continue shopping
            </Link>
          </div>

          {/* Order summary (Non-sticky) */}
          <aside className="h-fit">
            <div className="border border-[#102650]/15 bg-[#fffdfb] shadow-sm">
              <div className="border-b border-[#102650]/10 px-6 py-5 sm:px-7">
                <p className="text-[9px] font-medium uppercase tracking-[0.28em] text-[#c89a4b]">
                  Grandeur
                </p>

                <h2 className="mt-2 font-display text-2xl text-[#102650]">
                  Order Summary
                </h2>
              </div>

              <div className="px-6 py-6 sm:px-7">
                <dl className="space-y-4">
                  <SummaryRow
                    label="Subtotal"
                    value={formatINR(subtotal)}
                  />

                  <SummaryRow
                    label="Taxes & shipping"
                    value="Calculated at checkout"
                    muted
                  />
                </dl>

                <div className="mt-6 border-t border-[#102650]/10 pt-5">
                  <div className="flex items-end justify-between gap-4">
                    <span className="font-display text-xl text-[#102650]">
                      Total
                    </span>

                    <span className="font-display text-2xl text-[#102650]">
                      {formatINR(subtotal)}
                    </span>
                  </div>

                  <p className="mt-2 text-right text-[10px] leading-4 text-[#102650]/60">
                    Final taxes, shipping and discounts
                    are calculated at checkout.
                  </p>
                </div>

                <Link
                  to="/checkout"
                  className="group mt-7 flex h-14 items-center justify-center gap-3 bg-[#102650] text-[10px] font-medium uppercase tracking-[0.23em] text-white transition-colors hover:bg-[#18325f]"
                >
                  Proceed to checkout
                  <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-1" />
                </Link>
              </div>
            </div>
          </aside>
        </div>
      </section>

      <WishlistSection
        products={wishlistProducts}
        loading={wishlistLoading}
        authenticated={isAuthenticated}
      />
    </main>
  );
}

function WishlistSection({
  products,
  loading,
  authenticated,
}: {
  products: Array<any>;
  loading: boolean;
  authenticated: boolean;
}) {
  if (
    !authenticated ||
    loading ||
    products.length === 0
  ) {
    return null;
  }

  return (
    <section className="border-t border-[#102650]/10 bg-[#fdf7f4]">
      <div className="mx-auto max-w-[1320px] px-5 py-14 sm:px-8 sm:py-18 lg:px-12">
        <div className="flex items-end justify-between gap-6">
          <div>
            <p className="text-[9px] font-medium uppercase tracking-[0.3em] text-[#c89a4b]">
              Saved for later
            </p>

            <h2 className="mt-3 font-display text-3xl text-[#102650] sm:text-4xl">
              From your wishlist
            </h2>

            <div className="mt-4 h-px w-10 bg-[#c89a4b]/60" />
            <p className="mt-4 text-[9px] tracking-[0.08em] text-[#102650]/60">
              {products.length} {products.length === 1 ? "piece" : "pieces"} saved
            </p>
          </div>

          <Link
            to="/wishlist"
            className="group hidden items-center gap-2 text-[9px] font-medium uppercase tracking-[0.2em] text-[#102650]/60 transition-colors hover:text-[#102650] sm:flex"
          >
            View wishlist
            <ArrowRight className="size-3 text-[#c89a4b] transition-transform group-hover:translate-x-1" />
          </Link>
        </div>

        <div className="mt-10 grid grid-cols-2 gap-x-4 gap-y-10 sm:grid-cols-4 sm:gap-x-6">
          {products.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function SummaryRow({
  label,
  value,
  muted,
}: {
  label: string;
  value: string;
  muted?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-5">
      <dt
        className={
          muted
            ? "text-xs text-[#102650]/70 font-medium"
            : "text-xs text-[#102650]/80 font-medium"
        }
      >
        {label}
      </dt>

      <dd
        className={
          muted
            ? "text-right text-[11px] text-[#102650]/70 font-medium"
            : "text-xs font-semibold text-[#102650]"
        }
      >
        {value}
      </dd>
    </div>
  );
}

export default CartPage;