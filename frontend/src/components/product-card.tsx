import { Link } from "react-router-dom";
import { useState } from "react";
import { ArrowRight, Heart, ShoppingBag } from "lucide-react";
import { toast } from "sonner";

import { cn, formatINR } from "@/lib/utils";
import { useStore } from "@/lib/store";
import { useAuth } from "@/context/auth-context";
import type { Product as ApiProduct } from "@/lib/types";
import { AuthDialog } from "@/components/auth-dialog";

type ProductCardProps = {
  product: ApiProduct;
  index?: number;
};

export function ProductCard({
  product,
  index = 0,
}: ProductCardProps) {
  const {
    addToCart,
    toggleWishlist,
    wishlist,
  } = useStore();

  const { isAuthenticated } = useAuth();
  const [authOpen, setAuthOpen] = useState(false);

  const wished = wishlist.includes(product.id);

  const price = Number(product.price || 0);

  const imageUrl =
    product.images?.[0]?.url || "";

  const categoryName =
    product.category?.name || "Jewellery";

  const isOutOfStock =
    product.status === "OUT_OF_STOCK" ||
    (product.stock ?? 0) <= 0;

  /* =========================================================
     WISHLIST
  ========================================================= */

  const handleWishlist = () => {
    if (!isAuthenticated) {
      setAuthOpen(true);
      return;
    }

    toggleWishlist(product.id);

    toast(
      wished
        ? "Removed from wishlist"
        : "Saved to wishlist",
    );
  };

  /* =========================================================
     ADD TO BAG
  ========================================================= */

  const handleAddToCart = () => {
    if (isOutOfStock) return;

    addToCart(product.id, 1, product);

    toast.success(
      `${product.name} added to bag`,
    );
  };

  return (
    <>
      <article
        className="group relative min-w-0"
        style={{
          animationDelay: `${(index % 12) * 50}ms`,
        }}
      >
        {/* =====================================================
          PRODUCT IMAGE
      ===================================================== */}

        <div className="relative overflow-hidden bg-[#faf3f1]">
          <Link
            to={`/product/${product.id}`}
            className="block"
            aria-label={`View ${product.name}`}
          >
            <div className="relative aspect-[4/5] overflow-hidden">
              {imageUrl ? (
                <img
                  src={imageUrl}
                  alt={`${product.name} - ${categoryName} | Grandeur`}
                  loading={index < 4 ? "eager" : "lazy"}
                  decoding="async"
                  width={800}
                  height={1000}
                  className={cn(
                    "h-full w-full object-cover",
                    "transition-transform",
                    "duration-[1400ms]",
                    "ease-[cubic-bezier(0.22,1,0.36,1)]",
                    "group-hover:scale-[1.035]",
                    "motion-reduce:transition-none",
                    "motion-reduce:group-hover:scale-100",
                  )}
                />
              ) : (
                <div
                  className="h-full w-full bg-gradient-blush"
                  aria-label="Product image unavailable"
                />
              )}

              {/* Very subtle image veil on hover */}
              <div
                aria-hidden="true"
                className={cn(
                  "pointer-events-none absolute inset-0",
                  "bg-black/[0.025]",
                  "opacity-0",
                  "transition-opacity duration-700",
                  "group-hover:opacity-100",
                  "motion-reduce:transition-none",
                )}
              />
            </div>
          </Link>

          {/* ===================================================
            WISHLIST
        =================================================== */}

          <button
            type="button"
            aria-label={
              wished
                ? `Remove ${product.name} from wishlist`
                : `Add ${product.name} to wishlist`
            }
            aria-pressed={wished}
            onClick={handleWishlist}
            className={cn(
              "absolute right-3 top-3 z-10",
              "grid size-9 place-items-center",
              "bg-[#fffdfb]/90",
              "backdrop-blur-md",
              "shadow-[0_2px_12px_rgba(20,36,61,0.04)]",
              "transition-all duration-300",
              "hover:bg-[#fffdfb]",
              "hover:shadow-[0_4px_16px_rgba(20,36,61,0.08)]",
              "active:scale-95",
              "focus-visible:outline-none",
              "focus-visible:ring-1",
              "focus-visible:ring-[#c89a4b]",
            )}
          >
            <Heart
              className={cn(
                "size-[15px]",
                "transition-all duration-300",
                wished
                  ? "fill-[#c89a4b] text-[#c89a4b]"
                  : "text-[#c89a4b]/75",
              )}
              strokeWidth={1.25}
            />
          </button>

          {/* ===================================================
            AVAILABILITY
        =================================================== */}

          {isOutOfStock && (
            <div
              className={cn(
                "absolute inset-x-0 bottom-0 z-10",
                "border-t border-white/60",
                "bg-[#fffdfb]/90",
                "px-3 py-2.5",
                "text-center",
                "backdrop-blur-md",
              )}
            >
              <span
                className={cn(
                  "text-[8px] font-medium",
                  "uppercase tracking-[0.22em]",
                  "text-navy/55",
                )}
              >
                Out of stock
              </span>
            </div>
          )}

          {/* ===================================================
            DESKTOP PREMIUM ADD TO BAG
        =================================================== */}

          {!isOutOfStock && (
            <button
              type="button"
              onClick={handleAddToCart}
              aria-label={`Add ${product.name} to bag`}
              className={cn(
                "absolute inset-x-3 bottom-3 z-10",
                "hidden md:flex",
                "h-11 items-center",
                "justify-between",
                "border border-white/30",
                "bg-[#fffdfb]/92",
                "px-4",
                "text-navy",
                "backdrop-blur-md",
                "shadow-[0_4px_20px_rgba(20,36,61,0.08)]",
                "translate-y-3 opacity-0",
                "transition-all duration-500",
                "ease-[cubic-bezier(0.22,1,0.36,1)]",
                "group-hover:translate-y-0",
                "group-hover:opacity-100",
                "hover:bg-[#fffdfb]",
                "hover:shadow-[0_6px_24px_rgba(20,36,61,0.11)]",
                "active:scale-[0.99]",
                "focus-visible:translate-y-0",
                "focus-visible:opacity-100",
                "focus-visible:outline-none",
                "focus-visible:ring-1",
                "focus-visible:ring-[#c89a4b]",
                "motion-reduce:translate-y-0",
                "motion-reduce:transition-none",
                "motion-reduce:opacity-100",
              )}
            >
              <span className="flex items-center gap-2.5">
                <ShoppingBag
                  className="size-3.5 text-[#c89a4b]"
                  strokeWidth={1.25}
                />

                <span
                  className={cn(
                    "text-[9px] font-medium",
                    "uppercase tracking-[0.22em]",
                  )}
                >
                  Add to bag
                </span>
              </span>

              <ArrowRight
                className={cn(
                  "size-3.5",
                  "text-navy/60",
                  "transition-transform duration-300",
                  "group-hover:translate-x-1",
                )}
                strokeWidth={1.2}
              />
            </button>
          )}
        </div>

        {/* =====================================================
          PRODUCT INFORMATION
      ===================================================== */}

        <div className="pt-4">
          <Link
            to={`/product/${product.id}`}
            className="block"
          >
            <h3
              className={cn(
                "font-display",
                "text-[17px] leading-[1.25]",
                "text-navy",
                "transition-colors duration-300",
                "group-hover:text-[#b3863e]",
                "sm:text-[18px]",
              )}
            >
              {product.name}
            </h3>
          </Link>

          <p
            className={cn(
              "mt-1.5",
              "text-[9px] font-medium",
              "uppercase tracking-[0.18em]",
              "text-navy/40",
            )}
          >
            {categoryName}
          </p>

          <p
            className={cn(
              "mt-2",
              "text-[13px] font-medium",
              "tracking-[0.01em]",
              "text-navy",
            )}
          >
            {formatINR(price)}
          </p>

          {/* =================================================
            MOBILE ADD TO BAG
        ================================================= */}

          {!isOutOfStock && (
            <button
              type="button"
              onClick={handleAddToCart}
              aria-label={`Add ${product.name} to bag`}
              className={cn(
                "mt-3 flex w-full",
                "items-center justify-center gap-2",
                "border border-navy/15",
                "bg-transparent",
                "py-2.5",
                "text-[9px] font-medium",
                "uppercase tracking-[0.2em]",
                "text-navy",
                "transition-all duration-300",
                "hover:border-navy",
                "hover:bg-navy",
                "hover:text-white",
                "active:scale-[0.99]",
                "focus-visible:outline-none",
                "focus-visible:ring-1",
                "focus-visible:ring-[#c89a4b]",
                "md:hidden",
              )}
            >
              <ShoppingBag
                className="size-3.5"
                strokeWidth={1.25}
              />

              Add to bag
            </button>
          )}

          {/* Out of stock mobile state */}
          {isOutOfStock && (
            <p
              className={cn(
                "mt-3",
                "text-[8px] font-medium",
                "uppercase tracking-[0.2em]",
                "text-navy/45",
                "md:hidden",
              )}
            >
              Out of stock
            </p>
          )}
        </div>
      </article>
      <AuthDialog open={authOpen} onOpenChange={setAuthOpen} />
    </>
  );
}