import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Check,
  ChevronDown,
  CreditCard,
  Lock,
  Plus,
  Tag,
} from "lucide-react";
import { toast } from "sonner";

import { formatINR } from "@/lib/utils";
import { useStore, type Address } from "@/lib/store";
import { useAuth } from "@/context/auth-context";
import {
  useAddresses,
  useCreateAddress,
  useCheckout,
  useCreatePayment,
  useVerifyPayment,
  checkShippingServiceability,
} from "@/hooks/use-api";
import { AuthDialog } from "@/components/auth-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

const RAZORPAY_SCRIPT =
  "https://checkout.razorpay.com/v1/checkout.js";

function loadRazorpay() {
  if (window.Razorpay) return Promise.resolve();

  return new Promise<void>((resolve, reject) => {
    const existing =
      document.querySelector<HTMLScriptElement>(
        `script[src="${RAZORPAY_SCRIPT}"]`,
      );

    if (existing) {
      existing.addEventListener(
        "load",
        () => resolve(),
        { once: true },
      );
      existing.addEventListener(
        "error",
        () =>
          reject(
            new Error(
              "Unable to load payment gateway",
            ),
          ),
        { once: true },
      );
      return;
    }

    const script = document.createElement("script");
    script.src = RAZORPAY_SCRIPT;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () =>
      reject(
        new Error(
          "Unable to load payment gateway",
        ),
      );

    document.body.appendChild(script);
  });
}

