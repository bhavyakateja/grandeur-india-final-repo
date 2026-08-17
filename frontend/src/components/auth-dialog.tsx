import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { AlertCircle, Eye, EyeOff } from "lucide-react";
import logo from "@/assets/grandeur-logo.png";
import { useAuth } from "@/context/auth-context";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(100),
});

const signupSchema = z.object({
  name: z
    .string()
    .trim()
    .min(3, "Name must be at least 3 characters")
    .max(100),
  email: z.string().email("Invalid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(100),
});

type LoginFormValues = z.infer<typeof loginSchema>;
type SignupFormValues = z.infer<typeof signupSchema>;

interface AuthDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultTab?: "login" | "signup";
}

export function AuthDialog({ open, onOpenChange, defaultTab = "login" }: AuthDialogProps) {
  const [tab, setTab] = useState<"login" | "signup">(defaultTab);
  const [loading, setLoading] = useState(false);
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const { login, signup } = useAuth();

  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const signupForm = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: { name: "", email: "", password: "" },
  });

  const onLoginSubmit = async (values: LoginFormValues) => {
    setLoading(true);
    try {
      await login(values.email, values.password);
      toast.success("Welcome back to Grandeur India!");
      onOpenChange(false);
      loginForm.reset();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to log in");
    } finally {
      setLoading(false);
    }
  };

  const onSignupSubmit = async (values: SignupFormValues) => {
    setLoading(true);
    try {
      await signup(values.name, values.email, values.password);
      toast.success("Account created successfully! Welcome to Grandeur.");
      onOpenChange(false);
      signupForm.reset();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to sign up");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      setTab(defaultTab);
      loginForm.clearErrors();
      signupForm.clearErrors();
    }
  }, [open, defaultTab, loginForm, signupForm]);

  const inputProps = (invalid: boolean) => ({
    "aria-invalid": invalid || undefined,
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        overlayClassName="bg-black/60 backdrop-blur-sm"
        className="w-full max-w-[460px] overflow-hidden rounded-2xl border border-[#c89a4b]/30 bg-gradient-to-b from-[#ffffff] via-[#fefcf8] to-[#fbf7ee] p-7 shadow-2xl sm:p-9"
      >
        {/* Brand Crest */}
        <div className="mx-auto mb-1 flex size-12 items-center justify-center rounded-full border border-[#c89a4b]/30 bg-gradient-to-b from-[#fdf9f0] to-[#f5ead6] p-2 shadow-xs">
          <img src={logo} alt="Grandeur" className="h-full w-full object-contain" />
        </div>

        <DialogHeader className="text-center sm:text-center">
          <p className="text-[10px] font-medium uppercase tracking-[0.35em] text-[#c89a4b]">
            GRANDEUR
          </p>
          <DialogTitle className="mt-1 font-display text-2xl font-normal tracking-wide text-[#102650] sm:text-3xl">
            {tab === "login" ? "Welcome Back to Grandeur" : "Join Grandeur"}
          </DialogTitle>

          {/* Ornamental Divider */}
          <div className="mx-auto mt-2 flex items-center justify-center gap-2.5">
            <div className="h-px w-10 bg-gradient-to-r from-transparent to-[#c89a4b]/60" />
            <span className="text-[9px] text-[#c89a4b]">✦</span>
            <div className="h-px w-10 bg-gradient-to-l from-transparent to-[#c89a4b]/60" />
          </div>

          <DialogDescription className="mx-auto mt-2 max-w-[320px] text-[13px] leading-relaxed text-[#102650]/70">
            {tab === "login"
              ? "Sign in to access your account, personal wishlist, and bespoke orders."
              : "Create an account for exclusive previews, bespoke curation, and order tracking."}
          </DialogDescription>
        </DialogHeader>

        {/* Luxury Tab Switcher */}
        <div className="mt-5 flex rounded-xl border border-[#c89a4b]/20 bg-[#102650]/[0.03] p-1 shadow-inner">
          <button
            type="button"
            onClick={() => setTab("login")}
            className={cn(
              "flex-1 rounded-lg py-2 text-xs font-semibold uppercase tracking-[0.2em] transition-all duration-200",
              tab === "login"
                ? "border border-[#c89a4b]/30 bg-white text-[#102650] shadow-sm"
                : "text-[#102650]/55 hover:text-[#102650]"
            )}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => setTab("signup")}
            className={cn(
              "flex-1 rounded-lg py-2 text-xs font-semibold uppercase tracking-[0.2em] transition-all duration-200",
              tab === "signup"
                ? "border border-[#c89a4b]/30 bg-white text-[#102650] shadow-sm"
                : "text-[#102650]/55 hover:text-[#102650]"
            )}
          >
            Register
          </button>
        </div>

        {/* Login Form */}
        {tab === "login" ? (
          <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="mt-5 space-y-4" noValidate>
            <div>
              <label htmlFor="login-email" className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.16em] text-[#102650]/80">
                Email Address
              </label>
              <input
                id="login-email"
                type="email"
                autoComplete="email"
                placeholder="name@example.com"
                className="h-11 w-full rounded-lg border border-[#102650]/15 bg-white px-3.5 text-sm text-[#102650] shadow-xs placeholder:text-[#102650]/35 transition-all focus:border-[#c89a4b] focus:outline-none focus:ring-2 focus:ring-[#c89a4b]/20"
                {...loginForm.register("email")}
                {...inputProps(Boolean(loginForm.formState.errors.email))}
              />
              {loginForm.formState.errors.email && (
                <p className="mt-1.5 flex items-center gap-1.5 text-xs text-rose-600 font-medium" role="alert">
                  <AlertCircle className="size-3.5 shrink-0" />
                  {loginForm.formState.errors.email.message}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="login-password" className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.16em] text-[#102650]/80">
                Password
              </label>
              <div className="relative">
                <input
                  id="login-password"
                  type={showLoginPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className="h-11 w-full rounded-lg border border-[#102650]/15 bg-white px-3.5 pr-10 text-sm text-[#102650] shadow-xs placeholder:text-[#102650]/35 transition-all focus:border-[#c89a4b] focus:outline-none focus:ring-2 focus:ring-[#c89a4b]/20"
                  {...loginForm.register("password")}
                  {...inputProps(Boolean(loginForm.formState.errors.password))}
                />
                <button
                  type="button"
                  aria-label={showLoginPassword ? "Hide password" : "Show password"}
                  className="absolute inset-y-0 right-0 flex items-center px-3 text-[#102650]/40 transition-colors hover:text-[#102650]"
                  onClick={() => setShowLoginPassword((v) => !v)}
                >
                  {showLoginPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
              {loginForm.formState.errors.password && (
                <p className="mt-1.5 flex items-center gap-1.5 text-xs text-rose-600 font-medium" role="alert">
                  <AlertCircle className="size-3.5 shrink-0" />
                  {loginForm.formState.errors.password.message}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-2 flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-[#102650] via-[#163469] to-[#102650] text-xs font-semibold uppercase tracking-[0.24em] text-[#fdf6ea] shadow-md transition-all duration-300 hover:from-[#c89a4b] hover:via-[#b88c3e] hover:to-[#a87e35] hover:shadow-lg hover:shadow-[#c89a4b]/20 active:translate-y-[1px] disabled:opacity-60"
            >
              {loading ? "Signing in…" : "Sign In"}
            </button>

            <p className="pt-1 text-center text-xs text-[#102650]/65">
              Don&apos;t have an account?{" "}
              <button
                type="button"
                className="font-semibold text-[#102650] underline decoration-[#c89a4b]/60 underline-offset-4 transition-colors hover:text-[#c89a4b]"
                onClick={() => setTab("signup")}
              >
                Register now
              </button>
            </p>
          </form>
        ) : (
          /* Signup Form */
          <form onSubmit={signupForm.handleSubmit(onSignupSubmit)} className="mt-5 space-y-4" noValidate>
            <div>
              <label htmlFor="signup-name" className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.16em] text-[#102650]/80">
                Full Name
              </label>
              <input
                id="signup-name"
                type="text"
                autoComplete="name"
                placeholder="Radha Sharma"
                className="h-11 w-full rounded-lg border border-[#102650]/15 bg-white px-3.5 text-sm text-[#102650] shadow-xs placeholder:text-[#102650]/35 transition-all focus:border-[#c89a4b] focus:outline-none focus:ring-2 focus:ring-[#c89a4b]/20"
                {...signupForm.register("name")}
                {...inputProps(Boolean(signupForm.formState.errors.name))}
              />
              {signupForm.formState.errors.name && (
                <p className="mt-1.5 flex items-center gap-1.5 text-xs text-rose-600 font-medium" role="alert">
                  <AlertCircle className="size-3.5 shrink-0" />
                  {signupForm.formState.errors.name.message}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="signup-email" className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.16em] text-[#102650]/80">
                Email Address
              </label>
              <input
                id="signup-email"
                type="email"
                autoComplete="email"
                placeholder="name@example.com"
                className="h-11 w-full rounded-lg border border-[#102650]/15 bg-white px-3.5 text-sm text-[#102650] shadow-xs placeholder:text-[#102650]/35 transition-all focus:border-[#c89a4b] focus:outline-none focus:ring-2 focus:ring-[#c89a4b]/20"
                {...signupForm.register("email")}
                {...inputProps(Boolean(signupForm.formState.errors.email))}
              />
              {signupForm.formState.errors.email && (
                <p className="mt-1.5 flex items-center gap-1.5 text-xs text-rose-600 font-medium" role="alert">
                  <AlertCircle className="size-3.5 shrink-0" />
                  {signupForm.formState.errors.email.message}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="signup-password" className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.16em] text-[#102650]/80">
                Password
              </label>
              <div className="relative">
                <input
                  id="signup-password"
                  type={showSignupPassword ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="••••••••"
                  className="h-11 w-full rounded-lg border border-[#102650]/15 bg-white px-3.5 pr-10 text-sm text-[#102650] shadow-xs placeholder:text-[#102650]/35 transition-all focus:border-[#c89a4b] focus:outline-none focus:ring-2 focus:ring-[#c89a4b]/20"
                  {...signupForm.register("password")}
                  {...inputProps(Boolean(signupForm.formState.errors.password))}
                />
                <button
                  type="button"
                  aria-label={showSignupPassword ? "Hide password" : "Show password"}
                  className="absolute inset-y-0 right-0 flex items-center px-3 text-[#102650]/40 transition-colors hover:text-[#102650]"
                  onClick={() => setShowSignupPassword((v) => !v)}
                >
                  {showSignupPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
              {signupForm.formState.errors.password && (
                <p className="mt-1.5 flex items-center gap-1.5 text-xs text-rose-600 font-medium" role="alert">
                  <AlertCircle className="size-3.5 shrink-0" />
                  {signupForm.formState.errors.password.message}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-2 flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-[#102650] via-[#163469] to-[#102650] text-xs font-semibold uppercase tracking-[0.24em] text-[#fdf6ea] shadow-md transition-all duration-300 hover:from-[#c89a4b] hover:via-[#b88c3e] hover:to-[#a87e35] hover:shadow-lg hover:shadow-[#c89a4b]/20 active:translate-y-[1px] disabled:opacity-60"
            >
              {loading ? "Creating Account…" : "Create Account"}
            </button>

            <p className="pt-1 text-center text-xs text-[#102650]/65">
              Already have an account?{" "}
              <button
                type="button"
                className="font-semibold text-[#102650] underline decoration-[#c89a4b]/60 underline-offset-4 transition-colors hover:text-[#c89a4b]"
                onClick={() => setTab("login")}
              >
                Sign in
              </button>
            </p>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

