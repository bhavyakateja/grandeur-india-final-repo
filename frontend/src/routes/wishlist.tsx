import { Link } from "react-router-dom";
import { ArrowRight, Heart } from "lucide-react";

import { useStore } from "@/lib/store";
import { ProductCard } from "@/components/product-card";
import { useWishlist } from "@/hooks/use-api";
import { useAuth } from "@/context/auth-context";

export default function WishlistPage() {
  const { isAuthenticated } = useAuth();
  const { wishlist } = useStore();

  const {
    data: savedItems = [],
    isLoading,
  } = useWishlist();

  /* =========================================================
     AUTHENTICATION STATE
  ========================================================= */

  if (!isAuthenticated) {
    return (
      <main className="min-h-[70vh] bg-[#fffdfb]">
        <section className="mx-auto flex max-w-xl flex-col items-center px-6 py-24 text-center sm:py-32">
          {/* Decorative icon */}

          <div className="grid size-16 place-items-center rounded-full border border-gold/25 bg-[#fdeDEE]">
            <Heart
              className="size-6 text-gold-dark"
              strokeWidth={1.2}
            />
          </div>

          {/* Eyebrow */}

          <p className="eyebrow mt-7 text-gold-dark">
            Your collection
          </p>

          {/* Heading */}

          <h1 className="mt-3 font-display text-4xl leading-tight text-navy sm:text-5xl">
            Your wishlist
          </h1>

          {/* Gold divider */}

          <div className="mt-5 flex items-center justify-center gap-3">
            <span className="h-px w-10 bg-gold/40" />

            <span className="text-[10px] text-gold-dark">
              ✦
            </span>

            <span className="h-px w-10 bg-gold/40" />
          </div>

          {/* Description */}

          <p className="mt-6 max-w-md text-sm leading-7 text-navy/60">
            Sign in to keep your saved jewellery together
            and return to your favourites whenever you wish.
          </p>

          {/* CTA */}

          <Link
            to="/profile"
            className="group mt-8 inline-flex items-center gap-3 border border-navy bg-navy px-8 py-3.5 text-[10px] font-medium uppercase tracking-[0.2em] text-white transition-all duration-300 hover:bg-gold-dark hover:border-gold-dark"
          >
            Sign in

            <ArrowRight
              className="size-3.5 transition-transform duration-300 group-hover:translate-x-1"
              strokeWidth={1.2}
            />
          </Link>
        </section>
      </main>
    );
  }

  /* =========================================================
     SAVED PRODUCTS

     Only show products that are still present in the local
     wishlist state and have a corresponding API item.
  ========================================================= */

  const saved = savedItems
    .filter((item) => wishlist.includes(item.productId))
    .map((item) => item.product)
    .filter(Boolean);

  /* =========================================================
     MAIN PAGE
  ========================================================= */

  return (
    <main className="min-h-[70vh] bg-[#fffdfb]">
      <div className="mx-auto max-w-7xl px-5 py-14 sm:px-8 sm:py-16 lg:px-10 lg:py-20">

        {/* ===================================================
            PAGE HEADER
        =================================================== */}

        <header className="border-b border-navy/[0.08] pb-8 sm:pb-10">
          <div className="flex items-end justify-between gap-6">

            {/* Left */}

            <div>
              <p className="eyebrow text-gold-dark">
                Your collection
              </p>

              <h1 className="mt-2 font-display text-4xl leading-none text-navy sm:text-5xl">
                Wishlist
              </h1>

              {!isLoading && saved.length > 0 && (
                <p className="mt-3 text-xs tracking-[0.04em] text-navy/50">
                  {saved.length === 1
                    ? "1 piece saved"
                    : `${saved.length} pieces saved`}
                </p>
              )}
            </div>

            {/* Small decorative mark */}

            <div className="hidden items-center gap-2 sm:flex">
              <span className="h-px w-8 bg-gold/40" />

              <Heart
                className="size-4 text-gold-dark"
                strokeWidth={1.15}
              />

              <span className="h-px w-8 bg-gold/40" />
            </div>
          </div>
        </header>

        {/* ===================================================
            LOADING
        =================================================== */}

        {isLoading && (
          <div className="flex min-h-[360px] items-center justify-center">
            <div className="text-center">
              <div className="mx-auto size-6 animate-pulse rounded-full border border-gold/40" />

              <p className="mt-5 text-[10px] uppercase tracking-[0.2em] text-navy/45">
                Curating your collection
              </p>
            </div>
          </div>
        )}

        {/* ===================================================
            EMPTY WISHLIST
        =================================================== */}

        {!isLoading && saved.length === 0 && (
          <section className="flex min-h-[400px] flex-col items-center justify-center py-20 text-center">

            <div className="grid size-16 place-items-center rounded-full border border-gold/25 bg-[#fdeDEE]">
              <Heart
                className="size-6 text-gold-dark"
                strokeWidth={1.15}
              />
            </div>

            <p className="eyebrow mt-7 text-gold-dark">
              Nothing saved
            </p>

            <h2 className="mt-3 font-display text-3xl text-navy sm:text-4xl">
              A few pieces are waiting.
            </h2>

            <p className="mt-4 max-w-md text-sm leading-7 text-navy/55">
              Save the jewellery that catches your eye and
              return to it whenever you're ready.
            </p>

            <Link
              to="/products"
              className="group mt-8 inline-flex items-center gap-3 border-b border-gold/50 pb-2 text-[10px] font-medium uppercase tracking-[0.2em] text-navy transition-colors hover:text-gold-dark"
            >
              Explore jewellery

              <ArrowRight
                className="size-3.5 transition-transform duration-300 group-hover:translate-x-1"
                strokeWidth={1.2}
              />
            </Link>
          </section>
        )}

        {/* ===================================================
            SAVED PRODUCTS
        =================================================== */}

        {!isLoading && saved.length > 0 && (
          <section className="pt-9 sm:pt-10">

            <div className="grid grid-cols-2 gap-x-4 gap-y-12 sm:gap-x-6 sm:gap-y-14 md:grid-cols-3 lg:grid-cols-4">
              {saved.map((product, index) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  index={index}
                />
              ))}
            </div>

          </section>
        )}
      </div>
    </main>
  );
}