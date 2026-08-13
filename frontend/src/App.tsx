import { Routes, Route } from "react-router-dom";
import HomePage from "@/routes/index";
import ProductsPage from "@/routes/products";
import CategoryPage from "@/routes/category.$slug";
import ProductPage from "@/routes/product.$id";
import CartPage from "@/routes/cart";
import CheckoutPage from "@/routes/checkout";
import OrderSuccessPage from "@/routes/order-success";
import WishlistPage from "@/routes/wishlist";
import ProfilePage from "@/routes/profile";
import AboutPage from "@/routes/about";
import ContactPage from "@/routes/contact";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

export default function App() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />

      <main className="pt-20 md:pt-28">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/products" element={<ProductsPage />} />
          <Route path="/category/:slug" element={<CategoryPage />} />
          <Route path="/product/:id" element={<ProductPage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/order-success" element={<OrderSuccessPage />} />
          <Route path="/wishlist" element={<WishlistPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/contact" element={<ContactPage />} />

          <Route
            path="*"
            element={
              <main className="flex min-h-[60vh] items-center justify-center px-6">
                <div className="text-center">
                  <p className="text-sm uppercase tracking-[0.3em] text-gold">
                    404
                  </p>
                  <h1 className="mt-3 font-display text-5xl text-navy">
                    Page not found
                  </h1>
                </div>
              </main>
            }
          />
        </Routes>
      </main>

      <SiteFooter />
    </div>
  );
}
