"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion, type Variants } from "framer-motion";
import { staggerContainer, fadeUp } from "@/lib/animations";
import PageWrapper from "@/components/shared/PageWrapper";

import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import type { Category, MenuItem } from "@/lib/types/database";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ItemFormState {
  name: string;
  description: string;
  price: string;
  category_id: string;
  image_url: string;
  is_available: boolean;
}

const EMPTY_FORM: ItemFormState = {
  name: "",
  description: "",
  price: "",
  category_id: "",
  image_url: "",
  is_available: true,
};

const ALL = "__all__";

// ─── AddEditItemModal ─────────────────────────────────────────────────────────

interface ModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: Category[];
  editingItem: MenuItem | null;
  onSuccess: (item: MenuItem) => void;
}

function AddEditItemModal({
  open,
  onOpenChange,
  categories,
  editingItem,
  onSuccess,
}: ModalProps) {
  const [form, setForm] = useState<ItemFormState>(EMPTY_FORM);
  const [imagePreview, setImagePreview] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open || categories.length === 0) return;;
    if (editingItem) {
      setForm({
        name: editingItem.name,
        description: editingItem.description ?? "",
        price: String(editingItem.price),
        category_id: editingItem.category_id,
        image_url: editingItem.image_url ?? "",
        is_available: editingItem.is_available,
      });
      setImagePreview(editingItem.image_url ?? "");
    } else {
      setForm(EMPTY_FORM);
      setImagePreview("");
    }
  }, [open, editingItem]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const localPreview = URL.createObjectURL(file);
    setImagePreview(localPreview);
    setIsUploading(true);

    try {
      const fd = new FormData();
      fd.append("image", file);
      const res = await fetch("/api/admin/menu/upload", {
        method: "POST",
        body: fd,
      });
      const json = (await res.json()) as {
        data?: { url: string };
        error?: string;
      };
      if (!res.ok || !json.data?.url) {
        throw new Error(json.error ?? "Upload failed");
      }
      setForm((p) => ({ ...p, image_url: json.data!.url }));
      toast.success("Image uploaded");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
      setImagePreview(form.image_url);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const price = parseFloat(form.price);
    if (!form.name.trim() || !form.category_id || isNaN(price) || price <= 0) {
      toast.error("Please fill in all required fields");
      return;
    }

    const payload = {
      name: form.name.trim(),
      ...(form.description.trim() && { description: form.description.trim() }),
      price,
      category_id: form.category_id,
      ...(form.image_url && { image_url: form.image_url }),
      is_available: form.is_available,
    };

    setIsSubmitting(true);
    try {
      const url = editingItem
        ? `/api/admin/menu/${editingItem.id}`
        : "/api/admin/menu";
      const res = await fetch(url, {
        method: editingItem ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = (await res.json()) as {
        data?: { item: MenuItem };
        error?: string;
      };
      if (!res.ok || !json.data?.item) {
        throw new Error(json.error ?? "Request failed");
      }
      toast.success(editingItem ? "Item updated" : "Item added");
      onSuccess(json.data.item);
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" showCloseButton>
        <DialogHeader>
          <DialogTitle>{editingItem ? "Edit Item" : "Add Item"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Image */}
          <div className="flex flex-col gap-1.5">
            <Label>Image</Label>
            <div
              className="relative flex h-28 w-full cursor-pointer items-center justify-center overflow-hidden rounded-lg border-2 border-dashed border-input transition-colors hover:border-ring"
              onClick={() => fileInputRef.current?.click()}
            >
              {imagePreview ? (
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="text-sm text-muted-foreground">
                  Click to browse (JPEG or PNG, max 2 MB)
                </span>
              )}
              {isUploading && (
                <div className="absolute inset-0 flex items-center justify-center bg-background/70">
                  <span className="text-sm font-medium">Uploading…</span>
                </div>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>

          {/* Name */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="modal-name">Name *</Label>
            <Input
              id="modal-name"
              value={form.name}
              onChange={(e) =>
                setForm((p) => ({ ...p, name: e.target.value }))
              }
              placeholder="e.g. Masala Dosa"
              required
            />
          </div>

          {/* Category */}
          <div className="flex flex-col gap-1.5">
            <Label>Category *</Label>
            <Select
  key={form.category_id}
  value={form.category_id}
  onValueChange={(val) =>
    setForm((p) => ({ ...p, category_id: val ?? "" }))
  }
>
              <SelectTrigger className="w-full">
              <SelectValue placeholder="Select category">
  {categories.find(c => c.id === form.category_id)?.name ?? "Select category"}
</SelectValue>
              </SelectTrigger>
              <SelectContent>
              {categories.map(cat => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}  
                    </SelectItem>
                      ))}
              </SelectContent>
            </Select>
          </div>

          {/* Price */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="modal-price">Price (₹) *</Label>
            <Input
              id="modal-price"
              type="number"
              min="0.01"
              step="0.01"
              value={form.price}
              onChange={(e) =>
                setForm((p) => ({ ...p, price: e.target.value }))
              }
              placeholder="0.00"
              required
            />
          </div>

          {/* Description */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="modal-desc">Description</Label>
            <Textarea
              id="modal-desc"
              value={form.description}
              onChange={(e) =>
                setForm((p) => ({ ...p, description: e.target.value }))
              }
              placeholder="Optional description"
              rows={2}
            />
          </div>

          {/* Available */}
          <div className="flex items-center gap-2.5">
            <Switch
              id="modal-available"
              checked={form.is_available}
              onCheckedChange={(checked) =>
                setForm((p) => ({ ...p, is_available: checked }))
              }
            />
            <Label htmlFor="modal-available" className="cursor-pointer">
              Available for ordering
            </Label>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-[#F97316] text-white hover:bg-[#ea6c0f]"
              disabled={isSubmitting || isUploading}
            >
              {isSubmitting
                ? "Saving…"
                : editingItem
                  ? "Save Changes"
                  : "Add Item"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── DeleteConfirmDialog ──────────────────────────────────────────────────────

interface DeleteConfirmProps {
  item: MenuItem | null;
  onClose: () => void;
  onConfirm: (id: string) => Promise<void>;
}

function DeleteConfirmDialog({ item, onClose, onConfirm }: DeleteConfirmProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleConfirm = async () => {
    if (!item) return;
    setIsDeleting(true);
    try {
      await onConfirm(item.id);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AlertDialog open={!!item} onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent size="sm">
        <AlertDialogHeader>
          <AlertDialogTitle>Delete &ldquo;{item?.name}&rdquo;?</AlertDialogTitle>
          <AlertDialogDescription>
            If this item has active orders, it will be marked unavailable
            instead of being permanently deleted.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onClose} disabled={isDeleting}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            disabled={isDeleting}
            onClick={handleConfirm}
          >
            {isDeleting ? "Deleting…" : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminMenuPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState(ALL);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [deletingItem, setDeletingItem] = useState<MenuItem | null>(null);

  const fetchMenu = useCallback(async () => {
    try {
      const res = await fetch("/api/menu");
      const json = (await res.json()) as {
        data?: { categories: Category[]; items: MenuItem[] };
      };
      setCategories(json.data?.categories ?? []);
      setItems(json.data?.items ?? []);
    } catch {
      toast.error("Failed to load menu");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMenu();
  }, [fetchMenu]);

  const openAddModal = () => {
    setEditingItem(null);
    setIsModalOpen(true);
  };

  const openEditModal = (item: MenuItem) => {
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const handleModalSuccess = (saved: MenuItem) => {
    setItems((prev) => {
      const exists = prev.some((i) => i.id === saved.id);
      return exists
        ? prev.map((i) => (i.id === saved.id ? saved : i))
        : [...prev, saved];
    });
  };

  const handleToggleAvailable = async (item: MenuItem) => {
    const next = !item.is_available;
    setItems((prev) =>
      prev.map((i) => (i.id === item.id ? { ...i, is_available: next } : i)),
    );
    try {
      const res = await fetch(`/api/admin/menu/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_available: next }),
      });
      if (!res.ok) throw new Error("Update failed");
    } catch {
      setItems((prev) => prev.map((i) => (i.id === item.id ? item : i)));
      toast.error("Failed to update availability");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/menu/${id}`, { method: "DELETE" });
      const json = (await res.json()) as {
        data?: { deleted: boolean; disabled: boolean };
        error?: string;
      };
      if (!res.ok) throw new Error(json.error ?? "Delete failed");

      if (json.data?.deleted) {
        setItems((prev) => prev.filter((i) => i.id !== id));
        toast.success("Item deleted");
      } else {
        setItems((prev) =>
          prev.map((i) => (i.id === id ? { ...i, is_available: false } : i)),
        );
        toast.info("Item has active orders — marked as unavailable instead");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Delete failed");
    } finally {
      setDeletingItem(null);
    }
  };

  const filtered =
    selectedCategory === ALL
      ? items
      : items.filter((i) => i.category_id === selectedCategory);

  const catName = (catId: string) =>
    categories.find((c) => c.id === catId)?.name ?? "—";

  return (
    <PageWrapper variant='fade'>
    <main className="relative flex-1 p-4 md:p-6 text-[#3D2B1F]">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[#EED6BB]" />
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[url('/w2.png')] bg-cover bg-center bg-no-repeat opacity-65" />
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-[#3D2B1F]">Menu Management</h1>
        <Button
          className="rounded-lg bg-[#F97316] px-4 py-2 font-semibold text-white hover:bg-[#ea6c0f]"
          onClick={openAddModal}
        >
          + Add Item
        </Button>
      </div>

      {/* Category filter tabs */}
      <div className="mb-4 flex flex-wrap gap-2">
        {isLoading ? (
          Array.from({ length: 6 }).map((_, idx) => (
            <span
              key={`pill-skeleton-${idx}`}
              className="relative h-8 overflow-hidden rounded-full border border-[#D8C2AA] bg-[#F0E5D6]"
              style={{ width: idx === 0 ? 64 : idx % 2 === 0 ? 92 : 112 }}
            >
              <span
                className="absolute inset-y-0 -left-1/3 w-1/3 bg-[#E4D0B7]/70"
                style={{ animation: "shimmer 1.5s linear infinite" }}
              />
            </span>
          ))
        ) : (
          [{ id: ALL, name: "All" }, ...categories].map((cat) => (
            <button
              key={cat.id}
              className={`rounded-full px-4 py-1.5 text-sm font-semibold transition-all duration-200 ${
                selectedCategory === cat.id
                  ? "bg-[#3D2B1F] text-white"
                  : "border border-[#92400E] bg-[#FDF6EE] text-[#92400E] hover:bg-[#F5E6D3]"
              }`}
              onClick={() => setSelectedCategory(cat.id)}
            >
              {cat.name}
            </button>
          ))
        )}
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="overflow-x-auto rounded-xl border border-[#92400E]/15 bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#92400E]/15 bg-[#FDF6EE] text-left">
                {["Image", "Name", "Category", "Price", "Available", "Actions"].map(
                  (h) => (
                    <th
                      key={h}
                      className="px-4 py-3 font-medium text-[#6B4F3A]"
                    >
                      {h}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 7 }).map((_, idx) => (
                <tr
                  key={`row-skeleton-${idx}`}
                  className={`border-b border-[#92400E]/10 last:border-0 ${
                    idx % 2 === 0 ? "bg-white" : "bg-[#FDF6EE]/35"
                  }`}
                >
                  <td className="px-4 py-2.5">
                    <div className="relative h-10 w-10 overflow-hidden rounded bg-[#F0E5D6]">
                      <div className="absolute inset-y-0 -left-1/3 w-1/3 bg-[#E4D0B7]/70" style={{ animation: "shimmer 1.5s linear infinite" }} />
                    </div>
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="relative h-4 w-32 overflow-hidden rounded bg-[#F0E5D6]">
                      <div className="absolute inset-y-0 -left-1/3 w-1/3 bg-[#E4D0B7]/70" style={{ animation: "shimmer 1.5s linear infinite" }} />
                    </div>
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="relative h-4 w-24 overflow-hidden rounded bg-[#F0E5D6]">
                      <div className="absolute inset-y-0 -left-1/3 w-1/3 bg-[#E4D0B7]/70" style={{ animation: "shimmer 1.5s linear infinite" }} />
                    </div>
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="relative h-4 w-16 overflow-hidden rounded bg-[#F0E5D6]">
                      <div className="absolute inset-y-0 -left-1/3 w-1/3 bg-[#E4D0B7]/70" style={{ animation: "shimmer 1.5s linear infinite" }} />
                    </div>
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="relative h-6 w-10 overflow-hidden rounded-full bg-[#F0E5D6]">
                      <div className="absolute inset-y-0 -left-1/3 w-1/3 bg-[#E4D0B7]/70" style={{ animation: "shimmer 1.5s linear infinite" }} />
                    </div>
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="flex gap-2">
                      <div className="relative h-8 w-14 overflow-hidden rounded-lg bg-[#F0E5D6]">
                        <div className="absolute inset-y-0 -left-1/3 w-1/3 bg-[#E4D0B7]/70" style={{ animation: "shimmer 1.5s linear infinite" }} />
                      </div>
                      <div className="relative h-8 w-16 overflow-hidden rounded-lg bg-[#F0E5D6]">
                        <div className="absolute inset-y-0 -left-1/3 w-1/3 bg-[#E4D0B7]/70" style={{ animation: "shimmer 1.5s linear infinite" }} />
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : filtered.length === 0 ? (
        <p className="rounded-lg border border-dashed border-[#92400E]/25 bg-[#FDF6EE]/60 py-12 text-center text-sm text-[#6B4F3A]">
          No items found
        </p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-[#92400E]/15 bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#92400E]/15 bg-[#FDF6EE] text-left">
                {["Image", "Name", "Category", "Price", "Available", "Actions"].map(
                  (h) => (
                    <th
                      key={h}
                      className="px-4 py-3 font-medium text-[#6B4F3A]"
                    >
                      {h}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <motion.tbody
              variants={staggerContainer as Variants}
              initial='hidden'
              animate='visible'
            >
              {filtered.map((item, idx) => (
                <motion.tr
                  key={item.id}
                  variants={fadeUp as Variants}
                  className={`border-b border-[#92400E]/10 last:border-0 transition-colors hover:bg-[#FDF6EE]/80 ${
                    idx % 2 === 0 ? "bg-white/90" : "bg-[#FDF6EE]/45"
                  }`}
                >
                  <td className="px-4 py-2.5">
                    {item.image_url ? (
                      <img
                        src={item.image_url}
                        alt={item.name}
                        className="h-10 w-10 rounded object-cover"
                      />
                    ) : (
                      <div className="h-10 w-10 rounded bg-muted" />
                    )}
                  </td>
                  <td className="px-4 py-2.5 font-semibold text-[#3D2B1F]">{item.name}</td>
                  <td className="px-4 py-2.5">
                    <span className="inline-flex rounded-full border border-[#92400E]/20 bg-[#FDF6EE] px-2.5 py-0.5 text-xs font-medium text-[#6B4F3A]">
                      {catName(item.category_id)}
                    </span>
                  </td>
                  <td className="px-4 py-2.5">₹{item.price.toFixed(2)}</td>
                  <td className="px-4 py-2.5">
                    <Switch
                      checked={item.is_available}
                      onCheckedChange={() => handleToggleAvailable(item)}
                    />
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="rounded-lg border-[#92400E]/35 bg-[#FDF6EE] font-semibold text-[#3D2B1F] hover:bg-[#F5E6D3]"
                        onClick={() => openEditModal(item)}
                      >
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="rounded-lg border-red-300 bg-red-50 font-semibold text-red-700 hover:bg-red-100 hover:text-red-800"
                        onClick={() => setDeletingItem(item)}
                      >
                        Delete
                      </Button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </motion.tbody>
          </table>
        </div>
      )}

      <AddEditItemModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        categories={categories}
        editingItem={editingItem}
        onSuccess={handleModalSuccess}
      />

      <DeleteConfirmDialog
        item={deletingItem}
        onClose={() => setDeletingItem(null)}
        onConfirm={handleDelete}
      />
    </main>
    </PageWrapper>
  );
}
