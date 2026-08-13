import { Link } from "react-router-dom";
import { Heart, ShoppingBag } from "lucide-react";
import { toast } from "sonner";
import { formatINR } from "@/lib/utils";
import { useStore } from "@/lib/store";
import { useAuth } from "@/context/auth-context";
import { cn } from "@/lib/utils";
import type { Product as ApiProduct } from "@/lib/types";

type ProductCardProps = {
  product: ApiProduct;
  index?: number;
};

export function ProductCard({
  product,
  index = 0,
}: ProductCardProps) {
  const { addToCart, toggleWishlist, wishlist } = useStore();
  const { isAuthenticated } = useAuth();

  const wished = wishlist.includes(product.id);

  const price = Number(product.price || 0);
  const imageUrl =
    product.images?.[0]?.url || "";

  const categoryName = product.category?.name || "Jewellery";

  const isOutOfStock = product.status === "OUT_OF_STOCK";

  const handleWishlist = () => {
    if (!isAuthenticated) { toast.error("Please sign in to use your wishlist"); return; }
    toggleWishlist(product.id);

    toast(
      wished
        ? "Removed from wishlist"
        : "Saved to wishlist",
    );
  };

  const handleAddToCart = () => {
    if (isOutOfStock) return;
    if (!isAuthenticated) { toast.error("Please sign in to add items to your bag"); return; }

    addToCart(product.id);

    toast.success(`${product.name} added to bag`);
  };

  return (
    <article
      className="group relative flex flex-col"
      style={{
        animationDelay: `${(index % 8) * 60}ms`,
      }}
    >
      {/* Product image */}
      <div className="relative overflow-hidden rounded-sm bg-blush">
        <Link
          to={`/product/${product.id}`}
          className="block"
        >
          <div className="shimmer">
            {imageUrl ? (
              <img src={imageUrl} alt={product.name} loading="lazy" width={800} height={1000} className="aspect-[4/5] w-full object-cover transition-transform duration-[1200ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.06]" />
            ) : (
              <div className="aspect-[4/5] w-full bg-gradient-blush" aria-label="Product image unavailable" />
            )}
          </div>
        </Link>

        {/* Wishlist */}
        <button
          type="button"
          aria-label={
            wished
              ? "Remove from wishlist"
              : "Add to wishlist"
          }
          onClick={handleWishlist}
          className="absolute right-3 top-3 grid size-9 place-items-center rounded-full bg-background/85 text-navy backdrop-blur transition-all duration-300 hover:scale-105"
        >
          <Heart
            className={cn(
              "size-4",
              wished && "fill-navy",
            )}
          />
        </button>

        {/* Desktop Add to Bag */}
        <button
          type="button"
          disabled={isOutOfStock}
          onClick={handleAddToCart}
          className={cn(
            "absolute bottom-3 left-3 right-3",
            "flex items-center justify-center gap-2",
            "rounded-sm bg-navy py-3",
            "text-[11px] uppercase tracking-[0.2em] text-navy-foreground",
            "translate-y-3 opacity-0",
            "transition-all duration-500",
            "ease-[cubic-bezier(0.22,1,0.36,1)]",
            "group-hover:translate-y-0 group-hover:opacity-100",
            "max-md:hidden",
            "disabled:cursor-not-allowed disabled:opacity-50",
          )}
        >
          <ShoppingBag className="size-4" />
          {isOutOfStock ? "Out of stock" : "Add to bag"}
        </button>
      </div>

      {/* Product information */}
      <div className="pt-4">
        <Link to={`/product/${product.id}`}>
          <h3 className="font-display text-lg leading-snug text-foreground">
            {product.name}
          </h3>
        </Link>

        <p className="mt-0.5 text-xs uppercase tracking-[0.12em] text-muted-foreground">
          {categoryName}
        </p>

        <div className="mt-2 flex flex-wrap items-baseline gap-2">
          <span className="text-base font-medium">
            {formatINR(price)}
          </span>


        </div>

        {/* Mobile Add to Bag */}
        <button
          type="button"
          disabled={isOutOfStock}
          onClick={handleAddToCart}
          className="mt-3 w-full rounded-sm border border-navy/20 py-2.5 text-[11px] uppercase tracking-[0.2em] text-navy transition-colors hover:bg-navy hover:text-navy-foreground md:hidden disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isOutOfStock
            ? "Out of stock"
            : "Add to bag"}
        </button>
      </div>
    </article>
  );
}