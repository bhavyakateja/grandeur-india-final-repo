import { Link, useNavigate, useParams } from "react-router-dom";
import { useState } from "react";
import {
  Heart,
  Star,
  Minus,
  Plus,
  MessageSquare,
} from "lucide-react";
import { toast } from "sonner";

import { formatINR } from "@/lib/utils";
import { useStore } from "@/lib/store";
import {
  useProduct,
  useProductRating,
  useProductReviews,
  useCreateReview,
  useProducts,
} from "@/hooks/use-api";
import { useAuth } from "@/context/auth-context";
import { ProductCard } from "@/components/product-card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

function RatingStars({
  value,
  size = "size-4",
}: {
  value: number;
  size?: string;
}) {
  return (
    <div
      className="flex items-center gap-0.5"
      aria-label={`${value} out of 5 stars`}
    >
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={cn(
            size,
            star <= Math.round(value)
              ? "fill-gold text-gold"
              : "text-border",
          )}
        />
      ))}
    </div>
  );
}

export default function ProductPage() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const {
    data: product,
    isLoading,
    isError,
    refetch,
  } = useProduct(id);

  const {
    data: reviews = [],
    isLoading: reviewsLoading,
  } = useProductReviews(id);

  const {
    data: rating,
    isLoading: ratingLoading,
  } = useProductRating(id);

  const { data: relatedData } = useProducts({
    limit: 8,
    category: product?.category?.slug,
    status: "ACTIVE",
    sort: "-createdAt",
  });

  const { addToCart, toggleWishlist, wishlist } = useStore();
  const createReviewMutation = useCreateReview();

  const [qty, setQty] = useState(1);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewTitle, setReviewTitle] = useState("");
  const [activeImage, setActiveImage] = useState(0);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-32 text-center sm:px-6 lg:px-8">
        <p className="eyebrow text-gold">Loading piece…</p>
      </div>
    );
  }

  if (isError || !product) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-32 text-center sm:px-6 lg:px-8">
        <p className="eyebrow text-gold">Grandeur Jewellery</p>
        <h1 className="mt-3 font-display text-4xl">
          This piece could not be found
        </h1>
        <button
          onClick={() => void refetch()}
          className="mt-6 text-xs uppercase tracking-[0.2em] text-gold"
        >
          Try again
        </button>
        <br />
        <Link
          to="/products"
          className="mt-5 inline-block text-xs uppercase tracking-[0.2em] text-gold"
        >
          Browse jewellery
        </Link>
      </div>
    );
  }

  const wished = wishlist.includes(product.id);
  const price = Number(product.price);
  const images = product.images.map((image) => image.url).filter(Boolean);
  const categorySlug = product.category?.slug;
  const categoryName = product.category?.name || "Jewellery";

  const averageRating =
    rating && Number.isFinite(Number(rating.average))
      ? Number(rating.average)
      : 0;

  const reviewCount =
    rating && Number.isFinite(Number(rating.count))
      ? Number(rating.count)
      : reviews.length;

  const related = (relatedData?.products ?? [])
    .filter((relatedProduct) => relatedProduct.id !== product.id)
    .slice(0, 4);

  const maxQty = Math.min(10, Math.max(0, product.stock));
  const isAvailable =
    product.status === "ACTIVE" && product.stock > 0;

  const availabilityLabel =
    !isAvailable
      ? "Unavailable"
      : product.stock === 1
        ? "Only 1 left"
        : product.stock === 2
          ? "Only 2 left"
          : "Available";

  const submitReview = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!isAuthenticated) {
      toast.error("Please sign in to leave a review");
      return;
    }

    if (!reviewComment.trim()) {
      toast.error("Please write a review comment");
      return;
    }

    try {
      await createReviewMutation.mutateAsync({
        productId: product.id,
        rating: reviewRating,
        ...(reviewTitle.trim()
          ? { title: reviewTitle.trim() }
          : {}),
        comment: reviewComment.trim(),
      });

      setReviewTitle("");
      setReviewComment("");

      toast.success(
        "Thank you. Your review has been submitted for approval.",
      );
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Unable to submit review",
      );
    }
  };

  const add = () => {
    if (!isAuthenticated) {
      toast.error("Please sign in to add items to your bag");
      return false;
    }

    if (!isAvailable) {
      toast.error("This piece is currently unavailable");
      return false;
    }

    addToCart(product.id, qty);
    toast.success("Added to bag");
    return true;
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
      {/* Breadcrumb */}
      <nav className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
        <Link
          to="/"
          className="transition-colors hover:text-navy"
        >
          Home
        </Link>

        <span className="mx-2 text-border">·</span>

        {categorySlug ? (
          <Link
            to={`/category/${categorySlug}`}
            className="transition-colors hover:text-navy"
          >
            {categoryName}
          </Link>
        ) : (
          categoryName
        )}

        <span className="mx-2 text-border">·</span>

        <span className="text-foreground/70">
          {product.name}
        </span>
      </nav>

      {/* ------------------------------------------------------------------ */}
      {/* Product hero                                                        */}
      {/* ------------------------------------------------------------------ */}
      <section className="mt-7 grid items-start gap-12 lg:grid-cols-[minmax(0,1.08fr)_minmax(380px,0.92fr)] lg:gap-16">
        {/* Gallery */}
        <div className="grid self-start gap-3 sm:grid-cols-[76px_minmax(0,1fr)]">
          <div className="order-2 flex gap-2.5 overflow-x-auto pb-1 sm:order-1 sm:flex-col sm:overflow-visible">
            {images.map((url, index) => (
              <button
                key={url}
                type="button"
                onClick={() => setActiveImage(index)}
                className={cn(
                  "shrink-0 overflow-hidden border transition-all duration-300",
                  activeImage === index
                    ? "border-navy"
                    : "border-transparent opacity-65 hover:opacity-100",
                )}
                aria-label={`View image ${index + 1}`}
              >
                <img
                  src={url}
                  alt=""
                  className="size-[68px] object-cover"
                />
              </button>
            ))}
          </div>

          <div className="order-1 overflow-hidden bg-blush/50 sm:order-2">
            {images[activeImage] ? (
              <img
                src={images[activeImage]}
                alt={product.name}
                className="aspect-[4/5] w-full object-cover"
              />
            ) : (
              <div
                className="aspect-[4/5] w-full bg-gradient-blush"
                aria-label="Product image unavailable"
              />
            )}
          </div>
        </div>

        {/* Product information */}
        <div className="lg:pt-3">
          <div className="flex items-center justify-between gap-4">
            <p
              className={cn(
                "eyebrow",
                isAvailable
                  ? "text-gold"
                  : "text-destructive",
              )}
            >
              {isAvailable
                ? "Grandeur Collection"
                : "Currently unavailable"}
            </p>

            <button
              type="button"
              onClick={() => {
                if (!isAuthenticated) {
                  toast.error(
                    "Please sign in to use your wishlist",
                  );
                  return;
                }

                toggleWishlist(product.id);
                toast(
                  wished
                    ? "Removed from wishlist"
                    : "Saved to wishlist",
                );
              }}
              className="group flex items-center gap-2 text-[10px] uppercase tracking-[0.15em] text-muted-foreground transition-colors hover:text-gold"
              aria-label={
                wished
                  ? "Remove from wishlist"
                  : "Add to wishlist"
              }
            >
              <Heart
                className={cn(
                  "size-4 transition-all",
                  wished
                    ? "fill-gold text-gold"
                    : "text-gold group-hover:scale-105",
                )}
              />

              <span className="hidden sm:inline">
                Wishlist
              </span>
            </button>
          </div>

          <h1 className="mt-3 max-w-xl font-display text-4xl leading-[1.05] sm:text-5xl">
            {product.name}
          </h1>

          {/* Rating */}
          <div className="mt-5 flex flex-wrap items-center gap-3">
            {ratingLoading ? (
              <span className="text-xs text-muted-foreground">
                Loading rating…
              </span>
            ) : averageRating > 0 ? (
              <>
                <RatingStars value={averageRating} />

                <span className="text-sm font-medium">
                  {averageRating.toFixed(1)}
                </span>

                <span className="text-xs text-muted-foreground">
                  {reviewCount}{" "}
                  {reviewCount === 1
                    ? "review"
                    : "reviews"}
                </span>
              </>
            ) : (
              <span className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
                No reviews yet
              </span>
            )}
          </div>

          {/* Price */}
          <div className="mt-6 border-y border-border/50 py-5">
            <span className="font-display text-3xl">
              {formatINR(price)}
            </span>
          </div>

          {/* Availability */}
          <div className="mt-5 flex items-center gap-3 text-xs">
            <span
              className={cn(
                "inline-flex items-center gap-2",
                isAvailable
                  ? "text-muted-foreground"
                  : "text-destructive",
              )}
            >
              {isAvailable && (
                <span className="size-1.5 rounded-full bg-gold" />
              )}

              {availabilityLabel}
            </span>
          </div>

          {/* Purchase controls */}
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <div className="flex h-12 items-center border border-border">
              <button
                type="button"
                onClick={() =>
                  setQty((current) =>
                    Math.max(1, current - 1),
                  )
                }
                className="grid size-12 place-items-center transition-colors hover:bg-blush/40"
                aria-label="Decrease quantity"
              >
                <Minus className="size-4" />
              </button>

              <span className="w-10 text-center text-sm">
                {qty}
              </span>

              <button
                type="button"
                onClick={() =>
                  setQty((current) =>
                    Math.min(
                      maxQty || 1,
                      current + 1,
                    ),
                  )
                }
                className="grid size-12 place-items-center transition-colors hover:bg-blush/40 disabled:cursor-not-allowed disabled:opacity-30"
                aria-label="Increase quantity"
                disabled={
                  !isAvailable ||
                  maxQty <= qty
                }
              >
                <Plus className="size-4" />
              </button>
            </div>

            <Button
              disabled={!isAvailable}
              onClick={add}
              variant="outline"
              className="h-12 flex-1 rounded-none border-navy text-[10px] uppercase tracking-[0.2em]"
            >
              Add to bag
            </Button>

            <Button
              disabled={!isAvailable}
              onClick={() => {
                if (add()) {
                  navigate("/checkout");
                }
              }}
              className="h-12 flex-1 rounded-none bg-navy text-[10px] uppercase tracking-[0.2em] hover:bg-navy/90"
            >
              Buy now
            </Button>
          </div>

          {/* Supporting product information */}
          <Accordion
            type="single"
            collapsible
            defaultValue="desc"
            className="mt-8"
          >
            <AccordionItem value="desc">
              <AccordionTrigger className="text-[10px] uppercase tracking-[0.17em]">
                Description
              </AccordionTrigger>

              <AccordionContent className="max-w-xl text-sm leading-7 text-muted-foreground">
                {product.description}
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="details">
              <AccordionTrigger className="text-[10px] uppercase tracking-[0.17em]">
                Product details
              </AccordionTrigger>

              <AccordionContent>
                <dl className="grid grid-cols-2 gap-y-3 text-sm">
                  <dt className="text-muted-foreground">
                    Category
                  </dt>
                  <dd>{categoryName}</dd>

                  <dt className="text-muted-foreground">
                    Availability
                  </dt>
                  <dd>{availabilityLabel}</dd>

                  <dt className="text-muted-foreground">
                    Product ID
                  </dt>
                  <dd className="break-all">
                    {product.id}
                  </dd>
                </dl>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* Reviews — deliberately outside the product grid                    */}
      {/* ------------------------------------------------------------------ */}
      <section className="mt-16 border-t border-border/50 pt-8 sm:mt-20 sm:pt-10">
        <Accordion type="single" collapsible>
          <AccordionItem
            value="reviews"
            className="border-b-0"
          >
            <AccordionTrigger className="py-3 text-[10px] uppercase tracking-[0.18em] hover:no-underline">
              Customer Reviews ({reviewCount})
            </AccordionTrigger>

            <AccordionContent className="pt-6">
              <div className="grid gap-10 lg:grid-cols-[240px_minmax(0,1fr)]">
                {/* Rating summary */}
                <div className="lg:border-r lg:border-border/50 lg:pr-10">
                  <p className="font-display text-5xl leading-none">
                    {averageRating > 0
                      ? averageRating.toFixed(1)
                      : "—"}
                  </p>

                  <div className="mt-3">
                    <RatingStars value={averageRating} />
                  </div>

                  <p className="mt-2 text-xs text-muted-foreground">
                    {reviewCount}{" "}
                    {reviewCount === 1
                      ? "review"
                      : "reviews"}
                  </p>
                </div>

                {/* Reviews + form */}
                <div className="min-w-0">
                  {reviewsLoading ? (
                    <p className="text-sm text-muted-foreground">
                      Loading reviews…
                    </p>
                  ) : reviews.length === 0 ? (
                    <div className="border border-dashed border-border/70 px-5 py-10 text-center">
                      <MessageSquare className="mx-auto size-5 text-gold" />

                      <p className="mt-3 font-display text-xl">
                        Be the first to share
                      </p>

                      <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
                        Your experience can help another
                        customer choose their piece.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-7">
                      {reviews.map((review) => (
                        <article
                          key={review.id}
                          className="border-b border-border/50 pb-7 last:border-0 last:pb-0"
                        >
                          <div className="flex items-start justify-between gap-5">
                            <div>
                              <p className="text-sm font-medium">
                                {review.user?.name ||
                                  "Customer"}
                              </p>

                              <p className="mt-1 text-[10px] uppercase tracking-[0.13em] text-muted-foreground">
                                Verified customer
                              </p>
                            </div>

                            <RatingStars
                              value={review.rating}
                              size="size-3.5"
                            />
                          </div>

                          {review.title && (
                            <p className="mt-4 font-medium">
                              {review.title}
                            </p>
                          )}

                          {review.comment && (
                            <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
                              {review.comment}
                            </p>
                          )}
                        </article>
                      ))}
                    </div>
                  )}

                  {/* Review form */}
                  <form
                    onSubmit={submitReview}
                    className="mt-8 border-t border-border/50 pt-8"
                  >
                    <div className="flex items-start gap-3">
                      <MessageSquare className="mt-0.5 size-4 shrink-0 text-gold" />

                      <div>
                        <p className="text-sm font-medium">
                          Share your experience
                        </p>

                        <p className="mt-1 text-xs leading-5 text-muted-foreground">
                          Reviews are available to customers
                          who have purchased this piece.
                        </p>
                      </div>
                    </div>

                    {!isAuthenticated ? (
                      <div className="mt-5 border border-border/60 bg-blush/15 p-5">
                        <p className="text-sm">
                          Sign in to share your experience.
                        </p>

                        <Link
                          to="/login"
                          className="mt-3 inline-block text-[10px] uppercase tracking-[0.18em] text-gold"
                        >
                          Sign in
                        </Link>
                      </div>
                    ) : (
                      <>
                        <div className="mt-6">
                          <p className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                            Your rating
                          </p>

                          <div className="mt-2 flex gap-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <button
                                key={star}
                                type="button"
                                onClick={() =>
                                  setReviewRating(star)
                                }
                                aria-label={`${star} stars`}
                                className="p-1 text-gold transition-transform hover:scale-110"
                              >
                                <Star
                                  className={cn(
                                    "size-5",
                                    star <=
                                      reviewRating &&
                                      "fill-gold",
                                  )}
                                />
                              </button>
                            ))}
                          </div>
                        </div>

                        <input
                          value={reviewTitle}
                          onChange={(event) =>
                            setReviewTitle(
                              event.target.value,
                            )
                          }
                          maxLength={100}
                          placeholder="Review title (optional)"
                          className="mt-4 h-11 w-full border border-border bg-background px-3 text-sm outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-navy"
                        />

                        <Textarea
                          value={reviewComment}
                          onChange={(event) =>
                            setReviewComment(
                              event.target.value,
                            )
                          }
                          className="mt-3 min-h-28 resize-none rounded-none border-border"
                          maxLength={1000}
                          placeholder="Tell us about your experience with this piece"
                        />

                        <div className="mt-2 flex items-center justify-between gap-4">
                          <span className="text-[10px] text-muted-foreground">
                            {reviewComment.length}/1000
                          </span>

                          <Button
                            type="submit"
                            disabled={
                              createReviewMutation.isPending ||
                              !reviewComment.trim()
                            }
                            className="rounded-none bg-navy px-6 text-[10px] uppercase tracking-[0.16em] hover:bg-navy/90"
                          >
                            {createReviewMutation.isPending
                              ? "Submitting…"
                              : "Submit review"}
                          </Button>
                        </div>
                      </>
                    )}
                  </form>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* Related products                                                    */}
      {/* ------------------------------------------------------------------ */}
      {related.length > 0 && (
        <section className="mt-16 border-t border-border/50 pt-10 sm:mt-20 sm:pt-12">
          <div className="flex items-end justify-between gap-5">
            <div>
              <p className="eyebrow text-gold">
                Curated for you
              </p>

              <h2 className="mt-2 font-display text-3xl">
                You may also love
              </h2>
            </div>

            <Link
              to={
                categorySlug
                  ? `/category/${categorySlug}`
                  : "/products"
              }
              className="hidden text-[10px] uppercase tracking-[0.18em] text-gold sm:block"
            >
              View collection
            </Link>
          </div>

          <div className="gold-rule mt-4" />

          <div className="mt-8 grid grid-cols-2 gap-x-5 gap-y-10 md:grid-cols-4">
            {related.map((relatedProduct, index) => (
              <ProductCard
                key={relatedProduct.id}
                product={relatedProduct}
                index={index}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}