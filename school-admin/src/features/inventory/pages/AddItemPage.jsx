import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { ArrowLeft, ImagePlus, Plus, Sparkles } from "lucide-react";
import { PageHeader, cardClass, inputClass } from "../../../components/shared/ui";
import {
  useAnalyzeSchoolProduct,
  useCreateSchoolProduct,
} from "../hooks/useInventory";

const LISTING_TYPES = ["Thrift Store", "Lost and Found"];
const CONDITIONS = ["Excellent", "Good", "Fair", "Poor"];
const STATUSES = ["Available", "Sold", "Pending"];

const matchOption = (value, options) =>
  options.find((option) => option.toLowerCase() === String(value || "").toLowerCase()) ||
  "";

const EMPTY = {
  name: "",
  description: "",
  category: "",
  price: "",
  gender: "",
  age: "",
  condition: "Good",
  listing_type: "",
  status: "Available",
};

const AddItemPage = () => {
  const navigate = useNavigate();
  const createMutation = useCreateSchoolProduct();
  const analyzeMutation = useAnalyzeSchoolProduct();

  const [form, setForm] = useState(EMPTY);
  const [images, setImages] = useState({});

  const setField = (key, value) => setForm((c) => ({ ...c, [key]: value }));
  const setImage = (key, file) => setImages((c) => ({ ...c, [key]: file }));

  const handleAnalyze = async () => {
    if (Object.values(images).filter(Boolean).length === 0) {
      toast.info("Add at least one photo first.");
      return;
    }
    try {
      const ai = await analyzeMutation.mutateAsync({ images });
      setForm((c) => ({
        ...c,
        name: ai.name || c.name,
        description: ai.description || c.description,
        category: ai.category || c.category,
        gender: ai.gender || c.gender,
        age: ai.age || c.age,
        condition: matchOption(ai.condition, CONDITIONS) || c.condition,
        listing_type: matchOption(ai.listing_type, LISTING_TYPES) || c.listing_type,
      }));
      toast.success("Auto-filled from the photos — review before saving.");
    } catch (error) {
      toast.error(error?.response?.data?.message || "Could not analyze the photos");
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (Object.values(images).filter(Boolean).length === 0) {
      toast.error("Add at least one photo.");
      return;
    }
    if (!form.listing_type) {
      toast.error("Choose a listing type.");
      return;
    }
    try {
      await createMutation.mutateAsync({ formData: form, images });
      toast.success("Item added to your store");
      navigate("/school/inventory");
    } catch (error) {
      toast.error(error?.response?.data?.message || "Could not add the item");
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <button
        type="button"
        onClick={() => navigate("/school/inventory")}
        className="mb-4 inline-flex items-center gap-1 text-sm font-semibold text-on-surface-variant hover:text-on-surface"
      >
        <ArrowLeft size={16} aria-hidden="true" /> Back to inventory
      </button>

      <PageHeader
        title="Add item"
        subtitle="List a thrift or lost-and-found item for your school store."
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
        {/* Photos */}
        <section className={`${cardClass} h-fit p-5`}>
          <div className="mb-4 flex items-center gap-2">
            <ImagePlus size={18} className="text-primary" aria-hidden="true" />
            <h2 className="font-bold text-on-surface">Photos</h2>
          </div>

          <label htmlFor="image1" className="block cursor-pointer">
            {images.image1 ? (
              <img
                src={URL.createObjectURL(images.image1)}
                alt="Main"
                className="aspect-square w-full rounded-xl border border-outline-variant object-cover"
              />
            ) : (
              <div className="flex aspect-square w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-outline-variant bg-surface-container-low text-on-surface-variant">
                <ImagePlus size={28} aria-hidden="true" />
                <span className="text-xs font-semibold">Add main photo</span>
              </div>
            )}
            <input
              id="image1"
              type="file"
              accept="image/*"
              hidden
              onChange={(e) => setImage("image1", e.target.files[0])}
            />
          </label>

          <div className="mt-3 grid grid-cols-4 gap-2">
            {["image2", "image3", "image4", "image5"].map((key) => (
              <label key={key} htmlFor={key} className="block cursor-pointer">
                {images[key] ? (
                  <img
                    src={URL.createObjectURL(images[key])}
                    alt=""
                    className="aspect-square w-full rounded-lg border border-outline-variant object-cover"
                  />
                ) : (
                  <div className="flex aspect-square w-full items-center justify-center rounded-lg border-2 border-dashed border-outline-variant bg-surface-container-low text-on-surface-variant">
                    <Plus size={18} aria-hidden="true" />
                  </div>
                )}
                <input
                  id={key}
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={(e) => setImage(key, e.target.files[0])}
                />
              </label>
            ))}
          </div>

          <button
            type="button"
            onClick={handleAnalyze}
            disabled={analyzeMutation.isPending}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-primary px-4 py-2.5 text-sm font-semibold text-primary transition-colors hover:bg-surface-container-low disabled:opacity-60"
          >
            <Sparkles size={16} aria-hidden="true" />
            {analyzeMutation.isPending ? "Analyzing..." : "Auto-fill with AI"}
          </button>
        </section>

        {/* Details */}
        <section className={`${cardClass} p-5`}>
          <h2 className="mb-4 font-bold text-on-surface">Item details</h2>

          <div className="grid gap-4">
            <label className="grid gap-1.5 text-sm">
              <span className="font-semibold text-on-surface-variant">Name</span>
              <input
                value={form.name}
                onChange={(e) => setField("name", e.target.value)}
                placeholder="e.g. TI-84 Plus Calculator"
                className={inputClass}
                required
              />
            </label>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="grid gap-1.5 text-sm">
                <span className="font-semibold text-on-surface-variant">Category</span>
                <input
                  value={form.category}
                  onChange={(e) => setField("category", e.target.value)}
                  placeholder="e.g. School items"
                  className={inputClass}
                  required
                />
              </label>
              <label className="grid gap-1.5 text-sm">
                <span className="font-semibold text-on-surface-variant">Price (R)</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.price}
                  onChange={(e) => setField("price", e.target.value)}
                  placeholder="e.g. 120"
                  className={inputClass}
                  required
                />
              </label>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="grid gap-1.5 text-sm">
                <span className="font-semibold text-on-surface-variant">Listing type</span>
                <select
                  value={form.listing_type}
                  onChange={(e) => setField("listing_type", e.target.value)}
                  className={inputClass}
                  required
                >
                  <option value="">Select type</option>
                  {LISTING_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </label>
              <label className="grid gap-1.5 text-sm">
                <span className="font-semibold text-on-surface-variant">Status</span>
                <select
                  value={form.status}
                  onChange={(e) => setField("status", e.target.value)}
                  className={inputClass}
                >
                  {STATUSES.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <label className="grid gap-1.5 text-sm">
                <span className="font-semibold text-on-surface-variant">Gender</span>
                <input
                  value={form.gender}
                  onChange={(e) => setField("gender", e.target.value)}
                  placeholder="e.g. Unisex"
                  className={inputClass}
                  required
                />
              </label>
              <label className="grid gap-1.5 text-sm">
                <span className="font-semibold text-on-surface-variant">Age</span>
                <input
                  value={form.age}
                  onChange={(e) => setField("age", e.target.value)}
                  placeholder="e.g. 14-15 yrs"
                  className={inputClass}
                  required
                />
              </label>
              <label className="grid gap-1.5 text-sm">
                <span className="font-semibold text-on-surface-variant">Condition</span>
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
              </label>
            </div>

            <label className="grid gap-1.5 text-sm">
              <span className="font-semibold text-on-surface-variant">Description</span>
              <textarea
                value={form.description}
                onChange={(e) => setField("description", e.target.value)}
                rows={4}
                placeholder="Describe the item, its condition, and any details buyers should know."
                className={`${inputClass} resize-none`}
              />
            </label>
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => navigate("/school/inventory")}
              className="rounded-xl border border-outline-variant px-5 py-2.5 text-sm font-semibold text-on-surface-variant hover:bg-surface-container-low"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="rounded-xl bg-primary px-6 py-2.5 text-sm font-bold text-on-primary transition-colors hover:bg-on-primary-container disabled:opacity-60"
            >
              {createMutation.isPending ? "Adding..." : "Add to store"}
            </button>
          </div>
        </section>
      </div>
    </form>
  );
};

export default AddItemPage;
