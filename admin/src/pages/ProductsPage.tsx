import { useEffect, useState } from "react";
import { ImagePlus, Pencil, Plus, Search, Star, Trash2, X } from "lucide-react";
import { adminApi, type Category, type Product, type ProductInput, type ProductStatus } from "@/lib/admin-api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PageHeader, Loading, ErrorState, Empty, Badge, formatMoney, formatDate, statusTone } from "./common";

const statuses: ProductStatus[] = ["DRAFT", "ACTIVE", "OUT_OF_STOCK", "ARCHIVED"];

function ProductForm({ initial, categories, onClose, onSaved }: { initial?: Product; categories: Category[]; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState<ProductInput>({
    name: initial?.name ?? "", description: initial?.description ?? "", price: Number(initial?.price ?? 0),
    stock: initial?.stock ?? 0, categoryId: initial?.categoryId ?? categories[0]?.id ?? "", status: initial?.status ?? "DRAFT",
  });
  const [product, setProduct] = useState<Product | undefined>(initial);
  const [busy, setBusy] = useState(false);
  const [imageBusy, setImageBusy] = useState(false);
  const [error, setError] = useState("");

  const save = async (e: React.FormEvent) => {
    e.preventDefault(); setError("");
    if (!form.name.trim() || form.description.trim().length < 10 || !form.categoryId || form.price <= 0 || form.stock < 0) {
      setError("Enter valid product details. Description must be at least 10 characters."); return;
    }
    try {
      setBusy(true);
      const saved = product ? await adminApi.updateProduct(product.id, form) : await adminApi.createProduct(form);
      setProduct(saved);
      if (!initial) onSaved();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to save product.");
    } finally { setBusy(false); }
  };

  const upload = async (file: File) => {
    if (!product) { setError("Save the product before attaching images."); return; }
    try {
      setImageBusy(true); setError("");
      const uploaded = await adminApi.uploadProductImage(file);
      const attached = await adminApi.attachProductImage(product.id, { ...uploaded, isPrimary: product.images.length === 0 });
      setProduct(await adminApi.product(product.id));
      void attached;
    } catch (e) { setError(e instanceof Error ? e.message : "Unable to attach image."); }
    finally { setImageBusy(false); }
  };

  const setPrimary = async (imageId: string) => {
    if (!product) return;
    try { setImageBusy(true); await adminApi.setPrimaryProductImage(product.id, imageId); setProduct(await adminApi.product(product.id)); }
    catch (e) { setError(e instanceof Error ? e.message : "Unable to set primary image."); }
    finally { setImageBusy(false); }
  };

  const removeImage = async (imageId: string) => {
    if (!product || !window.confirm("Remove this product image?")) return;
    try { setImageBusy(true); await adminApi.deleteProductImage(product.id, imageId); setProduct(await adminApi.product(product.id)); }
    catch (e) { setError(e instanceof Error ? e.message : "Unable to remove image."); }
    finally { setImageBusy(false); }
  };

  return <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/50 p-4">
    <div className="mx-auto my-8 max-w-3xl rounded-2xl bg-white shadow-2xl">
      <div className="flex items-center justify-between border-b p-6"><div><h2 className="text-lg font-semibold">{initial ? "Edit product" : "Create product"}</h2><p className="text-sm text-muted-foreground">Catalog data and media are managed through the admin API.</p></div><button onClick={onClose} aria-label="Close"><X /></button></div>
      <form onSubmit={save} className="space-y-5 p-6">
        {error && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>}
        <div><Label htmlFor="pname">Name</Label><Input id="pname" className="mt-2" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required maxLength={150} /></div>
        <div><Label htmlFor="pdesc">Description</Label><Textarea id="pdesc" className="mt-2 min-h-28" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} required /></div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div><Label htmlFor="price">Price (INR)</Label><Input id="price" className="mt-2" type="number" min="0.01" step="0.01" value={form.price} onChange={e => setForm({ ...form, price: Number(e.target.value) })} required /></div>
          <div><Label htmlFor="stock">Stock</Label><Input id="stock" className="mt-2" type="number" min="0" step="1" value={form.stock} onChange={e => setForm({ ...form, stock: Number(e.target.value) })} required /></div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div><Label>Category</Label><select className="mt-2 h-9 w-full rounded-md border px-3 text-sm" value={form.categoryId} onChange={e => setForm({ ...form, categoryId: e.target.value })} required><option value="">Select category</option>{categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
          <div><Label>Status</Label><select className="mt-2 h-9 w-full rounded-md border px-3 text-sm" value={form.status} onChange={e => setForm({ ...form, status: e.target.value as ProductStatus })}>{statuses.map(s => <option key={s}>{s}</option>)}</select></div>
        </div>
        <div className="rounded-xl border p-4">
          <div className="flex items-center justify-between gap-3"><div><h3 className="font-medium">Product images</h3><p className="text-xs text-muted-foreground">Upload, choose the primary image, or remove an image.</p></div>
            <label className={`inline-flex cursor-pointer items-center gap-2 rounded-md bg-slate-900 px-3 py-2 text-sm text-white ${imageBusy || !product ? "pointer-events-none opacity-50" : ""}`}><ImagePlus className="size-4" />Add image<input type="file" accept="image/*" className="hidden" disabled={imageBusy || !product} onChange={e => { const f = e.target.files?.[0]; if (f) void upload(f); e.currentTarget.value = ""; }} /></label>
          </div>
          {!product ? <p className="mt-4 text-sm text-muted-foreground">Save the product first to attach images.</p> :
            product.images.length === 0 ? <p className="mt-4 text-sm text-muted-foreground">No images attached.</p> :
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">{product.images.map(image =>
              <div key={image.id} className="group relative overflow-hidden rounded-lg border">
                <img src={image.url} alt="" className="aspect-square w-full object-cover" />
                <div className="flex items-center justify-between gap-1 p-2"><button type="button" className="inline-flex items-center gap-1 text-xs" onClick={() => void setPrimary(image.id)} disabled={imageBusy || image.isPrimary}>{image.isPrimary ? <><Star className="size-3 fill-current" />Primary</> : <><Star className="size-3" />Make primary</>}</button><button type="button" className="text-red-600" onClick={() => void removeImage(image.id)} disabled={imageBusy} aria-label="Remove image"><Trash2 className="size-3.5" /></button></div>
              </div>
            )}</div>}
        </div>
        <div className="flex justify-end gap-3 border-t pt-5"><Button type="button" variant="outline" onClick={onClose}>Close</Button><Button disabled={busy}>{busy ? "Saving…" : product ? "Save changes" : "Create product"}</Button></div>
      </form>
    </div>
  </div>;
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]); const [categories, setCategories] = useState<Category[]>([]);
  const [total, setTotal] = useState(0); const [page, setPage] = useState(1); const [search, setSearch] = useState(""); const [status, setStatus] = useState(""); const [category, setCategory] = useState(""); const [sort, setSort] = useState("-createdAt");
  const [loading, setLoading] = useState(true); const [error, setError] = useState(""); const [editing, setEditing] = useState<Product | "new" | null>(null); const [notice, setNotice] = useState("");
  const limit = 12;
  const load = async () => { try { setLoading(true); setError(""); const [result, cats] = await Promise.all([adminApi.products({ page, limit, search: search.trim() || undefined, status: (status || undefined) as ProductStatus | undefined, category: category || undefined, sort }), adminApi.categories()]); setProducts(result.products); setTotal(result.total); setCategories(cats); } catch (e) { setError(e instanceof Error ? e.message : "Unable to load products."); } finally { setLoading(false); } };
  useEffect(() => { void load(); }, [page, search, status, category, sort]);
  const remove = async (p: Product) => { if (!window.confirm(`Delete "${p.name}"? This cannot be undone.`)) return; try { await adminApi.deleteProduct(p.id); setNotice("Product deleted."); void load(); } catch (e) { setError(e instanceof Error ? e.message : "Unable to delete product."); } };
  return <div>
    <PageHeader title="Products" description={`${total} products in the catalog.`} action={<Button onClick={() => setEditing("new")}><Plus />New product</Button>} />
    {notice && <div className="mb-4 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700">{notice}</div>}
    {error && <div className="mb-4"><ErrorState message={error} retry={load} /></div>}
    <div className="mb-4 grid gap-3 md:grid-cols-[1fr_180px_180px_180px]"><div className="relative"><Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" /><Input className="pl-9" placeholder="Search products…" value={search} onChange={e => { setPage(1); setSearch(e.target.value); }} /></div><select className="h-9 rounded-md border px-3 text-sm" value={category} onChange={e => { setPage(1); setCategory(e.target.value); }}><option value="">All categories</option>{categories.map(c => <option key={c.id} value={c.slug}>{c.name}</option>)}</select><select className="h-9 rounded-md border px-3 text-sm" value={status} onChange={e => { setPage(1); setStatus(e.target.value); }}><option value="">All statuses</option>{statuses.map(s => <option key={s}>{s}</option>)}</select><select className="h-9 rounded-md border px-3 text-sm" value={sort} onChange={e => setSort(e.target.value)}><option value="-createdAt">Newest</option><option value="createdAt">Oldest</option><option value="name">Name A–Z</option><option value="-name">Name Z–A</option><option value="price">Price low–high</option><option value="-price">Price high–low</option></select></div>
    {loading ? <Loading /> : products.length === 0 ? <Empty title="No products found" description="Try changing the filters or create a product." /> :
      <div className="overflow-hidden rounded-xl border bg-card"><div className="overflow-x-auto"><table className="w-full text-sm"><thead className="bg-slate-50"><tr className="text-left text-muted-foreground"><th className="p-3">Product</th><th className="p-3">Category</th><th className="p-3">Price</th><th className="p-3">Stock</th><th className="p-3">Status</th><th className="p-3">Updated</th><th className="p-3 text-right">Actions</th></tr></thead><tbody>{products.map(p => <tr key={p.id} className="border-t"><td className="p-3"><div className="flex items-center gap-3">{p.images?.find(i => i.isPrimary)?.url || p.images?.[0]?.url ? <img src={p.images.find(i => i.isPrimary)?.url || p.images[0]?.url} alt="" className="h-10 w-10 rounded-md object-cover" /> : <div className="h-10 w-10 rounded-md bg-slate-100" />}<div><p className="font-medium">{p.name}</p><p className="text-xs text-muted-foreground">{p.slug}</p></div></div></td><td className="p-3">{p.category?.name ?? "—"}</td><td className="p-3">{formatMoney(p.price)}</td><td className="p-3">{p.stock}</td><td className="p-3"><Badge tone={statusTone(p.status)}>{p.status}</Badge></td><td className="p-3">{formatDate(p.updatedAt)}</td><td className="p-3 text-right"><div className="flex justify-end gap-2"><Button size="sm" variant="outline" onClick={() => setEditing(p)}><Pencil /></Button><Button size="sm" variant="destructive" onClick={() => void remove(p)}><Trash2 /></Button></div></td></tr>)}</tbody></table></div>
        <div className="flex items-center justify-between border-t p-3 text-sm"><span>Page {page} of {Math.max(1, Math.ceil(total / limit))}</span><div className="flex gap-2"><Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Previous</Button><Button size="sm" variant="outline" disabled={page >= Math.ceil(total / limit)} onClick={() => setPage(p => p + 1)}>Next</Button></div></div>
      </div>}
    {editing && <ProductForm initial={editing === "new" ? undefined : editing} categories={categories} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); setNotice(editing === "new" ? "Product created." : "Product updated."); void load(); }} />}
  </div>;
}
