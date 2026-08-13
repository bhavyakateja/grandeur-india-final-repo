import { Link } from "react-router-dom";
import {
  Mail,
  Phone,
  MapPin,
  ArrowUpRight,
  Camera,
  MessageCircle,
} from "lucide-react";
import logo from "@/assets/grandeur-logo.png";
import { useCategories } from "@/hooks/use-api";

const quickLinks = [
  { label: "All Jewellery", to: "/products" },
  { label: "Our Story", to: "/about" },
  { label: "Contact Us", to: "/contact" },
  { label: "Wishlist", to: "/wishlist" },
  { label: "My Account", to: "/profile" },
];

export function SiteFooter() {
  const { data: categories = [] } = useCategories();

  return (
    <footer className="overflow-hidden bg-[#fdf0ef] text-[#102650]">
      <div className="mx-auto max-w-7xl px-6 py-16 sm:px-8 lg:px-12 lg:py-20">
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_1.3fr] lg:gap-16">
          {/* Brand & Socials Column */}
          <div>
            <div className="inline-flex">
              <img
                src={logo}
                alt="Grandeur India"
                className="h-16 w-auto sm:h-20"
              />
            </div>
            <p className="mt-6 max-w-sm text-sm leading-7 text-[#102650]/60">
              Fine jewellery presented by Grandeur. Explore the live collection
              and manage your orders securely through your account.
            </p>
            
            {/* Social Links with redirection URLs */}
            <div className="mt-7 flex gap-2">
              <SocialLink
                label="Instagram"
                href="https://instagram.com/grandeur"
              >
                <Camera className="size-4" />
              </SocialLink>
              <SocialLink
                label="Facebook"
                href="https://facebook.com/yourusername"
              >
                <MessageCircle className="size-4" />
              </SocialLink>
            </div>
          </div>

          {/* Quick Links Column */}
          <FooterColumn title="Explore">
            {quickLinks.map((link) => (
              <li key={link.label}>
                <Link
                  to={link.to}
                  className="group flex items-center justify-between border-b border-[#102650]/8 py-2.5 text-sm text-[#102650]/65 transition hover:text-[#102650]"
                >
                  {link.label}
                  <ArrowUpRight className="size-3 opacity-0 transition group-hover:opacity-100" />
                </Link>
              </li>
            ))}
          </FooterColumn>

          {/* Categories Column */}
          <FooterColumn title="Collections">
            {categories
              .filter((c) => c.isActive)
              .map((category) => (
                <li key={category.id}>
                  <Link
                    to={`/category/${category.slug}`}
                    className="group flex items-center justify-between border-b border-[#102650]/8 py-2.5 text-sm text-[#102650]/65 transition hover:text-[#102650]"
                  >
                    {category.name}
                    <ArrowUpRight className="size-3 opacity-0 transition group-hover:opacity-100" />
                  </Link>
                </li>
              ))}
          </FooterColumn>

          {/* Contact Details Column */}
          <div>
            <h3 className="text-[10px] font-medium uppercase tracking-[0.3em] text-[#c89a4b]">
              Get in touch
            </h3>
            <ul className="mt-5 space-y-4 text-sm text-[#102650]/65">
              <li className="flex items-start gap-3">
                <MapPin className="mt-0.5 size-4 shrink-0 text-[#c89a4b]" />
                <Link to="/contact" className="hover:text-[#102650]">
                  Visit our contact page for current store and support details.
                </Link>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="size-4 shrink-0 text-[#c89a4b]" />
                <Link to="/contact" className="hover:text-[#102650]">
                  Contact support
                </Link>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="size-4 shrink-0 text-[#c89a4b]" />
                <Link to="/contact" className="hover:text-[#102650]">
                  Email support
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Footer Bottom Bar */}
        <div className="mt-16 border-t border-[#102650]/10 pt-7 text-[10px] text-[#102650]/45">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <p>© {new Date().getFullYear()} Grandeur India. All rights reserved.</p>
            <div className="flex gap-5">
              <Link to="/contact" className="hover:text-[#102650]">
                Support
              </Link>
              <Link to="/about" className="hover:text-[#102650]">
                About
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h3 className="text-[10px] font-medium uppercase tracking-[0.3em] text-[#c89a4b]">
        {title}
      </h3>
      <ul className="mt-4">{children}</ul>
    </div>
  );
}

// Updated SocialLink Component
function SocialLink({
  label,
  href,
  children,
}: {
  label: string;
  href?: string;
  children: React.ReactNode;
}) {
  const baseClasses =
    "grid size-9 place-items-center rounded-full border border-[#102650]/10 text-[#102650]/55 transition-colors";

  if (!href) {
    return (
      <button
        type="button"
        disabled
        aria-label={`${label} link is not configured`}
        title={`${label} link is not configured`}
        className={`${baseClasses} cursor-not-allowed opacity-50`}
      >
        {children}
      </button>
    );
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      title={label}
      className={`${baseClasses} hover:bg-[#102650]/5 hover:text-[#102650]`}
    >
      {children}
    </a>
  );
}