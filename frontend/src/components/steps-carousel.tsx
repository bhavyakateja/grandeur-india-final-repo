import { useCallback, useEffect, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { ArrowRight } from "lucide-react";

/* =========================================================
   STYLE GUIDE CONTENT
============================================================= */

const STEPS = [
  {
    number: "01",
    title: "Choose your focal point.",
    description:
      "Build your look around one distinctive piece and give it enough space to make an impression.",
    points: [
      "Choose one hero piece and make it the centre of your look.",
      "Keep surrounding jewellery understated and refined.",
    ],
  },
  {
    number: "02",
    title: "Match your outfit & neckline.",
    description:
      "Let your outfit create the right canvas for statement jewellery.",
    points: [
      "Use simple, neutral outfits to let distinctive jewellery shine.",
      "Match necklace length and shape to your neckline.",
    ],
  },
  {
    number: "03",
    title: "Balance & layer with care.",
    description:
      "Layer thoughtfully to create a polished look without overwhelming it.",
    points: [
      "Pair one statement piece with simpler complementary jewellery.",
      "Avoid busy patterns when wearing bold, detailed pieces.",
    ],
  },
  {
    number: "04",
    title: "Wear your grandeur.",
    description:
      "Finish with confidence and let your jewellery become part of your signature style.",
    points: [
      "Choose pieces that feel expressive, distinctive and effortless.",
      "Let craftsmanship remain the focus of your look.",
    ],
  },
] as const;

/* =========================================================
   STEPS CAROUSEL
============================================================= */

export function StepsCarousel() {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: "start",
    loop: false,
    dragFree: false,
    skipSnaps: false,
  });

  const [selectedIndex, setSelectedIndex] = useState(0);

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
    <section className="overflow-hidden bg-[#f8f5f0] py-12 sm:py-16">
      <div className="mx-auto max-w-6xl px-5 sm:px-7 lg:px-10">

        {/* =====================================================
            HEADER
        ===================================================== */}

        <div className="mb-8">
          <p className="text-[10px] font-semibold uppercase tracking-[0.38em] text-[#c89a4b]">
            The Grandeur Guide
          </p>

          <h2 className="mt-2 font-display text-3xl leading-tight text-[#102650] sm:text-4xl">
            Style your statement jewellery.
          </h2>
        </div>

        {/* =====================================================
            CAROUSEL
        ===================================================== */}

        <div ref={emblaRef} className="overflow-hidden">
          <div className="-ml-3 flex touch-pan-y items-stretch">

            {/* =================================================
                SLIDE 01 — INTRO
            ================================================= */}

            <div className="min-w-0 shrink-0 basis-full pl-3">
              <div className="grid h-full min-h-[340px] sm:min-h-[360px] lg:min-h-[320px] bg-white lg:grid-cols-[0.75fr_1.25fr]">

                {/* Intro label */}

                <div className="flex flex-col justify-center bg-[#102650] px-8 py-10 text-white sm:px-12">
                  <span className="font-display text-6xl leading-none text-[#c89a4b]">
                    Style
                  </span>

                  <h3 className="mt-5 max-w-xs font-display text-3xl leading-tight sm:text-4xl">
                    Statement jewellery,
                    <br />
                    styled with intention.
                  </h3>
                </div>

                {/* Intro content */}

                <div className="flex flex-col justify-between px-8 py-10 sm:px-12">
                  <p className="max-w-lg text-base leading-7 text-[#102650]/80 sm:text-lg">
                    Simple styling principles to help distinctive jewellery
                    become the centre of your look.
                  </p>

                  <div>
                    <NextStepButton onClick={scrollNext} />
                  </div>
                </div>
              </div>
            </div>

            {/* =================================================
                SLIDE 02 — STEP 01
            ================================================= */}

            <StepSlide
              step={STEPS[0]}
              onNext={scrollNext}
              isLast={false}
            />

            {/* =================================================
                SLIDE 03 — STEP 02
            ================================================= */}

            <StepSlide
              step={STEPS[1]}
              onNext={scrollNext}
              isLast={false}
            />

            {/* =================================================
                SLIDE 04 — STEP 03
            ================================================= */}

            <StepSlide
              step={STEPS[2]}
              onNext={scrollNext}
              isLast={false}
            />

            {/* =================================================
                SLIDE 05 — STEP 04
            ================================================= */}

            <StepSlide
              step={STEPS[3]}
              onNext={scrollNext}
              isLast
            />
          </div>
        </div>

        {/* =====================================================
            MINIMAL PROGRESS
        ===================================================== */}

        <div className="mt-6 flex items-center gap-3">
          <span className="text-[10px] font-medium tracking-[0.18em] text-[#102650]/50">
            {String(selectedIndex + 1).padStart(2, "0")}
          </span>

          <div className="h-px w-16 overflow-hidden bg-[#102650]/15 sm:w-24">
            <div
              className="h-full bg-[#c89a4b] transition-all duration-500"
              style={{
                width: `${((selectedIndex + 1) / 5) * 100}%`,
              }}
            />
          </div>

          <span className="text-[10px] font-medium tracking-[0.18em] text-[#102650]/50">
            05
          </span>
        </div>
      </div>
    </section>
  );
}

/* =========================================================
   STEP SLIDE
============================================================= */

function StepSlide({
  step,
  onNext,
  isLast,
}: {
  step: (typeof STEPS)[number];
  onNext: () => void;
  isLast: boolean;
}) {
  return (
    <div className="min-w-0 shrink-0 basis-full pl-3">
      <div className="grid h-full min-h-[340px] sm:min-h-[360px] lg:min-h-[320px] bg-white lg:grid-cols-[0.75fr_1.25fr]">

        {/* Number + title */}

        <div className="flex flex-col justify-center bg-[#102650] px-8 py-10 text-white sm:px-12">
          <span className="font-display text-6xl leading-none text-[#c89a4b]">
            {step.number}
          </span>

          <h3 className="mt-5 max-w-sm font-display text-3xl leading-tight sm:text-4xl">
            {step.title}
          </h3>
        </div>

        {/* Content */}

        <div className="flex flex-col justify-between px-8 py-10 sm:px-12">
          <div>
            <p className="max-w-lg text-sm leading-7 text-[#102650]/80 sm:text-base">
              {step.description}
            </p>

            <div className="mt-6 max-w-lg space-y-3">
              {step.points.map((point) => (
                <StylePoint key={point}>{point}</StylePoint>
              ))}
            </div>
          </div>

          <div>
            {!isLast && <NextStepButton onClick={onNext} />}
          </div>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   NEXT STEP BUTTON
============================================================= */

function NextStepButton({
  onClick,
}: {
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="
        group
        mt-6
        inline-flex
        w-fit
        items-center
        gap-2.5
        border-b-2
        border-[#102650]/20
        pb-2
        text-[10px]
        font-semibold
        uppercase
        tracking-[0.22em]
        text-[#102650]
        transition-colors
        hover:border-[#c89a4b]
      "
    >
      Next step

      <ArrowRight
        className="size-3.5 text-[#c89a4b] transition-transform duration-300 group-hover:translate-x-1"
        strokeWidth={1.5}
      />
    </button>
  );
}

/* =========================================================
   STYLE POINT
============================================================= */

function StylePoint({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-[9px] size-1.5 shrink-0 rounded-full bg-[#c89a4b]" />

      <p className="text-sm leading-6 text-[#102650]/80 sm:text-base">
        {children}
      </p>
    </div>
  );
}