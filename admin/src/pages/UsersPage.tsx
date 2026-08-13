import { useEffect, useState } from "react";
import { Eye, Pencil, Search, UserX, X } from "lucide-react";
import { adminApi, type AdminUser, type Role } from "@/lib/admin-api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader, Loading, ErrorState, Empty, Badge, formatDate } from "./common";
import { useAuth } from "@/context/auth-context";

function UserEdit({ user, canManageRole, onClose, onSaved }: { user: AdminUser; canManageRole: boolean; onClose: () => void; onSaved: (u: AdminUser) => void }) {
  const [name, setName] = useState(user.name); const [email, setEmail] = useState(user.email);
  const [role, setRole] = useState<Role>(user.role); const [active, setActive] = useState(user.isActive); const [verified, setVerified] = useState(user.isVerified);
  const [busy, setBusy] = useState(false); const [error, setError] = useState("");
  const save = async (e: React.FormEvent) => { e.preventDefault(); try { setBusy(true); setError(""); onSaved(await adminApi.updateUser(user.id, { name, email, role: canManageRole ? role : undefined, isActive: active, isVerified: verified })); } catch (e) { setError(e instanceof Error ? e.message : "Unable to update user."); } finally { setBusy(false); } };
  return <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/50 p-4"><form onSubmit={save} className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
    <div className="flex items-start justify-between"><div><h2 className="text-lg font-semibold">Edit account</h2><p className="text-sm text-muted-foreground">{user.email}</p></div><button type="button" onClick={onClose}><X /></button></div>
    {error && <div className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>}
    <div className="mt-5 space-y-4"><div><Label>Name</Label><Input className="mt-2" value={name} onChange={e => setName(e.target.value)} /></div><div><Label>Email</Label><Input className="mt-2" type="email" value={email} onChange={e => setEmail(e.target.value)} /></div>
      <div className="grid gap-4 sm:grid-cols-2"><label className="text-sm"><span>Role</span><select disabled={!canManageRole} className="mt-2 h-9 w-full rounded-md border px-3 disabled:bg-slate-100" value={role} onChange={e => setRole(e.target.value as Role)}><option>USER</option><option>ADMIN</option><option>SUPER_ADMIN</option></select></label><label className="text-sm"><span>Account state</span><select className="mt-2 h-9 w-full rounded-md border px-3" value={active ? "ACTIVE" : "INACTIVE"} onChange={e => setActive(e.target.value === "ACTIVE")}><option>ACTIVE</option><option>INACTIVE</option></select></label></div>
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={verified} onChange={e => setVerified(e.target.checked)} /> Verified account</label>
    </div><div className="mt-6 flex justify-end gap-2 border-t pt-5"><Button type="button" variant="outline" onClick={onClose}>Cancel</Button><Button disabled={busy}>{busy ? "Saving…" : "Save changes"}</Button></div>
  </form></div>;
}

function UserDetail({ id, canManageRole, onBack, onChanged }: { id: string; canManageRole: boolean; onBack: () => void; onChanged: () => void }) {
  const [u, setU] = useState<AdminUser | null>(null); const [e, setE] = useState(""); const [editing, setEditing] = useState(false); const [busy, setBusy] = useState(false);
  const load = async () => { try { setE(""); setU(await adminApi.user(id)); } catch (x) { setE(x instanceof Error ? x.message : "Unable to load user."); } };
  useEffect(() => { void load(); }, [id]);
  const deactivate = async () => { if (!u || !window.confirm(`Deactivate ${u.name}'s account?`)) return; try { setBusy(true); setU(await adminApi.deleteUser(u.id)); onChanged(); } catch (x) { setE(x instanceof Error ? x.message : "Unable to deactivate user."); } finally { setBusy(false); } };
  if (e && !u) return <><Button variant="outline" onClick={onBack}>Back</Button><div className="mt-4"><ErrorState message={e} retry={load} /></div></>;
  if (!u) return <Loading />;
  return <div><Button variant="outline" onClick={onBack}>← Users</Button><PageHeader title={u.name} description={u.email} action={<div className="flex gap-2"><Button variant="outline" onClick={() => setEditing(true)}><Pencil />Edit</Button><Button variant="destructive" disabled={!u.isActive || busy} onClick={() => void deactivate()}><UserX />Deactivate</Button></div>} />
    {e && <div className="mb-4"><ErrorState message={e} /></div>}
    <div className="grid gap-6 lg:grid-cols-2"><div className="rounded-xl border bg-card p-6 space-y-4"><div className="flex justify-between"><span>Role</span><Badge>{u.role}</Badge></div><div className="flex justify-between"><span>Account</span><Badge tone={u.isActive ? "green" : "red"}>{u.isActive ? "ACTIVE" : "INACTIVE"}</Badge></div><div className="flex justify-between"><span>Verified</span><span>{u.isVerified ? "Yes" : "No"}</span></div><div className="flex justify-between"><span>Created</span><span>{formatDate(u.createdAt)}</span></div><div className="flex justify-between"><span>Last login</span><span>{formatDate(u.lastLoginAt ?? undefined)}</span></div></div>
      <div className="rounded-xl border bg-card p-6"><h2 className="font-semibold">Account activity</h2><div className="mt-4 grid grid-cols-3 gap-3">{[["Orders", u._count?.orders ?? 0], ["Reviews", u._count?.reviews ?? 0], ["Wishlists", u._count?.wishlists ?? 0]].map(([a, b]) => <div key={a} className="rounded-lg bg-slate-50 p-4 text-center"><p className="text-xl font-semibold">{b}</p><p className="text-xs text-muted-foreground">{a}</p></div>)}</div></div></div>
    {editing && <UserEdit user={u} canManageRole={canManageRole} onClose={() => setEditing(false)} onSaved={next => { setU(next); setEditing(false); onChanged(); }} />}
  </div>;
}

