import { Link, useSearchParams } from "react-router-dom";
import { Check, Package } from "lucide-react";



function OrderSuccess() {
  const [searchParams] = useSearchParams();
  const id = searchParams.get("id");
  return (
    <div className="mx-auto max-w-xl px-6 py-24 text-center">
      <div className="mx-auto grid size-16 animate-float-soft place-items-center rounded-full bg-gradient-blush">
        <Check className="size-7 text-navy" />
      </div>
      <h1 className="mt-8 font-display text-4xl">Thank you for your order</h1>
      <div className="gold-rule mx-auto mt-4" />
      <p className="mt-5 text-sm leading-relaxed text-muted-foreground">
        {id ? <>Order <span className="text-navy">{id}</span> has been confirmed after successful payment.</> : <>Your payment was completed successfully and your order is being processed.</>}
      </p>
      <div className="mt-9 flex flex-wrap justify-center gap-3">
        <Link to="/profile" className="flex items-center gap-2 rounded-sm bg-navy px-8 py-4 text-[11px] tracking-[0.22em] text-navy-foreground uppercase">
          <Package className="size-4" /> Track order
        </Link>
        <Link to="/products" className="rounded-sm border border-navy/25 px-8 py-4 text-[11px] tracking-[0.22em] text-navy uppercase">
          Continue shopping
        </Link>
      </div>
    </div>
  );
}

export default OrderSuccess;
