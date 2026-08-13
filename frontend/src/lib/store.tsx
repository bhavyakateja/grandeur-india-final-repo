import { createContext, useContext, useMemo, type ReactNode } from "react";
import { useAuth } from "@/context/auth-context";
import { useCart, useAddToCart, useUpdateCartItem, useRemoveCartItem, useWishlist, useToggleWishlist, useAddresses, useCreateAddress, useDeleteAddress, useOrders } from "@/hooks/use-api";
import type { Product, Address as ApiAddress, Order as ApiOrder } from "@/lib/types";

export type CartLine = { id: string; qty: number; itemId?: string; product?: Product };
export type Address = { id: string; label?: string; name: string; phone: string; line1: string; city: string; state: string; pincode: string; isDefault: boolean };
export type Order = { id: string; date: string; status: string; total: number; items: { id: string; name: string; qty: number; image?: string; price?: number }[] };

type StoreContextType = {
  cart: CartLine[]; wishlist: string[]; addresses: Address[]; orders: Order[];
  addToCart: (productId: string, qty?: number) => void;
  setQty: (productIdOrItemId: string, qty: number) => void;
  removeFromCart: (productIdOrItemId: string) => void;
  clearCart: () => void;
  toggleWishlist: (productId: string) => void;
  saveAddress: (a: Address) => void;
  removeAddress: (id: string) => void;
  cartCount: number; subtotal: number;
  lines: { product: Product; qty: number; itemId?: string }[];
  isApiLoading: boolean;
};
const StoreContext = createContext<StoreContextType | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  const { data: cart, isLoading: cartLoading } = useCart();
  const { data: wishlistData, isLoading: wishlistLoading } = useWishlist();
  const { data: addressData, isLoading: addressLoading } = useAddresses();
  const { data: orderData, isLoading: orderLoading } = useOrders();
  const addMutation = useAddToCart();
  const updateMutation = useUpdateCartItem();
  const removeMutation = useRemoveCartItem();
  const wishlistMutation = useToggleWishlist();
  const createAddressMutation = useCreateAddress();
  const deleteAddressMutation = useDeleteAddress();

const lines = useMemo(
  () =>
    isAuthenticated && Array.isArray(cart?.items)
      ? cart.items.map((item) => ({
          product: item.product,
          qty: item.quantity,
          itemId: item.id,
        }))
      : [],
  [isAuthenticated, cart]
);

const wishlist = useMemo(
  () =>
    isAuthenticated && Array.isArray(wishlistData)
      ? wishlistData.map((item) => item.productId)
      : [],
  [isAuthenticated, wishlistData]
);

const addresses = useMemo<Address[]>(
  () =>
    isAuthenticated && Array.isArray(addressData)
      ? addressData.map((a: ApiAddress) => ({
          id: a.id,
          label: a.isDefault ? "Default Address" : "Saved Address",
          name: a.fullName,
          phone: a.phone,
          line1: [a.addressLine1, a.addressLine2]
            .filter(Boolean)
            .join(", "),
          city: a.city,
          state: a.state,
          pincode: a.postalCode,
          isDefault: a.isDefault,
        }))
      : [],
  [isAuthenticated, addressData]
);

const orders = useMemo<Order[]>(
  () =>
    isAuthenticated && Array.isArray(orderData)
      ? orderData.map((o: ApiOrder) => ({
          id: o.orderNumber || o.id,
          date: new Date(o.createdAt).toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          }),
          status: o.status,
          total: Number(o.total),
          items: Array.isArray(o.items)
            ? o.items.map((i) => ({
                id: i.productId,
                name: i.productName,
                qty: i.quantity,
                price: Number(i.price),
                image: i.product?.images?.[0]?.url,
              }))
            : [],
        }))
      : [],
  [isAuthenticated, orderData]
);
  const subtotal = useMemo(() => lines.reduce((sum, line) => sum + Number(line.product.price) * line.qty, 0), [lines]);
  const cartCount = useMemo(() => lines.reduce((sum, line) => sum + line.qty, 0), [lines]);

  const value = useMemo<StoreContextType>(() => ({
    cart: lines.map((line) => ({ id: line.product.id, qty: line.qty, itemId: line.itemId, product: line.product })), wishlist, addresses, orders, lines, subtotal, cartCount,
    isApiLoading: isAuthenticated && (cartLoading || wishlistLoading || addressLoading || orderLoading),
    addToCart: (productId, qty = 1) => { if (isAuthenticated) addMutation.mutate({ productId, quantity: Math.min(10, Math.max(1, qty)) }); },
    setQty: (id, qty) => { if (!isAuthenticated) return; const line = lines.find((item) => item.itemId === id || item.product.id === id); if (!line?.itemId) return; if (qty <= 0) removeMutation.mutate(line.itemId); else updateMutation.mutate({ itemId: line.itemId, quantity: Math.min(10, qty) }); },
    removeFromCart: (id) => { if (!isAuthenticated) return; const line = lines.find((item) => item.itemId === id || item.product.id === id); if (line?.itemId) removeMutation.mutate(line.itemId); },
    clearCart: () => { if (isAuthenticated) lines.forEach((line) => { if (line.itemId) removeMutation.mutate(line.itemId); }); },
    toggleWishlist: (productId) => { if (isAuthenticated) wishlistMutation.mutate(productId); },
    saveAddress: (a) => { if (isAuthenticated) createAddressMutation.mutate({ fullName: a.name, phone: a.phone, addressLine1: a.line1, city: a.city, state: a.state, country: "India", postalCode: a.pincode, isDefault: a.isDefault }); },
    removeAddress: (id) => { if (isAuthenticated) deleteAddressMutation.mutate(id); },
  }), [lines, wishlist, addresses, orders, subtotal, cartCount, isAuthenticated, cartLoading, wishlistLoading, addressLoading, orderLoading, addMutation, updateMutation, removeMutation, wishlistMutation, createAddressMutation, deleteAddressMutation]);
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}
export function useStore() { const value = useContext(StoreContext); if (!value) throw new Error("useStore must be used within StoreProvider"); return value; }
