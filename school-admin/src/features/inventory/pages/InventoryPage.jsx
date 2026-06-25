import { useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import { ImageOff, Plus, Pencil, Trash2 } from "lucide-react";
import {
  PageHeader,
  Badge,
  Modal,
  inputClass,
} from "../../../components/shared/ui";
import Pagination from "../../../components/shared/Pagination";
import { useDebouncedValue } from "../../../lib/useDebouncedValue";
import {
  useInventory,
  useUpdateSchoolProduct,
  useDeleteSchoolProduct,
} from "../hooks/useInventory";

const PAGE_SIZE = 12;
const LISTING_TYPES = ["Thrift Store", "Lost and Found"];
const CONDITIONS = ["Excellent", "Good", "Fair", "Poor"];
const EDITABLE = [
  "name",
  "category",
  "price",
  "gender",
  "age",
  "condition",
  "listing_type",
  "status",
  "description",
];

// product_status enum values (must match the DB exactly).
const PRODUCT_STATUSES = [
  "Available",
  "Reserved",
  "Claimed",
  "Sold",
  "Pending",
  "Cancelled",
];

const STATUS_TONE = {
  Available: "success",
  Reserved: "info",
  Claimed: "primary",
  Sold: "neutral",
  Pending: "warning",
  Cancelled: "danger",
};

const EditField = ({ label, children }) => (
  <label className="grid gap-1.5 text-sm">
    <span className="font-semibold text-on-surface-variant">{label}</span>
    {children}
  </label>
);

const EditModal = ({ product, onClose }) => {
  const updateMutation = useUpdateSchoolProduct();
  const [form, setForm] = useState(() =>
    EDITABLE.reduce((acc, field) => {
      acc[field] = product[field] ?? "";
      return acc;
    }, {}),
  );
  const setField = (field, value) =>
    setForm((current) => ({ ...current, [field]: value }));

  const handleSave = async () => {
    try {
      await updateMutation.mutateAsync({ id: product.id, updates: form });
      toast.success("Item updated");
      onClose();
    } catch (error) {
      toast.error(error?.response?.data?.message || "Could not update item");
    }
  };

  return (
    <Modal title="Edit item" onClose={onClose}>
      <p className="mt-1 text-xs text-on-surface-variant">
        {product.reference_number}
      </p>
      <div className="mt-4 grid gap-4">
        <EditField label="Name">
          <input
            value={form.name}
            onChange={(e) => setField("name", e.target.value)}
            className={inputClass}
          />
        </EditField>
        <div className="grid gap-4 sm:grid-cols-2">
          <EditField label="Category">
            <input
              value={form.category}
              onChange={(e) => setField("category", e.target.value)}
              className={inputClass}
            />
          </EditField>
          <EditField label="Price (R)">
            <input
              type="number"
              step="0.01"
              min="0"
              value={form.price}
              onChange={(e) => setField("price", e.target.value)}
              className={inputClass}
            />
          </EditField>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <EditField label="Listing type">
            <select
              value={form.listing_type}
              onChange={(e) => setField("listing_type", e.target.value)}
              className={inputClass}
            >
              {LISTING_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </EditField>
          <EditField label="Status">
            <select
              value={form.status}
              onChange={(e) => setField("status", e.target.value)}
              className={inputClass}
            >
              {PRODUCT_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </EditField>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <EditField label="Gender">
            <input
              value={form.gender}
              onChange={(e) => setField("gender", e.target.value)}
              className={inputClass}
            />
          </EditField>
          <EditField label="Age">
            <input
              value={form.age}
              onChange={(e) => setField("age", e.target.value)}
              className={inputClass}
            />
          </EditField>
          <EditField label="Condition">
            <select
              value={form.condition}
              onChange={(e) => setField("condition", e.target.value)}
              className={inputClass}
            >
              {CONDITIONS.map((condition) => (
                <option key={condition} value={condition}>
                  {condition}
                </option>
              ))}
            </select>
          </EditField>
        </div>
        <EditField label="Description">
          <textarea
            value={form.description}
            onChange={(e) => setField("description", e.target.value)}
            rows={3}
            className={`${inputClass} resize-none`}
          />
        </EditField>
      </div>

      <div className="mt-6 flex justify-end gap-3">
        <button
          type="button"
          onClick={onClose}
          className="rounded-xl border border-outline-variant px-5 py-2.5 text-sm font-semibold text-on-surface-variant hover:bg-surface-container-low"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={updateMutation.isPending}
          className="rounded-xl bg-primary px-6 py-2.5 text-sm font-bold text-on-primary hover:bg-on-primary-container disabled:opacity-60"
        >
          {updateMutation.isPending ? "Saving..." : "Save changes"}
        </button>
      </div>
    </Modal>
  );
};

const InventoryPage = () => {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);

  const debouncedQuery = useDebouncedValue(query);

  const filterKey = `${debouncedQuery}|${statusFilter}`;
  const [prevFilterKey, setPrevFilterKey] = useState(filterKey);
  if (filterKey !== prevFilterKey) {
    setPrevFilterKey(filterKey);
    setPage(1);
  }

  const { data, isLoading, isError, error } = useInventory({
    q: debouncedQuery || undefined,
    status: statusFilter || undefined,
    limit: PAGE_SIZE,
    offset: (page - 1) * PAGE_SIZE,
  });

  const products = data?.products || [];
  const total = data?.total || 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const [editing, setEditing] = useState(null);
  const deleteMutation = useDeleteSchoolProduct();

  const handleDelete = async (product) => {
    if (!window.confirm(`Delete "${product.name}"? This cannot be undone.`)) {
      return;
    }
    try {
      await deleteMutation.mutateAsync(product.id);
      toast.success(`${product.name} deleted`);
    } catch (error) {
      toast.error(error?.response?.data?.message || "Could not delete item");
    }
  };

  return (
    <div>
      <PageHeader
        title="Inventory"
        subtitle="Your school's listed items and their live status."
      >
        <Link
          to="/school/inventory/add"
          className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-on-primary transition-colors hover:bg-on-primary-container"
        >
          <Plus size={16} aria-hidden="true" />
          Add item
        </Link>
      </PageHeader>

      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search by name, reference, or category..."
          className={`${inputClass} w-full`}
        />
        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
          aria-label="Filter by status"
          className={inputClass}
        >
          <option value="">All statuses</option>
          {PRODUCT_STATUSES.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>
      </div>

      {isError ? (
        <p className="mt-4 text-sm font-semibold text-error">
          {error?.response?.data?.message || "Could not load inventory"}
        </p>
      ) : null}

      {isLoading ? (
        <p className="mt-6 text-on-surface-variant">Loading inventory...</p>
      ) : products.length === 0 ? (
        <p className="mt-6 text-on-surface-variant">No items found.</p>
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {products.map((product) => (
            <div
              key={product.id}
              className="overflow-hidden rounded-2xl border border-outline-variant bg-surface"
            >
              <div className="flex aspect-square w-full items-center justify-center bg-surface-container-high">
                {product.image?.[0] ? (
                  <img
                    src={product.image[0]}
                    alt={product.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <ImageOff
                    size={28}
                    aria-hidden="true"
                    className="text-on-surface-variant"
                  />
                )}
              </div>
              <div className="flex flex-col gap-1 p-4">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wide text-on-surface-variant">
                    {product.listing_type}
                  </span>
                  <Badge tone={STATUS_TONE[product.status] || "neutral"}>
                    {product.status}
                  </Badge>
                </div>
                <p className="mt-1 truncate font-bold text-on-surface">
                  {product.name}
                </p>
                <p className="truncate text-xs text-on-surface-variant">
                  {product.reference_number}
                </p>
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-xs text-on-surface-variant">
                    {product.condition}
                  </span>
                  <span className="text-lg font-black text-primary">
                    R{product.price}
                  </span>
                </div>

                <div className="mt-3 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setEditing(product)}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-primary px-3 py-1.5 text-xs font-bold text-primary hover:bg-surface-container-low"
                  >
                    <Pencil size={14} aria-hidden="true" /> Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(product)}
                    disabled={deleteMutation.isPending}
                    className="flex items-center justify-center gap-1.5 rounded-lg border border-error px-3 py-1.5 text-xs font-bold text-error hover:bg-error-container/40 disabled:opacity-60"
                  >
                    <Trash2 size={14} aria-hidden="true" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Pagination page={page} totalPages={totalPages} onPage={setPage} />

      {editing ? (
        <EditModal product={editing} onClose={() => setEditing(null)} />
      ) : null}
    </div>
  );
};

export default InventoryPage;
