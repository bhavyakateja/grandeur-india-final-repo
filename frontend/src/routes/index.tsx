import { Link } from "react-router-dom";
import { useMemo } from "react";
import {
  ArrowRight,
  Heart,
  ShoppingBag,
  Sparkles,
} from "lucide-react";

import craft from "@/assets/craft.jpg";

import rings from "@/assets/cat-rings.jpg";
import necklaces from "@/assets/cat-necklaces.jpg";
import earrings from "@/assets/cat-earrings.jpg";
import bangles from "@/assets/cat-bangles.jpg";
import pendants from "@/assets/cat-pendants.jpg";
import bracelets from "@/assets/cat-bracelets.jpg";

import { useCategories, useProducts } from "@/hooks/use-api";
import { useStore } from "@/lib/store";
import { useAuth } from "@/context/auth-context";
import { toast } from "sonner";
import { formatINR } from "@/lib/utils";
import type { Product } from "@/lib/types";

// // Replace with your actual hero video asset path or video URL
// import heroVideo from "../../public/videos/hero.mp4"; 

const categoryImages: Record<string, string> = {
  rings,
  necklaces,
  earrings,
  bangles,
  pendants,
  bracelets,
};

const categorySubtitles: Record<string, string> = {
  rings: "Solitaires & bands",
  necklaces: "Statement & everyday",
  earrings: "Studs to chandeliers",
  bangles: "Heritage craftsmanship",
  pendants: "Delicate signatures",
  bracelets: "Modern classics",
};

