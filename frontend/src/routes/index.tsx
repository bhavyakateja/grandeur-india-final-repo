import { Link } from "react-router-dom";

import { ArrowRight } from "lucide-react";

import { CategoryCarousel } from "@/components/category-carousel";
import { useStore } from "@/lib/store";
import craftsman from "@/assets/carftman.jpg";
import { ReviewCarousel } from "@/components/review-carousel";
import { StepsCarousel } from "@/components/steps-carousel";
import { HomeProductCarousel } from "@/components/homepage-product";
import { useEffect, useRef } from "react";
import { useIsMobileViewport } from "@/hooks/use-is-mobile-viewport";
import { useFeaturedProducts } from "@/hooks/use-api";

/* =============================================================
   HOME PAGE
============================================================= */

export default function HomePage() {
  const {
    wishlist,
    addToCart,
    toggleWishlist,
  } = useStore();

  const {
    data: featuredProducts = [],
  } = useFeaturedProducts();

  return (
    <main className="bg-white">
      {/* =========================================================
          HERO VIDEO & INTRO
      ========================================================= */}
      <section className="bg-white">
        <div className="relative h-[75vh] w-full overflow-hidden bg-[#fdf0ef] sm:h-[80vh] lg:h-[88vh]">
          <HeroVideo />
        </div>

        <div className="mx-auto max-w-7xl px-6 py-12 sm:px-8 sm:py-16 lg:px-12 lg:py-20">
          <div className="grid items-center gap-8 lg:grid-cols-2 lg:gap-16">
            <div>
              <p className="mb-4 text-[10px] font-medium uppercase tracking-[0.45em] text-[#c89a4b] sm:text-xs">
                Shop Grandeur
              </p>

              <h1 className="font-display text-4xl leading-[1.05] text-[#102650] sm:text-5xl lg:text-6xl">
                Jewellery{" "}
                <span className="font-serif italic text-[#c89a4b]">
                  that outlives
                </span>{" "}
                trends.
              </h1>
            </div>

            <div>
              <p className="max-w-xl text-sm leading-8 text-[#102650]/75 sm:text-base">
                Discover jewellery designed to become part of your story,
                crafted with character and made to be worn beyond the moment.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  to="/products"
                  className="inline-flex items-center gap-3 bg-[#102650] px-7 py-3.5 text-[10px] font-medium uppercase tracking-[0.22em] text-white transition-all duration-300 hover:bg-[#172f5d]"
                >
                  Explore Collection
                  <ArrowRight className="size-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================
          CATEGORIES
      ========================================================= */}
      <section className="bg-white pb-12 pt-6 sm:pb-16 sm:pt-8">
        <div className="mx-auto max-w-7xl px-6 sm:px-8 lg:px-12">
          <CategoryCarousel />
        </div>
      </section>

      {/* =========================================================
          BESTSELLERS & NEW ARRIVALS
      ========================================================= */}
      <HomeProductCarousel
        products={featuredProducts}
        wishlist={wishlist}
        onWishlist={toggleWishlist}
        onAddToCart={addToCart}
      />

      {/* =========================================================
          GRANDEUR GUIDE
      ========================================================= */}
      <StepsCarousel />

      {/* =========================================================
          CRAFTSMANSHIP
      ========================================================= */}
      <section className="bg-white py-14 sm:py-20">
        <div className="mx-auto max-w-7xl px-6 sm:px-8 lg:px-12">
          {/* Section intro */}
          <div className="mb-10 max-w-3xl sm:mb-12">
            <p className="text-[9px] font-medium uppercase tracking-[0.4em] text-[#c89a4b]">
              Handcrafted Statement Jewellery
            </p>

            <h2 className="mt-3 font-display text-3xl leading-tight text-[#102650] sm:text-5xl">
              Where craftsmanship
              <br />
              becomes{" "}
              <span className="font-serif italic text-[#c89a4b]">
                grandeur.
              </span>
            </h2>
          </div>

          {/* Main content */}
          <div className="grid items-center gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:gap-20">
            {/* Craftsman image */}
            <div className="relative overflow-hidden">
              <img
                src={craftsman}
                alt="Artisan handcrafting luxury statement jewellery with intricate detailing"
                className="h-auto w-full object-contain"
                loading="lazy"
              />

              {/* Image caption */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-[#102650]/70 to-transparent px-6 pb-5 pt-16">
                <p className="text-[8px] font-medium uppercase tracking-[0.28em] text-white/75">
                  Crafted with exceptional skill
                </p>
              </div>
            </div>

            {/* Copy */}
            <div className="max-w-xl">
              <p className="font-display text-2xl leading-[1.35] text-[#102650] sm:text-3xl">
                Every piece is more than jewellery;
                <span className="font-serif italic text-[#c89a4b]">
                  {" "}
                  it is a work of art.
                </span>
              </p>

              <p className="mt-6 text-sm leading-8 text-[#102650]/65 sm:text-base">
                Our artisans devote countless hours to bringing each design to
                life with exceptional skill and intricate detailing, whilst
                upholding the highest standards of quality. From the first
                design to the final finishing touch, each piece reflects our
                commitment to creating luxury statement jewellery that embodies
                elegance, celebrates craftsmanship, and lets you{" "}
                <span className="font-serif italic text-[#102650]">
                  Wear Your Grandeur.
                </span>
              </p>

              {/* Our story */}
              <Link
                to="/about"
                className="group mt-7 inline-flex items-center gap-3 text-[9px] font-medium uppercase tracking-[0.25em] text-[#102650]"
              >
                Discover Our Story

                <ArrowRight
                  className="size-3.5 text-[#c89a4b] transition-transform duration-500 group-hover:translate-x-1"
                  strokeWidth={1.3}
                />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================
          REVIEWS
      ========================================================= */}
      <ReviewCarousel />
    </main>
  );
}

/* =============================================================
   HERO VIDEO
============================================================= */

function HeroVideo() {
  const isMobile = useIsMobileViewport();

  const videoRef =
    useRef<HTMLVideoElement>(null);

  useEffect(() => {
    videoRef.current
      ?.play()
      .catch(() => {});
  }, [isMobile]);

  const src = isMobile
    ? "/videos/hero-phone.mp4"
    : "/videos/hero.mp4";

  const poster = isMobile
    ? "/videos/hero-phone-poster.jpg"
    : "/videos/hero-poster.jpg";

  return (
    <video
      key={src}
      ref={videoRef}
      className="absolute inset-0 h-full w-full object-cover object-center"
      autoPlay
      muted
      loop
      playsInline
      preload="auto"
      poster={poster}
      disablePictureInPicture
      disableRemotePlayback
      aria-hidden="true"
    >
      <source
        src={src}
        type="video/mp4"
      />
    </video>
  );
}