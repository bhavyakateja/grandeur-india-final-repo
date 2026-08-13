import { useSearchParams } from "react-router-dom";
import { ProductBrowser } from "@/components/product-browser";

type Search = { occasion?: string };

function ProductsPage() {
  const [searchParams] = useSearchParams();
  const occasion = searchParams.get("occasion") || undefined;
  return (
    <ProductBrowser
      {...(occasion ? { initialOccasion: occasion, title: `${occasion} Jewellery` } : {})}
    />
  );
}

export default ProductsPage;
