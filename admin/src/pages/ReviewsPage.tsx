import { useEffect, useState } from "react";
import { Search, Trash2 } from "lucide-react";
import { adminApi, type Review, type ReviewStatus } from "@/lib/admin-api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageHeader, Loading, ErrorState, Empty, Badge, formatDate, statusTone } from "./common";

const statuses: ReviewStatus[] = ["PENDING", "APPROVED", "REJECTED"];

export default function ReviewsPage() {
  const [data, setData] = useState<Review[]>([]); const [total, setTotal] = useState(0); const [page, setPage] = useState(1);
  const [search, setSearch] = useState(""); const [status, setStatus] = useState(""); const [loading, setLoading] = useState(true); const [error, setError] = useState("");
  const limit = 15;
  const load = async () => { try { setLoading(true); setError(""); const r = await adminApi.reviews({ page, limit, search: search.trim() || undefined, status: (status || undefined) as ReviewStatus | undefined }); setData(r.data); setTotal(r.pagination.total); } catch (e) { setError(e instanceof Error ? e.message : "Unable to load reviews."); } finally { setLoading(false); } };
  useEffect(() => { void load(); }, [page, search, status]);
  const setReviewStatus = async (review: Review, next: ReviewStatus) => { try { await adminApi.updateReviewStatus(review.id, next); void load(); } catch (e) { setError(e instanceof Error ? e.message : "Unable to moderate review."); } };
  const remove = async (review: Review) => { if (!window.confirm("Delete this review permanently?")) return; try { await adminApi.deleteReview(review.id); void load(); } catch (e) { setError(e instanceof Error ? e.message : "Unable to delete review."); } };
  return <div><PageHeader title="Review moderation" description={`${total} customer reviews. Approve, reject, or remove content.`} />{error && <div className="mb-4"><ErrorState message={error} retry={load} /></div>}
    <div className="mb-4 grid gap-3 md:grid-cols-[1fr_180px]"><div className="relative"><Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" /><Input className="pl-9" placeholder="Search review, customer or product…" value={search} onChange={e => { setPage(1); setSearch(e.target.value); }} /></div><select className="h-9 rounded-md border px-3 text-sm" value={status} onChange={e => { setPage(1); setStatus(e.target.value); }}><option value="">All statuses</option>{statuses.map(s => <option key={s}>{s}</option>)}</select></div>
    {loading ? <Loading /> : data.length === 0 ? <Empty title="No reviews found" /> : <div className="space-y-3">{data.map(r => <article key={r.id} className="rounded-xl border bg-card p-5"><div className="flex flex-wrap items-start justify-between gap-4"><div><div className="flex items-center gap-2"><h2 className="font-medium">{r.product.name}</h2><Badge tone={statusTone(r.status)}>{r.status}</Badge></div><p className="mt-1 text-xs text-muted-foreground">{r.user.name} · {r.user.email} · {formatDate(r.createdAt)}</p></div><div className="flex gap-2">{r.status !== "APPROVED" && <Button size="sm" onClick={() => void setReviewStatus(r, "APPROVED")}>Approve</Button>}{r.status !== "REJECTED" && <Button size="sm" variant="outline" onClick={() => void setReviewStatus(r, "REJECTED")}>Reject</Button>}<Button size="sm" variant="destructive" onClick={() => void remove(r)}><Trash2 /></Button></div></div><div className="mt-4"><p className="font-medium">{"★".repeat(r.rating)}<span className="text-slate-300">{"★".repeat(5 - r.rating)}</span>{r.title ? ` · ${r.title}` : ""}</p>{r.comment && <p className="mt-2 text-sm leading-6 text-muted-foreground">{r.comment}</p>}</div>{r.images.length > 0 && <div className="mt-4 flex gap-2">{r.images.map(i => <img key={i.id} src={i.url} alt="" className="h-16 w-16 rounded-md object-cover" />)}</div>}</article>)}</div>}
    {!loading && data.length > 0 && <div className="mt-4 flex items-center justify-between text-sm"><span>Page {page} of {Math.max(1, Math.ceil(total / limit))}</span><div className="flex gap-2"><Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Previous</Button><Button size="sm" variant="outline" disabled={page >= Math.ceil(total / limit)} onClick={() => setPage(p => p + 1)}>Next</Button></div></div>}
  </div>;
}