export default function CheckoutPage() {
  const { lines } = useStore();
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [authOpen, setAuthOpen] = useState(false);
  const [adding, setAdding] = useState(false);
  const [selectedAddressId, setSelectedAddressId] =
    useState("");
  const [couponCode, setCouponCode] = useState("");
  const [couponError, setCouponError] = useState("");
  const [placing, setPlacing] = useState(false);

  const {
    data: addresses = [],
    isLoading: addressesLoading,
  } = useAddresses();

  const createAddressMutation =
    useCreateAddress();

  const checkoutMutation = useCheckout();
  const createPaymentMutation = useCreatePayment();
  const verifyPaymentMutation = useVerifyPayment();

  useEffect(() => {
    if (!selectedAddressId) {
      setSelectedAddressId(
        addresses.find((address) => address.isDefault)
          ?.id ||
        addresses[0]?.id ||
        "",
      );
    }
  }, [addresses, selectedAddressId]);

  // Calculate the complete checkout total as soon as a delivery address
  // is selected. Tax and shipping are returned by the backend.
  useEffect(() => {
    if (!selectedAddressId || lines.length === 0) return;

    checkoutMutation.reset();

    void checkoutMutation
      .mutateAsync({
        addressId: selectedAddressId,
      })
      .catch((error) => {
        toast.error(
          error instanceof Error
            ? error.message
            : "Unable to calculate checkout total",
        );
      });
  }, [selectedAddressId]);

  const activeAddress = useMemo(
    () =>
      addresses.find(
        (address) =>
          address.id === selectedAddressId,
      ),
    [addresses, selectedAddressId],
  );

  if (!isAuthenticated) {
    return (
      <main className="bg-white">
        <div className="mx-auto max-w-2xl px-6 py-28 text-center sm:py-36">
          <div className="mx-auto flex size-16 items-center justify-center rounded-full border border-[#c89a4b]/25 bg-[#fdf7f4]">
            <Lock className="size-5 text-[#c89a4b]" />
          </div>

          <p className="mt-7 text-[9px] font-medium uppercase tracking-[0.3em] text-[#c89a4b]">
            Secure checkout
          </p>

          <h1 className="mt-3 font-display text-4xl text-[#102650] sm:text-5xl">
            Sign in to checkout
          </h1>

          <p className="mx-auto mt-5 max-w-md text-sm leading-7 text-[#102650]/60">
            Your bag and delivery details are securely
            tied to your Grandeur account.
          </p>

          <Button
            onClick={() => setAuthOpen(true)}
            className="mt-8 h-12 rounded-none bg-[#102650] px-8 text-[10px] uppercase tracking-[0.2em] text-white hover:bg-[#18325f]"
          >
            Sign in / Register
          </Button>

          <AuthDialog
            open={authOpen}
            onOpenChange={setAuthOpen}
          />
        </div>
      </main>
    );
  }

  if (lines.length === 0) {
    return (
      <main className="bg-white">
        <div className="mx-auto max-w-2xl px-6 py-28 text-center">
          <p className="text-[9px] font-medium uppercase tracking-[0.3em] text-[#c89a4b]">
            Checkout
          </p>

          <h1 className="mt-3 font-display text-4xl text-[#102650]">
            Nothing to check out
          </h1>

          <Link
            to="/products"
            className="mt-7 inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-[#102650]/60"
          >
            Browse jewellery
            <ArrowRight className="size-3 text-[#c89a4b]" />
          </Link>
        </div>
      </main>
    );
  }

  const preview = checkoutMutation.data;
  const total = Number(preview?.total ?? 0);

  const previewCheckout = async () => {
    if (!selectedAddressId) {
      toast.error("Please select a delivery address");
      return;
    }

    setCouponError("");

    try {
      await checkoutMutation.mutateAsync({
        addressId: selectedAddressId,
        ...(couponCode.trim()
          ? { couponCode: couponCode.trim() }
          : {}),
      });

      toast.success(
        couponCode.trim()
          ? "Order total updated"
          : "Order total calculated",
      );
    } catch (error) {
      if (
        couponCode.trim() &&
        error instanceof Error &&
        /coupon/i.test(error.message)
      ) {
        setCouponError("Coupon is not valid or active.");
      }
      toast.error(
        error instanceof Error
          ? error.message
          : "Unable to calculate checkout total",
      );
    }
  };

  const pay = async () => {
    if (!selectedAddressId) {
      toast.error("Please select a delivery address");
      return;
    }

    setPlacing(true);

    try {
      const payment =
        await createPaymentMutation.mutateAsync({
          addressId: selectedAddressId,
          ...(couponCode.trim()
            ? { couponCode: couponCode.trim() }
            : {}),
        });

      if (
        payment.provider !== "RAZORPAY" ||
        !payment.key
      ) {
        throw new Error(
          "The configured payment provider is not available in this storefront.",
        );
      }

      await loadRazorpay();

      if (!window.Razorpay) {
        throw new Error(
          "Payment gateway is unavailable.",
        );
      }

      const gateway = new window.Razorpay({
        key: payment.key,
        amount: Math.round(
          Number(payment.amount) * 100,
        ),
        currency: payment.currency,
        name: "Grandeur India",
        description:
          "Grandeur India jewellery purchase",
        order_id: payment.providerOrderId,
        prefill: activeAddress
          ? {
            name: activeAddress.fullName,
            contact: activeAddress.phone,
            email: user?.email,
          }
          : undefined,
        theme: {
          color: "#102650",
        },
        handler: async (response) => {
          try {
            const order =
              await verifyPaymentMutation.mutateAsync(
                {
                  providerOrderId:
                    response.razorpay_order_id,
                  providerPaymentId:
                    response.razorpay_payment_id,
                  signature:
                    response.razorpay_signature,
                },
              );

            navigate(
              `/order-success?id=${encodeURIComponent(
                order.orderNumber,
              )}`,
              { replace: true },
            );
          } catch (error) {
            toast.error(
              error instanceof Error
                ? error.message
                : "Payment verification failed",
            );
          } finally {
            setPlacing(false);
          }
        },
        modal: {
          ondismiss: () => setPlacing(false),
        },
      });

      gateway.on("payment.failed", (response) => {
        setPlacing(false);
        toast.error(response.error?.description ?? "Payment was declined. Please try again.");
      });

      gateway.open();
    } catch (error) {
      setPlacing(false);

      toast.error(
        error instanceof Error
          ? error.message
          : "Unable to start payment",
      );
    }
  };

  return (
    <main className="bg-white">
      {/* Header */}
      <section className="mx-auto max-w-7xl px-5 pb-8 pt-12 sm:px-8 sm:pt-16 lg:px-12">
        <p className="text-[9px] font-medium uppercase tracking-[0.3em] text-[#c89a4b]">
          Grandeur
        </p>

        <div className="mt-3 flex items-end justify-between gap-6">
          <div>
            <h1 className="font-display text-4xl text-[#102650] sm:text-5xl">
              Checkout
            </h1>

            <div className="mt-4 h-px w-12 bg-[#c89a4b]/60" />
          </div>

          <div className="hidden items-center gap-3 text-[9px] uppercase tracking-[0.16em] text-[#102650]/35 sm:flex">
            <span className="text-[#c89a4b]">
              Bag
            </span>
            <ArrowRight className="size-3" />
            <span className="text-[#102650]">
              Checkout
            </span>
            <ArrowRight className="size-3" />
            <span>Payment</span>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 pb-20 sm:px-8 lg:px-12">
        <div className="grid items-start gap-12 lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-20">
          <div className="space-y-10">
            {/* DELIVERY */}
            <section>
              <CheckoutSectionHeader
                number="01"
                title="Delivery address"
                detail={`${addresses.length} saved`}
              />

              <div className="mt-6">
                {addressesLoading ? (
                  <p className="py-5 text-sm text-[#102650]/50">
                    Loading addresses…
                  </p>
                ) : addresses.length === 0 ? (
                  <div className="border border-dashed border-[#102650]/15 px-5 py-8 text-center">
                    <p className="text-sm text-[#102650]/55">
                      Add a delivery address to continue.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {addresses.map((address) => (
                      <label
                        key={address.id}
                        className={`block cursor-pointer border p-5 transition-colors ${selectedAddressId ===
                          address.id
                          ? "border-[#102650] bg-[#fdf7f4]"
                          : "border-[#102650]/10 hover:border-[#102650]/25"
                          }`}
                      >
                        <input
                          type="radio"
                          name="address"
                          value={address.id}
                          checked={
                            selectedAddressId ===
                            address.id
                          }
                          onChange={() => {
                            setSelectedAddressId(
                              address.id,
                            );
                            checkoutMutation.reset();
                          }}
                          className="sr-only"
                        />

                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-start gap-3">
                            <span
                              className={`mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full border ${selectedAddressId ===
                                address.id
                                ? "border-[#102650]"
                                : "border-[#102650]/25"
                                }`}
                            >
                              {selectedAddressId ===
                                address.id && (
                                  <span className="size-2 rounded-full bg-[#c89a4b]" />
                                )}
                            </span>

                            <div>
                              <p className="text-sm font-medium text-[#102650]">
                                {address.fullName}
                              </p>

                              <p className="mt-1.5 max-w-xl text-sm leading-6 text-[#102650]/55">
                                {address.addressLine1}
                                {address.addressLine2
                                  ? `, ${address.addressLine2}`
                                  : ""}
                                , {address.city},{" "}
                                {address.state} —{" "}
                                {address.postalCode}
                              </p>

                              <p className="mt-1 text-xs text-[#102650]/45">
                                {address.phone} · {address.country}
                              </p>
                            </div>
                          </div>

                          {address.isDefault && (
                            <span className="shrink-0 text-[8px] font-medium uppercase tracking-[0.18em] text-[#c89a4b]">
                              Default
                            </span>
                          )}
                        </div>
                      </label>
                    ))}
                  </div>
                )}

                {adding ? (
                  <AddressForm
                    onCancel={() => setAdding(false)}
                    onSave={async (address) => {
                      try {
                        const created =
                          await createAddressMutation.mutateAsync(
                            {
                              fullName: address.name,
                              phone: address.phone,
                              addressLine1:
                                address.line1,
                              city: address.city,
                              state: address.state,
                              country: address.country,
                              postalCode:
                                address.pincode,
                              isDefault:
                                address.isDefault,
                            },
                          );

                        setSelectedAddressId(
                          created.id,
                        );
                        setAdding(false);
                        checkoutMutation.reset();

                        toast.success(
                          "Address saved",
                        );
                      } catch (error) {
                        toast.error(
                          error instanceof Error
                            ? error.message
                            : "Unable to save address",
                        );
                      }
                    }}
                  />
                ) : (
                  <button
                    type="button"
                    onClick={() => setAdding(true)}
                    className="mt-5 flex items-center gap-2 text-[9px] font-medium uppercase tracking-[0.19em] text-[#102650]/60 transition-colors hover:text-[#102650]"
                  >
                    <Plus className="size-3.5 text-[#c89a4b]" />
                    Add another address
                  </button>
                )}
              </div>
            </section>

            {/* PROMO + TOTAL */}
            <section>
              <CheckoutSectionHeader
                number="02"
                title="Order total"
                detail="Secure pricing"
              />

              <div className="mt-6 border border-[#102650]/10 bg-[#fffdfb]">
                <div className="p-5 sm:p-6">
                  <label
                    htmlFor="checkout-coupon"
                    className="flex items-center gap-2 text-[9px] font-medium uppercase tracking-[0.2em] text-[#102650]/50"
                  >
                    <Tag className="size-3 text-[#c89a4b]" />
                    Promo code
                  </label>

                  <p className="mt-1.5 text-xs leading-5 text-[#102650]/40">
                    Enter a promo code if you have one.
                    Your final tax and shipping are calculated
                    automatically after address selection.
                  </p>

                  <div className="mt-4 flex">
                    <Input
                      id="checkout-coupon"
                      value={couponCode}
                      onChange={(event) => {
                        setCouponCode(
                          event.target.value.toUpperCase(),
                        );
                        setCouponError("");
                        checkoutMutation.reset();
                      }}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          event.preventDefault();
                          void previewCheckout();
                        }
                      }}
                      placeholder="ENTER CODE"
                      autoComplete="off"
                      className="h-11 min-w-0 rounded-none border-[#102650]/15 bg-white text-xs uppercase tracking-[0.08em] placeholder:text-[#102650]/25 focus-visible:ring-0 focus-visible:ring-offset-0"
                    />

                    <Button
                      type="button"
                      onClick={previewCheckout}
                      disabled={
                        !selectedAddressId ||
                        checkoutMutation.isPending
                      }
                      className="h-11 rounded-none bg-[#102650] px-5 text-[9px] uppercase tracking-[0.17em] text-white hover:bg-[#18325f]"
                    >
                      {checkoutMutation.isPending
                        ? "Checking…"
                        : "Apply"}
                    </Button>
                  </div>

                  {couponError && (
                    <p className="mt-2 text-xs text-red-600" role="alert">
                      {couponError}
                    </p>
                  )}
                </div>

                {preview && (
                  <div className="border-t border-[#102650]/10 px-5 py-6 sm:px-6">
                    <dl className="space-y-4">
                      <SummaryRow
                        label="Subtotal"
                        value={formatINR(
                          Number(preview.subtotal),
                        )}
                      />

                      <SummaryRow
                        label="Discount"
                        value={
                          Number(preview.discount) > 0
                            ? `−${formatINR(
                              Number(
                                preview.discount,
                              ),
                            )}`
                            : "—"
                        }
                        accent={
                          Number(preview.discount) > 0
                        }
                      />

                      <SummaryRow
                        label="Tax"
                        value={formatINR(
                          Number(preview.tax),
                        )}
                      />

                      <SummaryRow
                        label="Shipping"
                        value={
                          Number(preview.shipping)
                            ? formatINR(
                              Number(
                                preview.shipping,
                              ),
                            )
                            : "Free"
                        }
                      />

                      <div className="border-t border-[#102650]/10 pt-5">
                        <div className="flex items-end justify-between gap-5">
                          <span className="font-display text-xl text-[#102650]">
                            Total
                          </span>

                          <span className="font-display text-2xl text-[#102650]">
                            {formatINR(total)}
                          </span>
                        </div>
                      </div>
                    </dl>
                  </div>
                )}

                {!preview && (
                  <div className="border-t border-[#102650]/10 px-5 py-5 sm:px-6">
                    <p className="text-xs leading-5 text-[#102650]/40">
                      Select a delivery address to calculate
                      your tax, shipping, and final total.
                    </p>
                  </div>
                )}
              </div>
            </section>

            {/* PAYMENT */}
            <section>
              <CheckoutSectionHeader
                number="03"
                title="Payment"
                detail="Razorpay"
              />

              <div className="mt-6 border border-[#102650]/10 p-5 sm:p-6">
                <div className="flex items-start gap-4">
                  <div className="flex size-10 shrink-0 items-center justify-center bg-[#fdf7f4]">
                    <CreditCard className="size-4 text-[#c89a4b]" />
                  </div>

                  <div>
                    <p className="text-sm font-medium text-[#102650]">
                      Secure online payment
                    </p>

                    <p className="mt-1 text-xs leading-5 text-[#102650]/45">
                      Your payment is processed securely
                      through Razorpay. The order is
                      created only after payment
                      verification.
                    </p>
                  </div>
                </div>

                <Button
                  type="button"
                  onClick={pay}
                  disabled={
                    !selectedAddressId ||
                    !preview ||
                    placing ||
                    addresses.length === 0
                  }
                  className="mt-7 h-14 w-full rounded-none bg-[#102650] text-[10px] uppercase tracking-[0.22em] text-white hover:bg-[#18325f]"
                >
                  {placing ? (
                    "Opening secure payment…"
                  ) : (
                    <>
                      <Lock className="mr-2 size-3.5" />
                      Pay securely
                      {preview
                        ? ` · ${formatINR(total)}`
                        : ""}
                      <ArrowRight className="ml-1 size-3.5" />
                    </>
                  )}
                </Button>
              </div>
            </section>
          </div>

          {/* BAG SUMMARY */}
          <aside className="h-fit lg:sticky lg:top-36">
            <div className="border border-[#102650]/10 bg-[#fffdfb]">
              <div className="border-b border-[#102650]/10 px-6 py-5">
                <p className="text-[9px] font-medium uppercase tracking-[0.28em] text-[#c89a4b]">
                  Your selection
                </p>

                <h2 className="mt-2 font-display text-2xl text-[#102650]">
                  Your Bag
                </h2>
              </div>

              <ul className="divide-y divide-[#102650]/10 px-6">
                {lines.map(({ product, qty }) => (
                  <li
                    key={product.id}
                    className="flex gap-4 py-5"
                  >
                    <Link
                      to={`/product/${product.id}`}
                      className="size-[72px] shrink-0 overflow-hidden bg-[#fdf0ef]"
                    >
                      {product.images?.[0]?.url ? (
                        <img
                          src={product.images[0].url}
                          alt=""
                          className="size-full object-cover"
                        />
                      ) : (
                        <div className="size-full bg-[#fdf0ef]" />
                      )}
                    </Link>

                    <div className="min-w-0 flex-1">
                      <p className="truncate font-display text-base text-[#102650]">
                        {product.name}
                      </p>

                      <p className="mt-1 text-[10px] uppercase tracking-[0.12em] text-[#102650]/40">
                        Qty {qty}
                      </p>
                    </div>

                    <span className="font-display text-sm text-[#102650]">
                      {formatINR(
                        Number(product.price) * qty,
                      )}
                    </span>
                  </li>
                ))}
              </ul>

              <div className="border-t border-[#102650]/10 px-6 py-5">
                <SummaryRow
                  label="Cart subtotal"
                  value={formatINR(
                    lines.reduce(
                      (sum, line) =>
                        sum +
                        Number(line.product.price) *
                        line.qty,
                      0,
                    ),
                  )}
                />

                <p className="mt-4 flex items-center gap-2 text-[9px] leading-4 text-[#102650]/40">
                  <Check className="size-3 text-[#c89a4b]" />
                  Final pricing is validated securely by
                  the backend.
                </p>
              </div>
            </div>

            <Link
              to="/cart"
              className="group mt-5 flex items-center justify-center gap-2 text-[9px] uppercase tracking-[0.18em] text-[#102650]/50 transition-colors hover:text-[#102650]"
            >
              Return to bag
              <ArrowRight className="size-3 rotate-180 text-[#c89a4b]" />
            </Link>
          </aside>
        </div>
      </section>
    </main>
  );
}

