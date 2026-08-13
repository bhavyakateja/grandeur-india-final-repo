import type { ReactNode } from "react";

export function PageHeader({ title, description, action }: { title: string; description?: string; action?: ReactNode }) {
  return <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
    <div><h1 className="text-2xl font-semibold tracking-tight">{title}</h1>{description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}</div>
    {action}
  </div>;
}
export function Loading({ label = "Loading…" }: { label?: string }) { return <div className="rounded-xl border bg-card p-10 text-center text-sm text-muted-foreground">{label}</div>; }
export function ErrorState({ message, retry }: { message: string; retry?: () => void }) {
  return <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-800"><p>{message}</p>{retry && <button onClick={retry} className="mt-3 rounded-md bg-red-800 px-3 py-2 text-white">Retry</button>}</div>;
}
export function Empty({ title, description }: { title: string; description?: string }) { return <div className="rounded-xl border bg-card p-10 text-center"><p className="font-medium">{title}</p>{description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}</div>; }
export function formatMoney(value: number | string | undefined) { return `₹${Number(value ?? 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`; }
export function formatDate(value: string | undefined) { return value ? new Date(value).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }) : "—"; }
export function Badge({ children, tone = "default" }: { children: ReactNode; tone?: "default" | "green" | "amber" | "red" | "blue" }) {
  const styles = { default: "bg-slate-100 text-slate-700", green: "bg-emerald-100 text-emerald-700", amber: "bg-amber-100 text-amber-700", red: "bg-red-100 text-red-700", blue: "bg-blue-100 text-blue-700" };
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${styles[tone]}`}>{children}</span>;
}
export function statusTone(status: string): "default"|"green"|"amber"|"red"|"blue" {
  if (["ACTIVE","DELIVERED","PAID","APPROVED"].includes(status)) return "green";
  if (["PENDING","DRAFT","CONFIRMED"].includes(status)) return "amber";
  if (["CANCELLED","FAILED","REJECTED","ARCHIVED"].includes(status)) return "red";
  return "blue";
}
