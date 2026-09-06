import {
  useCallback,
  useEffect,
  useState,
} from "react";

import { Link } from "react-router-dom";

import useEmblaCarousel from "embla-carousel-react";

import {
  ArrowRight,
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  Heart,
  ShoppingBag,
} from "lucide-react";

import { cn, formatINR } from "@/lib/utils";
import { useStore } from "@/lib/store";
import { useAuth } from "@/context/auth-context";
import { toast } from "sonner";
import type { Product } from "@/lib/types";

export type FeaturedProduct = {
  product: Product;
  badge: "Bestseller" | "New";
};

/* =============================================================
   FEATURED PRODUCT CAROUSEL
============================================================= */

export function HomeProductCarousel({
  products,
}: {
  products: readonly FeaturedProduct[];
  wishlist?: string[];
  onWishlist?: (id: string) => void;
  onAddToCart?: (
    id: string,
    qty?: number,
  ) => void;
}) {
  const visibleProducts =
    products.slice(0, 6);

  const [
    emblaRef,
    emblaApi,
  ] = useEmblaCarousel({
    align: "start",
    loop: true,
    dragFree: false,
    skipSnaps: false,
  });

  const [
    selectedIndex,
    setSelectedIndex,
  ] = useState(0);

  const scrollPrev = useCallback(() => {
    emblaApi?.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    emblaApi?.scrollNext();
  }, [emblaApi]);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;

    setSelectedIndex(
      emblaApi.selectedScrollSnap(),
    );
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;

    onSelect();

    emblaApi.on(
      "select",
      onSelect,
    );

    emblaApi.on(
      "reInit",
      onSelect,
    );

    return () => {
      emblaApi.off(
        "select",
        onSelect,
      );

      emblaApi.off(
        "reInit",
        onSelect,
      );
    };
  }, [
    emblaApi,
    onSelect,
  ]);

  useEffect(() => {
    emblaApi?.reInit();
  }, [
    emblaApi,
    visibleProducts.length,
  ]);

  if (visibleProducts.length === 0) {
    return null;
  }

  const total =
    visibleProducts.length;

  const progress =
    total > 0
      ? ((selectedIndex + 1) /
          total) *
        100
      : 0;

  return (
    <section className="bg-white py-12 sm:py-16">
      <div className="mx-auto max-w-7xl px-6 sm:px-8 lg:px-12">
        {/* =====================================================
            SECTION HEADING
        ===================================================== */}
        <div className="mb-10 flex items-end justify-between gap-8">
          <div>
            <p className="mb-3 text-[10px] font-medium uppercase tracking-[0.28em] text-[#c89a4b]">
              Most Loved
            </p>

            <h2 className="font-display text-3xl leading-tight text-[#102650] sm:text-4xl">
              Bestsellers &amp; New Arrivals
            </h2>

            <p className="mt-3 max-w-lg text-sm leading-6 text-[#102650]/50">
              Pieces worth discovering, selected from the Shop Grandeur
              collection.
            </p>
          </div>

          <Link
            to="/products"
            className="group hidden items-center gap-2 text-[10px] font-medium uppercase tracking-[0.2em] text-[#102650] sm:flex"
          >
            Discover the collection

            <ArrowUpRight
              className="size-3.5 transition-transform duration-500 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
              strokeWidth={1.4}
            />
          </Link>
        </div>

        {/* =====================================================
            EMBLA CAROUSEL
        ===================================================== */}
        <div 
          ref={emblaRef} 
          className="overflow-hidden" // Change from overflow-visible to overflow-hidden
        >
          <div className="-ml-3 flex touch-pan-y">
            {visibleProducts.map(({ product, badge }) => (
              <div
                key={product.id}
                className="min-w-0 shrink-0 basis-[78%] pl-3 sm:basis-[46%] lg:basis-[31%] xl:basis-[28%]"
              >
                <HomeProductCard product={product} badge={badge} />
              </div>
            ))}
          </div>
        </div>

        {/* =====================================================
            CONTROLS
        ===================================================== */}
        <div className="mt-8 flex items-center justify-between">
          {/* Progress */}
          <div className="flex items-center gap-4">
            <span className="text-[9px] font-medium tracking-[0.18em] text-[#102650]/50">
              {String(
                selectedIndex + 1,
              ).padStart(2, "0")}
            </span>

            <div className="relative h-px w-24 overflow-hidden bg-[#102650]/10 sm:w-36">
              <div
                className="absolute inset-y-0 left-0 bg-[#102650] transition-all duration-500"
                style={{
                  width: `${progress}%`,
                }}
              />
            </div>

            <span className="text-[9px] font-medium tracking-[0.18em] text-[#102650]/50">
              {String(total).padStart(
                2,
                "0",
              )}
            </span>
          </div>

          {/* Navigation */}
          <div className="flex items-center gap-2">
            <CarouselButton
              label="Previous product"
              onClick={scrollPrev}
            >
              <ChevronLeft
                className="size-4"
                strokeWidth={1.2}
              />
            </CarouselButton>

            <CarouselButton
              label="Next product"
              onClick={scrollNext}
            >
              <ChevronRight
                className="size-4"
                strokeWidth={1.2}
              />
            </CarouselButton>
          </div>
        </div>

        {/* =====================================================
            MOBILE VIEW ALL
        ===================================================== */}
        <div className="mt-6 sm:hidden">
          <Link
            to="/products"
            className="group inline-flex items-center gap-2 text-[10px] font-medium uppercase tracking-[0.2em] text-[#102650]"
          >
            View all jewellery

            <ArrowUpRight
              className="size-3.5 transition-transform duration-500 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
              strokeWidth={1.4}
            />
          </Link>
        </div>
      </div>
    </section>
  );
}

