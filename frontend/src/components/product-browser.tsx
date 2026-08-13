import { useEffect, useMemo } from "react";
import { SlidersHorizontal, X } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { useProducts, useCategories } from "@/hooks/use-api";
import { ProductCard } from "@/components/product-card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { ProductQueryParams } from "@/lib/types";

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

  useEffect(() => {
    if (lockedCategory && params.get("category") !== lockedCategory) {
      const next = new URLSearchParams(params);
      next.set("category", lockedCategory); next.set("page", "1"); setParams(next, { replace: true });
    }
  }, [lockedCategory, params, setParams]);

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
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-border pb-5">
        <div>
          <p className="eyebrow text-gold">{categoryName || initialOccasion || "Collection"}</p>
          <h1 className="mt-2 font-display text-3xl sm:text-4xl">{title ?? "All Jewellery"}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{isLoading ? "Loading collection…" : `${total} piece${total === 1 ? "" : "s"}`}{isFetching && !isLoading ? " · Updating…" : ""}</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={sort} onValueChange={(v) => setQuery("sort", v)}>
            <SelectTrigger className="w-[190px] rounded-sm border-navy/20 text-xs uppercase tracking-[0.12em]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="-createdAt">Newest Arrivals</SelectItem>
              <SelectItem value="price">Price: Low to High</SelectItem>
              <SelectItem value="-price">Price: High to Low</SelectItem>
              <SelectItem value="name">Name: A to Z</SelectItem>
            </SelectContent>
          </Select>
          <SlidersHorizontal className="hidden size-4 text-muted-foreground sm:block" />
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        {!lockedCategory && categories.filter((c) => c.isActive).map((category) => (
          <button key={category.id} onClick={() => setQuery("category", selectedCategory === category.slug ? undefined : category.slug)} className={cn("rounded-full border px-3 py-1.5 text-xs transition-colors", selectedCategory === category.slug ? "border-navy bg-navy text-white" : "border-border hover:border-navy/40")}>{category.name}</button>
        ))}
        {(search || (selectedCategory && !lockedCategory) || sort !== "-createdAt") && <button onClick={clear} className="ml-1 flex items-center gap-1 rounded-full px-3 py-1.5 text-xs text-muted-foreground hover:text-navy">Clear <X className="size-3" /></button>}
      </div>

      {isError ? (
        <div className="mt-10 rounded-sm border border-dashed border-destructive/40 py-20 text-center">
          <p className="font-display text-2xl">We couldn't load this collection</p>
          <button onClick={() => void refetch()} className="mt-4 text-xs uppercase tracking-[0.2em] text-gold">Try again</button>
        </div>
      ) : products.length === 0 && !isLoading ? (
        <div className="mt-10 rounded-sm border border-dashed border-border py-24 text-center">
          <p className="font-display text-2xl">No pieces match your selection</p>
          <button onClick={clear} className="mt-4 text-xs uppercase tracking-[0.2em] text-gold">Clear filters</button>
        </div>
      ) : (
        <>
          <div className="mt-10 grid grid-cols-2 gap-x-5 gap-y-10 md:grid-cols-3 lg:grid-cols-4">
            {products.map((product, index) => <ProductCard key={product.id} product={product} index={index} />)}
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
