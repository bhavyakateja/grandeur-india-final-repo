import {
  useEffect,
  useState,
} from "react";

import {
  ImagePlus,
  Pencil,
  Plus,
  Trash2,
  X,
} from "lucide-react";

import {
  adminApi,
  type Category,
  type CategoryImageUploadSignature,
} from "@/lib/admin-api";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import {
  PageHeader,
  Loading,
  ErrorState,
  Empty,
  Badge,
} from "./common";

function CategoryForm({
  initial,
  onClose,
  onSaved,
}: {
  initial?: Category;
  onClose: () => void;
  onSaved: (category: Category) => void;
}) {
  const [category, setCategory] =
    useState<Category | undefined>(
      initial,
    );

  const [name, setName] =
    useState(initial?.name ?? "");

  const [active, setActive] =
    useState(
      initial?.isActive ?? true,
    );

  const [busy, setBusy] =
    useState(false);

  const [imageBusy, setImageBusy] =
    useState(false);

  const [error, setError] =
    useState("");

  const save = async (
    e: React.FormEvent,
  ) => {
    e.preventDefault();

    if (name.trim().length < 2) {
      setError(
        "Category name must be at least 2 characters.",
      );
      return;
    }

    try {
      setBusy(true);
      setError("");

      const payload = {
        name: name.trim(),
        isActive: active,
      };

      const saved = initial
        ? await adminApi.updateCategory(
            initial.id,
            payload,
          )
        : await adminApi.createCategory(
            payload,
          );

      setCategory(saved);

      onSaved(saved);
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Unable to save category.",
      );
    } finally {
      setBusy(false);
    }
  };

  const uploadImage = async (
    file: File,
  ) => {
    if (!category) {
      setError(
        "Save the category first.",
      );
      return;
    }

    if (!file.type.startsWith("image/")) {
      setError(
        "Please select an image file.",
      );
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError(
        "Category image must be 10MB or smaller.",
      );
      return;
    }

    try {
      setImageBusy(true);
      setError("");

      const signatureResponse =
        await adminApi.getCategoryImageUploadSignature(
          category.id,
        );

      const signature =
        signatureResponse;

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
        String(signature.timestamp),
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
        const body =
          await response.json().catch(
            () => null,
          );

        throw new Error(
          body?.error?.message ??
            "Cloudinary image upload failed.",
        );
      }

      const uploaded =
        (await response.json()) as {
          secure_url: string;
          public_id: string;
        };

      const updated =
        await adminApi.updateCategory(
          category.id,
          {
            imageUrl:
              uploaded.secure_url,
            imagePublicId:
              uploaded.public_id,
          },
        );

      setCategory(updated);

      onSaved(updated);
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Unable to upload category image.",
      );
    } finally {
      setImageBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/50 p-4">
      <form
        onSubmit={save}
        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
      >
        <div className="flex justify-between">
          <div>
            <h2 className="text-lg font-semibold">
              {initial
                ? "Edit category"
                : "Create category"}
            </h2>

            <p className="text-sm text-muted-foreground">
              The backend generates the slug.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={busy || imageBusy}
          >
            <X />
          </button>
        </div>

        {error && (
          <div className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="mt-5">
          <Label>Name</Label>

          <Input
            className="mt-2"
            value={name}
            onChange={(e) =>
              setName(e.target.value)
            }
            required
            maxLength={100}
          />
        </div>

        <label className="mt-5 flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={active}
            onChange={(e) =>
              setActive(e.target.checked)
            }
          />

          Active category
        </label>

        {/* Category image */}
        <div className="mt-6">
          <Label>Category image</Label>

          <div className="mt-3 overflow-hidden rounded-xl border bg-slate-50">
            {category?.imageUrl ? (
              <img
                src={category.imageUrl}
                alt={category.name}
                className="h-48 w-full object-cover"
              />
            ) : (
              <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
                No category image
              </div>
            )}
          </div>

          <label
            className={[
              "mt-3 flex cursor-pointer items-center justify-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition",
              imageBusy ||
              !category
                ? "pointer-events-none opacity-50"
                : "hover:bg-slate-50",
            ].join(" ")}
          >
            <ImagePlus size={18} />

            {imageBusy
              ? "Uploading…"
              : category?.imageUrl
                ? "Replace image"
                : "Upload image"}

            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/avif"
              className="hidden"
              disabled={
                imageBusy ||
                !category
              }
              onChange={(e) => {
                const file =
                  e.target.files?.[0];

                if (file) {
                  void uploadImage(file);
                }

                e.currentTarget.value =
                  "";
              }}
            />
          </label>

          {!category && (
            <p className="mt-2 text-xs text-muted-foreground">
              Save the category first, then upload
              its image.
            </p>
          )}
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={
              busy || imageBusy
            }
          >
            Cancel
          </Button>

          <Button
            disabled={
              busy || imageBusy
            }
          >
            {busy
              ? "Saving…"
              : "Save"}
          </Button>
        </div>
      </form>
    </div>
  );
}

export default function CategoriesPage() {
  const [categories, setCategories] =
    useState<Category[]>([]);

  const [search, setSearch] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [editing, setEditing] =
    useState<
      Category | "new" | null
    >(null);

  const [notice, setNotice] =
    useState("");

  const load = async () => {
    try {
      setLoading(true);
      setError("");

      setCategories(
        await adminApi.categories(
          search.trim() || undefined,
        ),
      );
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Unable to load categories.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [search]);

  const remove = async (
    category: Category,
  ) => {
    if (
      !window.confirm(
        `Deactivate "${category.name}"?`,
      )
    ) {
      return;
    }

    try {
      await adminApi.deleteCategory(
        category.id,
      );

      setNotice(
        "Category deactivated.",
      );

      void load();
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Unable to deactivate category.",
      );
    }
  };

  const handleSaved = (
    category: Category,
  ) => {
    setCategories((current) => {
      const exists =
        current.some(
          (item) =>
            item.id === category.id,
        );

      if (exists) {
        return current.map((item) =>
          item.id === category.id
            ? category
            : item,
        );
      }

      return [
        category,
        ...current,
      ];
    });

    setNotice(
      editing === "new"
        ? "Category created."
        : "Category updated.",
    );

    /*
     * IMPORTANT:
     *
     * Do NOT close the modal here.
     * The category must remain open after
     * creation so its image can be uploaded.
     */
  };

  return (
    <div>
      <PageHeader
        title="Categories"
        description="Manage catalog categories."
        action={
          <Button
            onClick={() =>
              setEditing("new")
            }
          >
            <Plus />
            New category
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

      <div className="mb-4 max-w-md">
        <Input
          placeholder="Search categories…"
          value={search}
          onChange={(e) =>
            setSearch(e.target.value)
          }
        />
      </div>

      {loading ? (
        <Loading />
      ) : categories.length === 0 ? (
        <Empty title="No categories found" />
      ) : (
        <div className="overflow-hidden rounded-xl border bg-card">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50">
                <tr className="text-left text-muted-foreground">
                  <th className="p-3">
                    Image
                  </th>

                  <th className="p-3">
                    Name
                  </th>

                  <th className="p-3">
                    Slug
                  </th>

                  <th className="p-3">
                    Products
                  </th>

                  <th className="p-3">
                    Status
                  </th>

                  <th className="p-3 text-right">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody>
                {categories.map(
                  (category) => (
                    <tr
                      key={category.id}
                      className="border-t"
                    >
                      <td className="p-3">
                        {category.imageUrl ? (
                          <img
                            src={
                              category.imageUrl
                            }
                            alt={
                              category.name
                            }
                            className="h-12 w-16 rounded-lg object-cover"
                          />
                        ) : (
                          <div className="flex h-12 w-16 items-center justify-center rounded-lg bg-slate-100 text-xs text-muted-foreground">
                            None
                          </div>
                        )}
                      </td>

                      <td className="p-3 font-medium">
                        {category.name}
                      </td>

                      <td className="p-3 text-muted-foreground">
                        {category.slug}
                      </td>

                      <td className="p-3">
                        {category._count?.products ??
                          "—"}
                      </td>

                      <td className="p-3">
                        <Badge
                          tone={
                            category.isActive
                              ? "green"
                              : "red"
                          }
                        >
                          {category.isActive
                            ? "ACTIVE"
                            : "INACTIVE"}
                        </Badge>
                      </td>

                      <td className="p-3">
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              setEditing(
                                category,
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
                                category,
                              )
                            }
                          >
                            <Trash2 />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ),
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {editing && (
        <CategoryForm
          initial={
            editing === "new"
              ? undefined
              : editing
          }
          onClose={() =>
            setEditing(null)
          }
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}