/* =============================================================
   FEATURED PRODUCT CARD
============================================================= */

function HomeProductCard({
  product,
  badge,
}: {
  product: Product;
  badge: "Bestseller" | "New";
}) {
  const {
    addToCart,
    toggleWishlist,
    wishlist,
  } = useStore();

  const { isAuthenticated } =
    useAuth();

  const wished =
    wishlist.includes(product.id);

  const price = Number(
    product.price || 0,
  );

  const imageUrl =
    product.images?.[0]?.url || "";

  const categoryName =
    product.category?.name ||
    "Jewellery";

  const isOutOfStock =
    product.status ===
      "OUT_OF_STOCK" ||
    (product.stock ?? 0) <= 0;

  /* =========================================================
     WISHLIST
  ========================================================= */

  const handleWishlist = () => {
    if (!isAuthenticated) {
      toast.error(
        "Please sign in to use your wishlist",
      );

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
    if (isOutOfStock) {
      return;
    }

    if (!isAuthenticated) {
      toast.error(
        "Please sign in to add items to your bag",
      );

      return;
    }

    addToCart(product.id);

    toast.success(
      `${product.name} added to bag`,
    );
  };

  return (
    <article className="group relative min-w-0">
      {/* =====================================================
          PRODUCT IMAGE CONTAINER (Matched with Category Card)
      ===================================================== */}

      <div className="relative aspect-[4/5] overflow-hidden bg-[#faf3f1]">
        <Link
          to={`/product/${product.id}`}
          className="block h-full w-full"
          aria-label={`View ${product.name}`}
        >
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={`${product.name} - ${categoryName} | Grandeur`}
              loading="lazy"
              decoding="async"
              width={800}
              height={1000}
              className={cn(
                "absolute inset-0 h-full w-full object-cover",
                "transition-transform",
                "duration-[1400ms]",
                "ease-[cubic-bezier(0.22,1,0.36,1)]",
                "group-hover:scale-[1.045]",
                "motion-reduce:transition-none",
                "motion-reduce:group-hover:scale-100",
              )}
            />
          ) : (
            <div
              className="absolute inset-0 h-full w-full bg-[#fdf0ef]"
              aria-label="Product image unavailable"
            />
          )}

          {/* =================================================
              BOTTOM GRADIENT (Matched with Category Card Style)
          ================================================= */}

          <div
            className={cn(
              "absolute inset-x-0 bottom-0 h-1/2",
              "bg-gradient-to-t",
              "from-[#102650]/65",
              "via-[#102650]/10",
              "to-transparent",
              "opacity-90",
              "transition-opacity duration-700",
              "group-hover:opacity-100",
            )}
          />
        </Link>

        {/* =====================================================
            FEATURED BADGE
        ===================================================== */}

        <div className="absolute left-5 top-5 z-10">
          <span
            className={cn(
              "bg-[#fffdfb]/90",
              "px-2.5 py-1",
              "text-[7px] font-medium",
              "uppercase tracking-[0.15em]",
              "text-[#102650]",
              "backdrop-blur-md",
            )}
          >
            {badge}
          </span>
        </div>

        {/* =====================================================
            WISHLIST
        ===================================================== */}

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
            "absolute right-5 top-5 z-10",
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

        {/* =====================================================
            OUT OF STOCK OVERLAY
        ===================================================== */}

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
                "text-[#102650]/55",
              )}
            >
              Out of stock
            </span>
          </div>
        )}

        {/* =====================================================
            DESKTOP PREMIUM ADD TO BAG (Hover overlay slide-up)
        ===================================================== */}

        {!isOutOfStock && (
          <button
            type="button"
            onClick={handleAddToCart}
            aria-label={`Add ${product.name} to bag`}
            className={cn(
              "absolute inset-x-4 bottom-4 z-10",
              "hidden md:flex",
              "h-11 items-center",
              "justify-between",
              "border border-white/30",
              "bg-[#fffdfb]/92",
              "px-4",
              "text-[#102650]",
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
                "text-[#102650]/60",
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
              "text-[#102650]",
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
            "text-[#102650]/40",
          )}
        >
          {categoryName}
        </p>

        <p
          className={cn(
            "mt-2",
            "text-[13px] font-medium",
            "tracking-[0.01em]",
            "text-[#102650]",
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
              "border border-[#102650]/15",
              "bg-transparent",
              "py-2.5",
              "text-[9px] font-medium",
              "uppercase tracking-[0.2em]",
              "text-[#102650]",
              "transition-all duration-300",
              "hover:border-[#102650]",
              "hover:bg-[#102650]",
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

        {/* =================================================
            MOBILE OUT OF STOCK
        ================================================= */}

        {isOutOfStock && (
          <p
            className={cn(
              "mt-3",
              "text-[8px] font-medium",
              "uppercase tracking-[0.2em]",
              "text-[#102650]/45",
              "md:hidden",
            )}
          >
            Out of stock
          </p>
        )}
      </div>
    </article>
  );
}

/* =============================================================
   CAROUSEL BUTTON
============================================================= */

function CarouselButton({
  children,
  label,
  onClick,
  disabled = false,
}: {
  children: React.ReactNode;
  label: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className={cn(
        "grid size-11 place-items-center",
        "border border-[#102650]/15",
        "text-[#102650]",
        "transition-all duration-500",
        "hover:border-[#102650]",
        "hover:bg-[#102650]",
        "hover:text-white",
        "active:scale-95",
        "disabled:cursor-default",
        "disabled:opacity-40",
        "disabled:hover:border-[#102650]/15",
        "disabled:hover:bg-transparent",
        "disabled:hover:text-[#102650]",
      )}
    >
      {children}
    </button>
  );
}