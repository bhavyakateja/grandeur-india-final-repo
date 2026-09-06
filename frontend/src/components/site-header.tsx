import { Link, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  ChevronDown,
  Heart,
  Menu,
  Phone,
  ShoppingBag,
  User as UserIcon,
} from "lucide-react";
import useEmblaCarousel from "embla-carousel-react";

import logo from "@/assets/grandeur-logo.png";
import { useStore } from "@/lib/store";
import { useAuth } from "@/context/auth-context";
import { AuthDialog } from "@/components/auth-dialog";
import { cn } from "@/lib/utils";

import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";

import necklaceImg from "../assets/category-carousel/necklace.png";
import earringImg from "../assets/category-carousel/earring.png";
import braceletImg from "../assets/category-carousel/bracelet.png";
import pendantImg from "../assets/category-carousel/pendant.png";
import ringImg from "../assets/category-carousel/ring.png";
import beadImg from "../assets/category-carousel/bead.png";

/* =============================================================
   SHOP GRANDEUR CATEGORIES
============================================================= */

const SHOP_CATEGORIES = [
  {
    number: "01",
    name: "Necklaces",
    slug: "necklaces",
    image: necklaceImg,
    description: "Statement & everyday",
  },
  {
    number: "02",
    name: "Earrings",
    slug: "earrings",
    image: earringImg,
    description: "Sculptural silhouettes",
  },
  {
    number: "03",
    name: "Bracelets",
    slug: "bracelets",
    image: braceletImg,
    description: "Modern classics",
  },
  {
    number: "04",
    name: "Pendants",
    slug: "pendants",
    image: pendantImg,
    description: "Delicate signatures",
  },
  {
    number: "05",
    name: "Rings",
    slug: "rings",
    image: ringImg,
    description: "Solitaires & bands",
  },
  {
    number: "06",
    name: "Beads",
    slug: "beads",
    image: beadImg,
    description: "Colour & character",
  },
] as const;

/* =============================================================
   PRIMARY NAVIGATION
============================================================= */

type NavItem = {
  label: string;
  to: string;
};

const navItems: NavItem[] = [
  {
    label: "Home",
    to: "/",
  },
  {
    label: "All Jewellery",
    to: "/products",
  },
  {
    label: "Our Story",
    to: "/about",
  },
  {
    label: "Contact",
    to: "/contact",
  },
];

/* =============================================================
   SITE HEADER
============================================================= */

