import { Link, useNavigate, useParams } from "react-router-dom";
import { useState } from "react";
import { Heart, Star, Minus, Plus, MessageSquare } from "lucide-react";
import { toast } from "sonner";
import { formatINR } from "@/lib/utils";
import { useStore } from "@/lib/store";
import { useProduct, useProductReviews, useCreateReview, useProducts } from "@/hooks/use-api";
import { useAuth } from "@/context/auth-context";
import { ProductCard } from "@/components/product-card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

export default function ProductPage() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { data: product, isLoading, isError, refetch } = useProduct(id);
  const { data: reviews = [], isLoading: reviewsLoading } = useProductReviews(id);
  const { data: relatedData } = useProducts({ limit: 8, category: product?.category?.slug, status: "ACTIVE", sort: "-createdAt" });
  const { addToCart, toggleWishlist, wishlist } = useStore();
  const createReviewMutation = useCreateReview();
  const [qty, setQty] = useState(1);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [activeImage, setActiveImage] = useState(0);

  if (isLoading) return <div className="mx-auto max-w-7xl px-4 py-32 text-center"><p className="eyebrow text-gold">Loading piece…</p></div>;
  if (isError || !product) return <div className="mx-auto max-w-7xl px-4 py-32 text-center"><h1 className="font-display text-4xl">This piece could not be found</h1><button onClick={() => void refetch()} className="mt-5 text-xs uppercase tracking-[0.2em] text-gold">Try again</button><br /><Link to="/products" className="mt-5 inline-block text-xs uppercase tracking-[0.2em] text-gold">Browse jewellery</Link></div>;

  const wished = wishlist.includes(product.id);
  const price = Number(product.price);
  const images = product.images.map((image) => image.url).filter(Boolean);
  const categorySlug = product.category?.slug;
  const categoryName = product.category?.name || "Jewellery";
  const averageRating = reviews.length ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length : 0;
  const related = (relatedData?.products ?? []).filter((p) => p.id !== product.id).slice(0, 4);
  const maxQty = Math.min(10, product.stock);

  const submitReview = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!isAuthenticated) { toast.error("Please sign in to leave a review"); return; }
    if (!reviewComment.trim()) { toast.error("Please write a review comment"); return; }
    try {
      await createReviewMutation.mutateAsync({ productId: product.id, rating: reviewRating, comment: reviewComment.trim() });
      setReviewComment("");
      toast.success("Thank you for your review");
    } catch (error) { toast.error(error instanceof Error ? error.message : "Unable to submit review"); }
  };

  const add = () => {
    if (!isAuthenticated) { toast.error("Please sign in to add items to your bag"); return false; }
    addToCart(product.id, qty); toast.success("Added to bag"); return true;
  };

  return <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
    <nav className="text-xs uppercase tracking-[0.14em] text-muted-foreground"><Link to="/">Home</Link> · {categorySlug ? <Link to={`/category/${categorySlug}`}>{categoryName}</Link> : categoryName} · {product.name}</nav>
    <div className="mt-6 grid gap-10 lg:grid-cols-2">
      <div className="grid gap-3 sm:grid-cols-[80px_minmax(0,1fr)]">
        <div className="order-2 flex gap-3 overflow-x-auto sm:order-1 sm:flex-col">
          {images.map((url, index) => <button key={url} type="button" onClick={() => setActiveImage(index)} className={cn("shrink-0 overflow-hidden rounded-sm border", activeImage === index ? "border-navy" : "border-transparent")} aria-label={`View image ${index + 1}`}><img src={url} alt="" className="size-20 object-cover" /></button>)}
        </div>
        <div className="order-1 overflow-hidden rounded-sm bg-blush sm:order-2">
          {images[activeImage] ? <img src={images[activeImage]} alt={product.name} className="aspect-[4/5] w-full object-cover" /> : <div className="aspect-[4/5] w-full bg-gradient-blush" aria-label="Product image unavailable" />}
        </div>
      </div>

      <div>
        {product.status === "OUT_OF_STOCK" || product.stock <= 0 ? <p className="eyebrow text-destructive">Out of Stock</p> : <p className="eyebrow text-gold">{product.status === "ACTIVE" ? "Available" : "Currently unavailable"}</p>}
        <h1 className="mt-2 font-display text-4xl">{product.name}</h1>
        <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground"><Star className="size-4 fill-gold text-gold" />{averageRating ? averageRating.toFixed(1) : "No rating yet"}<span>({reviews.length} reviews)</span></div>
        <div className="mt-5"><span className="font-display text-3xl">{formatINR(price)}</span></div>

        <div className="mt-7 flex items-center gap-4">
          <div className="flex items-center rounded-sm border border-border">
            <button type="button" onClick={() => setQty((q) => Math.max(1, q - 1))} className="grid size-11 place-items-center" aria-label="Decrease quantity"><Minus className="size-4" /></button>
            <span className="w-10 text-center text-sm">{qty}</span>
            <button type="button" onClick={() => setQty((q) => Math.min(maxQty || 1, q + 1))} className="grid size-11 place-items-center" aria-label="Increase quantity" disabled={maxQty <= qty}><Plus className="size-4" /></button>
          </div>
          <button type="button" onClick={() => { if (!isAuthenticated) { toast.error("Please sign in to use your wishlist"); return; } toggleWishlist(product.id); toast(wished ? "Removed from wishlist" : "Saved to wishlist"); }} className="flex h-11 items-center gap-2 rounded-sm border border-border px-4 text-xs uppercase tracking-[0.16em]"><Heart className={cn("size-4", wished && "fill-navy text-navy")} /> Wishlist</button>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <Button disabled={product.status !== "ACTIVE" || product.stock <= 0} onClick={add} variant="outline" className="h-12 rounded-sm border-navy text-xs uppercase tracking-[0.2em]">Add to bag</Button>
          <Button disabled={product.status !== "ACTIVE" || product.stock <= 0} onClick={() => { if (add()) navigate("/checkout"); }} className="h-12 rounded-sm bg-navy text-xs uppercase tracking-[0.2em]">Buy now</Button>
        </div>

        <Accordion type="single" collapsible defaultValue="desc" className="mt-8">
          <AccordionItem value="desc"><AccordionTrigger className="text-xs uppercase tracking-[0.16em]">Description</AccordionTrigger><AccordionContent className="text-sm leading-relaxed text-muted-foreground">{product.description}</AccordionContent></AccordionItem>
          <AccordionItem value="details"><AccordionTrigger className="text-xs uppercase tracking-[0.16em]">Product details</AccordionTrigger><AccordionContent><dl className="grid grid-cols-2 gap-y-2 text-sm"><dt className="text-muted-foreground">Category</dt><dd>{categoryName}</dd><dt className="text-muted-foreground">Availability</dt><dd>{product.stock > 0 && product.status === "ACTIVE" ? `${product.stock} available` : "Unavailable"}</dd><dt className="text-muted-foreground">Product ID</dt><dd className="break-all">{product.id}</dd></dl></AccordionContent></AccordionItem>
          <AccordionItem value="reviews"><AccordionTrigger className="text-xs uppercase tracking-[0.16em]">Customer Reviews ({reviews.length})</AccordionTrigger><AccordionContent className="space-y-5 pt-2">
            {reviewsLoading ? <p className="text-sm text-muted-foreground">Loading reviews…</p> : reviews.length === 0 ? <p className="text-sm text-muted-foreground">No reviews yet.</p> : reviews.map((review) => <div key={review.id} className="border-b border-border/50 pb-4"><div className="flex justify-between text-xs"><span className="font-medium">{review.user?.name || "Customer"}</span><span className="flex items-center gap-1 text-gold"><Star className="size-3 fill-gold" />{review.rating}</span></div>{review.title && <p className="mt-1 font-medium">{review.title}</p>}{review.comment && <p className="mt-1 text-sm text-muted-foreground">{review.comment}</p>}</div>)}
            <form onSubmit={submitReview} className="rounded-sm bg-blush/40 p-4"><div className="flex items-center gap-2"><MessageSquare className="size-4 text-gold" /><span className="text-xs font-medium">Share your experience</span></div><div className="mt-3 flex gap-1">{[1,2,3,4,5].map((star) => <button key={star} type="button" onClick={() => setReviewRating(star)} aria-label={`${star} stars`} className="text-gold"><Star className={cn("size-5", star <= reviewRating && "fill-gold")} /></button>)}</div><Textarea value={reviewComment} onChange={(e) => setReviewComment(e.target.value)} className="mt-3" maxLength={1000} placeholder="Tell us about your experience" /><Button type="submit" disabled={createReviewMutation.isPending} className="mt-3 bg-navy text-xs uppercase tracking-[0.15em]">{createReviewMutation.isPending ? "Submitting…" : "Submit review"}</Button></form>
          </AccordionContent></AccordionItem>
        </Accordion>
      </div>
    </div>

    {related.length > 0 && <section className="mt-20"><h2 className="font-display text-3xl">You may also love</h2><div className="gold-rule mt-3" /><div className="mt-8 grid grid-cols-2 gap-x-5 gap-y-10 md:grid-cols-4">{related.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}</div></section>}
  </div>;
}
