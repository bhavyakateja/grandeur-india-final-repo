import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import useEmblaCarousel from "embla-carousel-react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useCategories } from "@/hooks/use-api";
import { cn } from "@/lib/utils";

type Category = {
  id?: string;
  slug: string;
  name: string;
  image?: string;
  tagline?: string;
};

export function CategoryCarousel() {
  const { data: apiCategories = [] } = useCategories();

  const [emblaRef, embla] = useEmblaCarousel({
    align: "start",
    loop: true,
    dragFree: true,
  });

  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(true);

  const displayCategories: Category[] = apiCategories.filter((category) => category.isActive);

  useEffect(() => {
    if (!embla) return;

    const update = () => {
      setCanPrev(embla.canScrollPrev());
      setCanNext(embla.canScrollNext());
    };

    update();

    embla.on("select", update);
    embla.on("reInit", update);

    return () => {
      embla.off("select", update);
      embla.off("reInit", update);
    };
  }, [embla]);

  return (
    <div className="relative">
      <div ref={emblaRef} className="overflow-hidden">
        <div className="flex gap-5">
          {displayCategories.map((category) => {
            return (
              <Link
                key={category.id ?? category.slug}
                to={`/category/${category.slug}`}
                className="group min-w-0 shrink-0 basis-[68%] sm:basis-[40%] lg:basis-[23%]"
              >
                <div className="overflow-hidden rounded-sm bg-blush">
                  {category.image ? (
                    <img
                      src={category.image}
                      alt={category.name}
                      loading="lazy"
                      width={800}
                      height={1000}
                      className="aspect-[4/5] w-full object-cover transition-transform duration-[1200ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.07]"
                    />
                  ) : (
                    <div className="flex aspect-[4/5] w-full items-center justify-center bg-muted">
                      <span className="text-sm text-muted-foreground">
                        {category.name}
                      </span>
                    </div>
                  )}
                </div>

                <div className="pt-4">
                  <h3 className="font-display text-xl">{category.name}</h3>

                  <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
                    Collection
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      <div className="mt-8 flex justify-center gap-3">
        <NavBtn
          onClick={() => embla?.scrollPrev()}
          disabled={!canPrev}
          label="Previous"
        >
          <ChevronLeft className="size-4" />
        </NavBtn>

        <NavBtn
          onClick={() => embla?.scrollNext()}
          disabled={!canNext}
          label="Next"
        >
          <ChevronRight className="size-4" />
        </NavBtn>
      </div>
    </div>
  );
}

function NavBtn({
  children,
  onClick,
  disabled,
  label,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled: boolean;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className={cn(
        "grid size-11 place-items-center rounded-full border border-navy/20 text-navy transition-all duration-300",
        "hover:border-navy hover:bg-navy hover:text-navy-foreground",
        disabled && "cursor-not-allowed opacity-30",
      )}
    >
      {children}
    </button>
  );
}