export function SiteHeader() {
  const { cartCount, wishlist } = useStore();
  const { user, isAuthenticated } = useAuth();

  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [categoryMenuOpen, setCategoryMenuOpen] = useState(false);
  const [categoryMenuHover, setCategoryMenuHover] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();

  const catMenuRef = useRef<HTMLLIElement>(null);
  const catCloseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* =========================================================
     CLOSE CATEGORY MENU
  ========================================================= */

  useEffect(() => {
    const isOpen = categoryMenuOpen || categoryMenuHover;

    if (!isOpen) return;

    const handleOutsideClick = (event: MouseEvent) => {
      if (
        catMenuRef.current &&
        !catMenuRef.current.contains(event.target as Node)
      ) {
        setCategoryMenuOpen(false);
        setCategoryMenuHover(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setCategoryMenuOpen(false);
        setCategoryMenuHover(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [categoryMenuOpen, categoryMenuHover]);

  /* =========================================================
     CLEAN CATEGORY MENU TIMER
  ========================================================= */

  useEffect(() => {
    return () => {
      if (catCloseTimer.current) {
        clearTimeout(catCloseTimer.current);
      }
    };
  }, []);

  const openCategoryMenu = () => {
    if (catCloseTimer.current) {
      clearTimeout(catCloseTimer.current);
      catCloseTimer.current = null;
    }

    setCategoryMenuHover(true);
    setCategoryMenuOpen(true);
  };

  const closeCategoryMenu = () => {
    if (catCloseTimer.current) {
      clearTimeout(catCloseTimer.current);
    }

    catCloseTimer.current = setTimeout(() => {
      setCategoryMenuHover(false);
      setCategoryMenuOpen(false);
      catCloseTimer.current = null;
    }, 180);
  };

  /* =========================================================
     SCROLL STATE
  ========================================================= */

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 12);
    };

    handleScroll();

    window.addEventListener("scroll", handleScroll, {
      passive: true,
    });

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  /* =========================================================
     ACCOUNT
  ========================================================= */

  const handleAccountClick = () => {
    if (isAuthenticated) {
      navigate("/profile");
      return;
    }

    setAuthOpen(true);
  };

  /* =========================================================
     RENDER
  ========================================================= */

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-50 bg-[#fdeDEE]">
        <div
          className={cn(
            "bg-[#fdeDEE] transition-all duration-500",
            scrolled &&
              "shadow-[0_10px_30px_-24px_rgba(16,38,80,0.55)]",
          )}
        >
          {/* ===================================================
              TOP HEADER
          =================================================== */}

          <div
            className={cn(
              "relative mx-auto flex max-w-7xl items-center justify-between px-6 transition-all duration-500 sm:px-8 lg:px-12",
              scrolled
                ? "h-16"
                : "h-[88px]",
            )}
          >
            {/* =================================================
                LEFT — MOBILE MENU
            ================================================= */}

            <div className="flex items-center lg:w-32">
              <Sheet
                open={menuOpen}
                onOpenChange={setMenuOpen}
              >
                <SheetTrigger
                  type="button"
                  className="grid size-10 place-items-center text-navy transition-colors hover:text-gold-dark active:scale-95 lg:hidden"
                  aria-label="Open navigation menu"
                >
                  <Menu
                    className="size-5"
                    strokeWidth={1.5}
                  />
                </SheetTrigger>

                <SheetContent
                  side="left"
                  className="w-[86vw] max-w-sm border-r border-navy/10 bg-[#fdeDEE] p-0"
                >
                  <div className="flex h-full flex-col overflow-y-auto p-6">
                    {/* Mobile logo */}

                    <Link
                      to="/"
                      onClick={() => setMenuOpen(false)}
                      className="inline-flex"
                    >
                      <img
                        src={logo}
                        alt="Grandeur — Luxury Statement Jewellery"
                        className="h-12 w-auto object-contain"
                      />
                    </Link>

                    {/* Primary navigation */}

                    <nav className="mt-10 flex flex-col gap-1">
                      {navItems.map((item) => (
                        <Link
                          key={item.label}
                          to={item.to}
                          onClick={() => setMenuOpen(false)}
                          className={cn(
                            "font-display text-2xl text-navy transition-colors hover:text-gold-dark",
                            location.pathname === item.to &&
                              "text-gold-dark",
                          )}
                        >
                          {item.label}
                        </Link>
                      ))}
                    </nav>

                    {/* Categories */}

                    <p className="eyebrow mt-10 text-navy/50">
                      Shop by category
                    </p>

                    <div className="mt-3 grid grid-cols-2 gap-3">
                      {SHOP_CATEGORIES.map((category) => (
                        <Link
                          key={category.slug}
                          to={`/category/${category.slug}`}
                          onClick={() => setMenuOpen(false)}
                          className="group overflow-hidden bg-white"
                        >
                          <div className="aspect-[4/5] overflow-hidden bg-blush">
                            <img
                              src={category.image}
                              alt={`${category.name} — Grandeur luxury jewellery`}
                              loading="lazy"
                              width={800}
                              height={1000}
                              className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                            />
                          </div>

                          <div className="p-3">
                            <p className="text-[8px] uppercase tracking-[0.18em] text-navy/40">
                              {category.number}
                            </p>

                            <p className="mt-1 font-display text-base text-navy">
                              {category.name}
                            </p>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            </div>

            {/* =================================================
                CENTER — LOGO
            ================================================= */}

            <Link
              to="/"
              aria-label="Grandeur home"
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
            >
              <img
                src={logo}
                alt="Grandeur — Luxury Statement Jewellery"
                className={cn(
                  "w-auto object-contain transition-all duration-500",
                  scrolled
                    ? "h-10 md:h-11"
                    : "h-12 md:h-16",
                )}
              />
            </Link>

            {/* =================================================
                RIGHT — ACCOUNT ACTIONS
            ================================================= */}

            <div className="ml-auto flex items-center gap-0.5 sm:gap-1">
              <IconBtn
                label="Wishlist"
                onClick={() => navigate("/wishlist")}
                badge={wishlist.length}
              >
                <Heart
                  className="size-[19px]"
                  strokeWidth={1.5}
                />
              </IconBtn>

              <IconBtn
                label={
                  isAuthenticated
                    ? `Profile (${user?.name ?? "Account"})`
                    : "Account"
                }
                onClick={handleAccountClick}
              >
                <UserIcon
                  className="size-[19px]"
                  strokeWidth={1.5}
                />
              </IconBtn>

              <IconBtn
                label="Shopping bag"
                onClick={() => navigate("/cart")}
                badge={cartCount}
              >
                <ShoppingBag
                  className="size-[19px]"
                  strokeWidth={1.5}
                />
              </IconBtn>
            </div>
          </div>

          {/* ===================================================
              DESKTOP NAVIGATION
          =================================================== */}

          <nav className="hidden border-t border-navy/[0.08] lg:block">
            <ul className="mx-auto flex max-w-7xl items-center justify-center gap-10 px-6">
              {/* Home */}

              <TopLink
                to="/"
                active={location.pathname === "/"}
              >
                Home
              </TopLink>

              {/* All Jewellery */}

              <TopLink
                to="/products"
                active={location.pathname === "/products"}
              >
                All Jewellery
              </TopLink>

              {/* =================================================
                  SHOP BY CATEGORY
              ================================================= */}

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
                  onClick={() => {
                    if (categoryMenuOpen) {
                      setCategoryMenuOpen(false);
                      setCategoryMenuHover(false);
                    } else {
                      openCategoryMenu();
                    }
                  }}
                  className={cn(
                    "flex items-center gap-1.5 py-3.5 text-[10px] font-medium uppercase tracking-[0.22em] text-navy transition-colors hover:text-gold-dark",
                    categoryMenuOpen && "text-gold-dark",
                  )}
                >
                  Shop by Category

                  <ChevronDown
                    className={cn(
                      "size-3 transition-transform duration-300",
                      categoryMenuOpen && "rotate-180",
                    )}
                    strokeWidth={1.4}
                  />
                </button>

                {/* =================================================
                    CATEGORY DROPDOWN
                ================================================= */}

                <div
                  aria-hidden={!categoryMenuOpen}
                  className={cn(
                    "pointer-events-none absolute left-1/2 top-full z-[60] -translate-x-1/2 translate-y-2 opacity-0 transition-all duration-300",
                    categoryMenuOpen &&
                      "pointer-events-auto translate-y-0 opacity-100",
                  )}
                >
                  <div
                    className="mt-2 w-[min(72rem,calc(100vw-2rem))] overflow-hidden border border-navy/[0.08] bg-[#fffaf7] shadow-[0_28px_70px_-30px_rgba(16,38,80,0.5)]"
                    onMouseEnter={openCategoryMenu}
                    onMouseLeave={closeCategoryMenu}
                  >
                    <HeaderCategoryCarousel />
                  </div>
                </div>
              </li>

              {/* Our Story */}

              <TopLink
                to="/about"
                active={location.pathname === "/about"}
              >
                Our Story
              </TopLink>

              {/* Contact */}

              <TopLink
                to="/contact"
                active={location.pathname === "/contact"}
              >
                Contact
              </TopLink>
            </ul>
          </nav>
        </div>
      </header>

      {/* =======================================================
          AUTH DIALOG
      ======================================================= */}

      <AuthDialog
        open={authOpen}
        onOpenChange={setAuthOpen}
      />
    </>
  );
}

/* =============================================================
   HEADER CATEGORY CAROUSEL
============================================================= */

function HeaderCategoryCarousel() {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: "start",
    loop: true,
    dragFree: true,
    skipSnaps: false,
  });

  const [isHovered, setIsHovered] = useState(false);

  /* -----------------------------------------------------------
     AUTO SCROLL
  ----------------------------------------------------------- */

  useEffect(() => {
    if (!emblaApi || isHovered) return;

    const interval = window.setInterval(() => {
      emblaApi.scrollNext();
    }, 3000);

    return () => {
      window.clearInterval(interval);
    };
  }, [emblaApi, isHovered]);

  return (
    <div
      className="px-5 py-5 sm:px-6"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        ref={emblaRef}
        className="overflow-hidden"
      >
        <div className="-ml-2.5 flex touch-pan-y">
          {SHOP_CATEGORIES.map((category) => (
            <div
              key={category.slug}
              className="min-w-0 shrink-0 basis-[58%] pl-2.5 sm:basis-[31%] lg:basis-[24%]"
            >
              <Link
                to={`/category/${category.slug}`}
                className="group block"
              >
                <div className="relative aspect-[5/4] overflow-hidden bg-blush">
                  <img
                    src={category.image}
                    alt={`${category.name} — Grandeur luxury jewellery collection`}
                    loading="lazy"
                    width={800}
                    height={640}
                    className="h-full w-full object-cover transition-transform duration-[1000ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.045]"
                  />

                  {/* Soft overlay */}

                  <div className="absolute inset-0 bg-gradient-to-t from-navy/80 via-navy/5 to-transparent opacity-90 transition-opacity duration-500 group-hover:opacity-100" />

                  {/* Category number */}

                  <div className="absolute left-3 top-3">
                    <span className="text-[7px] font-medium tracking-[0.18em] text-white/75">
                      {category.number}
                    </span>
                  </div>

                  {/* Hover arrow */}

                  <div className="absolute right-3 top-3 grid size-7 translate-y-1 place-items-center border border-white/40 text-white opacity-0 transition-all duration-500 group-hover:translate-y-0 group-hover:opacity-100">
                    <ArrowRight
                      className="size-3"
                      strokeWidth={1.2}
                    />
                  </div>

                  {/* Category information */}

                  <div className="absolute inset-x-3 bottom-3">
                    <h3 className="font-display text-lg leading-none text-white">
                      {category.name}
                    </h3>

                    <p className="mt-1 text-[7px] uppercase tracking-[0.13em] text-white/65">
                      {category.description}
                    </p>

                    <div className="mt-1.5 h-px w-5 bg-white/55 transition-all duration-500 group-hover:w-9" />
                  </div>
                </div>
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* =============================================================
   ICON BUTTON
============================================================= */

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
      type="button"
      onClick={onClick}
      aria-label={label}
      className={cn(
        "relative grid size-10 place-items-center text-navy transition-all duration-300 hover:text-gold-dark active:scale-95",
        className,
      )}
    >
      {children}

      {!!badge && (
        <span className="absolute right-0 top-1 grid min-w-4 place-items-center rounded-full bg-gold-dark px-1 text-[9px] font-medium leading-4 text-white">
          {badge}
        </span>
      )}
    </button>
  );
}

/* =============================================================
   TOP NAVIGATION LINK
============================================================= */

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
          "link-underline block py-3.5 text-[10px] font-medium uppercase tracking-[0.22em] text-navy transition-colors hover:text-gold-dark",
          active && "text-gold-dark",
        )}
      >
        {children}
      </Link>
    </li>
  );
}