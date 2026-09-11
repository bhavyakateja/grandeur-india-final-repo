import { useEffect, useState } from "react";
import { Search, Check, X } from "lucide-react";
import { adminApi, type Product } from "@/lib/admin-api";
import { useDebounce } from "@/lib/use-debounce";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PageHeader, Loading, ErrorState, Empty, Badge, formatMoney, statusTone } from "./common";

export default function InventoryPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [stockInput, setStockInput] = useState("");
  const [saving, setSaving] = useState(false);

  const limit = 15;
  const debouncedSearch = useDebounce(search, 300);

  const load = async (signal?: AbortSignal) => {
    try {
      setLoading(true);
      setError("");
      const r = await adminApi.products({
        page,
        limit,
        search: debouncedSearch.trim() || undefined,
        sort: "name",
      }, signal);
      setProducts(r.products);
      setTotal(r.total);
    } catch (e) {
      if (signal?.aborted) return;
      setError(e instanceof Error ? e.message : "Unable to load inventory.");
    } finally {
      if (!signal?.aborted) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    const ac = new AbortController();
    void load(ac.signal);
    return () => {
      ac.abort();
    };
  }, [page, debouncedSearch]);

  const handleStartEdit = (p: Product) => {
    setEditingId(p.id);
    setStockInput(String(p.stock));
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setStockInput("");
  };

  const handleSaveStock = async (p: Product) => {
    const stock = Number(stockInput);
    if (!Number.isInteger(stock) || stock < 0) {
      setError("Stock must be a non-negative whole number.");
      return;
    }
    try {
      setSaving(true);
      setError("");
      await adminApi.setStock(p.id, stock);
      // In-place local state update without redundant DB query for entire page
      setProducts((prev) =>
        prev.map((item) => (item.id === p.id ? { ...item, stock } : item)),
      );
      setEditingId(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to update stock.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Inventory"
        description="Stock is updated through the backend inventory service."
      />
      <div className="mb-4 max-w-lg relative">
        <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
        <Input
          className="pl-9"
          placeholder="Search products…"
          value={search}
          onChange={(e) => {
            setPage(1);
            setSearch(e.target.value);
          }}
        />
      </div>
      {error && (
        <div className="mb-4">
          <ErrorState message={error} retry={load} />
        </div>
      )}
      {loading ? (
        <Loading />
      ) : products.length === 0 ? (
        <Empty title="No products found" />
      ) : (
        <div className="overflow-hidden rounded-xl border bg-card">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50">
                <tr className="text-left text-muted-foreground">
                  <th className="p-3">Product</th>
                  <th className="p-3">Price</th>
                  <th className="p-3">Stock</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Update</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => {
                  const isEditing = editingId === p.id;
                  return (
                    <tr key={p.id} className="border-t">
                      <td className="p-3">
                        <p className="font-medium">{p.name}</p>
                        <p className="text-xs text-muted-foreground">{p.category?.name}</p>
                      </td>
                      <td className="p-3">{formatMoney(p.price)}</td>
                      <td className="p-3 font-medium">
                        {isEditing ? (
                          <Input
                            type="number"
                            min="0"
                            step="1"
                            className="h-8 w-24"
                            value={stockInput}
                            onChange={(e) => setStockInput(e.target.value)}
                            autoFocus
                            disabled={saving}
                          />
                        ) : (
                          p.stock
                        )}
                      </td>
                      <td className="p-3">
                        <Badge tone={statusTone(p.status)}>{p.status}</Badge>
                      </td>
                      <td className="p-3 text-right">
                        {isEditing ? (
                          <div className="flex justify-end gap-1.5">
                            <Button
                              size="sm"
                              className="h-8 px-2"
                              disabled={saving}
                              onClick={() => void handleSaveStock(p)}
                            >
                              <Check className="size-3.5" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 px-2"
                              disabled={saving}
                              onClick={handleCancelEdit}
                            >
                              <X className="size-3.5" />
                            </Button>
                          </div>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleStartEdit(p)}
                          >
                            Set stock
                          </Button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between border-t p-3 text-sm">
            <span>
              Page {page} of {Math.max(1, Math.ceil(total / limit))}
            </span>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                Previous
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={page >= Math.ceil(total / limit)}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}