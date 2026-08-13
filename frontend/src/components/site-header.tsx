import { Link, useNavigate, useLocation } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import {
  Heart,
  Menu,
  Search,
  ShoppingBag,
  User as UserIcon,
  ChevronDown,
  Phone,
} from "lucide-react";
import logo from "@/assets/grandeur-logo.png";
import { useStore } from "@/lib/store";
import { useAuth } from "@/context/auth-context";
import { useCategories, useProducts } from "@/hooks/use-api";
import { AuthDialog } from "@/components/auth-dialog";
import { cn } from "@/lib/utils";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { formatINR } from "@/lib/utils";

type NavItem = {
  label: string;
  to: string;
  search?: string;
};

const navItems: NavItem[] = [
  { label: "Home", to: "/" },
  { label: "All Jewellery", to: "/products" },
  { label: "Our Story", to: "/about" },
  { label: "Contact", to: "/contact" },
];

export function SiteHeader() {
  const { cartCount, wishlist } = useStore();
  const { user, isAuthenticated } = useAuth();
  const { data: apiCategories } = useCategories();

  const categories = Array.isArray(apiCategories) ? apiCategories : [];

  const [scrolled, setScrolled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [categoryMenuOpen, setCategoryMenuOpen] = useState(false);
  const [categoryMenuHover, setCategoryMenuHover] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const catMenuRef = useRef<HTMLLIElement>(null);

  // Close the Shop-by-Category menu when clicking outside or pressing Escape.
  useEffect(() => {
    const open = categoryMenuOpen || categoryMenuHover;
    if (!open) return;

    const onOutside = (e: MouseEvent) => {
      if (catMenuRef.current && !catMenuRef.current.contains(e.target as Node)) {
        setCategoryMenuOpen(false);
        setCategoryMenuHover(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setCategoryMenuOpen(false);
        setCategoryMenuHover(false);
      }
    };

    document.addEventListener("mousedown", onOutside);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onOutside);
      document.removeEventListener("keydown", onKey);
    };
  }, [categoryMenuOpen, categoryMenuHover]);

  // Keep the menu open while the cursor lingers between trigger and panel,
  // and give the user a moment to move in without it flickering closed.
  const catCloseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const openCategoryMenu = () => {
    if (catCloseTimer.current) clearTimeout(catCloseTimer.current);
    setCategoryMenuHover(true);
    setCategoryMenuOpen(true);
  };
  const closeCategoryMenu = () => {
    if (catCloseTimer.current) clearTimeout(catCloseTimer.current);
    // Short grace period so crossing from the trigger into the panel does
    // not cause flicker. Once the cursor leaves the whole menu region it
    // closes. Click-outside and Escape close it immediately as well.
    catCloseTimer.current = setTimeout(() => {
      setCategoryMenuHover(false);
      setCategoryMenuOpen(false);
    }, 150);
  };

  const { data: searchResults } = useProducts({
    search: searchTerm || undefined,
    limit: 10,
  });

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setSearchOpen(true);
      }
    };

    window.addEventListener("keydown", onKey);

    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const handleAccountClick = () => {
    if (isAuthenticated) {
      navigate("/profile");
    } else {
      setAuthOpen(true);
    }
  };

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-50 bg-[#fdeDEE]">
        <div
          className={cn(
            "bg-[#fdeDEE] transition-all duration-500",
            scrolled &&
            "shadow-[0_10px_30px_-24px_rgba(20,35,70,0.55)]",
          )}
        >
          <div
            className={cn(
              "mx-auto grid max-w-7xl grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 px-4 transition-all duration-500 sm:px-6",
              scrolled ? "py-2" : "py-3 md:py-4",
            )}
          >
            <div className="flex items-center gap-1">
              <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
                <SheetTrigger
                  className="-ml-2 grid size-10 shrink-0 place-items-center rounded-full text-navy transition-colors hover:bg-blush-deep lg:hidden"
                  aria-label="Open menu"
                >
                  <Menu className="size-5" />
                </SheetTrigger>

                <SheetContent
                  side="left"
                  className="w-[86vw] max-w-sm bg-[#fdeDEE] p-0"
                >
                  <div className="flex h-full flex-col overflow-y-auto p-6">
                    <img
                      src={logo}
                      alt="Grandeur"
                      className="h-12 w-auto self-start"
                    />

                    <nav className="mt-8 flex flex-col gap-1">
                      {navItems.map((item) => (
                        <Link
                          key={item.label}
                          to={item.to}
                          state={{ search: item.search }}
                          onClick={() => setMenuOpen(false)}
                          className="font-display text-2xl text-navy"
                        >
                          {item.label}
                        </Link>
                      ))}
                    </nav>

                    <p className="eyebrow mt-8 text-navy/50">
                      Shop by category
                    </p>

                    <div className="mt-3 grid grid-cols-2 gap-3">
                      {categories.map((category) => (
                        <Link
                          key={category.id || category.slug}
                          to={`/category/${category.slug}`}
                          onClick={() => setMenuOpen(false)}
                          className="overflow-hidden rounded-sm bg-background p-3"
                        >
                          <span className="block text-xs font-medium tracking-[0.14em] text-navy uppercase">
                            {category.name}
                          </span>
                        </Link>
                      ))}
                    </div>

                    <Link to="/contact" onClick={() => setMenuOpen(false)} className="mt-8 flex items-center gap-2 text-sm text-navy/70">
                      <Phone className="size-4" />
                      Contact support
                    </Link>
                  </div>
                </SheetContent>
              </Sheet>

              <button
                onClick={() => setSearchOpen(true)}
                className="hidden items-center gap-2 rounded-full border border-navy/15 bg-background/70 px-4 py-2 text-xs tracking-[0.16em] text-navy/60 uppercase transition-colors hover:border-navy/35 lg:flex"
              >
                <Search className="size-4" />
                Search
              </button>
            </div>

            <Link to="/" className="justify-self-center">
              <img
                src={logo}
                alt="Grandeur — fine jewellery"
                className={cn(
                  "w-auto transition-all duration-500",
                  scrolled ? "h-10 md:h-11" : "h-12 md:h-16",
                )}
              />
            </Link>

            <div className="flex items-center gap-0.5 justify-self-end sm:gap-1">
              <IconBtn
                label="Search"
                onClick={() => setSearchOpen(true)}
                className="lg:hidden"
              >
                <Search className="size-5" />
              </IconBtn>

              <IconBtn
                label="Wishlist"
                onClick={() => navigate("/wishlist")}
                badge={wishlist.length}
              >
                <Heart className="size-5" />
              </IconBtn>

              <IconBtn
                label={
                  isAuthenticated
                    ? `Profile (${user?.name ?? "Account"})`
                    : "Account"
                }
                onClick={handleAccountClick}
              >
                <UserIcon className="size-5" />
              </IconBtn>

              <IconBtn
                label="Cart"
                onClick={() => navigate("/cart")}
                badge={cartCount}
              >
                <ShoppingBag className="size-5" />
              </IconBtn>
            </div>
          </div>

          <nav className="hidden border-t border-navy/10 bg-[#fdeDEE] lg:block">
            <ul className="mx-auto flex max-w-7xl items-center justify-center gap-9 px-6">
              {navItems.slice(0, 2).map((item) => (
                <TopLink
                  key={item.label}
                  to={item.to}
                  active={location.pathname === item.to}
                >
                  {item.label}
                </TopLink>
              ))}

              <li
                ref={catMenuRef}
                className="relative"
                onMouseEnter={openCategoryMenu}
                onMouseLeave={closeCategoryMenu}
              >
                <button
                  type="button"
                  aria-haspopup="true"
                  aria-expanded={categoryMenuOpen}
                  onClick={() =>
                    categoryMenuOpen
                      ? setCategoryMenuOpen(false)
                      : openCategoryMenu()
                  }
                  className={cn(
                    "flex items-center gap-1.5 py-3 text-[11px] tracking-[0.2em] text-navy uppercase transition-colors",
                    categoryMenuOpen && "text-gold-dark",
                  )}
                >
                  Shop by Category

                  <ChevronDown
                    className={cn(
                      "size-3.5 transition-transform duration-300",
                      categoryMenuOpen && "rotate-180",
                    )}
                  />
                </button>

                {/* Shop by Category — floating opaque panel */}
                <div
                  aria-hidden={!categoryMenuOpen}
                  className={cn(
                    "pointer-events-none absolute top-full left-1/2 z-[60] opacity-0 transition-all duration-300",
                    "-translate-x-1/2 translate-y-2",
                    categoryMenuOpen &&
                      "pointer-events-auto translate-y-0 opacity-100",
                  )}
                >
                  <div className="mt-2 w-[min(76rem,calc(100vw-2rem))] overflow-hidden rounded-sm border border-navy/15 bg-[#fffaf7] shadow-[0_28px_70px_-30px_rgba(16,38,80,0.5)]">
                    <div className="grid grid-cols-2 gap-x-10 gap-y-0 border-b border-navy/10 p-8 sm:grid-cols-4 lg:grid-cols-5">
                      {/* Primary shop link */}
                      <div>
                        <p className="eyebrow text-gold-dark">Browse</p>
                        <div className="mt-3 space-y-2.5">
                          <Link
                            to="/products"
                            onClick={() => setCategoryMenuOpen(false)}
                            className="block text-[13px] text-navy transition-colors hover:text-gold-dark"
                          >
                            All Jewellery
                          </Link>
                          <Link
                            to="/products?occasion=bridal"
                            onClick={() => setCategoryMenuOpen(false)}
                            className="block text-[13px] text-navy transition-colors hover:text-gold-dark"
                          >
                            Bridal
                          </Link>
                        </div>
                      </div>

                      {/* Dynamic categories from the backend */}
                      {categories
                        .filter((c) => c.isActive)
                        .slice(0, 4)
                        .map((category) => (
                          <div key={category.id || category.slug}>
                            <p className="eyebrow text-gold-dark">
                              {category.name}
                            </p>
                            <div className="mt-3 space-y-2.5">
                              <Link
                                key={category.id + "-all"}
                                to={`/category/${category.slug}`}
                                onClick={() => setCategoryMenuOpen(false)}
                                className="block text-[13px] text-navy transition-colors hover:text-gold-dark"
                              >
                                Shop {category.name}
                              </Link>
                            </div>
                          </div>
                      ))}
                    </div>

                    {/* Footer strip — value messaging */}
                    <div className="flex flex-wrap items-center justify-between gap-3 bg-[#fdf0ef] px-8 py-4">
                      <p className="text-[11px] uppercase tracking-[0.2em] text-navy/60">
                        Fine jewellery, crafted to be treasured
                      </p>
                      <Link
                        to="/products"
                        onClick={() => setCategoryMenuOpen(false)}
                        className="text-[11px] uppercase tracking-[0.18em] text-gold-dark hover:text-navy"
                      >
                        Explore the collection →
                      </Link>
                    </div>
                  </div>
                </div>
              </li>

              {navItems.slice(2).map((item) => (
                <TopLink
                  key={item.label}
                  to={item.to}
                  active={
                    location.pathname === item.to &&
                    !item.search
                  }
                >
                  {item.label}
                </TopLink>
              ))}
            </ul>
          </nav>
        </div>

        <CommandDialog
          open={searchOpen}
          onOpenChange={setSearchOpen}
        >
          <CommandInput
            placeholder="Search rings, necklaces, polki…"
            value={searchTerm}
            onValueChange={setSearchTerm}
          />

          <CommandList>
            <CommandEmpty>
              No products found matching "{searchTerm}".
            </CommandEmpty>

            <CommandGroup heading="Products">
              {searchResults?.products?.map((product) => (
                <CommandItem
                  key={product.id}
                  value={`${product.name} ${product.category?.name || ""}`}
                  onSelect={() => {
                    setSearchOpen(false);
                    navigate(`/product/${product.id}`);
                  }}
                >
                  {product.images?.[0]?.url && (
                    <img
                      src={product.images[0].url}
                      alt=""
                      className="mr-3 size-9 rounded-sm object-cover"
                    />
                  )}

                  <span className="flex-1 font-medium">
                    {product.name}
                  </span>

                  <span className="text-xs text-muted-foreground">
                    {formatINR(Number(product.price))}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </CommandDialog>
      </header>

      <AuthDialog open={authOpen} onOpenChange={setAuthOpen} />
    </>
  );
}

function IconBtn({
  children,
  label,
  onClick,
  badge,
  className,
}: {
  children: React.ReactNode;
  label: string;
  onClick: () => void;
  badge?: number;
  className?: string;
}) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className={cn(
        "relative grid size-10 place-items-center rounded-full text-navy transition-all duration-300 hover:bg-blush-deep active:scale-95",
        className,
      )}
    >
      {children}

      {!!badge && (
        <span className="absolute top-1 right-0.5 grid min-w-4 place-items-center rounded-full bg-navy px-1 text-[10px] leading-4 text-navy-foreground">
          {badge}
        </span>
      )}
    </button>
  );
}

function TopLink({
  to,
  children,
  active,
}: {
  to: string;
  children: React.ReactNode;
  active?: boolean;
}) {
  return (
    <li>
      <Link
        to={to}
        className={cn(
          "link-underline block py-3 text-[11px] tracking-[0.2em] text-navy uppercase transition-opacity hover:opacity-80",
          active && "font-medium",
        )}
      >
        {children}
      </Link>
    </li>
  );
}