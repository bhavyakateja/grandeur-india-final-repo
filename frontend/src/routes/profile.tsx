import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { MapPin, Package, Pencil, Trash2, User, Heart, LogOut } from "lucide-react";
import { toast } from "sonner";
import { formatINR } from "@/lib/utils";
import { useStore, type Address } from "@/lib/store";
import { useCreateAddress, useUpdateAddress, useDeleteAddress } from "@/hooks/use-api";
import { useAuth } from "@/context/auth-context";
import { AuthDialog } from "@/components/auth-dialog";
import { AddressForm } from "@/routes/checkout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";



function ProfilePage() {
  const { user, isAuthenticated, logout } = useAuth();
  const { addresses, orders, wishlist } = useStore();
  const createAddressMutation = useCreateAddress();
  const updateAddressMutation = useUpdateAddress();
  const deleteAddressMutation = useDeleteAddress();
  const [editing, setEditing] = useState<Address | "new" | null>(null);
  const [authOpen, setAuthOpen] = useState(false);
  const navigate = useNavigate();

  if (!isAuthenticated) {
    return (
      <div className="mx-auto max-w-xl px-6 py-28 text-center">
        <User className="mx-auto size-12 text-gold" />
        <h1 className="mt-4 font-display text-4xl">Sign in to your Account</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Access your order status, address book, and saved wishlist items.
        </p>
        <Button onClick={() => setAuthOpen(true)} className="mt-6 bg-navy text-navy-foreground">
          Sign In / Register
        </Button>
        <AuthDialog open={authOpen} onOpenChange={setAuthOpen} />
      </div>
    );
  }

  const handleSignOut = async () => {
    await logout();
    toast.success("Signed out successfully");
    navigate("/");
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 rounded-sm bg-gradient-blush p-6 sm:flex sm:justify-between sm:p-8">
        <div className="flex min-w-0 items-center gap-4">
          <div className="grid size-14 shrink-0 place-items-center rounded-full bg-navy text-navy-foreground">
            <User className="size-6" />
          </div>
          <div className="min-w-0">
            <h1 className="truncate font-display text-3xl">{user?.name}</h1>
            <p className="truncate text-sm text-navy/60">{user?.email} · {user?.role}</p>
          </div>
        </div>
        <button
          onClick={handleSignOut}
          className="flex shrink-0 items-center gap-2 rounded-sm border border-navy/25 px-5 py-3 text-[11px] tracking-[0.18em] text-navy uppercase hover:bg-navy/10"
        >
          <LogOut className="size-4" /> <span className="max-sm:sr-only">Sign out</span>
        </button>
      </div>

      <Tabs defaultValue="orders" className="mt-10">
        <TabsList className="h-auto w-full justify-start gap-2 rounded-sm bg-transparent p-0">
          {[
            { v: "orders", label: "Previous Orders", icon: Package },
            { v: "addresses", label: "Saved Addresses", icon: MapPin },
            { v: "wishlist", label: "Wishlist", icon: Heart },
          ].map((t) => (
            <TabsTrigger
              key={t.v}
              value={t.v}
              className="gap-2 rounded-sm border border-border px-4 py-3 text-[11px] tracking-[0.16em] uppercase data-[state=active]:border-navy data-[state=active]:bg-navy data-[state=active]:text-navy-foreground"
            >
              <t.icon className="size-4" /> <span className="max-sm:sr-only">{t.label}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="orders" className="mt-8 space-y-5">
          {orders.length === 0 ? (
            <p className="py-12 text-center text-sm text-muted-foreground">You have not placed any orders yet.</p>
          ) : (
            orders.map((o) => (
              <article key={o.id} className="rounded-sm border border-border p-5 transition-shadow duration-300 hover:shadow-card sm:p-6">
                <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-4 border-b border-border pb-4">
                  <div className="min-w-0">
                    <p className="font-display text-xl">Order #{o.id}</p>
                    <p className="text-xs tracking-[0.14em] text-muted-foreground uppercase">Placed {o.date}</p>
                  </div>
                  <span
                    className={cn(
                      "shrink-0 rounded-full px-3 py-1 text-[10px] tracking-[0.16em] uppercase",
                      o.status === "DELIVERED" || o.status === "Delivered" ? "bg-blush text-navy" : "bg-navy text-navy-foreground",
                    )}
                  >
                    {o.status}
                  </span>
                </div>
                <ul className="mt-4 space-y-3">
                  {o.items.map((it) => (
                    <li key={it.id} className="flex items-center gap-3">
                      {it.image && <img src={it.image} alt="" className="size-14 rounded-sm object-cover" />}
                      <Link
                        to={`/product/${it.id}`}
                        className="min-w-0 flex-1 truncate text-sm hover:text-gold"
                      >
                        {it.name}
                      </Link>
                      <span className="text-xs text-muted-foreground">Qty {it.qty}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
                  <span className="text-sm text-muted-foreground">Order total</span>
                  <span className="font-display text-xl">{formatINR(o.total)}</span>
                </div>
              </article>
            ))
          )}
        </TabsContent>

        <TabsContent value="addresses" className="mt-8">
          {editing ? (
            <AddressForm
              {...(editing !== "new" ? { initial: editing } : {})}
              onCancel={() => setEditing(null)}
              onSave={async (a) => {
                try {
                  const payload = { fullName: a.name, phone: a.phone, addressLine1: a.line1, city: a.city, state: a.state, country: "India", postalCode: a.pincode, isDefault: a.isDefault };
                  if (editing !== "new") await updateAddressMutation.mutateAsync({ id: a.id, data: payload });
                  else await createAddressMutation.mutateAsync(payload);
                  setEditing(null);
                  toast.success(editing === "new" ? "Address added" : "Address updated");
                } catch (error) { toast.error(error instanceof Error ? error.message : "Unable to save address"); }
              }}
            />
          ) : (
            <div className="grid gap-5 sm:grid-cols-2">
              {addresses.map((a) => (
                <div key={a.id} className="rounded-sm border border-border p-6">
                  <div className="flex items-center justify-between">
                    <span className="eyebrow text-navy">{a.label || "Address"}</span>
                    {a.isDefault && <span className="text-[10px] tracking-[0.16em] text-gold uppercase">Default</span>}
                  </div>
                  <p className="mt-3 font-medium">{a.name}</p>
                  <p className="text-sm text-muted-foreground">{a.line1}, {a.city}, {a.state} — {a.pincode}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{a.phone}</p>
                  <div className="mt-5 flex gap-3">
                    <button onClick={() => setEditing(a)} className="flex items-center gap-2 text-xs tracking-[0.16em] text-navy uppercase hover:text-gold">
                      <Pencil className="size-3.5" /> Edit
                    </button>
                    <button
                      onClick={() => {
                        void deleteAddressMutation.mutateAsync(a.id).then(() => toast("Address removed")).catch((error) => toast.error(error instanceof Error ? error.message : "Unable to remove address"));
                      }}
                      className="flex items-center gap-2 text-xs tracking-[0.16em] text-muted-foreground uppercase hover:text-destructive"
                    >
                      <Trash2 className="size-3.5" /> Delete
                    </button>
                  </div>
                </div>
              ))}
              <button
                onClick={() => setEditing("new")}
                className="grid min-h-40 place-items-center rounded-sm border border-dashed border-navy/30 p-6 text-xs tracking-[0.18em] text-navy uppercase"
              >
                + Add new address
              </button>
            </div>
          )}
        </TabsContent>

        <TabsContent value="wishlist" className="mt-8">
          <p className="text-sm text-muted-foreground">
            You have {wishlist.length} saved piece{wishlist.length === 1 ? "" : "s"}.
          </p>
          <Link to="/wishlist" className="mt-5 inline-block rounded-sm bg-navy px-8 py-4 text-[11px] tracking-[0.22em] text-navy-foreground uppercase">
            View wishlist
          </Link>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default ProfilePage;
