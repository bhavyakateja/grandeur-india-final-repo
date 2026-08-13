import { Link, useParams } from "react-router-dom";
import { ProductBrowser } from "@/components/product-browser";
import { useCategories } from "@/hooks/use-api";

export default function CategoryPage() {
  const { slug = "" } = useParams();
  const { data: categories = [], isLoading, isError, refetch } = useCategories();
  const category = categories.find((item) => item.slug === slug);

  if (isLoading) return <div className="mx-auto max-w-7xl px-4 py-32 text-center"><p className="eyebrow text-gold">Loading collection…</p></div>;
  if (isError) return <div className="mx-auto max-w-7xl px-4 py-32 text-center"><h1 className="font-display text-4xl">Unable to load this collection</h1><button onClick={() => void refetch()} className="mt-5 text-xs uppercase tracking-[0.2em] text-gold">Try again</button></div>;
  if (!category || !category.isActive) return <div className="mx-auto max-w-7xl px-4 py-32 text-center"><h1 className="font-display text-4xl">Collection not found</h1><Link to="/products" className="mt-5 inline-block text-xs uppercase tracking-[0.2em] text-gold">Browse jewellery</Link></div>;

  return <>
    <section className="bg-gradient-blush"><div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8"><p className="eyebrow text-gold">Collection</p><h1 className="mt-3 font-display text-4xl sm:text-5xl">{category.name}</h1><div className="gold-rule mt-4" /></div></section>
    <ProductBrowser lockedCategory={category.slug} title={category.name} />
  </>;
}
