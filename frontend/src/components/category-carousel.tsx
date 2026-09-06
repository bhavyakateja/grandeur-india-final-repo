import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import useEmblaCarousel from "embla-carousel-react";
import { ArrowUpRight, ChevronLeft, ChevronRight } from "lucide-react";

import necklaceImg from "../assets/category-carousel/necklace.png";
import earringImg from "../assets/category-carousel/earring.png";
import braceletImg from "../assets/category-carousel/bracelet.png";
import pendantImg from "../assets/category-carousel/pendant.png";
import ringImg from "../assets/category-carousel/ring.png";
import beadImg from "../assets/category-carousel/bead.png";

export const CATEGORIES = [
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


export function CategoryCarousel() {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: "start",
    loop: true,
    dragFree: false,
    skipSnaps: false,
  });

  const [selectedIndex, setSelectedIndex] = useState(0);

  const scrollPrev = useCallback(() => {
    emblaApi?.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    emblaApi?.scrollNext();
  }, [emblaApi]);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;

    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;

    onSelect();

    emblaApi.on("select", onSelect);
    emblaApi.on("reInit", onSelect);

    return () => {
      emblaApi.off("select", onSelect);
      emblaApi.off("reInit", onSelect);
    };
  }, [emblaApi, onSelect]);

  return (
    <section className="relative overflow-hidden">
      {/* Section heading */}
      <div className="mb-10 flex items-end justify-between gap-8">
        <div>
          <p className="mb-3 text-[10px] font-medium uppercase tracking-[0.28em] text-gold">
            Shop by category
          </p>

          <h2 className="font-display text-3xl leading-tight text-navy sm:text-4xl">
            Find your signature.
          </h2>
        </div>

        <Link
          to="/products"
          className="group hidden items-center gap-2 text-[10px] font-medium uppercase tracking-[0.2em] text-navy sm:flex"
        >
          View all
          <ArrowUpRight
            className="size-3.5 transition-transform duration-500 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
            strokeWidth={1.4}
          />
        </Link>
      </div>

      {/* Carousel */}
      <div
        ref={emblaRef}
        className="overflow-visible"
      >
        <div className="-ml-3 flex touch-pan-y">
          {CATEGORIES.map((category) => (
            <div
              key={category.slug}
              className="min-w-0 shrink-0 basis-[78%] pl-3 sm:basis-[46%] lg:basis-[31%] xl:basis-[28%]"
            >
              <Link
                to={`/category/${category.slug}`}
                className="group block"
              >
                {/* Image */}
                <div className="relative aspect-[4/5] overflow-hidden bg-blush">
                  <img
                    src={category.image}
                    alt={category.name}
                    loading="lazy"
                    width={800}
                    height={1000}
                    className="
                      absolute inset-0
                      h-full w-full
                      object-cover
                      transition-transform
                      duration-[1400ms]
                      ease-[cubic-bezier(0.22,1,0.36,1)]
                      group-hover:scale-[1.045]
                    "
                  />

                  {/* Bottom gradient */}
                  <div
                    className="
                      absolute inset-x-0 bottom-0 h-1/2
                      bg-gradient-to-t
                      from-navy/65
                      via-navy/10
                      to-transparent
                      opacity-90
                      transition-opacity duration-700
                      group-hover:opacity-100
                    "
                  />

                  {/* Category number */}
                  <div className="absolute left-5 top-5">
                    <span className="text-[10px] font-medium tracking-[0.2em] text-white/80">
                      {category.number}
                    </span>
                  </div>

                  {/* Explore arrow */}
                  <div
                    className="
                      absolute right-5 top-5
                      grid size-9 place-items-center
                      border border-white/40
                      text-white
                      opacity-0
                      translate-y-1
                      transition-all duration-500
                      group-hover:translate-y-0
                      group-hover:opacity-100
                    "
                  >
                    <ArrowUpRight
                      className="size-4"
                      strokeWidth={1.2}
                    />
                  </div>

                  {/* Category name */}
                  <div className="absolute inset-x-5 bottom-5">
                    <h3 className="font-display text-2xl text-white sm:text-3xl">
                      {category.name}
                    </h3>

                    <div
                      className="
                        mt-2 flex items-center gap-2
                        text-[9px]
                        font-medium
                        uppercase
                        tracking-[0.2em]
                        text-white/75
                        transition-colors duration-300
                        group-hover:text-white
                      "
                    >
                      {category.description}
                      <span
                        className="
                          h-px w-5 bg-white/60
                          transition-all duration-500
                          group-hover:w-8
                        "
                      />
                    </div>
                  </div>
                </div>
              </Link>
            </div>
          ))}
        </div>
      </div>

      {/* Controls */}
      <div className="mt-8 flex items-center justify-between">
        {/* Progress */}
        <div className="flex items-center gap-4">
          <span className="text-[9px] font-medium tracking-[0.18em] text-navy/50">
            {String(selectedIndex + 1).padStart(2, "0")}
          </span>

          <div className="relative h-px w-24 overflow-hidden bg-navy/10 sm:w-36">
            <div
              className="absolute inset-y-0 left-0 bg-navy transition-all duration-500"
              style={{
                width: `${((selectedIndex + 1) / CATEGORIES.length) * 100}%`,
              }}
            />
          </div>

          <span className="text-[9px] font-medium tracking-[0.18em] text-navy/50">
            {String(CATEGORIES.length).padStart(2, "0")}
          </span>
        </div>

        {/* Navigation */}
        <div className="flex items-center gap-2">
          <CarouselButton
            label="Previous category"
            onClick={scrollPrev}
          >
            <ChevronLeft
              className="size-4"
              strokeWidth={1.2}
            />
          </CarouselButton>

          <CarouselButton
            label="Next category"
            onClick={scrollNext}
          >
            <ChevronRight
              className="size-4"
              strokeWidth={1.2}
            />
          </CarouselButton>
        </div>
      </div>

      {/* Mobile view all */}
      <div className="mt-6 sm:hidden">
        <Link
          to="/products"
          className="group inline-flex items-center gap-2 text-[10px] font-medium uppercase tracking-[0.2em] text-navy"
        >
          View all jewellery
          <ArrowUpRight
            className="size-3.5 transition-transform duration-500 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
            strokeWidth={1.4}
          />
        </Link>
      </div>
    </section>
  );
}

function CarouselButton({
  children,
  label,
  onClick,
}: {
  children: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="
        grid size-11 place-items-center
        border border-navy/15
        text-navy
        transition-all duration-500
        hover:border-navy
        hover:bg-navy
        hover:text-navy-foreground
        active:scale-95
      "
    >
      {children}
    </button>
  );
}