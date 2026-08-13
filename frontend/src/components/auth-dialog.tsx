import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { AlertCircle, Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/context/auth-context";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
      toast.success("Welcome back!");
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
      toast.success("Account created successfully!");
      onOpenChange(false);
      signupForm.reset();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to sign up");
    } finally {
      setLoading(false);
    }
  };

  // Reset the active tab to the requested default whenever the dialog opens.
  useEffect(() => {
    if (open) {
      setTab(defaultTab);
      // Clear any stale validation state when re-opening.
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
        overlayClassName="auth-backdrop"
        className="auth-modal w-full max-w-[460px] rounded-md p-8 sm:p-10"
      >
        <DialogHeader className="text-center sm:text-center">
          <DialogTitle className="font-display text-[26px] leading-tight font-medium text-navy sm:text-[28px]">
            {tab === "login" ? "Welcome Back to Grandeur" : "Join Grandeur India"}
          </DialogTitle>
          <div className="auth-title-rule mt-3" aria-hidden="true" />
          <DialogDescription className="mx-auto mt-3 max-w-[300px] text-[13px] leading-relaxed tracking-wide text-navy/60">
            {tab === "login"
              ? "Sign in to access your account and discover your collection."
              : "Create an account for exclusive previews and to track your orders."}
          </DialogDescription>
        </DialogHeader>

        <Tabs
          value={tab}
          onValueChange={(v) => setTab(v as "login" | "signup")}
          className="mt-6 w-full"
        >
          <TabsList className="auth-tabs w-full bg-transparent" aria-label="Sign in or register">
            <TabsTrigger value="login" className="auth-tab">
              Sign In
            </TabsTrigger>
            <TabsTrigger value="signup" className="auth-tab">
              Register
            </TabsTrigger>
          </TabsList>

          <TabsContent value="login" className="mt-7 focus:outline-none">
            <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-5" noValidate>
              <div>
                <label htmlFor="login-email" className="auth-label">
                  Email Address
                </label>
                <input
                  id="login-email"
                  type="email"
                  autoComplete="email"
                  placeholder="name@example.com"
                  className="auth-input"
                  {...loginForm.register("email")}
                  {...inputProps(Boolean(loginForm.formState.errors.email))}
                />
                {loginForm.formState.errors.email && (
                  <p className="auth-error" role="alert">
                    <AlertCircle className="size-3.5 shrink-0" />
                    {loginForm.formState.errors.email.message}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="login-password" className="auth-label">
                  Password
                </label>
                <div className="auth-password-wrap">
                  <input
                    id="login-password"
                    type={showLoginPassword ? "text" : "password"}
                    autoComplete="current-password"
                    placeholder="••••••••"
                    className="auth-input"
                    {...loginForm.register("password")}
                    {...inputProps(Boolean(loginForm.formState.errors.password))}
                  />
                  <button
                    type="button"
                    aria-label={showLoginPassword ? "Hide password" : "Show password"}
                    className="auth-password-toggle"
                    onClick={() => setShowLoginPassword((v) => !v)}
                  >
                    {showLoginPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
                {loginForm.formState.errors.password && (
                  <p className="auth-error" role="alert">
                    <AlertCircle className="size-3.5 shrink-0" />
                    {loginForm.formState.errors.password.message}
                  </p>
                )}
              </div>

              <button type="submit" disabled={loading} className="auth-submit">
                {loading ? "Signing in…" : "Sign In"}
              </button>
            </form>

            <p className="auth-footnote">
              Don&apos;t have an account?{" "}
              <button type="button" onClick={() => setTab("signup")}>
                Register now
              </button>
            </p>
          </TabsContent>

          <TabsContent value="signup" className="mt-7 focus:outline-none">
            <form onSubmit={signupForm.handleSubmit(onSignupSubmit)} className="space-y-5" noValidate>
              <div>
                <label htmlFor="signup-name" className="auth-label">
                  Full Name
                </label>
                <input
                  id="signup-name"
                  type="text"
                  autoComplete="name"
                  placeholder="Ananya Sharma"
                  className="auth-input"
                  {...signupForm.register("name")}
                  {...inputProps(Boolean(signupForm.formState.errors.name))}
                />
                {signupForm.formState.errors.name && (
                  <p className="auth-error" role="alert">
                    <AlertCircle className="size-3.5 shrink-0" />
                    {signupForm.formState.errors.name.message}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="signup-email" className="auth-label">
                  Email Address
                </label>
                <input
                  id="signup-email"
                  type="email"
                  autoComplete="email"
                  placeholder="name@example.com"
                  className="auth-input"
                  {...signupForm.register("email")}
                  {...inputProps(Boolean(signupForm.formState.errors.email))}
                />
                {signupForm.formState.errors.email && (
                  <p className="auth-error" role="alert">
                    <AlertCircle className="size-3.5 shrink-0" />
                    {signupForm.formState.errors.email.message}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="signup-password" className="auth-label">
                  Password
                </label>
                <div className="auth-password-wrap">
                  <input
                    id="signup-password"
                    type={showSignupPassword ? "text" : "password"}
                    autoComplete="new-password"
                    placeholder="••••••••"
                    className="auth-input"
                    {...signupForm.register("password")}
                    {...inputProps(Boolean(signupForm.formState.errors.password))}
                  />
                  <button
                    type="button"
                    aria-label={showSignupPassword ? "Hide password" : "Show password"}
                    className="auth-password-toggle"
                    onClick={() => setShowSignupPassword((v) => !v)}
                  >
                    {showSignupPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
                {signupForm.formState.errors.password && (
                  <p className="auth-error" role="alert">
                    <AlertCircle className="size-3.5 shrink-0" />
                    {signupForm.formState.errors.password.message}
                  </p>
                )}
              </div>

              <button type="submit" disabled={loading} className="auth-submit">
                {loading ? "Creating Account…" : "Create Account"}
              </button>
            </form>

            <p className="auth-footnote">
              Already have an account?{" "}
              <button type="button" onClick={() => setTab("login")}>
                Sign in
              </button>
            </p>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