export default function UsersPage() {
  const { user: actor } = useAuth(); const [data, setData] = useState<AdminUser[]>([]); const [total, setTotal] = useState(0); const [page, setPage] = useState(1); const [search, setSearch] = useState(""); const [role, setRole] = useState(""); const [active, setActive] = useState(""); const [loading, setLoading] = useState(true); const [error, setError] = useState(""); const [selected, setSelected] = useState<string | null>(null);
  const limit = 20; const load = async () => { try { setLoading(true); setError(""); const r = await adminApi.users({ page, limit, search: search.trim() || undefined, role: (role || undefined) as Role | undefined, isActive: active === "" ? undefined : active === "true" }); setData(r.data); setTotal(r.pagination.total); } catch (e) { setError(e instanceof Error ? e.message : "Unable to load users."); } finally { setLoading(false); } };
  useEffect(() => { void load(); }, [page, search, role, active]);
  if (selected) return <UserDetail id={selected} canManageRole={actor?.role === "SUPER_ADMIN"} onBack={() => setSelected(null)} onChanged={() => void load()} />;
  return <div><PageHeader title="Customers & users" description={`${total} accounts. Administrators can manage account state; super administrators can manage roles.`} />{error && <div className="mb-4"><ErrorState message={error} retry={load} /></div>}
    <div className="mb-4 grid gap-3 md:grid-cols-[1fr_180px_180px]"><div className="relative"><Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" /><Input className="pl-9" placeholder="Search name or email…" value={search} onChange={e => { setPage(1); setSearch(e.target.value); }} /></div><select className="h-9 rounded-md border px-3 text-sm" value={role} onChange={e => { setPage(1); setRole(e.target.value); }}><option value="">All roles</option><option>USER</option><option>ADMIN</option><option>SUPER_ADMIN</option></select><select className="h-9 rounded-md border px-3 text-sm" value={active} onChange={e => { setPage(1); setActive(e.target.value); }}><option value="">All account states</option><option value="true">Active</option><option value="false">Inactive</option></select></div>
    {loading ? <Loading /> : data.length === 0 ? <Empty title="No users found" /> : <div className="overflow-hidden rounded-xl border bg-card"><div className="overflow-x-auto"><table className="w-full text-sm"><thead className="bg-slate-50"><tr className="text-left text-muted-foreground"><th className="p-3">Customer</th><th className="p-3">Role</th><th className="p-3">State</th><th className="p-3">Orders</th><th className="p-3">Created</th><th className="p-3 text-right">View</th></tr></thead><tbody>{data.map(u => <tr key={u.id} className="border-t"><td className="p-3"><p className="font-medium">{u.name}</p><p className="text-xs text-muted-foreground">{u.email}</p></td><td className="p-3"><Badge>{u.role}</Badge></td><td className="p-3"><Badge tone={u.isActive ? "green" : "red"}>{u.isActive ? "ACTIVE" : "INACTIVE"}</Badge></td><td className="p-3">{u._count?.orders ?? 0}</td><td className="p-3">{formatDate(u.createdAt)}</td><td className="p-3 text-right"><Button size="sm" variant="outline" onClick={() => setSelected(u.id)}><Eye />View</Button></td></tr>)}</tbody></table></div><div className="flex items-center justify-between border-t p-3 text-sm"><span>Page {page} of {Math.max(1, Math.ceil(total / limit))}</span><div className="flex gap-2"><Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Previous</Button><Button size="sm" variant="outline" disabled={page >= Math.ceil(total / limit)} onClick={() => setPage(p => p + 1)}>Next</Button></div></div></div>}
  </div>;
}
