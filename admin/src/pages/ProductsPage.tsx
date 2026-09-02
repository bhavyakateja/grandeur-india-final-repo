import {
  useEffect,
  useRef,
  useState,
} from "react";
import {
  ImagePlus,
  Pencil,
  Plus,
  Search,
  Star,
  Trash2,
  X,
} from "lucide-react";

import {
  adminApi,
  type Category,
  type Product,
  type ProductInput,
  type ProductStatus,
} from "@/lib/admin-api";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import {
  PageHeader,
  Loading,
  ErrorState,
  Empty,
  Badge,
  formatMoney,
  formatDate,
  statusTone,
} from "./common";

const statuses: ProductStatus[] = [
  "DRAFT",
  "ACTIVE",
  "OUT_OF_STOCK",
  "ARCHIVED",
];

function ProductForm({
  initial,
  categories,
  onClose,
  onSaved,
}: {
  initial?: Product;
  categories: Category[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState<ProductInput>({
    name: initial?.name ?? "",
    description: initial?.description ?? "",
    price: Number(initial?.price ?? 0),
    stock: initial?.stock ?? 0,
    categoryId:
      initial?.categoryId ??
      categories[0]?.id ??
      "",
    status:
      initial?.status ??
      "DRAFT",
  });

  const [product, setProduct] =
    useState<Product | undefined>(
      initial,
    );

  const [busy, setBusy] =
    useState(false);

  const [imageBusy, setImageBusy] =
    useState(false);

  const [error, setError] =
    useState("");

  const fileInputRef =
    useRef<HTMLInputElement>(null);

  const save = async (
    e: React.FormEvent,
  ) => {
    e.preventDefault();
    setError("");

    if (
      !form.name.trim() ||
      form.description.trim().length < 10 ||
      !form.categoryId ||
      form.price <= 0 ||
      form.stock < 0
    ) {
      setError(
        "Enter valid product details. Description must be at least 10 characters.",
      );
      return;
    }

    try {
      setBusy(true);

      const saved = product
        ? await adminApi.updateProduct(
          product.id,
          form,
        )
        : await adminApi.createProduct(
          form,
        );

      /*
       * Important:
       * Keep the modal open after creating a new
       * product so images can immediately be uploaded.
       */
      setProduct(saved);

      /*
       * Refresh the product list in the parent,
       * but do NOT close this modal.
       */
      onSaved();
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Unable to save product.",
      );
    } finally {
      setBusy(false);
    }
  };

  const openFilePicker = () => {
    if (!product || imageBusy) {
      return;
    }

    fileInputRef.current?.click();
  };

  const uploadMultiple = async (
    files: File[],
  ) => {
    if (!product) {
      setError(
        "Save the product before attaching images.",
      );
      return;
    }

    const MAX_SIZE =
      10 * 1024 * 1024;

    const allowedTypes = new Set([
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/avif",
    ]);

    const invalidFiles =
      files.filter(
        (file) =>
          !allowedTypes.has(file.type) ||
          file.size > MAX_SIZE,
      );

    if (invalidFiles.length > 0) {
      setError(
        "Only JPEG, PNG, WebP and AVIF images under 10MB are allowed.",
      );
      return;
    }

    if (files.length > 10) {
      setError(
        "You can upload a maximum of 10 images at once.",
      );
      return;
    }

    try {
      setImageBusy(true);
      setError("");

      /*
       * Get one signed upload credential.
       */
      const signature =
        await adminApi.getProductImageUploadSignature(
          product.id,
        );

      /*
       * Upload directly to Cloudinary.
       *
       * All files upload concurrently.
       */
      const uploads =
        await Promise.all(
          files.map(async (file) => {
            const formData =
              new FormData();

            formData.append(
              "file",
              file,
            );

            formData.append(
              "api_key",
              signature.apiKey,
            );

            formData.append(
              "timestamp",
              String(
                signature.timestamp,
              ),
            );

            formData.append(
              "folder",
              signature.folder,
            );

            formData.append(
              "signature",
              signature.signature,
            );

            const response =
              await fetch(
                `https://api.cloudinary.com/v1_1/${signature.cloudName}/image/upload`,
                {
                  method: "POST",
                  body: formData,
                },
              );

            if (!response.ok) {
              const text =
                await response.text();

              throw new Error(
                `Cloudinary upload failed: ${text}`,
              );
            }

            const result =
              (await response.json()) as {
                secure_url: string;
                public_id: string;
              };

            if (
              !result.secure_url ||
              !result.public_id
            ) {
              throw new Error(
                "Cloudinary returned an invalid upload response.",
              );
            }

            return {
              url: result.secure_url,
              publicId: result.public_id,
            };
          }),
        );

      /*
       * One database request for all uploaded
       * Cloudinary assets.
       */
      await adminApi.attachProductImages(
        product.id,
        uploads,
      );

      /*
       * Refresh only once.
       */
      const updated =
        await adminApi.product(
          product.id,
        );

      setProduct(updated);
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Unable to upload images.",
      );
    } finally {
      setImageBusy(false);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleFilesChange = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const files = Array.from(
      e.target.files ?? [],
    );

    if (files.length === 0) {
      return;
    }

    void uploadMultiple(files);
  };

  const setPrimary = async (
    imageId: string,
  ) => {
    if (!product) {
      return;
    }

    try {
      setImageBusy(true);
      setError("");

      await adminApi.setPrimaryProductImage(
        product.id,
        imageId,
      );

      const updated =
        await adminApi.product(
          product.id,
        );

      setProduct(updated);

      onSaved();
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Unable to set primary image.",
      );
    } finally {
      setImageBusy(false);
    }
  };

  const removeImage = async (
    imageId: string,
  ) => {
    if (
      !product ||
      !window.confirm(
        "Remove this product image?",
      )
    ) {
      return;
    }

    try {
      setImageBusy(true);
      setError("");

      await adminApi.deleteProductImage(
        product.id,
        imageId,
      );

      const updated =
        await adminApi.product(
          product.id,
        );

      setProduct(updated);

      onSaved();
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Unable to remove image.",
      );
    } finally {
      setImageBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/50 p-4">
      <div className="mx-auto my-8 max-w-3xl rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b p-6">
          <div>
            <h2 className="text-lg font-semibold">
              {initial
                ? "Edit product"
                : product
                  ? "Product created"
                  : "Create product"}
            </h2>

            <p className="text-sm text-muted-foreground">
              Catalog data and media are managed
              through the admin API.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
          >
            <X />
          </button>
        </div>

        <form
          onSubmit={save}
          className="space-y-5 p-6"
        >
          {error && (
            <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div>
            <Label htmlFor="pname">
              Name
            </Label>

            <Input
              id="pname"
              className="mt-2"
              value={form.name}
              onChange={(e) =>
                setForm({
                  ...form,
                  name: e.target.value,
                })
              }
              required
              maxLength={150}
            />
          </div>

          <div>
            <Label htmlFor="pdesc">
              Description
            </Label>

            <Textarea
              id="pdesc"
              className="mt-2 min-h-28"
              value={form.description}
              onChange={(e) =>
                setForm({
                  ...form,
                  description:
                    e.target.value,
                })
              }
              required
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="price">
                Price (INR)
              </Label>

              <Input
                id="price"
                className="mt-2"
                type="number"
                min="0.01"
                step="0.01"
                value={form.price}
                onChange={(e) =>
                  setForm({
                    ...form,
                    price: Number(
                      e.target.value,
                    ),
                  })
                }
                required
              />
            </div>

            <div>
              <Label htmlFor="stock">
                Stock
              </Label>

              <Input
                id="stock"
                className="mt-2"
                type="number"
                min="0"
                step="1"
                value={form.stock}
                onChange={(e) =>
                  setForm({
                    ...form,
                    stock: Number(
                      e.target.value,
                    ),
                  })
                }
                required
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>
                Category
              </Label>

              <select
                className="mt-2 h-9 w-full rounded-md border px-3 text-sm"
                value={form.categoryId}
                onChange={(e) =>
                  setForm({
                    ...form,
                    categoryId:
                      e.target.value,
                  })
                }
                required
              >
                <option value="">
                  Select category
                </option>

                {categories.map(
                  (category) => (
                    <option
                      key={category.id}
                      value={category.id}
                    >
                      {category.name}
                    </option>
                  ),
                )}
              </select>
            </div>

            <div>
              <Label>
                Status
              </Label>

              <select
                className="mt-2 h-9 w-full rounded-md border px-3 text-sm"
                value={form.status}
                onChange={(e) =>
                  setForm({
                    ...form,
                    status:
                      e.target.value as ProductStatus,
                  })
                }
              >
                {statuses.map(
                  (status) => (
                    <option
                      key={status}
                      value={status}
                    >
                      {status}
                    </option>
                  ),
                )}
              </select>
            </div>
          </div>

          {/* Product Images */}
          <div className="rounded-xl border p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="font-medium">
                  Product images
                </h3>

                <p className="text-xs text-muted-foreground">
                  Upload, choose the primary
                  image, or remove an image.
                </p>
              </div>

              <div>
                <Button
                  type="button"
                  onClick={openFilePicker}
                  disabled={
                    imageBusy ||
                    !product
                  }
                  variant={
                    product
                      ? "default"
                      : "secondary"
                  }
                >
                  <ImagePlus className="size-4" />

                  {imageBusy
                    ? "Uploading…"
                    : "Add image"}
                </Button>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/avif"
                  multiple
                  className="hidden"
                  disabled={
                    imageBusy || !product
                  }
                  onChange={(e) => {
                    const files = Array.from(
                      e.target.files ?? [],
                    );

                    if (files.length > 0) {
                      void uploadMultiple(files);
                    }
                  }}
                />
              </div>
            </div>

            {!product ? (
              <div className="mt-4 rounded-lg bg-slate-50 p-3 text-sm text-muted-foreground">
                Save the product first to
                attach images.
              </div>
            ) : product.images.length ===
              0 ? (
              <div className="mt-4 rounded-lg bg-slate-50 p-3 text-sm text-muted-foreground">
                No images attached. Click
                <strong className="mx-1">
                  Add image
                </strong>
                to upload the first image.
              </div>
            ) : (
              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {product.images.map(
                  (image) => (
                    <div
                      key={image.id}
                      className="group relative overflow-hidden rounded-lg border"
                    >
                      <img
                        src={image.url}
                        alt={
                          product.name
                        }
                        className="aspect-square w-full object-cover"
                      />

                      <div className="flex items-center justify-between gap-1 p-2">
                        <button
                          type="button"
                          className="inline-flex items-center gap-1 text-xs"
                          onClick={() =>
                            void setPrimary(
                              image.id,
                            )
                          }
                          disabled={
                            imageBusy ||
                            image.isPrimary
                          }
                        >
                          {image.isPrimary ? (
                            <>
                              <Star className="size-3 fill-current" />
                              Primary
                            </>
                          ) : (
                            <>
                              <Star className="size-3" />
                              Make primary
                            </>
                          )}
                        </button>

                        <button
                          type="button"
                          className="text-red-600"
                          onClick={() =>
                            void removeImage(
                              image.id,
                            )
                          }
                          disabled={
                            imageBusy
                          }
                          aria-label="Remove image"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </div>
                    </div>
                  ),
                )}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 border-t pt-5">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
            >
              Close
            </Button>

            <Button
              type="submit"
              disabled={busy}
            >
              {busy
                ? "Saving…"
                : product
                  ? "Save changes"
                  : "Create product"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function ProductsPage() {
  const [products, setProducts] =
    useState<Product[]>([]);

  const [categories, setCategories] =
    useState<Category[]>([]);

  const [total, setTotal] =
    useState(0);

  const [page, setPage] =
    useState(1);

  const [search, setSearch] =
    useState("");

  const [status, setStatus] =
    useState("");

  const [category, setCategory] =
    useState("");

  const [sort, setSort] =
    useState("-createdAt");

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [editing, setEditing] =
    useState<
      Product | "new" | null
    >(null);

  const [notice, setNotice] =
    useState("");

  const limit = 12;

  const load = async () => {
    try {
      setLoading(true);
      setError("");

      const [
        result,
        cats,
      ] = await Promise.all([
        adminApi.products({
          page,
          limit,
          search:
            search.trim() ||
            undefined,
          status:
            (status ||
              undefined) as
            | ProductStatus
            | undefined,
          category:
            category || undefined,
          sort,
        }),
        adminApi.categories(),
      ]);

      setProducts(
        result.products,
      );

      setTotal(result.total);

      setCategories(cats);
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Unable to load products.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [
    page,
    search,
    status,
    category,
    sort,
  ]);

  const remove = async (
    product: Product,
  ) => {
    if (
      !window.confirm(
        `Delete "${product.name}"? This cannot be undone.`,
      )
    ) {
      return;
    }

    try {
      await adminApi.deleteProduct(
        product.id,
      );

      setNotice(
        "Product deleted.",
      );

      void load();
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Unable to delete product.",
      );
    }
  };

  return (
    <div>
      <PageHeader
        title="Products"
        description={`${total} products in the catalog.`}
        action={
          <Button
            onClick={() =>
              setEditing("new")
            }
          >
            <Plus />
            New product
          </Button>
        }
      />

      {notice && (
        <div className="mb-4 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700">
          {notice}
        </div>
      )}

      {error && (
        <div className="mb-4">
          <ErrorState
            message={error}
            retry={load}
          />
        </div>
      )}

      <div className="mb-4 grid gap-3 md:grid-cols-[1fr_180px_180px_180px]">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />

          <Input
            className="pl-9"
            placeholder="Search products…"
            value={search}
            onChange={(e) => {
              setPage(1);
              setSearch(
                e.target.value,
              );
            }}
          />
        </div>

        <select
          className="h-9 rounded-md border px-3 text-sm"
          value={category}
          onChange={(e) => {
            setPage(1);
            setCategory(
              e.target.value,
            );
          }}
        >
          <option value="">
            All categories
          </option>

          {categories.map(
            (category) => (
              <option
                key={category.id}
                value={category.slug}
              >
                {category.name}
              </option>
            ),
          )}
        </select>

        <select
          className="h-9 rounded-md border px-3 text-sm"
          value={status}
          onChange={(e) => {
            setPage(1);
            setStatus(
              e.target.value,
            );
          }}
        >
          <option value="">
            All statuses
          </option>

          {statuses.map(
            (status) => (
              <option
                key={status}
                value={status}
              >
                {status}
              </option>
            ),
          )}
        </select>

        <select
          className="h-9 rounded-md border px-3 text-sm"
          value={sort}
          onChange={(e) =>
            setSort(
              e.target.value,
            )
          }
        >
          <option value="-createdAt">
            Newest
          </option>
          <option value="createdAt">
            Oldest
          </option>
          <option value="name">
            Name A–Z
          </option>
          <option value="-name">
            Name Z–A
          </option>
          <option value="price">
            Price low–high
          </option>
          <option value="-price">
            Price high–low
          </option>
        </select>
      </div>

      {loading ? (
        <Loading />
      ) : products.length === 0 ? (
        <Empty
          title="No products found"
          description="Try changing the filters or create a product."
        />
      ) : (
        <div className="overflow-hidden rounded-xl border bg-card">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50">
                <tr className="text-left text-muted-foreground">
                  <th className="p-3">
                    Product
                  </th>

                  <th className="p-3">
                    Category
                  </th>

                  <th className="p-3">
                    Price
                  </th>

                  <th className="p-3">
                    Stock
                  </th>

                  <th className="p-3">
                    Status
                  </th>

                  <th className="p-3">
                    Updated
                  </th>

                  <th className="p-3 text-right">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody>
                {products.map(
                  (product) => {
                    const image =
                      product.images?.find(
                        (item) =>
                          item.isPrimary,
                      ) ??
                      product.images?.[0];

                    return (
                      <tr
                        key={
                          product.id
                        }
                        className="border-t"
                      >
                        <td className="p-3">
                          <div className="flex items-center gap-3">
                            {image?.url ? (
                              <img
                                src={
                                  image.url
                                }
                                alt=""
                                className="h-10 w-10 rounded-md object-cover"
                              />
                            ) : (
                              <div className="h-10 w-10 rounded-md bg-slate-100" />
                            )}

                            <div>
                              <p className="font-medium">
                                {
                                  product.name
                                }
                              </p>

                              <p className="text-xs text-muted-foreground">
                                {
                                  product.slug
                                }
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="p-3">
                          {
                            product
                              .category
                              ?.name ??
                            "—"
                          }
                        </td>

                        <td className="p-3">
                          {formatMoney(
                            product.price,
                          )}
                        </td>

                        <td className="p-3">
                          {
                            product.stock
                          }
                        </td>

                        <td className="p-3">
                          <Badge
                            tone={statusTone(
                              product.status,
                            )}
                          >
                            {
                              product.status
                            }
                          </Badge>
                        </td>

                        <td className="p-3">
                          {formatDate(
                            product.updatedAt,
                          )}
                        </td>

                        <td className="p-3 text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                setEditing(
                                  product,
                                )
                              }
                            >
                              <Pencil />
                            </Button>

                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() =>
                                void remove(
                                  product,
                                )
                              }
                            >
                              <Trash2 />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  },
                )}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between border-t p-3 text-sm">
            <span>
              Page {page} of{" "}
              {Math.max(
                1,
                Math.ceil(
                  total / limit,
                ),
              )}
            </span>

            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                disabled={page <= 1}
                onClick={() =>
                  setPage(
                    (value) =>
                      value - 1,
                  )
                }
              >
                Previous
              </Button>

              <Button
                size="sm"
                variant="outline"
                disabled={
                  page >=
                  Math.ceil(
                    total / limit,
                  )
                }
                onClick={() =>
                  setPage(
                    (value) =>
                      value + 1,
                  )
                }
              >
                Next
              </Button>
            </div>
          </div>
        </div>
      )}

      {editing && (
        <ProductForm
          initial={
            editing === "new"
              ? undefined
              : editing
          }
          categories={categories}
          onClose={() =>
            setEditing(null)
          }
          onSaved={() => {
            setNotice(
              editing === "new"
                ? "Product saved successfully."
                : "Product updated successfully.",
            );

            void load();
          }}
        />
      )}
    </div>
  );
}