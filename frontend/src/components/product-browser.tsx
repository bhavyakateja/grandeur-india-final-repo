import { useEffect, useMemo, useState } from "react";
import {
  Check,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { useProducts, useCategories } from "@/hooks/use-api";
import { ProductCard } from "@/components/product-card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import type { ProductQueryParams } from "@/lib/types";

/* ------------------------------------------------------------------ */
/* Price bucket helpers                                               */
/* ------------------------------------------------------------------ */

const PRICE_LABELS = [
  "Under ₹5,000",
  "₹5,000 – ₹10,000",
  "₹10,000 – ₹25,000",
  "₹25,000 – ₹50,000",
  "₹50,000+",
] as const;

const PRICE_BOUNDS: { min: number; max?: number }[] = [
  { min: 0, max: 5000 },
  { min: 5000, max: 10000 },
  { min: 10000, max: 25000 },
  { min: 25000, max: 50000 },
  { min: 50000 },
];

function priceForBucket(index: number, p: number): boolean {
  const b = PRICE_BOUNDS[index];
  if (b.max === undefined) return p >= b.min;
  return p >= b.min && p < b.max;
}

/* ------------------------------------------------------------------ */
/* Component                                                          */
/* ------------------------------------------------------------------ */

export function ProductBrowser({ lockedCategory, initialOccasion, title }: { lockedCategory?: string; initialOccasion?: string; title?: string }) {
  const [params, setParams] = useSearchParams();
  const page = Math.max(1, Number(params.get("page") || "1"));
  const search = params.get("search") || "";
  const selectedCategory = lockedCategory || params.get("category") || undefined;
  const sort = (params.get("sort") || "-createdAt") as ProductQueryParams["sort"];
  const { data, isLoading, isFetching, isError, refetch } = useProducts({ page, limit: 24, search: search || undefined, category: selectedCategory, sort });
  const { data: categories = [] } = useCategories();
  const products = data?.products ?? [];
  const total = data?.total ?? 0;
  const pageCount = Math.max(1, Math.ceil(total / 24));

  const [filterOpen, setFilterOpen] = useState(false);
  const [priceBucket, setPriceBucket] = useState<number | null>(null);
  const [inStockOnly, setInStockOnly] = useState(false);

  useEffect(() => {
    if (lockedCategory && params.get("category") !== lockedCategory) {
      const next = new URLSearchParams(params);
      next.set("category", lockedCategory); next.set("page", "1"); setParams(next, { replace: true });
    }
  }, [lockedCategory, params, setParams]);

  const priceBounds = useMemo(() => {
    if (products.length === 0) return PRICE_BOUNDS;
    const max = Math.max(...products.map((p) => Number(p.price) || 0));
    // Only keep buckets that would be meaningful for the actual data range.
    return PRICE_BOUNDS.filter((b) => b.min <= max || (b.max !== undefined && b.max > max));
  }, [products]);

  const categoryName = useMemo(() => categories.find((c) => c.slug === selectedCategory)?.name, [categories, selectedCategory]);

  const setQuery = (key: string, value?: string) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value); else next.delete(key);
    next.set("page", "1"); setParams(next);
  };

  const clear = () => {
    const next = new URLSearchParams();
    if (lockedCategory) next.set("category", lockedCategory);
    setParams(next);
    setPriceBucket(null);
    setInStockOnly(false);
  };

  // Client-side price + availability filters (server supports category/search/sort).
  const filteredProducts = useMemo(() => {
    let list = products;
    if (priceBucket !== null) {
      list = list.filter((p) => priceForBucket(priceBucket, Number(p.price) || 0));
    }
    if (inStockOnly) {
      list = list.filter((p) => p.status !== "OUT_OF_STOCK" && (p.stock ?? 0) > 0);
    }
    return list;
  }, [products, priceBucket, inStockOnly]);

  const activeFilters = Number(
    (inStockOnly ? 1 : 0) +
      (priceBucket !== null ? 1 : 0) +
      (!lockedCategory && selectedCategory ? 1 : 0) +
      (search ? 1 : 0)
  );

  const hasClientFilter = priceBucket !== null || inStockOnly;

  const FilterBody = () => (
    <div className="divide-y divide-navy/10">
      {/* Category */}
      {!lockedCategory && (
        <section className="py-4">
          <p className="eyebrow text-gold-dark">Category</p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => setQuery("category", undefined)}
              className={cn("rounded-sm border px-2.5 py-1 text-xs transition-colors", !selectedCategory ? "border-navy bg-navy text-white" : "border-border hover:border-navy/40")}
            >
              All
            </button>
            {categories.filter((c) => c.isActive).map((category) => (
              <button
                key={category.id}
                type="button"
                onClick={() => setQuery("category", selectedCategory === category.slug ? undefined : category.slug)}
                className={cn("rounded-sm border px-2.5 py-1 text-xs transition-colors", selectedCategory === category.slug ? "border-navy bg-navy text-white" : "border-border hover:border-navy/40")}
              >
                {category.name}
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Price */}
      <section className="py-4">
        <p className="eyebrow text-gold-dark">Price</p>
        <div className="mt-3 space-y-1">
          {priceBounds.map((b, index) => (
            <button
              key={PRICE_LABELS[index]}
              type="button"
              onClick={() => setPriceBucket(priceBucket === index ? null : index)}
              className={cn(
                "flex w-full items-center justify-between rounded-sm px-2 py-1.5 text-left text-sm transition-colors",
                priceBucket === index ? "bg-blush text-navy" : "text-navy/80 hover:bg-blush/50"
              )}
            >
              <span>{PRICE_LABELS[index]}</span>
              {priceBucket === index && <Check className="size-4 text-gold-dark" />}
            </button>
          ))}
        </div>
      </section>

      {/* Availability */}
      <section className="py-4">
        <p className="eyebrow text-gold-dark">Availability</p>
        <button
          type="button"
          onClick={() => setInStockOnly(!inStockOnly)}
          className={cn(
            "mt-3 flex w-full items-center justify-between rounded-sm px-2 py-1.5 text-left text-sm transition-colors",
            inStockOnly ? "bg-blush text-navy" : "text-navy/80 hover:bg-blush/50"
          )}
        >
          <span>In Stock</span>
          {inStockOnly && <Check className="size-4 text-gold-dark" />}
        </button>
      </section>

      {/* Actions */}
      <div className="flex items-center justify-between gap-3 pt-4">
        <button
          type="button"
          onClick={clear}
          className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground hover:text-navy"
        >
          Clear all
        </button>
        <button
          type="button"
          onClick={() => setFilterOpen(false)}
          className="rounded-sm bg-navy px-5 py-2 text-[11px] uppercase tracking-[0.18em] text-white hover:bg-navy-light"
        >
          Apply
        </button>
      </div>
    </div>
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-border pb-5">
        <div>
          <p className="eyebrow text-gold">{categoryName || initialOccasion || "Collection"}</p>
          <h1 className="mt-2 font-display text-3xl sm:text-4xl">{title ?? "All Jewellery"}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{isLoading ? "Loading collection…" : `${filteredProducts.length} piece${filteredProducts.length === 1 ? "" : "s"}`}{isFetching && !isLoading ? " · Updating…" : ""}</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={sort} onValueChange={(v) => setQuery("sort", v)}>
            <SelectTrigger className="w-[190px] rounded-sm border-navy/20 bg-[#fffaf7] text-xs uppercase tracking-[0.12em] shadow-sm"><SelectValue /></SelectTrigger>
            <SelectContent
              align="end"
              className="w-[220px] border-navy/15 bg-[#fffaf7] p-1.5 text-navy shadow-lg"
            >
              <SelectItem value="-createdAt">Newest Arrivals</SelectItem>
              <SelectItem value="price">Price: Low to High</SelectItem>
              <SelectItem value="-price">Price: High to Low</SelectItem>
              <SelectItem value="name">Name: A to Z</SelectItem>
            </SelectContent>
          </Select>

          {/* Filter trigger + panel (desktop / tablet) */}
          <div className="hidden sm:block">
            <Popover open={filterOpen} onOpenChange={setFilterOpen}>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  aria-label="Filter products"
                  className={cn(
                    "relative grid size-9 place-items-center rounded-sm border transition-colors",
                    activeFilters > 0 ? "border-gold-dark bg-blush text-navy" : "border-navy/20 bg-[#fffaf7] text-navy hover:border-navy/40"
                  )}
                >
                  <SlidersHorizontal className="size-4" />
                  {activeFilters > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 grid min-w-4 place-items-center rounded-full bg-gold-dark px-1 text-[9px] leading-4 text-white">
                      {activeFilters}
                    </span>
                  )}
                </button>
              </PopoverTrigger>
              <PopoverContent
                align="end"
                sideOffset={8}
                className="w-72 rounded-sm border-navy/15 bg-[#fffaf7] p-4 text-navy shadow-lg"
              >
                <FilterBody />
              </PopoverContent>
            </Popover>
          </div>

          {/* Mobile filter — bottom sheet */}
          <div className="sm:hidden">
            <Sheet open={filterOpen} onOpenChange={setFilterOpen}>
              <SheetTrigger asChild>
                <button
                  type="button"
                  aria-label="Filter products"
                  className={cn(
                    "relative grid size-9 place-items-center rounded-sm border transition-colors",
                    activeFilters > 0 ? "border-gold-dark bg-blush text-navy" : "border-navy/20 bg-[#fffaf7] text-navy"
                  )}
                >
                  <SlidersHorizontal className="size-4" />
                  {activeFilters > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 grid min-w-4 place-items-center rounded-full bg-gold-dark px-1 text-[9px] leading-4 text-white">
                      {activeFilters}
                    </span>
                  )}
                </button>
              </SheetTrigger>
              <SheetContent side="bottom" className="rounded-t-2xl border-navy/15 bg-[#fffaf7] p-5 text-navy">
                <SheetHeader>
                  <SheetTitle className="font-display text-xl text-navy">Filters</SheetTitle>
                </SheetHeader>
                <div className="mt-2 max-h-[70vh] overflow-y-auto pr-1">
                  <FilterBody />
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        {!lockedCategory && categories.filter((c) => c.isActive).map((category) => (
          <button key={category.id} onClick={() => setQuery("category", selectedCategory === category.slug ? undefined : category.slug)} className={cn("rounded-full border px-3 py-1.5 text-xs transition-colors", selectedCategory === category.slug ? "border-navy bg-navy text-white" : "border-border hover:border-navy/40")}>{category.name}</button>
        ))}
        {(search || (selectedCategory && !lockedCategory) || sort !== "-createdAt" || hasClientFilter) && <button onClick={clear} className="ml-1 flex items-center gap-1 rounded-full px-3 py-1.5 text-xs text-muted-foreground hover:text-navy">Clear <X className="size-3" /></button>}
      </div>

      {isError ? (
        <div className="mt-10 rounded-sm border border-dashed border-destructive/40 py-20 text-center">
          <p className="font-display text-2xl">We couldn't load this collection</p>
          <button onClick={() => void refetch()} className="mt-4 text-xs uppercase tracking-[0.2em] text-gold">Try again</button>
        </div>
      ) : filteredProducts.length === 0 && !isLoading ? (
        <div className="mt-10 rounded-sm border border-dashed border-border py-24 text-center">
          <p className="font-display text-2xl">No pieces match your selection</p>
          <button onClick={clear} className="mt-4 text-xs uppercase tracking-[0.2em] text-gold">Clear filters</button>
        </div>
      ) : (
        <>
          <div className="mt-10 grid grid-cols-2 gap-x-5 gap-y-10 md:grid-cols-3 lg:grid-cols-4">
            {filteredProducts.map((product, index) => <ProductCard key={product.id} product={product} index={index} />)}
          </div>
          {pageCount > 1 && (
            <nav className="mt-12 flex items-center justify-center gap-2" aria-label="Product pagination">
              <button disabled={page <= 1} onClick={() => setQuery("page", String(page - 1))} className="rounded-sm border px-4 py-2 text-xs disabled:opacity-40">Previous</button>
              <span className="px-3 text-xs text-muted-foreground">Page {page} of {pageCount}</span>
              <button disabled={page >= pageCount} onClick={() => setQuery("page", String(page + 1))} className="rounded-sm border px-4 py-2 text-xs disabled:opacity-40">Next</button>
            </nav>
          )}
        </>
      )}
    </div>
  );
}
