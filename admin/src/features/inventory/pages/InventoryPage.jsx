import { useState } from "react";
import { toast } from "react-toastify";
import {
  useDeleteProduct,
  useInventory,
  useUpdateProduct,
} from "../hooks/useInventory";
import { useDebouncedValue } from "../../../lib/useDebouncedValue";
import Pagination from "../../../components/shared/Pagination";

const PAGE_SIZE = 10;

const PRODUCT_STATUSES = [
  "Available",
  "Sold",
  "Pending",
  "Reserved",
  "Claimed",
  "Cancelled",
];
const LISTING_TYPES = ["Thrift Store", "Lost and Found"];

const statusStyles = {
  Available: "bg-teal-100 text-teal-800",
  Sold: "bg-gray-200 text-gray-700",
  Pending: "bg-yellow-100 text-yellow-800",
  Reserved: "bg-blue-100 text-blue-800",
  Claimed: "bg-green-100 text-green-800",
  Cancelled: "bg-red-100 text-red-800",
};

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

const buildForm = (product) =>
  EDITABLE.reduce((acc, field) => {
    acc[field] = product[field] ?? "";
    return acc;
  }, {});

const EditModal = ({ product, onClose }) => {
  const [form, setForm] = useState(() => buildForm(product));
  const updateMutation = useUpdateProduct();

  const setField = (field, value) =>
    setForm((current) => ({ ...current, [field]: value }));

  const handleSave = async () => {
    try {
      await updateMutation.mutateAsync({ id: product.id, updates: form });
      toast.success("Product updated");
      onClose();
    } catch (error) {
      toast.error(error?.response?.data?.message || "Could not update product");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white p-6">
        <div className="flex items-start justify-between">
          <h2 className="text-xl font-black text-teal-600">Edit product</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-2xl leading-none text-gray-400 hover:text-gray-700"
          >
            ×
          </button>
        </div>
        <p className="mt-1 text-xs text-gray-500">
          Ref {product.reference_number} · {product.schoolName}
        </p>

        <div className="mt-5 grid gap-4">
          <label className="grid gap-1 text-sm">
            <span className="font-semibold text-gray-600">Name</span>
            <input
              value={form.name}
              onChange={(e) => setField("name", e.target.value)}
              className="rounded-md border border-gray-300 px-3 py-2 outline-none focus:border-teal-600"
            />
          </label>

          <div className="grid grid-cols-2 gap-4">
            <label className="grid gap-1 text-sm">
              <span className="font-semibold text-gray-600">Category</span>
              <input
                value={form.category}
                onChange={(e) => setField("category", e.target.value)}
                className="rounded-md border border-gray-300 px-3 py-2 outline-none focus:border-teal-600"
              />
            </label>
            <label className="grid gap-1 text-sm">
              <span className="font-semibold text-gray-600">Price (R)</span>
              <input
                type="number"
                value={form.price}
                onChange={(e) => setField("price", e.target.value)}
                className="rounded-md border border-gray-300 px-3 py-2 outline-none focus:border-teal-600"
              />
            </label>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <label className="grid gap-1 text-sm">
              <span className="font-semibold text-gray-600">Listing type</span>
              <select
                value={form.listing_type}
                onChange={(e) => setField("listing_type", e.target.value)}
                className="rounded-md border border-gray-300 px-3 py-2 outline-none focus:border-teal-600"
              >
                {LISTING_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-1 text-sm">
              <span className="font-semibold text-gray-600">Status</span>
              <select
                value={form.status}
                onChange={(e) => setField("status", e.target.value)}
                className="rounded-md border border-gray-300 px-3 py-2 outline-none focus:border-teal-600"
              >
                {PRODUCT_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <label className="grid gap-1 text-sm">
              <span className="font-semibold text-gray-600">Gender</span>
              <input
                value={form.gender}
                onChange={(e) => setField("gender", e.target.value)}
                className="rounded-md border border-gray-300 px-3 py-2 outline-none focus:border-teal-600"
              />
            </label>
            <label className="grid gap-1 text-sm">
              <span className="font-semibold text-gray-600">Age</span>
              <input
                value={form.age}
                onChange={(e) => setField("age", e.target.value)}
                className="rounded-md border border-gray-300 px-3 py-2 outline-none focus:border-teal-600"
              />
            </label>
          </div>

          <label className="grid gap-1 text-sm">
            <span className="font-semibold text-gray-600">Condition</span>
            <input
              value={form.condition}
              onChange={(e) => setField("condition", e.target.value)}
              className="rounded-md border border-gray-300 px-3 py-2 outline-none focus:border-teal-600"
            />
          </label>

          <label className="grid gap-1 text-sm">
            <span className="font-semibold text-gray-600">Description</span>
            <textarea
              value={form.description}
              onChange={(e) => setField("description", e.target.value)}
              rows={3}
              className="rounded-md border border-gray-300 px-3 py-2 outline-none focus:border-teal-600"
            />
          </label>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-gray-300 px-4 py-2 font-semibold text-gray-600"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={updateMutation.isPending}
            className="rounded-lg bg-teal-600 px-4 py-2 font-bold text-white disabled:opacity-60"
          >
            {updateMutation.isPending ? "Saving..." : "Save changes"}
          </button>
        </div>
      </div>
    </div>
  );
};

const InventoryPage = () => {
  const deleteMutation = useDeleteProduct();
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState(null);

  const debouncedQuery = useDebouncedValue(query);

  // reset to the first page whenever the search/filter changes
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

  const handleDelete = async (product) => {
    if (!window.confirm(`Delete "${product.name}"? This cannot be undone.`)) return;

    try {
      await deleteMutation.mutateAsync(product.id);
      toast.success(`${product.name} deleted`);
    } catch (deleteError) {
      toast.error(deleteError?.response?.data?.message || "Could not delete product");
    }
  };

  return (
    <div className="p-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-black text-teal-600">Inventory</h1>
        <p className="text-sm font-medium text-gray-500">
          View, edit, and remove items across all schools.
        </p>
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm outline-none focus:border-teal-600"
          placeholder="Search by name, reference, school, category..."
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm outline-none focus:border-teal-600"
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
        <p className="mt-4 text-sm font-semibold text-red-600">
          {error?.response?.data?.message || "Could not load products"}
        </p>
      ) : null}

      <section className="mt-6 overflow-hidden rounded-xl border border-gray-200 bg-white">
        {isLoading ? (
          <p className="p-5 text-gray-500">Loading inventory...</p>
        ) : products.length === 0 ? (
          <p className="p-5 text-gray-500">No products found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-left text-sm">
              <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                <tr>
                  <th className="px-4 py-3">Item</th>
                  <th className="px-4 py-3">School</th>
                  <th className="px-4 py-3">Listing</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Price</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr key={product.id} className="border-t border-gray-100">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <img
                          src={product.image?.[0] || ""}
                          alt=""
                          className="h-12 w-12 rounded-lg bg-gray-100 object-cover"
                        />
                        <div>
                          <p className="font-semibold text-gray-800">
                            {product.name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {product.reference_number}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">{product.schoolName}</td>
                    <td className="px-4 py-3">{product.listing_type}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-bold ${
                          statusStyles[product.status] || "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {product.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-bold">R{product.price}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setEditing(product)}
                          className="rounded-lg border border-teal-600 px-3 py-1.5 text-xs font-bold text-teal-700 hover:bg-teal-50"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(product)}
                          disabled={deleteMutation.isPending}
                          className="rounded-lg border border-red-300 px-3 py-1.5 text-xs font-bold text-red-600 hover:bg-red-50 disabled:opacity-60"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <Pagination page={page} totalPages={totalPages} onPage={setPage} />

      {editing ? (
        <EditModal product={editing} onClose={() => setEditing(null)} />
      ) : null}
    </div>
  );
};

export default InventoryPage;