export default function HomePage() {
  const {
    data: categories = [],
    isLoading: categoriesLoading,
  } = useCategories();

  const {
    data: productsData,
    isLoading: productsLoading,
  } = useProducts({
    page: 1,
    limit: 24,
    status: "ACTIVE",
    sort: "-createdAt",
  });

  const {
    wishlist,
    addToCart,
    toggleWishlist,
  } = useStore();

  const products = productsData?.products ?? [];

  const featuredProducts = useMemo(
    () => products.slice(0, 8),
    [products]
  );

  return (
    <main className="bg-white">
      {/* =========================================================
          HERO
      ========================================================= */}

      <section className="relative min-h-[calc(100vh-7rem)] overflow-hidden bg-[#fdf0ef]">
        <video className="absolute inset-0 h-full w-full object-cover object-center" autoPlay muted loop playsInline preload="auto" aria-hidden="true" >
          <source src="/videos/hero.mp4" type="video/mp4" /> </video>
        {/* Soft luxury overlay instead of heavy white wash */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#fffaf7]/85 via-[#fffaf7]/35 to-transparent" />
        {/* Bottom fade */}
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#fffaf7] to-transparent" />
        <div className="relative z-10 flex min-h-[calc(100vh-7rem)] items-center">
          <div className="mx-auto w-full max-w-7xl px-6 py-20 sm:px-8 lg:px-12">
            <div className="max-w-xl">
              <p className="mb-5 text-[10px] font-medium uppercase tracking-[0.45em] text-[#102650]/70 sm:text-xs"> Grandeur India </p>
              <h1 className="font-display text-5xl leading-[0.95] text-[#102650] sm:text-6xl lg:text-8xl"> Jewellery <br /> <span className="font-serif italic text-[#c89a4b]"> that outlives </span> <br /> trends. </h1>
              <p className="mt-7 max-w-md text-sm leading-7 text-[#102650]/75 sm:text-base"> Explore the live collection of jewellery, with product pricing and availability shown directly from the catalogue.
              </p>
              <div className="mt-9 flex flex-wrap gap-3">
                <Link to="/products" className="inline-flex items-center gap-3 bg-[#102650] px-7 py-3.5 text-[10px] font-medium uppercase tracking-[0.22em] text-white transition-all duration-300 hover:bg-[#172f5d]" > Explore Collection <ArrowRight className="size-3.5" /> </Link>
                {/* <Link to="/products" className="border border-[#102650]/25 bg-white/40 px-7 py-3.5 text-[10px] font-medium uppercase tracking-[0.22em] text-[#102650] backdrop-blur-sm transition-all duration-300 hover:border-[#102650]" > Discover More </Link> */}
              </div>
            </div>
          </div>
        </div> {/* Hero phrase */}
        <div className="absolute bottom-8 right-6 z-10 max-w-xs text-right sm:right-10 lg:right-16"> <p className="font-serif text-xl italic text-[#102650] drop-shadow-sm sm:text-2xl lg:text-3xl"> Wear your grandeur. </p> <div className="ml-auto mt-2 h-px w-16 bg-[#c89a4b]" /> </div>
      </section>

      {/* =========================================================
          CATEGORIES
      ========================================================= */}

      <CategorySection
        categories={categories}
        loading={categoriesLoading}
      />

      {/* =========================================================
          BESTSELLERS
      ========================================================= */}

      <ProductSection
        eyebrow="Most Loved"
        title="Bestsellers & New Arrivals"
        subtitle="Explore the latest pieces currently available from Grandeur."
        products={featuredProducts}
        loading={productsLoading}
        wishlist={wishlist}
        onWishlist={toggleWishlist}
        onAddToCart={addToCart}
        viewAllTo="/products"
      />

      {/* =========================================================
          BRIDAL BANNER
      ========================================================= */}

      <section className="relative overflow-hidden">
        <img
          src={craft}
          alt="Grandeur India bridal jewellery"
          className="h-[460px] w-full object-cover object-center sm:h-[520px]"
        />

        <div className="absolute inset-0 bg-gradient-to-r from-[#102650]/80 via-[#102650]/40 to-transparent" />

        <div className="absolute inset-0">
          <div className="mx-auto flex h-full max-w-7xl items-center px-6 sm:px-8 lg:px-12">
            <div className="max-w-xl text-white">
              <p className="text-[9px] uppercase tracking-[0.4em] text-[#e7c987]">
                The Bridal Edit
              </p>

              <h2 className="mt-5 font-display text-4xl leading-[0.95] sm:text-5xl lg:text-6xl">
                For the days you'll
                <br />

                <span className="font-serif italic text-[#e7c987]">
                  never forget.
                </span>
              </h2>

              <p className="mt-6 max-w-md text-sm leading-7 text-white/75">
                Pick chokers, temple sets and diamond solitaires — with
                complimentary styling and lifetime care.
              </p>

              <Link
                to="/products"
                className="mt-8 inline-flex items-center gap-3 bg-white px-7 py-3.5 text-[9px] font-medium uppercase tracking-[0.22em] text-[#102650] transition hover:bg-[#e7c987]"
              >
                Shop Bridal
                <ArrowRight className="size-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================
          CRAFTSMANSHIP
      ========================================================= */}

      <section className="bg-white py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-6 sm:px-8 lg:px-12">
          <div className="mb-10">
            <p className="text-[9px] font-medium uppercase tracking-[0.4em] text-[#c89a4b]">
              The Atelier
            </p>

            <h2 className="mt-3 font-display text-3xl text-[#102650] sm:text-4xl">
              Made by hand, in India
            </h2>
          </div>

          <div className="grid items-center gap-12 lg:grid-cols-[1fr_1.05fr] lg:gap-20">
            {/* IMAGE */}

            <div className="overflow-hidden">
              <img
                src={craft}
                alt="Grandeur India artisan crafting jewellery"
                className="aspect-[4/3] w-full object-cover"
              />
            </div>

            {/* CONTENT */}

            <div className="max-w-xl">
              <p className="text-sm leading-8 text-[#102650]/65">
                Every Grandeur India piece passes through skilled hands —
                from wax carving and stone setting to the final mirror polish.
                It is slow work, and deliberately so.
              </p>

              <div className="mt-10 grid grid-cols-3 border-y border-[#102650]/10 py-6">
                <div>
                  <p className="font-display text-2xl text-[#c89a4b]">
                    40+
                  </p>

                  <p className="mt-1 text-[8px] uppercase tracking-[0.18em] text-[#102650]/50">
                    Hours of craft
                  </p>
                </div>

                <div className="border-l border-[#102650]/10 pl-5">
                  <p className="font-display text-2xl text-[#c89a4b]">
                    60+
                  </p>

                  <p className="mt-1 text-[8px] uppercase tracking-[0.18em] text-[#102650]/50">
                    Karigars
                  </p>
                </div>

                <div className="border-l border-[#102650]/10 pl-5">
                  <p className="font-display text-2xl text-[#c89a4b]">
                    1998
                  </p>

                  <p className="mt-1 text-[8px] uppercase tracking-[0.18em] text-[#102650]/50">
                    Established
                  </p>
                </div>
              </div>

              <Link
                to="/about"
                className="mt-7 inline-flex items-center gap-3 text-[9px] font-medium uppercase tracking-[0.25em] text-[#102650]"
              >
                Our Story
                <ArrowRight className="size-3.5 text-[#c89a4b]" />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

/* =============================================================
   CATEGORY SECTION
============================================================= */

function CategorySection({
  categories,
  loading,
}: {
  categories: {
    id: string;
    name: string;
    slug: string;
  }[];
  loading: boolean;
}) {
  if (loading) {
    return (
      <section className="bg-white py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-6 sm:px-8 lg:px-12">
          <div className="h-3 w-24 animate-pulse bg-[#fdf0ef]" />

          <div className="mt-3 h-10 w-64 animate-pulse bg-[#fdf0ef]" />

          <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index}>
                <div className="aspect-square animate-pulse bg-[#fdf0ef]" />

                <div className="mt-3 h-3 w-20 animate-pulse bg-[#fdf0ef]" />

                <div className="mt-2 h-2 w-28 animate-pulse bg-[#fdf0ef]" />
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  const safeCategories = Array.isArray(categories)
    ? categories
    : [];

  const visibleCategories = safeCategories.slice(0, 6);

  return (
    <section className="bg-white py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-6 sm:px-8 lg:px-12">
        <div className="flex items-end justify-between gap-6">
          <div>
            <p className="text-[9px] font-medium uppercase tracking-[0.4em] text-[#c89a4b]">
              Shop by category
            </p>

            <h2 className="mt-3 font-display text-3xl text-[#102650] sm:text-4xl">
              Find your signature
            </h2>
          </div>

          <Link
            to="/products"
            className="hidden items-center gap-2 text-[9px] uppercase tracking-[0.2em] text-[#102650] sm:flex"
          >
            View all
            <ArrowRight className="size-3.5 text-[#c89a4b]" />
          </Link>
        </div>

        <div className="mt-10 grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-6">
          {visibleCategories.map((category) => {
            const image = categoryImages[category.slug];
            const subtitle =
              categorySubtitles[category.slug] ?? "Explore the collection";

            return (
              <Link
                key={category.id}
                to={`/category/${category.slug}`}
                className="group block min-w-0"
              >
                <div className="aspect-square overflow-hidden bg-[#fdf0ef]">
                  {image ? (
                    <img
                      src={image}
                      alt={category.name}
                      loading="lazy"
                      className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center bg-[#fdf0ef] px-4 text-center">
                      <span className="font-display text-xl text-[#102650]/60">
                        {category.name}
                      </span>
                    </div>
                  )}
                </div>

                <div className="pt-3">
                  <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-[#102650]">
                    {category.name}
                  </p>

                  <p className="mt-1 text-[9px] text-[#102650]/50">
                    {subtitle}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>

        <Link
          to="/products"
          className="mt-8 flex items-center justify-center gap-2 text-[9px] uppercase tracking-[0.2em] text-[#102650] sm:hidden"
        >
          View all
          <ArrowRight className="size-3.5 text-[#c89a4b]" />
        </Link>
      </div>
    </section>
  );
}

/* =============================================================
   PRODUCT SECTION
============================================================= */

function ProductSection({
  eyebrow,
  title,
  subtitle,
  products,
  loading,
  wishlist,
  onWishlist,
  onAddToCart,
  viewAllTo,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
  products: Product[];
  loading: boolean;
  wishlist: string[];
  onWishlist: (id: string) => void;
  onAddToCart: (id: string, qty?: number) => void;
  viewAllTo: string;
}) {
  return (
    <section className="bg-white py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-6 sm:px-8 lg:px-12">
        <div className="flex items-end justify-between gap-6">
          <div>
            <p className="text-[9px] font-medium uppercase tracking-[0.4em] text-[#c89a4b]">
              {eyebrow}
            </p>

            <h2 className="mt-3 font-display text-3xl text-[#102650] sm:text-4xl">
              {title}
            </h2>

            <p className="mt-3 max-w-lg text-sm text-[#102650]/50">
              {subtitle}
            </p>
          </div>

          <Link
            to={viewAllTo}
            className="hidden items-center gap-2 text-[9px] uppercase tracking-[0.2em] text-[#102650] sm:flex"
          >
            Shop all
            <ArrowRight className="size-3.5 text-[#c89a4b]" />
          </Link>
        </div>

        {loading ? (
          <div className="mt-10 grid grid-cols-2 gap-x-4 gap-y-10 sm:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, index) => (
              <div key={index}>
                <div className="aspect-square animate-pulse bg-[#fdf0ef]" />

                <div className="mt-4 h-3 w-3/4 animate-pulse bg-[#fdf0ef]" />

                <div className="mt-2 h-3 w-1/3 animate-pulse bg-[#fdf0ef]" />
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="mt-10 border border-[#102650]/10 px-6 py-16 text-center">
            <p className="font-serif text-xl italic text-[#102650]/50">
              New pieces are arriving soon.
            </p>
          </div>
        ) : (
          <div className="mt-10 grid grid-cols-2 gap-x-4 gap-y-12 sm:grid-cols-3 lg:grid-cols-4">
            {products.slice(0, 8).map((product, index) => (
              <ProductCard
                key={product.id}
                product={product}
                isWishlisted={wishlist.includes(product.id)}
                isNew={index < 2}
                onWishlist={() => onWishlist(product.id)}
                onAddToCart={() => onAddToCart(product.id)}
              />
            ))}
          </div>
        )}

        <Link
          to={viewAllTo}
          className="mt-10 flex items-center justify-center gap-2 border border-[#102650]/15 py-3.5 text-[9px] uppercase tracking-[0.2em] text-[#102650] sm:hidden"
        >
          Shop all
          <ArrowRight className="size-3.5 text-[#c89a4b]" />
        </Link>
      </div>
    </section>
  );
}

/* =============================================================
   PRODUCT CARD
============================================================= */

function ProductCard({
  product,
  isWishlisted,
  isNew,
  onWishlist,
  onAddToCart,
}: {
  product: Product;
  isWishlisted: boolean;
  isNew: boolean;
  onWishlist: () => void;
  onAddToCart: () => void;
}) {
  const image = product.images?.[0]?.url;
  const { isAuthenticated } = useAuth();

  return (
    <article className="group min-w-0">
      <div className="relative overflow-hidden bg-[#fdf0ef]">
        <Link
          to={`/product/${product.id}`}
          className="block"
        >
          <div className="aspect-square">
            {image ? (
              <img
                src={image}
                alt={product.name}
                loading="lazy"
                className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.04]"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-[#102650]/30">
                <Sparkles className="size-8" />
              </div>
            )}
          </div>
        </Link>

        <div className="absolute left-3 top-3">
          <span className="rounded-full bg-white/90 px-2.5 py-1 text-[7px] font-medium uppercase tracking-[0.15em] text-[#102650] backdrop-blur">
            {isNew ? "New" : "Bestseller"}
          </span>
        </div>

        <button
          type="button"
          onClick={() => {
            if (!isAuthenticated) {
              toast.error(
                "Please sign in to use your wishlist"
              );
              return;
            }

            onWishlist();
          }}
          aria-label={
            isWishlisted
              ? "Remove from wishlist"
              : "Add to wishlist"
          }
          className="absolute right-3 top-3 grid size-8 place-items-center rounded-full bg-white/90 text-[#102650] shadow-sm backdrop-blur transition hover:bg-white"
        >
          <Heart
            className={`size-3.5 ${isWishlisted
              ? "fill-[#c89a4b] text-[#c89a4b]"
              : ""
              }`}
          />
        </button>

        <button
          type="button"
          onClick={() => {
            if (!isAuthenticated) {
              toast.error(
                "Please sign in to add items to your bag"
              );
              return;
            }

            onAddToCart();
          }}
          className="absolute inset-x-3 bottom-3 flex translate-y-2 items-center justify-center gap-2 bg-[#102650]/95 py-3 text-[8px] uppercase tracking-[0.18em] text-white opacity-0 backdrop-blur transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100"
        >
          <ShoppingBag className="size-3" />
          Add to bag
        </button>
      </div>

      <Link
        to={`/product/${product.id}`}
        className="block pt-4"
      >
        <p className="truncate text-[10px] font-medium uppercase tracking-[0.08em] text-[#102650]">
          {product.name}
        </p>

        {product.category?.name && (
          <p className="mt-1 text-[9px] text-[#102650]/45">
            {product.category.name}
          </p>
        )}

        <p className="mt-2 text-sm font-medium text-[#102650]">
          {formatINR(Number(product.price))}
        </p>
      </Link>
    </article>
  );
}