import { Link } from "react-router-dom";
import { Mail, Phone, MapPin, ArrowUpRight } from "lucide-react";
import { FaWhatsapp } from "react-icons/fa";

export default function ContactPage() {
  return (
    <div className="bg-[#f1ecec] text-[#102650] min-h-screen py-20 px-6 sm:px-8 lg:px-12">
      <div className="mx-auto max-w-4xl text-center">
        <p className="text-[10px] font-medium uppercase tracking-[0.3em] text-[#c89a4b]">
          Get in Touch
        </p>
        <h1 className="mt-3 font-serif text-4xl sm:text-5xl tracking-wide text-[#102650]">
          How can we assist you?
        </h1>
        <div className="mx-auto mt-4 h-0.5 w-12 bg-[#c89a4b]" />
        
        <p className="mt-6 text-sm leading-7 text-[#102650]/70 max-w-xl mx-auto">
          We are here to help with your fine jewellery selections, order tracking, custom requests, and account support. Reach out through any of our channels below.
        </p>

        {/* Quick Action Grid */}
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 text-left">
          
          {/* WhatsApp Direct Chat Card */}
          <a
            href="https://wa.me/8454871820?text=Hello%20Grandeur,%20I%20need%20assistance%20with%20my%20order."
            target="_blank"
            rel="noopener noreferrer"
            className="group rounded-xl border border-[#102650]/15 bg-white p-6 shadow-md shadow-[#102650]/5 transition-all hover:-translate-y-1 hover:border-[#c89a4b] hover:shadow-lg"
          >
            <div className="flex items-center justify-between">
              <div className="grid size-10 place-items-center rounded-full bg-[#25D366]/10 text-[#25D366]">
                <FaWhatsapp className="size-5" />
              </div>
              <ArrowUpRight className="size-4 opacity-40 transition group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 text-[#102650]" />
            </div>
            <h2 className="mt-5 font-serif text-lg font-medium text-[#102650]">WhatsApp Chat</h2>
            <p className="mt-1.5 text-xs text-[#102650]/65 leading-relaxed">
              Connect instantly with our customer support concierge for fast replies.
            </p>
          </a>

          {/* Account & Orders Card */}
          <Link
            to="/profile"
            className="group rounded-xl border border-[#102650]/15 bg-white p-6 shadow-md shadow-[#102650]/5 transition-all hover:-translate-y-1 hover:border-[#c89a4b] hover:shadow-lg"
          >
            <div className="flex items-center justify-between">
              <div className="grid size-10 place-items-center rounded-full bg-[#c89a4b]/10 text-[#c89a4b]">
                <Phone className="size-4" />
              </div>
              <ArrowUpRight className="size-4 opacity-40 transition group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 text-[#102650]" />
            </div>
            <h2 className="mt-5 font-serif text-lg font-medium text-[#102650]">Account & Orders</h2>
            <p className="mt-1.5 text-xs text-[#102650]/65 leading-relaxed">
              View your live orders, manage saved addresses, and profile details.
            </p>
          </Link>

          {/* Product Catalogue Card */}
          <Link
            to="/products"
            className="group rounded-xl border border-[#102650]/15 bg-white p-6 shadow-md shadow-[#102650]/5 transition-all hover:-translate-y-1 hover:border-[#c89a4b] hover:shadow-lg sm:col-span-2 lg:col-span-1"
          >
            <div className="flex items-center justify-between">
              <div className="grid size-10 place-items-center rounded-full bg-[#c89a4b]/10 text-[#c89a4b]">
                <Mail className="size-4" />
              </div>
              <ArrowUpRight className="size-4 opacity-40 transition group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 text-[#102650]" />
            </div>
            <h2 className="mt-5 font-serif text-lg font-medium text-[#102650]">Product Catalogue</h2>
            <p className="mt-1.5 text-xs text-[#102650]/65 leading-relaxed">
              Browse current live collections, ring sizes, and availability status.
            </p>
          </Link>

        </div>

        {/* Direct Contact Details Cards Grid (Email, Phone, Location) */}
        <div className="mt-8 grid gap-6 sm:grid-cols-3 text-left">
          
          {/* Email Card */}
          <a
            href="mailto:grandeur.in@gmail.com"
            className="group rounded-xl border border-[#102650]/15 bg-white p-5 shadow-sm transition-all hover:border-[#c89a4b] hover:shadow-md flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between">
                <div className="grid size-8 place-items-center rounded-full bg-[#c89a4b]/10 text-[#c89a4b]">
                  <Mail className="size-4" />
                </div>
                <ArrowUpRight className="size-3.5 opacity-40 transition group-hover:opacity-100 text-[#102650]" />
              </div>
              <h3 className="mt-3 font-serif text-base font-medium text-[#102650]">Email Support</h3>
              <p className="mt-1 text-xs text-[#102650]/65">grandeur.in@gmail.com</p>
            </div>
          </a>

          {/* Phone Card */}
          <a
            href="tel:+918454871820"
            className="group rounded-xl border border-[#102650]/15 bg-white p-5 shadow-sm transition-all hover:border-[#c89a4b] hover:shadow-md flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between">
                <div className="grid size-8 place-items-center rounded-full bg-[#c89a4b]/10 text-[#c89a4b]">
                  <Phone className="size-4" />
                </div>
                <ArrowUpRight className="size-3.5 opacity-40 transition group-hover:opacity-100 text-[#102650]" />
              </div>
              <h3 className="mt-3 font-serif text-base font-medium text-[#102650]">Direct Call</h3>
              <p className="mt-1 text-xs text-[#102650]/65">+91 84548 71820</p>
            </div>
          </a>

          {/* Clickable Google Maps Location Card with Full Address */}
          <a
            href="https://www.google.com/maps/search/Flat+No.+106,+Vimal+Society,+91,+Banganga+Road,+Walkeshwar,+Mumbai/@18.946688,72.793752,10z?hl=en-US&entry=ttu"
            target="_blank"
            rel="noopener noreferrer"
            className="group rounded-xl border border-[#102650]/15 bg-white p-5 shadow-sm transition-all hover:border-[#c89a4b] hover:shadow-md flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between">
                <div className="grid size-8 place-items-center rounded-full bg-[#c89a4b]/10 text-[#c89a4b]">
                  <MapPin className="size-4" />
                </div>
                <ArrowUpRight className="size-3.5 opacity-40 transition group-hover:opacity-100 text-[#102650]" />
              </div>
              <h3 className="mt-3 font-serif text-base font-medium text-[#102650]">Studio Location</h3>
              <p className="mt-1 text-xs text-[#102650]/65 leading-relaxed">
                Flat No. 106, Vimal Society, 91, Banganga Road, Walkeshwar, Mumbai – 400006
              </p>
            </div>
          </a>

        </div>

        {/* Additional Info Box */}
        <div className="mt-8 rounded-xl border border-[#102650]/15 bg-white p-6 text-center max-w-2xl mx-auto shadow-sm space-y-2">
          <div className="flex items-center justify-center gap-2 text-[#c89a4b]">
            <MapPin className="size-4" />
            <span className="text-[10px] uppercase tracking-widest font-medium">Grandeur India Studio</span>
          </div>
          <p className="text-xs sm:text-sm text-[#102650]/75">
            For direct inquiries, you can also drop us a message via Instagram <a href="https://instagram.com/_grandeurindia" target="_blank" rel="noopener noreferrer" className="underline font-medium hover:text-[#102650]">@_grandeurindia</a>.
          </p>
        </div>

      </div>
    </div>
  );
}