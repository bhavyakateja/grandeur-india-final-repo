import craft from "@/assets/craft.jpg";
import bridal from "@/assets/bridal-banner.jpg";

export default function AboutPage() {
  return <div>
    <section className="bg-gradient-blush py-16"><div className="mx-auto max-w-3xl px-6 text-center"><p className="eyebrow text-gold">Grandeur India</p><h1 className="mt-4 font-display text-4xl sm:text-5xl">Jewellery with a sense of occasion</h1><div className="gold-rule mx-auto mt-5" /><p className="mt-6 text-sm leading-relaxed text-navy/70">Discover a contemporary jewellery collection presented through a refined Indian lens. Browse live product availability, pricing and product details directly from our catalogue.</p></div></section>
    <section className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-20 sm:px-6 md:grid-cols-2 lg:px-8"><img src={craft} alt="Jewellery craftsmanship" loading="lazy" width={1200} height={900} className="rounded-sm object-cover shadow-luxe" /><div><h2 className="font-display text-3xl">The craft</h2><div className="gold-rule mt-3" /><p className="mt-5 text-sm leading-relaxed text-muted-foreground">Our visual identity brings together Indian heritage, contemporary silhouettes and an emphasis on detail. Product-specific materials, specifications and availability are shown from the live catalogue rather than inferred by the storefront.</p></div></section>
    <section className="relative"><img src={bridal} alt="Bridal jewellery styling" loading="lazy" width={1600} height={900} className="h-[420px] w-full object-cover" /><div className="absolute inset-0 grid place-items-center bg-navy/45 px-6 text-center"><div><h2 className="font-display text-4xl text-navy-foreground">For your defining moments</h2><p className="mx-auto mt-4 max-w-lg text-sm text-navy-foreground/80">Explore the collection for bridal occasions, celebrations and everyday signatures.</p></div></div></section>
  </div>;
}
