import { Link } from "react-router-dom";
import { Heart } from "lucide-react";
import { useStore } from "@/lib/store";
import { ProductCard } from "@/components/product-card";
import { useWishlist } from "@/hooks/use-api";
import { useAuth } from "@/context/auth-context";

export default function WishlistPage() {
  const { isAuthenticated } = useAuth();
  const { wishlist } = useStore();
  const { data: savedItems = [], isLoading } = useWishlist();

  if (!isAuthenticated) return <div className="mx-auto max-w-xl px-6 py-28 text-center"><Heart className="mx-auto size-10 text-gold" /><h1 className="mt-5 font-display text-4xl">Your wishlist</h1><p className="mt-3 text-sm text-muted-foreground">Sign in to keep your saved jewellery synced to your account.</p><Link to="/profile" className="mt-6 inline-block rounded-sm bg-navy px-8 py-4 text-xs uppercase tracking-[0.2em] text-white">Sign in</Link></div>;
  const saved = savedItems.filter((item) => wishlist.includes(item.productId)).map((item) => item.product);
  return <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8"><h1 className="font-display text-4xl">Wishlist</h1><div className="gold-rule mt-3" />{isLoading ? <p className="py-20 text-center text-sm text-muted-foreground">Loading wishlist…</p> : saved.length === 0 ? <div className="py-24 text-center"><Heart className="mx-auto size-9 text-gold" /><p className="mt-6 font-display text-2xl">Nothing saved yet</p><Link to="/products" className="mt-5 inline-block rounded-sm bg-navy px-8 py-4 text-xs uppercase tracking-[0.2em] text-white">Explore jewellery</Link></div> : <div className="mt-10 grid grid-cols-2 gap-x-5 gap-y-10 md:grid-cols-4">{saved.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}</div>}</div>;
}