function CheckoutSectionHeader({
  number,
  title,
  detail,
}: {
  number: string;
  title: string;
  detail: string;
}) {
  return (
    <div className="flex items-end justify-between gap-5 border-b border-[#102650]/10 pb-4">
      <div className="flex items-center gap-4">
        <span className="text-[9px] font-medium tracking-[0.2em] text-[#c89a4b]">
          {number}
        </span>

        <h2 className="font-display text-2xl text-[#102650]">
          {title}
        </h2>
      </div>

      <span className="hidden text-[8px] uppercase tracking-[0.17em] text-[#102650]/35 sm:block">
        {detail}
      </span>
    </div>
  );
}

function SummaryRow({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-5">
      <dt
        className={
          accent
            ? "text-xs text-[#c89a4b]"
            : "text-xs text-[#102650]/55"
        }
      >
        {label}
      </dt>

      <dd
        className={
          accent
            ? "text-xs text-[#c89a4b]"
            : "text-xs text-[#102650]"
        }
      >
        {value}
      </dd>
    </div>
  );
}

export function AddressForm({
  initial,
  onSave,
  onCancel,
}: {
  initial?: Address;
  onSave: (
    address: Address,
  ) => void | Promise<void>;
  onCancel: () => void;
}) {
  const [form, setForm] = useState<Address>(
    initial ?? {
      id: "",
      label: "Address",
      name: "",
      phone: "",
      line1: "",
      city: "",
      state: "",
      pincode: "",
      country: "India",
      isDefault: false,
    },
  );
  const [serviceability, setServiceability] = useState<{
    loading: boolean;
    serviceable: boolean | null;
    message: string;
  }>({ loading: false, serviceable: null, message: "" });

  useEffect(() => {
    if (form.country !== "India" || !/^\d{6}$/.test(form.pincode)) {
      setServiceability({ loading: false, serviceable: null, message: "" });
      return;
    }

    let cancelled = false;
    setServiceability({ loading: true, serviceable: null, message: "Checking Delhivery serviceability..." });
    void checkShippingServiceability(form.pincode)
      .then((result) => {
        if (cancelled) return;
        setServiceability({
          loading: false,
          serviceable: result.isServiceable,
          message: result.remarks ?? (result.isServiceable ? "Delhivery Express delivery available" : "Pincode is not serviceable"),
        });
      })
      .catch(() => {
        if (!cancelled) {
          setServiceability({ loading: false, serviceable: false, message: "Unable to check Delhivery serviceability" });
        }
      });

    return () => { cancelled = true; };
  }, [form.country, form.pincode]);

  const set =
    (key: keyof Address) =>
      (
        event: React.ChangeEvent<HTMLInputElement>,
      ) =>
        setForm((current) => ({
          ...current,
          [key]: event.target.value,
        }));

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        void onSave(form);
      }}
      className="mt-6 grid gap-4 border border-[#102650]/10 bg-[#fffdfb] p-5 sm:grid-cols-2"
    >
      <TextField
        label="Full name"
        value={form.name}
        onChange={set("name")}
        required
      />

      <label className="text-xs text-[#102650]/60">
        Country
        <select
          className="mt-2 h-11 w-full border border-[#102650]/15 bg-white px-3 text-sm outline-none focus:border-[#102650]"
          value={form.country}
          onChange={(event) =>
            setForm((current) => ({ ...current, country: event.target.value }))
          }
        >
          {['India', 'United States', 'United Kingdom', 'United Arab Emirates', 'Canada', 'Australia', 'Singapore', 'Germany', 'France'].map((country) => (
            <option key={country}>{country}</option>
          ))}
        </select>
      </label>

      <TextField
        label="Phone"
        value={form.phone}
        onChange={set("phone")}
        required
        inputMode="tel"
        pattern={form.country === "India" ? "[6-9][0-9]{9}" : "\\+?[0-9\\s\\-()]{7,20}"}
      />

      <TextField
        label="Pincode"
        value={form.pincode}
        onChange={set("pincode")}
        required
        inputMode={form.country === "India" ? "numeric" : "text"}
        pattern={form.country === "India" ? "[0-9]{6}" : "[A-Za-z0-9\\s\\-]{3,12}"}
      />

      {form.country === "India" && serviceability.message && (
        <p className={`text-xs sm:col-span-2 ${serviceability.serviceable ? "text-emerald-700" : "text-red-600"}`}>
          {serviceability.loading ? serviceability.message : `${serviceability.serviceable ? "✓ " : ""}${serviceability.message}`}
        </p>
      )}
      {form.country !== "India" && (
        <p className="text-xs text-blue-700 sm:col-span-2">International Express Shipping</p>
      )}

      <TextField
        label="Address"
        value={form.line1}
        onChange={set("line1")}
        required
        className="sm:col-span-2"
      />

      <TextField
        label="City"
        value={form.city}
        onChange={set("city")}
        required
      />

      <TextField
        label="State"
        value={form.state}
        onChange={set("state")}
        required
      />

      <label className="flex items-center gap-2 text-xs text-[#102650]/60 sm:col-span-2">
        <input
          type="checkbox"
          checked={form.isDefault}
          onChange={(event) =>
            setForm((current) => ({
              ...current,
              isDefault:
                event.target.checked,
            }))
          }
        />
        Make this the default address
      </label>

      <div className="flex gap-3 sm:col-span-2">
        <Button
          type="submit"
          className="h-11 rounded-none bg-[#102650] px-6 text-[9px] uppercase tracking-[0.18em] text-white hover:bg-[#18325f]"
        >
          Save address
        </Button>

        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          className="h-11 rounded-none border-[#102650]/15 text-[9px] uppercase tracking-[0.18em]"
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}

function TextField({
  label,
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & {
  label: string;
}) {
  return (
    <div className={className}>
      <Label className="text-[9px] uppercase tracking-[0.16em] text-[#102650]/50">
        {label}
      </Label>

      <Input
        {...props}
        className="mt-2 h-11 rounded-none border-[#102650]/15 bg-white text-sm focus-visible:ring-0 focus-visible:ring-offset-0"
      />
    </div>
  );
}