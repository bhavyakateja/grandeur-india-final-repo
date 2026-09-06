import { useCallback, useEffect, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import {
  ChevronLeft,
  ChevronRight,
  Quote,
  Star,
} from "lucide-react";

const REVIEWS = [
  {
    id: "review-01",
    name: "Ananya Mehta",
    location: "Mumbai",
    review:
      "The necklace is even more beautiful in person. The detailing is exceptional and it feels like a piece I will keep forever.",
  },
  {
    id: "review-02",
    name: "Rhea Kapoor",
    location: "New Delhi",
    review:
      "I was looking for something special without being overly traditional. The earrings were beautifully crafted, elegant and incredibly easy to wear.",
  },
  {
    id: "review-03",
    name: "Meera Shah",
    location: "Bengaluru",
    review:
      "There is something wonderfully artistic about the jewellery. My pendant arrived beautifully presented and the craftsmanship is genuinely impressive.",
  },
  {
    id: "review-04",
    name: "Ishita Malhotra",
    location: "Pune",
    review:
      "The bracelet has so much character. Every time I wear it someone asks where it is from. It feels luxurious while still having that handmade quality.",
  },
  {
    id: "review-05",
    name: "Nandini Rao",
    location: "Hyderabad",
    review:
      "I absolutely loved the attention to detail. The colours, finish and design all came together beautifully. It feels incredibly thoughtfully made.",
  },
  {
    id: "review-06",
    name: "Kavya Sethi",
    location: "Chennai",
    review:
      "From the packaging to the jewellery itself, everything felt considered. My ring is beautifully finished and has quickly become a favourite.",
  },
] as const;

export function ReviewCarousel() {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: "center",
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

  const getDistanceFromCenter = (index: number) => {
    const total = REVIEWS.length;
    const direct = index - selectedIndex;

    if (direct > total / 2) {
      return direct - total;
    }

    if (direct < -total / 2) {
      return direct + total;
    }

    return direct;
  };

  return (
    <section className="overflow-hidden bg-[#fffaf7] py-14 sm:py-16 lg:py-20">
      <div className="mx-auto max-w-[1500px] px-6 sm:px-8 lg:px-12">

        {/* =====================================================
            COMPACT INTRO
        ===================================================== */}

        <div className="text-center">
          <p className="text-[10px] font-semibold uppercase tracking-[0.38em] text-[#c89a4b]">
            The Grandeur Edit
          </p>

          <h2 className="mt-3 font-display text-3xl text-[#102650] sm:text-4xl lg:text-5xl">
            Loved by those who{" "}
            <span className="font-serif italic text-[#c89a4b]">
              wear it.
            </span>
          </h2>
        </div>

        {/* =====================================================
            CAROUSEL
        ===================================================== */}

        <div className="relative mt-9 sm:mt-11">

          {/* Previous */}

          <button
            type="button"
            onClick={scrollPrev}
            aria-label="Previous review"
            className="
              absolute left-0 top-1/2 z-40
              grid size-10 -translate-y-1/2 place-items-center
              rounded-full
              border border-[#102650]/15
              bg-white
              text-[#102650]
              shadow-sm
              transition-all duration-300
              hover:border-[#102650]
              hover:bg-[#102650]
              hover:text-white
              active:scale-95
              sm:left-3
              lg:left-10
            "
          >
            <ChevronLeft
              className="size-4"
              strokeWidth={1.5}
            />
          </button>

          {/* Next */}

          <button
            type="button"
            onClick={scrollNext}
            aria-label="Next review"
            className="
              absolute right-0 top-1/2 z-40
              grid size-10 -translate-y-1/2 place-items-center
              rounded-full
              border border-[#102650]/15
              bg-white
              text-[#102650]
              shadow-sm
              transition-all duration-300
              hover:border-[#102650]
              hover:bg-[#102650]
              hover:text-white
              active:scale-95
              sm:right-3
              lg:right-10
            "
          >
            <ChevronRight
              className="size-4"
              strokeWidth={1.5}
            />
          </button>

          {/* Embla */}

          <div
            ref={emblaRef}
            className="overflow-visible"
          >
            <div className="-ml-3 flex touch-pan-y py-6">

              {REVIEWS.map((review, index) => {
                const distance = getDistanceFromCenter(index);
                const isCenter = distance === 0;
                const isNear = Math.abs(distance) === 1;

                return (
                  <div
                    key={review.id}
                    className="
                      min-w-0 shrink-0 pl-3
                      basis-[88%]
                      sm:basis-[50%]
                      lg:basis-[32%]
                      xl:basis-[29%]
                    "
                  >
                    <article
                      className={`
                        relative
                        h-[310px]
                        overflow-hidden
                        border
                        px-7 py-7
                        transition-all
                        duration-600
                        ease-[cubic-bezier(0.22,1,0.36,1)]
                        sm:h-[330px]
                        sm:px-8
                        sm:py-8

                        ${
                          isCenter
                            ? "z-30 scale-100 border-[#c89a4b]/40 bg-white opacity-100 shadow-[0_20px_55px_-35px_rgba(16,38,80,0.45)]"
                            : isNear
                              ? "z-20 scale-[0.88] border-[#102650]/8 bg-white/60 opacity-40"
                              : "z-10 scale-[0.80] border-[#102650]/5 bg-white/30 opacity-15"
                        }
                      `}
                    >

                      {/* Quote */}

                      <Quote
                        className="
                          absolute
                          right-6
                          top-6
                          size-9
                          text-[#c89a4b]/25
                        "
                        strokeWidth={1}
                      />

                      {/* Stars */}

                      <div className="flex gap-1.5">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className="size-3.5 fill-[#c89a4b] text-[#c89a4b]"
                            strokeWidth={1}
                          />
                        ))}
                      </div>

                      {/* Review */}

                      <p
                        className={`
                          mt-5
                          max-w-[95%]
                          font-display
                          leading-[1.5]
                          text-[#102650]

                          ${
                            isCenter
                              ? "text-[18px] sm:text-[20px]"
                              : "text-[16px]"
                          }
                        `}
                      >
                        “{review.review}”
                      </p>

                      {/* Customer */}

                      <div className="absolute inset-x-7 bottom-6 border-t border-[#102650]/10 pt-4 sm:inset-x-8 sm:bottom-7">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#102650]">
                          {review.name}
                        </p>

                        <p className="mt-1 text-[8px] font-medium uppercase tracking-[0.2em] text-[#102650]/50">
                          {review.location}
                        </p>
                      </div>

                      {/* Active accent */}

                      {isCenter && (
                        <div className="absolute bottom-0 left-0 h-[2.5px] w-full bg-[#c89a4b]" />
                      )}
                    </article>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* =====================================================
            COMPACT PROGRESS
        ===================================================== */}

        <div className="mt-3 flex items-center justify-center gap-3.5">
          <span className="text-[9px] font-medium tracking-[0.18em] text-[#102650]/50">
            {String(selectedIndex + 1).padStart(2, "0")}
          </span>

          <div className="h-px w-20 overflow-hidden bg-[#102650]/15 sm:w-28">
            <div
              className="h-full bg-[#c89a4b] transition-all duration-500"
              style={{
                width: `${((selectedIndex + 1) / REVIEWS.length) * 100}%`,
              }}
            />
          </div>

          <span className="text-[9px] font-medium tracking-[0.18em] text-[#102650]/50">
            {String(REVIEWS.length).padStart(2, "0")}
          </span>
        </div>

      </div>
    </section>
  );
}