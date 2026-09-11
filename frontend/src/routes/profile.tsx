import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  MapPin,
  Package,
  Pencil,
  Trash2,
  User,
  LogOut,
  FileDown,
  ArrowRight,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";

import { formatINR } from "@/lib/utils";
import { useStore, type Address } from "@/lib/store";
import {
  useCreateAddress,
  useUpdateAddress,
  useDeleteAddress,
} from "@/hooks/use-api";
import { useAuth } from "@/context/auth-context";
import { AuthDialog } from "@/components/auth-dialog";
import { AddressForm } from "@/routes/checkout";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { getApiBaseUrl, getAccessToken } from "@/lib/api";

function ProfilePage() {
  const { user, isAuthenticated, logout } = useAuth();
  const { addresses, orders } = useStore();

  const createAddressMutation = useCreateAddressMutation();
  const updateAddressMutation = useUpdateAddressMutation();
  const deleteAddressMutation = useDeleteAddressMutation();

  const [editing, setEditing] = useState<Address | "new" | null>(null);
  const [authOpen, setAuthOpen] = useState(false);

  const navigate = useNavigate();

  if (!isAuthenticated) {
    return (
      <main className="min-h-[70vh] bg-white">
        <div className="mx-auto max-w-xl px-6 py-28 text-center">
          <div className="mx-auto grid size-14 place-items-center rounded-full border border-[#c89a4b]/30 bg-[#fdf0ef]">
            <User className="size-5 text-[#102650]" strokeWidth={1.3} />
          </div>

          <p className="mt-7 text-[9px] font-medium uppercase tracking-[0.4em] text-[#c89a4b]">
            Grandeur
          </p>

          <h1 className="mt-3 font-display text-4xl text-[#102650]">
            Sign in to your account
          </h1>

          <p className="mx-auto mt-4 max-w-md text-sm leading-7 text-[#102650]/60">
            Access your orders, saved addresses, and your Grandeur account.
          </p>

          <Button
            onClick={() => setAuthOpen(true)}
            className="mt-8 h-12 rounded-none bg-[#102650] px-8 text-[10px] font-medium uppercase tracking-[0.22em] text-white hover:bg-[#172f5d]"
          >
            Sign In / Register
          </Button>

          <AuthDialog open={authOpen} onOpenChange={setAuthOpen} />
        </div>
      </main>
    );
  }

  const handleSignOut = async () => {
    await logout();
    toast.success("Signed out successfully");
    navigate("/");
  };

  const downloadInvoice = async (
    orderId: string,
    orderNumber: string,
  ) => {
    try {
      const token = getAccessToken();
      const headers = new Headers();

      if (token) {
        headers.set("Authorization", `Bearer ${token}`);
      }

      const res = await fetch(
        `${getApiBaseUrl()}/invoice/${orderId}`,
        {
          headers,
          credentials: "include",
        },
      );

      if (!res.ok) {
        throw new Error("Invoice not available yet.");
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = `invoice-${orderNumber}.pdf`;

      document.body.appendChild(a);
      a.click();
      a.remove();

      URL.revokeObjectURL(url);
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : "Failed to download invoice",
      );
    }
  };

  return (
    <main className="min-h-[70vh] bg-white">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12 lg:px-10 lg:py-16">
        {/* =========================================================
            ACCOUNT HEADER
        ========================================================= */}
        <section className="border-b border-[#102650]/10 pb-6 sm:pb-10">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
            <div className="flex min-w-0 items-center gap-4 sm:gap-5">
              <div className="grid size-12 sm:size-14 shrink-0 place-items-center rounded-full bg-[#102650]">
                <User
                  className="size-4 sm:size-5 text-white"
                  strokeWidth={1.2}
                />
              </div>

              <div className="min-w-0">
                <p className="mb-1 text-[8px] font-medium uppercase tracking-[0.35em] text-[#c89a4b]">
                  My Account
                </p>

                <h1 className="truncate font-display text-2xl sm:text-3xl lg:text-4xl text-[#102650]">
                  {user?.name}
                </h1>

                <p className="mt-1 truncate text-xs text-[#102650]/50">
                  {user?.email}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleSignOut}
              className="group self-start sm:self-center flex shrink-0 items-center gap-2 border-b border-[#102650]/20 pb-1.5 text-[9px] font-medium uppercase tracking-[0.2em] text-[#102650] transition-colors hover:border-[#c89a4b] hover:text-[#c89a4b]"
            >
              <LogOut
                className="size-3.5"
                strokeWidth={1.3}
              />
              Sign out
            </button>
          </div>
        </section>

        {/* =========================================================
            ACCOUNT CONTENT
        ========================================================= */}
        <Tabs defaultValue="orders" className="mt-8 sm:mt-10">
          <TabsList className="grid h-auto w-full grid-cols-2 gap-0 rounded-none bg-transparent p-0">
            <TabsTrigger
              value="orders"
              className="
                relative h-12 rounded-none border-0 bg-transparent
                px-2 sm:px-4 text-[8.5px] sm:text-[10px] font-medium uppercase tracking-[0.08em] sm:tracking-[0.2em]
                text-[#102650]/45
                shadow-none
                transition-colors
                hover:text-[#102650]
                data-[state=active]:bg-transparent
                data-[state=active]:text-[#102650]
                data-[state=active]:shadow-none
                after:absolute after:inset-x-0 after:bottom-[-1px]
                after:h-px after:bg-[#c89a4b]
                after:opacity-0
                data-[state=active]:after:opacity-100
              "
            >
              <span className="flex items-center justify-center gap-1.5 sm:gap-2">
                <Package
                  className="size-3.5 shrink-0"
                  strokeWidth={1.2}
                />
                <span className="truncate">Previous Orders</span>
              </span>
            </TabsTrigger>

            <TabsTrigger
              value="addresses"
              className="
                relative h-12 rounded-none border-0 bg-transparent
                px-2 sm:px-4 text-[8.5px] sm:text-[10px] font-medium uppercase tracking-[0.08em] sm:tracking-[0.2em]
                text-[#102650]/45
                shadow-none
                transition-colors
                hover:text-[#102650]
                data-[state=active]:bg-transparent
                data-[state=active]:text-[#102650]
                data-[state=active]:shadow-none
                after:absolute after:inset-x-0 after:bottom-[-1px]
                after:h-px after:bg-[#c89a4b]
                after:opacity-0
                data-[state=active]:after:opacity-100
              "
            >
              <span className="flex items-center justify-center gap-1.5 sm:gap-2">
                <MapPin
                  className="size-3.5 shrink-0"
                  strokeWidth={1.2}
                />
                <span className="truncate">Saved Addresses</span>
              </span>
            </TabsTrigger>
          </TabsList>

          {/* =======================================================
              PREVIOUS ORDERS
          ======================================================= */}
          <TabsContent
            value="orders"
            className="mt-6 sm:mt-8 outline-none"
          >
            {orders.length === 0 ? (
              <div className="py-12 sm:py-16 text-center">
                <Package
                  className="mx-auto size-6 text-[#c89a4b]/70"
                  strokeWidth={1.1}
                />

                <h2 className="mt-5 font-display text-xl sm:text-2xl text-[#102650]">
                  No orders yet
                </h2>

                <p className="mt-2 text-sm text-[#102650]/50">
                  Your previous orders will appear here.
                </p>

                <Link
                  to="/products"
                  className="group mt-6 inline-flex items-center gap-2 border-b border-[#c89a4b]/60 pb-1.5 text-[9px] font-medium uppercase tracking-[0.2em] text-[#102650]"
                >
                  Explore Jewellery
                  <ArrowRight
                    className="size-3 text-[#c89a4b] transition-transform duration-300 group-hover:translate-x-1"
                    strokeWidth={1.2}
                  />
                </Link>
              </div>
            ) : (
              <div className="space-y-5">
                {orders.map((o) => (
                  <article
                    key={o.id}
                    className="border border-[#102650]/10 bg-white transition-shadow duration-300 hover:shadow-[0_12px_40px_rgba(16,38,80,0.06)]"
                  >
                    {/* Order header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#102650]/10 px-4 py-4 sm:px-6 sm:py-5">
                      <div>
                        <p className="font-display text-lg sm:text-xl text-[#102650]">
                          Order #{o.id}
                        </p>

                        <p className="mt-1 text-[9px] uppercase tracking-[0.16em] text-[#102650]/45">
                          Placed {o.date}
                        </p>
                      </div>

                      <span className="self-start sm:self-auto shrink-0 border border-[#c89a4b]/30 px-3 py-1.5 text-[8px] font-medium uppercase tracking-[0.16em] text-[#c89a4b]">
                        {o.status}
                      </span>
                    </div>

                    {/* Items */}
                    <ul className="divide-y divide-[#102650]/[0.07] px-4 sm:px-6">
                      {o.items.map((it) => (
                        <li
                          key={it.id}
                          className="flex items-center gap-4 py-4"
                        >
                          {it.image && (
                            <img
                              src={it.image}
                              alt=""
                              className="size-14 shrink-0 object-cover"
                            />
                          )}

                          <Link
                            to={`/product/${it.id}`}
                            className="min-w-0 flex-1 truncate text-sm text-[#102650] transition-colors hover:text-[#c89a4b]"
                          >
                            {it.name}
                          </Link>

                          <span className="shrink-0 text-[10px] uppercase tracking-[0.12em] text-[#102650]/40">
                            Qty {it.qty}
                          </span>
                        </li>
                      ))}
                    </ul>

                    {/* Order footer */}
                    <div className="flex flex-wrap items-center justify-between gap-4 border-t border-[#102650]/10 px-4 py-4 sm:px-6 sm:py-5">
                      <div>
                        <p className="text-[8px] uppercase tracking-[0.18em] text-[#102650]/40">
                          Order Total
                        </p>

                        <p className="mt-1 font-display text-lg sm:text-xl text-[#102650]">
                          {formatINR(o.total)}
                        </p>
                      </div>

                      {o.paymentStatus === "PAID" && (
                        <button
                          type="button"
                          onClick={() =>
                            void downloadInvoice(
                              o.orderId,
                              o.orderNumber,
                            )
                          }
                          className="group flex items-center gap-2 text-[9px] font-medium uppercase tracking-[0.16em] text-[#102650] transition-colors hover:text-[#c89a4b]"
                        >
                          <FileDown
                            className="size-3.5"
                            strokeWidth={1.2}
                          />
                          Download Invoice
                        </button>
                      )}
                      {o.waybill && o.trackingUrl && (
                        <a
                          href={o.trackingUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="group flex items-center gap-2 text-[9px] font-medium uppercase tracking-[0.16em] text-[#102650] transition-colors hover:text-[#c89a4b]"
                        >
                          <ExternalLink className="size-3.5" strokeWidth={1.2} />
                          Track {o.courier ?? "shipment"}
                        </a>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            )}
          </TabsContent>

          {/* =======================================================
              SAVED ADDRESSES
          ======================================================= */}
          <TabsContent
            value="addresses"
            className="mt-6 sm:mt-8 outline-none"
          >
            {editing ? (
              <div className="border border-[#102650]/10 p-4 sm:p-8">
                <div className="mb-7">
                  <p className="text-[8px] font-medium uppercase tracking-[0.3em] text-[#c89a4b]">
                    Address Book
                  </p>

                  <h2 className="mt-2 font-display text-xl sm:text-2xl text-[#102650]">
                    {editing === "new"
                      ? "Add a new address"
                      : "Edit your address"}
                  </h2>
                </div>

                <AddressForm
                  {...(editing !== "new"
                    ? { initial: editing }
                    : {})}
                  onCancel={() => setEditing(null)}
                  onSave={async (a) => {
                    try {
                      const payload = {
                        fullName: a.name,
                        phone: a.phone,
                        addressLine1: a.line1,
                        city: a.city,
                        state: a.state,
                        country: a.country,
                        postalCode: a.pincode,
                        isDefault: a.isDefault,
                      };

                      if (editing !== "new") {
                        await updateAddressMutation.mutateAsync({
                          id: a.id,
                          data: payload,
                        });
                      } else {
                        await createAddressMutation.mutateAsync(
                          payload,
                        );
                      }

                      setEditing(null);

                      toast.success(
                        editing === "new"
                          ? "Address added"
                          : "Address updated",
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
              </div>
            ) : (
              <>
                {addresses.length === 0 ? (
                  <div className="py-12 sm:py-16 text-center">
                    <MapPin
                      className="mx-auto size-6 text-[#c89a4b]/70"
                      strokeWidth={1.1}
                    />

                    <h2 className="mt-5 font-display text-xl sm:text-2xl text-[#102650]">
                      No saved addresses
                    </h2>

                    <p className="mt-2 text-sm text-[#102650]/50">
                      Add an address for a faster checkout.
                    </p>

                    <button
                      type="button"
                      onClick={() => setEditing("new")}
                      className="mt-6 inline-flex items-center gap-2 border-b border-[#c89a4b]/60 pb-1.5 text-[9px] font-medium uppercase tracking-[0.2em] text-[#102650]"
                    >
                      Add Address
                      <ArrowRight
                        className="size-3 text-[#c89a4b]"
                        strokeWidth={1.2}
                      />
                    </button>
                  </div>
                ) : (
                  <div className="grid gap-5 sm:grid-cols-2">
                    {addresses.map((a) => (
                      <article
                        key={a.id}
                        className="border border-[#102650]/10 p-5 sm:p-6 transition-shadow duration-300 hover:shadow-[0_12px_40px_rgba(16,38,80,0.05)]"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-[8px] font-medium uppercase tracking-[0.25em] text-[#c89a4b]">
                            {a.label || "Saved Address"}
                          </span>

                          {a.isDefault && (
                            <span className="text-[8px] uppercase tracking-[0.15em] text-[#102650]/45">
                              Default
                            </span>
                          )}
                        </div>

                        <div className="mt-5">
                          <p className="font-display text-lg sm:text-xl text-[#102650]">
                            {a.name}
                          </p>

                          <p className="mt-2 text-sm leading-6 text-[#102650]/55">
                            {a.line1}, {a.city}, {a.state} —{" "}
                            {a.pincode}, {a.country}
                          </p>

                          <p className="mt-2 text-xs text-[#102650]/45">
                            {a.phone}
                          </p>
                        </div>

                        <div className="mt-6 flex items-center gap-5 border-t border-[#102650]/10 pt-5">
                          <button
                            type="button"
                            onClick={() => setEditing(a)}
                            className="flex items-center gap-2 text-[9px] font-medium uppercase tracking-[0.16em] text-[#102650] transition-colors hover:text-[#c89a4b]"
                          >
                            <Pencil
                              className="size-3.5"
                              strokeWidth={1.2}
                            />
                            Edit
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              void deleteAddressMutation
                                .mutateAsync(a.id)
                                .then(() =>
                                  toast("Address removed"),
                                )
                                .catch((error) =>
                                  toast.error(
                                    error instanceof Error
                                      ? error.message
                                      : "Unable to remove address",
                                  ),
                                );
                            }}
                            className="flex items-center gap-2 text-[9px] font-medium uppercase tracking-[0.16em] text-[#102650]/40 transition-colors hover:text-red-600"
                          >
                            <Trash2
                              className="size-3.5"
                              strokeWidth={1.2}
                            />
                            Delete
                          </button>
                        </div>
                      </article>
                    ))}

                    {/* Add address */}
                    <button
                      type="button"
                      onClick={() => setEditing("new")}
                      className="group flex min-h-48 flex-col items-center justify-center border border-dashed border-[#102650]/20 p-6 transition-colors hover:border-[#c89a4b]"
                    >
                      <span className="grid size-9 place-items-center border border-[#c89a4b]/40 text-[#c89a4b]">
                        +
                      </span>

                      <span className="mt-4 text-[9px] font-medium uppercase tracking-[0.2em] text-[#102650]">
                        Add new address
                      </span>

                      <ArrowRight
                        className="mt-2 size-3 text-[#c89a4b] transition-transform duration-300 group-hover:translate-x-1"
                        strokeWidth={1.2}
                      />
                    </button>
                  </div>
                )}
              </>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </main>
  );
}

/*
 * Keep the mutation hooks isolated so the page remains easy to read.
 * These wrappers simply expose the existing API hooks.
 */
function useCreateAddressMutation() {
  return useCreateAddress();
}

function useUpdateAddressMutation() {
  return useUpdateAddress();
}

function useDeleteAddressMutation() {
  return useDeleteAddress();
}

export default ProfilePage;