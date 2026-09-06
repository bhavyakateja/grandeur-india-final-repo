import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Check,
  ChevronDown,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";

import { useSearchParams } from "react-router-dom";

import { useProductCatalogue } from "@/hooks/use-api";
import { ProductCard } from "@/components/product-card";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 12;

type PriceBound = {
  label: string;
  min: number;
  max?: number;
};

const PRICE_BOUNDS: PriceBound[] = [
  {
    label: "Under ₹5,000",
    min: 0,
    max: 5000,
  },
  {
    label: "₹5,000 – ₹10,000",
    min: 5000,
    max: 10000,
  },
  {
    label: "₹10,000 – ₹25,000",
    min: 10000,
    max: 25000,
  },
  {
    label: "₹25,000 – ₹50,000",
    min: 25000,
    max: 50000,
  },
  {
    label: "₹50,000+",
    min: 50000,
  },
];

type SortOption =
  | "-createdAt"
  | "price"
  | "-price"
  | "name";

type ProductBrowserProps = {
  lockedCategory?: string;
  initialOccasion?: string;
  title?: string;
};

export function ProductBrowser({
  lockedCategory,
  initialOccasion,
  title,
}: ProductBrowserProps) {
  const [params, setParams] = useSearchParams();

  const {
    data: allProducts = [],
    isPending,
    isError,
    refetch,
  } = useProductCatalogue();

  const selectedCategory =
    lockedCategory ||
    params.get("category") ||
    "";

  const [searchInput, setSearchInput] = useState(
    params.get("search") || "",
  );

  const [sort, setSort] = useState<SortOption>(
    (params.get("sort") as SortOption) ||
      "-createdAt",
  );

  const [priceBucket, setPriceBucket] =
    useState<number | null>(
      params.get("price")
        ? Number(params.get("price"))
        : null,
    );

  const [inStockOnly, setInStockOnly] = useState(
    params.get("stock") === "1",
  );

  const [filterOpen, setFilterOpen] = useState(false);

  const [page, setPage] = useState(
    Math.max(
      1,
      Number(params.get("page") || "1"),
    ),
  );

  /* ------------------------------------------------------------------------ */
  /* URL synchronisation                                                      */
  /* ------------------------------------------------------------------------ */

  useEffect(() => {
    const next = new URLSearchParams(params);

    if (searchInput.trim()) {
      next.set("search", searchInput.trim());
    } else {
      next.delete("search");
    }

    if (sort !== "-createdAt") {
      next.set("sort", sort);
    } else {
      next.delete("sort");
    }

    if (priceBucket !== null) {
      next.set("price", String(priceBucket));
    } else {
      next.delete("price");
    }

    if (inStockOnly) {
      next.set("stock", "1");
    } else {
      next.delete("stock");
    }

    if (page > 1) {
      next.set("page", String(page));
    } else {
      next.delete("page");
    }

    setParams(next, {
      replace: true,
    });

    // URL params are intentionally treated as
    // derived state from the controls above.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    searchInput,
    sort,
    priceBucket,
    inStockOnly,
    page,
  ]);

  /* ------------------------------------------------------------------------ */
  /* Categories                                                               */
  /* ------------------------------------------------------------------------ */

  const categories = useMemo(() => {
    const map = new Map<
      string,
      {
        id: string;
        slug: string;
        name: string;
      }
    >();

    for (const product of allProducts) {
      const category = product.category;

      if (!category?.slug) {
        continue;
      }

      if (!map.has(category.slug)) {
        map.set(category.slug, {
          id: category.id,
          slug: category.slug,
          name: category.name,
        });
      }
    }

    return Array.from(map.values()).sort((a, b) =>
      a.name.localeCompare(b.name),
    );
  }, [allProducts]);

  const categoryName = useMemo(
    () =>
      categories.find(
        (category) =>
          category.slug === selectedCategory,
      )?.name,
    [
      categories,
      selectedCategory,
    ],
  );

  /* ------------------------------------------------------------------------ */
  /* Local filtering + search + sorting                                       */
  /* ------------------------------------------------------------------------ */

  const filteredProducts = useMemo(() => {
    let list = allProducts;

    const query = searchInput
      .trim()
      .toLowerCase();

    if (query) {
      list = list.filter((product) => {
        const name =
          product.name?.toLowerCase() || "";

        const category =
          product.category?.name?.toLowerCase() ||
          "";

        const description =
          product.description?.toLowerCase() ||
          "";

        return (
          name.includes(query) ||
          category.includes(query) ||
          description.includes(query)
        );
      });
    }

    if (selectedCategory) {
      list = list.filter(
        (product) =>
          product.category?.slug ===
          selectedCategory,
      );
    }

    if (priceBucket !== null) {
      const bucket = PRICE_BOUNDS[priceBucket];

      if (bucket) {
        list = list.filter((product) => {
          const price =
            Number(product.price) || 0;

          if (bucket.max === undefined) {
            return price >= bucket.min;
          }

          return (
            price >= bucket.min &&
            price < bucket.max
          );
        });
      }
    }

    if (inStockOnly) {
      list = list.filter(
        (product) =>
          product.status !== "OUT_OF_STOCK" &&
          (product.stock ?? 0) > 0,
      );
    }

    if (sort !== "-createdAt") {
      list = [...list];

      switch (sort) {
        case "price":
          list.sort(
            (a, b) =>
              Number(a.price) -
              Number(b.price),
          );
          break;

        case "-price":
          list.sort(
            (a, b) =>
              Number(b.price) -
              Number(a.price),
          );
          break;

        case "name":
          list.sort((a, b) =>
            a.name.localeCompare(b.name),
          );
          break;
      }
    }

    return list;
  }, [
    allProducts,
    searchInput,
    selectedCategory,
    priceBucket,
    inStockOnly,
    sort,
  ]);

  /* ------------------------------------------------------------------------ */
  /* Pagination                                                               */
  /* ------------------------------------------------------------------------ */

  const pageCount = Math.max(
    1,
    Math.ceil(
      filteredProducts.length / PAGE_SIZE,
    ),
  );

  useEffect(() => {
    if (page > pageCount) {
      setPage(pageCount);
    }
  }, [
    page,
    pageCount,
  ]);

  const paginatedProducts = useMemo(() => {
    const start =
      (page - 1) * PAGE_SIZE;

    return filteredProducts.slice(
      start,
      start + PAGE_SIZE,
    );
  }, [
    filteredProducts,
    page,
  ]);

  /* ------------------------------------------------------------------------ */
  /* Filters                                                                  */
  /* ------------------------------------------------------------------------ */

  const activeFilters =
    (selectedCategory && !lockedCategory
      ? 1
      : 0) +
    (priceBucket !== null ? 1 : 0) +
    (inStockOnly ? 1 : 0);

  const hasAnyFilter =
    Boolean(searchInput.trim()) ||
    Boolean(
      selectedCategory &&
        !lockedCategory,
    ) ||
    priceBucket !== null ||
    inStockOnly ||
    sort !== "-createdAt";

  const clearAll = () => {
    setSearchInput("");
    setSort("-createdAt");
    setPriceBucket(null);
    setInStockOnly(false);
    setPage(1);

    const next = new URLSearchParams();

    if (lockedCategory) {
      next.set(
        "category",
        lockedCategory,
      );
    }

    setParams(next, {
      replace: true,
    });
  };

  const selectCategory = (
    category?: string,
  ) => {
    if (lockedCategory) {
      return;
    }

    setPage(1);

    const next = new URLSearchParams(params);

    if (category) {
      next.set(
        "category",
        category,
      );
    } else {
      next.delete("category");
    }

    next.delete("page");

    setParams(next, {
      replace: true,
    });
  };

  const changeSearch = (value: string) => {
    setSearchInput(value);
    setPage(1);
  };

  /* ------------------------------------------------------------------------ */
  /* Error state                                                              */
  /* ------------------------------------------------------------------------ */

  if (isError) {
    return (
      <section className="mx-auto flex min-h-[520px] max-w-6xl items-center justify-center px-5 py-20 sm:px-8">
        <div className="max-w-md text-center">
          <span className="mx-auto block h-px w-10 bg-gold" />

          <p className="mt-5 text-[9px] font-medium uppercase tracking-[0.38em] text-gold-dark">
            The Collection
          </p>

          <h1 className="mt-4 font-display text-3xl leading-tight text-navy sm:text-4xl">
            We couldn't load this
            collection
          </h1>

          <p className="mt-4 text-sm leading-6 text-navy/50">
            Something interrupted the
            collection request. Please
            try again.
          </p>

          <button
            type="button"
            onClick={() =>
              void refetch()
            }
            className="mt-7 border-b border-gold pb-1 text-[10px] uppercase tracking-[0.24em] text-gold-dark transition-colors duration-300 hover:border-navy hover:text-navy"
          >
            Try again
          </button>
        </div>
      </section>
    );
  }

  /* ------------------------------------------------------------------------ */
  /* Render                                                                   */
  /* ------------------------------------------------------------------------ */

  return (
    <main className="mx-auto max-w-6xl px-5 pb-16 pt-8 sm:px-8 sm:pt-10 lg:px-10 lg:pb-20">
      {/* ------------------------------------------------------------------ */}
      {/* Collection header                                                   */}
      {/* ------------------------------------------------------------------ */}

      <header className="border-b border-navy/[0.08] pb-7 sm:pb-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between lg:gap-10">
          <div className="min-w-0">
            <div className="flex items-center gap-3">
              <span className="h-px w-7 bg-gold/80" />

              <p className="text-[8px] font-medium uppercase tracking-[0.42em] text-gold-dark sm:text-[9px]">
                {categoryName ||
                  initialOccasion ||
                  "The Collection"}
              </p>
            </div>

            <h1 className="mt-3 font-display text-[2.65rem] leading-[0.95] tracking-[-0.02em] text-navy sm:text-5xl">
              {title ?? "All Jewellery"}
            </h1>

            <div className="mt-4 flex items-center gap-3">
              <p className="text-[9px] uppercase tracking-[0.17em] text-navy/40">
                {isPending
                  ? "Curating the collection…"
                  : `${filteredProducts.length} ${
                      filteredProducts.length ===
                      1
                        ? "piece"
                        : "pieces"
                    }`}
              </p>

              {!isPending &&
                filteredProducts.length !==
                  allProducts.length && (
                  <>
                    <span className="h-3 w-px bg-navy/10" />

                    <p className="text-[9px] uppercase tracking-[0.15em] text-gold-dark">
                      Refined selection
                    </p>
                  </>
                )}
            </div>
          </div>

          {/* Search */}
          <div className="relative w-full lg:max-w-[330px]">
            <Search
              className="pointer-events-none absolute left-0 top-1/2 size-3.5 -translate-y-1/2 text-navy/35"
              strokeWidth={1.35}
            />

            <input
              type="search"
              value={searchInput}
              onChange={(event) =>
                changeSearch(
                  event.target.value,
                )
              }
              placeholder="Search the collection"
              aria-label="Search jewellery"
              className="h-10 w-full border-0 border-b border-navy/15 bg-transparent pl-7 pr-8 text-[12px] text-navy outline-none transition-all duration-300 placeholder:text-navy/30 focus:border-gold"
            />

            {searchInput && (
              <button
                type="button"
                onClick={() =>
                  changeSearch("")
                }
                aria-label="Clear search"
                className="absolute right-0 top-1/2 -translate-y-1/2 text-navy/35 transition-colors hover:text-navy"
              >
                <X
                  className="size-3.5"
                  strokeWidth={1.35}
                />
              </button>
            )}
          </div>
        </div>
      </header>

      {/* ------------------------------------------------------------------ */}
      {/* Categories                                                          */}
      {/* ------------------------------------------------------------------ */}

      <nav
        aria-label="Jewellery categories"
        className="border-b border-navy/[0.08] py-4 sm:py-5"
      >
        <div className="-mx-1 flex items-center gap-5 overflow-x-auto px-1 pb-1 sm:gap-7">
          {!lockedCategory && (
            <button
              type="button"
              onClick={() =>
                selectCategory()
              }
              className={cn(
                "relative shrink-0 pb-1.5",
                "text-[9px] font-medium uppercase tracking-[0.2em]",
                "transition-colors duration-300",
                !selectedCategory
                  ? "text-navy"
                  : "text-navy/35 hover:text-navy",
              )}
            >
              All

              {!selectedCategory && (
                <span className="absolute inset-x-0 -bottom-px h-px bg-gold" />
              )}
            </button>
          )}

          {!lockedCategory &&
            categories.map((category) => {
              const active =
                selectedCategory ===
                category.slug;

              return (
                <button
                  key={category.id}
                  type="button"
                  onClick={() =>
                    selectCategory(
                      active
                        ? undefined
                        : category.slug,
                    )
                  }
                  className={cn(
                    "relative shrink-0 pb-1.5",
                    "text-[9px] font-medium uppercase tracking-[0.2em]",
                    "transition-colors duration-300",
                    active
                      ? "text-navy"
                      : "text-navy/35 hover:text-navy",
                  )}
                >
                  {category.name}

                  {active && (
                    <span className="absolute inset-x-0 -bottom-px h-px bg-gold" />
                  )}
                </button>
              );
            })}
        </div>
      </nav>

      {/* ------------------------------------------------------------------ */}
      {/* Catalogue workspace                                                */}
      {/* ------------------------------------------------------------------ */}

      <div className="lg:grid lg:grid-cols-[190px_minmax(0,1fr)] lg:gap-x-8 xl:grid-cols-[210px_minmax(0,1fr)] xl:gap-x-10">
        {/* ---------------------------------------------------------------- */}
        {/* LEFT SIDEBAR                                                      */}
        {/* ---------------------------------------------------------------- */}

        <aside className="hidden lg:block">
          <div className="sticky top-6">
            {/* Sort */}
            <div className="border-b border-navy/[0.08] py-5">
              <p className="text-[8px] font-medium uppercase tracking-[0.3em] text-gold-dark">
                Sort by
              </p>

              <div className="relative mt-3">
                <select
                  value={sort}
                  onChange={(event) => {
                    setSort(
                      event.target
                        .value as SortOption,
                    );
                    setPage(1);
                  }}
                  aria-label="Sort jewellery"
                  className={cn(
                    "h-9 w-full appearance-none",
                    "border-0 border-b",
                    "border-navy/15",
                    "bg-transparent",
                    "pl-0 pr-7",
                    "text-[9px] font-medium uppercase tracking-[0.12em]",
                    "text-navy",
                    "outline-none",
                    "transition-colors duration-300",
                    "focus:border-gold",
                  )}
                >
                  <option value="-createdAt">
                    Newest Arrivals
                  </option>

                  <option value="price">
                    Price: Low to High
                  </option>

                  <option value="-price">
                    Price: High to Low
                  </option>

                  <option value="name">
                    Name: A to Z
                  </option>
                </select>

                <ChevronDown
                  className="pointer-events-none absolute right-0 top-1/2 size-3 -translate-y-1/2 text-navy/40"
                  strokeWidth={1.3}
                />
              </div>
            </div>

            {/* Filter trigger */}
            <div className="border-b border-navy/[0.08] py-5">
              <button
                type="button"
                onClick={() =>
                  setFilterOpen(
                    (open) => !open,
                  )
                }
                aria-expanded={filterOpen}
                className="flex w-full items-center justify-between"
              >
                <span className="flex items-center gap-2 text-[8px] font-medium uppercase tracking-[0.3em] text-gold-dark">
                  <SlidersHorizontal
                    className="size-3"
                    strokeWidth={1.25}
                  />

                  Filter
                </span>

                <span className="flex items-center gap-2">
                  {activeFilters > 0 && (
                    <span className="grid size-4 place-items-center rounded-full bg-navy text-[7px] text-white">
                      {activeFilters}
                    </span>
                  )}

                  <span
                    className={cn(
                      "text-[16px] font-light leading-none text-navy/45 transition-transform duration-300",
                      filterOpen &&
                        "rotate-45",
                    )}
                  >
                    +
                  </span>
                </span>
              </button>
            </div>

            {/* Expanded filters */}
            <div
              className={cn(
                "overflow-hidden transition-all duration-500",
                "ease-[cubic-bezier(0.22,1,0.36,1)]",
                filterOpen
                  ? "max-h-[700px] opacity-100"
                  : "max-h-0 opacity-0",
              )}
            >
              <div className="pb-2">
                {/* Category */}
                {!lockedCategory && (
                  <div className="border-b border-navy/[0.08] py-5">
                    <p className="text-[8px] font-medium uppercase tracking-[0.25em] text-gold-dark">
                      Category
                    </p>

                    <div className="mt-3">
                      <button
                        type="button"
                        onClick={() =>
                          selectCategory()
                        }
                        className={cn(
                          "flex w-full items-center justify-between",
                          "py-2 text-left",
                          "text-[11px]",
                          "transition-colors duration-300",
                          !selectedCategory
                            ? "text-navy"
                            : "text-navy/45 hover:text-navy",
                        )}
                      >
                        All Jewellery

                        {!selectedCategory && (
                          <Check
                            className="size-3 text-gold-dark"
                            strokeWidth={1.5}
                          />
                        )}
                      </button>

                      {categories.map(
                        (category) => {
                          const active =
                            selectedCategory ===
                            category.slug;

                          return (
                            <button
                              key={category.id}
                              type="button"
                              onClick={() =>
                                selectCategory(
                                  active
                                    ? undefined
                                    : category.slug,
                                )
                              }
                              className={cn(
                                "flex w-full items-center justify-between",
                                "py-2 text-left",
                                "text-[11px]",
                                "transition-colors duration-300",
                                active
                                  ? "text-navy"
                                  : "text-navy/45 hover:text-navy",
                              )}
                            >
                              {category.name}

                              {active && (
                                <Check
                                  className="size-3 text-gold-dark"
                                  strokeWidth={
                                    1.5
                                  }
                                />
                              )}
                            </button>
                          );
                        },
                      )}
                    </div>
                  </div>
                )}

                {/* Price */}
                <div className="border-b border-navy/[0.08] py-5">
                  <p className="text-[8px] font-medium uppercase tracking-[0.25em] text-gold-dark">
                    Price
                  </p>

                  <div className="mt-3">
                    {PRICE_BOUNDS.map(
                      (bucket, index) => {
                        const active =
                          priceBucket ===
                          index;

                        return (
                          <button
                            key={
                              bucket.label
                            }
                            type="button"
                            onClick={() => {
                              setPriceBucket(
                                active
                                  ? null
                                  : index,
                              );
                              setPage(1);
                            }}
                            className={cn(
                              "flex w-full items-center justify-between",
                              "py-2",
                              "text-left text-[11px]",
                              "transition-colors duration-300",
                              active
                                ? "text-navy"
                                : "text-navy/45 hover:text-navy",
                            )}
                          >
                            {bucket.label}

                            {active && (
                              <Check
                                className="size-3 text-gold-dark"
                                strokeWidth={
                                  1.5
                                }
                              />
                            )}
                          </button>
                        );
                      },
                    )}
                  </div>
                </div>

                {/* Availability */}
                <div className="py-5">
                  <p className="text-[8px] font-medium uppercase tracking-[0.25em] text-gold-dark">
                    Availability
                  </p>

                  <button
                    type="button"
                    onClick={() => {
                      setInStockOnly(
                        (current) =>
                          !current,
                      );
                      setPage(1);
                    }}
                    className={cn(
                      "mt-3 flex w-full items-center justify-between",
                      "py-2 text-left text-[11px]",
                      "transition-colors duration-300",
                      inStockOnly
                        ? "text-navy"
                        : "text-navy/45 hover:text-navy",
                    )}
                  >
                    In-stock pieces

                    {inStockOnly && (
                      <Check
                        className="size-3 text-gold-dark"
                        strokeWidth={1.5}
                      />
                    )}
                  </button>
                </div>

                {hasAnyFilter && (
                  <button
                    type="button"
                    onClick={clearAll}
                    className="flex items-center gap-2 pt-2 text-[8px] uppercase tracking-[0.2em] text-navy/35 transition-colors hover:text-navy"
                  >
                    Clear selection

                    <X
                      className="size-3"
                      strokeWidth={1.3}
                    />
                  </button>
                )}
              </div>
            </div>
          </div>
        </aside>

        {/* ---------------------------------------------------------------- */}
        {/* MOBILE CONTROLS                                                   */}
        {/* ---------------------------------------------------------------- */}

        <div className="border-b border-navy/[0.08] py-4 lg:hidden">
          <div className="flex items-center justify-between gap-3">
            <div className="relative min-w-0 flex-1">
              <select
                value={sort}
                onChange={(event) => {
                  setSort(
                    event.target
                      .value as SortOption,
                  );
                  setPage(1);
                }}
                aria-label="Sort jewellery"
                className="h-9 w-full appearance-none border-0 border-b border-navy/15 bg-transparent pr-7 text-[9px] font-medium uppercase tracking-[0.14em] text-navy outline-none focus:border-gold"
              >
                <option value="-createdAt">
                  Newest Arrivals
                </option>

                <option value="price">
                  Price: Low to High
                </option>

                <option value="-price">
                  Price: High to Low
                </option>

                <option value="name">
                  Name: A to Z
                </option>
              </select>

              <ChevronDown
                className="pointer-events-none absolute right-0 top-1/2 size-3 -translate-y-1/2 text-navy/40"
                strokeWidth={1.3}
              />
            </div>

            <button
              type="button"
              onClick={() =>
                setFilterOpen(
                  (open) => !open,
                )
              }
              className={cn(
                "flex h-9 shrink-0 items-center gap-2 border px-3.5",
                "text-[9px] font-medium uppercase tracking-[0.16em]",
                filterOpen ||
                  activeFilters > 0
                  ? "border-gold text-navy"
                  : "border-navy/15 text-navy",
              )}
            >
              <SlidersHorizontal
                className="size-3"
                strokeWidth={1.25}
              />

              Filter

              {activeFilters > 0 && (
                <span className="grid size-4 place-items-center rounded-full bg-navy text-[7px] text-white">
                  {activeFilters}
                </span>
              )}
            </button>
          </div>

          {/* Mobile filter content */}
          {filterOpen && (
            <div className="mt-5 border-t border-navy/[0.06] pt-5">
              <div className="grid gap-6 sm:grid-cols-2">
                {!lockedCategory && (
                  <div>
                    <p className="text-[8px] font-medium uppercase tracking-[0.25em] text-gold-dark">
                      Category
                    </p>

                    <div className="mt-3">
                      <button
                        type="button"
                        onClick={() =>
                          selectCategory()
                        }
                        className="flex w-full items-center justify-between border-b border-navy/[0.08] py-2 text-left text-[11px] text-navy"
                      >
                        All Jewellery

                        {!selectedCategory && (
                          <Check className="size-3 text-gold-dark" />
                        )}
                      </button>

                      {categories.map(
                        (category) => {
                          const active =
                            selectedCategory ===
                            category.slug;

                          return (
                            <button
                              key={category.id}
                              type="button"
                              onClick={() =>
                                selectCategory(
                                  active
                                    ? undefined
                                    : category.slug,
                                )
                              }
                              className="flex w-full items-center justify-between border-b border-navy/[0.08] py-2 text-left text-[11px] text-navy/50"
                            >
                              {category.name}

                              {active && (
                                <Check className="size-3 text-gold-dark" />
                              )}
                            </button>
                          );
                        },
                      )}
                    </div>
                  </div>
                )}

                <div>
                  <p className="text-[8px] font-medium uppercase tracking-[0.25em] text-gold-dark">
                    Price
                  </p>

                  <div className="mt-3">
                    {PRICE_BOUNDS.map(
                      (bucket, index) => {
                        const active =
                          priceBucket ===
                          index;

                        return (
                          <button
                            key={
                              bucket.label
                            }
                            type="button"
                            onClick={() => {
                              setPriceBucket(
                                active
                                  ? null
                                  : index,
                              );
                              setPage(1);
                            }}
                            className="flex w-full items-center justify-between border-b border-navy/[0.08] py-2 text-left text-[11px] text-navy/50"
                          >
                            {bucket.label}

                            {active && (
                              <Check className="size-3 text-gold-dark" />
                            )}
                          </button>
                        );
                      },
                    )}
                  </div>
                </div>

                <div>
                  <p className="text-[8px] font-medium uppercase tracking-[0.25em] text-gold-dark">
                    Availability
                  </p>

                  <button
                    type="button"
                    onClick={() => {
                      setInStockOnly(
                        (current) =>
                          !current,
                      );
                      setPage(1);
                    }}
                    className="mt-3 flex w-full items-center justify-between border-b border-navy/[0.08] py-2 text-left text-[11px] text-navy/50"
                  >
                    In-stock pieces

                    {inStockOnly && (
                      <Check className="size-3 text-gold-dark" />
                    )}
                  </button>
                </div>
              </div>

              {hasAnyFilter && (
                <button
                  type="button"
                  onClick={clearAll}
                  className="mt-5 text-[8px] uppercase tracking-[0.2em] text-navy/35"
                >
                  Clear selection
                </button>
              )}
            </div>
          )}
        </div>

        {/* ---------------------------------------------------------------- */}
        {/* PRODUCT AREA                                                       */}
        {/* ---------------------------------------------------------------- */}

        <section className="min-w-0">
          {/* Result status */}
          {hasAnyFilter && (
            <div className="flex min-h-10 items-center justify-between border-b border-navy/[0.06]">
              <div className="flex items-center gap-3">
                <span className="h-1 w-1 rounded-full bg-gold" />

                <p className="text-[8px] uppercase tracking-[0.17em] text-navy/40">
                  {filteredProducts.length}{" "}
                  {filteredProducts.length ===
                  1
                    ? "piece"
                    : "pieces"}{" "}
                  selected
                </p>
              </div>

              <button
                type="button"
                onClick={clearAll}
                className="flex items-center gap-1.5 text-[8px] uppercase tracking-[0.17em] text-navy/35 transition-colors hover:text-navy"
              >
                Clear
                <X
                  className="size-3"
                  strokeWidth={1.3}
                />
              </button>
            </div>
          )}

          {/* Loading */}
          {isPending ? (
            <div className="grid grid-cols-2 gap-x-4 gap-y-10 py-8 sm:gap-x-6 sm:gap-y-12 md:grid-cols-3 lg:grid-cols-3 lg:gap-x-7 lg:gap-y-14 xl:grid-cols-3">
              {Array.from({
                length: 9,
              }).map((_, index) => (
                <div
                  key={index}
                  className="animate-pulse"
                >
                  <div className="aspect-[4/5] bg-blush/50" />

                  <div className="mt-4 h-3.5 w-3/4 bg-blush/50" />

                  <div className="mt-2 h-2.5 w-1/3 bg-blush/35" />

                  <div className="mt-3 h-3 w-1/4 bg-blush/40" />
                </div>
              ))}
            </div>
          ) : paginatedProducts.length === 0 ? (
            <div className="py-24 text-center sm:py-28">
              <span className="mx-auto block h-px w-10 bg-gold" />

              <p className="mt-6 font-display text-3xl text-navy">
                No pieces found
              </p>

              <p className="mx-auto mt-3 max-w-xs text-sm leading-6 text-navy/45">
                Try adjusting your search
                or collection filters.
              </p>

              <button
                type="button"
                onClick={clearAll}
                className="mt-6 border-b border-gold pb-1 text-[8px] uppercase tracking-[0.22em] text-gold-dark transition-colors hover:border-navy hover:text-navy"
              >
                Clear selection
                <span className="ml-2">
                  →
                </span>
              </button>
            </div>
          ) : (
            <>
              {/* Product grid */}
              <div className="grid grid-cols-2 gap-x-4 gap-y-10 py-8 sm:gap-x-6 sm:gap-y-12 md:grid-cols-3 lg:grid-cols-3 lg:gap-x-7 lg:gap-y-14 lg:py-10 xl:grid-cols-3">
                {paginatedProducts.map(
                  (product, index) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      index={index}
                    />
                  ),
                )}
              </div>

              {/* Pagination */}
              {pageCount > 1 && (
                <div className="border-t border-navy/[0.08] pt-7">
                  <div className="flex items-center justify-center gap-7">
                    <button
                      type="button"
                      disabled={page <= 1}
                      onClick={() =>
                        setPage(
                          (current) =>
                            Math.max(
                              1,
                              current - 1,
                            ),
                        )
                      }
                      className="text-[8px] uppercase tracking-[0.2em] text-navy/40 transition-colors hover:text-navy disabled:cursor-not-allowed disabled:opacity-20"
                    >
                      Previous
                    </button>

                    <span className="flex items-center gap-2 text-[8px] uppercase tracking-[0.2em] text-navy/35">
                      <span className="text-navy">
                        {String(
                          page,
                        ).padStart(2, "0")}
                      </span>

                      <span className="text-navy/20">
                        /
                      </span>

                      <span>
                        {String(
                          pageCount,
                        ).padStart(2, "0")}
                      </span>
                    </span>

                    <button
                      type="button"
                      disabled={
                        page >= pageCount
                      }
                      onClick={() =>
                        setPage(
                          (current) =>
                            Math.min(
                              pageCount,
                              current + 1,
                            ),
                        )
                      }
                      className="text-[8px] uppercase tracking-[0.2em] text-navy/40 transition-colors hover:text-navy disabled:cursor-not-allowed disabled:opacity-20"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </section>
      </div>
    </main>
  );
}