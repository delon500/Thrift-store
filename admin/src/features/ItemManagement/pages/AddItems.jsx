import { useQuery } from "@tanstack/react-query";
import { images as uiImages } from "../../../assets/images/images";
import { icons } from "../../../assets/icons/icons";
import { getInstitutions } from "../../institutions/api/institutionsApi";
import { useProductStore } from "../../product/store/productStore";
import {
  useAnalyzeProduct,
  useCreateProduct,
} from "../../product/hooks/useProduct";
import useAuthStore from "../../auth/store/authStore";

// listing_type is a DB enum — values must match exactly.
const LISTING_TYPES = ["Thrift Store", "Lost and Found"];
const CONDITIONS = ["Excellent", "Good", "Fair", "Poor"];

// Map a free-form (e.g. AI-suggested) value onto a known option, or "" if none.
const matchOption = (value, options) =>
  options.find(
    (option) => option.toLowerCase() === String(value || "").toLowerCase(),
  ) || "";

const AddItems = () => {
  const token = useAuthStore((state) => state.token);

  const {
    formData,
    images: productImages,
    setField,
    setImage,
    resetForm,
  } = useProductStore();

  const analyzeProductMutation = useAnalyzeProduct();
  const createProductMutation = useCreateProduct();

  const {
    data: institutions = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["institutions"],
    queryFn: getInstitutions,
  });

  const handleSchoolChange = (e) => {
    setField("schoolId", e.target.value);
  };

  const handleAnalyze = () => {
    analyzeProductMutation.mutate(
      { images: productImages, token },
      {
        onSuccess: (ai) => {
          setField("name", ai.name || "");
          setField("description", ai.description || "");
          setField("category", ai.category || "");
          setField("gender", ai.gender || "");
          setField("price", ai.price || "");
          setField("age", ai.age || "");
          setField("listing_type", matchOption(ai.listing_type, LISTING_TYPES));
          setField("condition", matchOption(ai.condition, CONDITIONS) || "Excellent");
        },
      },
    );
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    createProductMutation.mutate(
      {
        formData,
        images: productImages,
        token,
      },
      {
        onSuccess: () => {
          resetForm();
        },
      },
    );
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="flex flex-col gap-2">
        <h1 className="text-sm sm:text-2xl font-black text-primary">
          Add Items
        </h1>
        <p className="text-sm sm:text-sm font-medium text-on-surface-variant">
          Manage the school store inventory, verify pickups, and set up your
          shopfront.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-6 w-full">
        <div className="w-full sm:w-[60%]">
          <div className="mt-10 bg-white p-4 border-outline-variant border-2 rounded-2xl">
            <div className="flex gap-2 items-center mb-4">
              <img src={icons.product_image_icons} alt="" />
              <p className="font-bold text-xl text-primary">Product Image</p>
            </div>

            <div className="flex flex-col sm:flex-row gap-6">
              <div className="w-[50%]">
                <label htmlFor="image1">
                  <img
                    src={
                      !productImages.image1
                        ? uiImages.main_upload_image
                        : URL.createObjectURL(productImages.image1)
                    }
                    alt="main_upload_image"
                  />
                  <input
                    onChange={(e) => {
                      setImage("image1", e.target.files[0]);
                    }}
                    type="file"
                    id="image1"
                    hidden
                  />
                </label>
              </div>

              <div className="flex sm:grid gap-2 grid-cols-2 w-[50%]">
                {["image2", "image3", "image4", "image5"].map((key) => (
                  <label htmlFor={key} key={key}>
                    <img
                      src={
                        !productImages[key]
                          ? uiImages.secondary_image
                          : URL.createObjectURL(productImages[key])
                      }
                      alt=""
                    />
                    <input
                      onChange={(e) => setImage(key, e.target.files[0])}
                      type="file"
                      id={key}
                      hidden
                    />
                  </label>
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={handleAnalyze}
              disabled={analyzeProductMutation.isPending}
              className="w-full mt-4 shadow-md bg-primary text-white rounded-md p-2 cursor-pointer disabled:opacity-60"
            >
              {analyzeProductMutation.isPending
                ? "Analyzing..."
                : "Auto-fill with AI"}
            </button>

            <span className="text-on-surface-variant italic text-xs">
              Tip: Bright, natural light works best for displaying item
              condition.
            </span>
          </div>

          <div className="mt-10 bg-white p-4 border-outline-variant border-2 rounded-2xl">
            <div className="flex gap-2 items-center mb-4">
              <img src={icons.product_description_icon} alt="" />
              <p className="font-bold text-xl text-primary">
                Product Description
              </p>
            </div>

            <p className="text-on-surface-variant font-light mb-4">ITEM DETAILS</p>
            <textarea
              className="w-full px-3 py-2 border border-outline-variant rounded-sm h-[200px] outline-none placeholder:text-sm"
              placeholder="Describe the brand, model, size, or any specific features that make this item great for campus life..."
              value={formData.description}
              onChange={(e) => setField("description", e.target.value)}
            />
          </div>

          <button
            type="submit"
            className="w-full lg:flex lg:items-center lg:justify-center lg:gap-2 shadow-md bg-primary text-white rounded-md p-2 mt-5 hidden cursor-pointer"
          >
            Save Item To Shop
            <img src={icons.product_add_shop_arrow_icon} alt="Arrow" />
          </button>
        </div>

        <div className="w-full sm:w-[40%]">
          <div className="mt-10 bg-white p-4 border-outline-variant border-2 rounded-2xl">
            <div className="flex gap-2 items-center mb-4">
              <img src={icons.basic_info_icon} alt="" />
              <p className="font-bold text-xl text-primary">Product Details</p>
            </div>

            <div className="flex flex-col gap-2">
              <p>PRODUCT TITLE</p>
              <input
                type="text"
                className="w-full border-2 border-outline-variant rounded-md p-2"
                placeholder="e.g. TI-84 Plus CE Graphing Calculator"
                value={formData.name}
                onChange={(e) => setField("name", e.target.value)}
              />
            </div>

            <div className="flex flex-col gap-2 mt-3">
              <p>CATEGORY</p>
              <input
                type="text"
                className="w-full border-2 border-outline-variant rounded-md p-2"
                placeholder="e.g. School Items"
                value={formData.category}
                onChange={(e) => setField("category", e.target.value)}
              />
            </div>

            <div className="flex justify-between w-full items-center gap-6 mt-3">
              <div className="flex flex-col gap-2 w-full">
                <p>Price</p>
                <input
                  type="number"
                  className="w-full border-2 border-outline-variant rounded-md p-2"
                  placeholder="e.g. 12000"
                  value={formData.price}
                  onChange={(e) => setField("price", e.target.value)}
                />
              </div>

              <div className="flex flex-col gap-2 w-full">
                <p>Gender</p>
                <input
                  type="text"
                  className="w-full border-2 border-outline-variant rounded-md p-2"
                  placeholder="e.g. Unisex"
                  value={formData.gender}
                  onChange={(e) => setField("gender", e.target.value)}
                />
              </div>
            </div>

            <div className="flex justify-between w-full items-center gap-6 mt-3">
              <div className="flex flex-col gap-2 w-full">
                <p>Status</p>
                <select
                  className="w-full border-2 border-outline-variant rounded-md p-2"
                  value={formData.status}
                  onChange={(e) => setField("status", e.target.value)}
                >
                  <option value="Available">Available</option>
                  <option value="Sold">Sold</option>
                  <option value="Pending">Pending</option>
                </select>
              </div>

              <div className="flex flex-col gap-2 w-full">
                <p>School Name</p>
                <select
                  className="w-full border-2 border-outline-variant rounded-md p-2"
                  value={formData.schoolId}
                  onChange={handleSchoolChange}
                >
                  <option value="">Select School</option>
                  {isLoading && <option value="">Loading schools...</option>}
                  {isError && <option value="">Failed to load schools</option>}
                  {institutions.map((school) => (
                    <option key={school.id} value={school.id}>
                      {school.institution_name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-between w-full items-center gap-6 mt-3">
              <div className="flex flex-col gap-2 w-full">
                <p>Listing Type</p>
                <select
                  className="w-full border-2 border-outline-variant rounded-md p-2"
                  value={formData.listing_type}
                  onChange={(e) => setField("listing_type", e.target.value)}
                >
                  <option value="">Select type</option>
                  {LISTING_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-2 w-full">
                <p>Age</p>
                <input
                  type="text"
                  className="w-full border-2 border-outline-variant rounded-md p-2"
                  placeholder="e.g. 14-15 years"
                  value={formData.age}
                  onChange={(e) => setField("age", e.target.value)}
                />
              </div>
            </div>

            <div className="flex flex-col gap-2 mt-3">
              <p>Condition</p>
              <select
                className="w-full border-2 border-outline-variant rounded-md p-2"
                value={formData.condition}
                onChange={(e) => setField("condition", e.target.value)}
              >
                {CONDITIONS.map((conditionOption) => (
                  <option key={conditionOption} value={conditionOption}>
                    {conditionOption}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <button
            type="submit"
            className="w-full lg:hidden flex items-center justify-center gap-2 shadow-md bg-primary text-white rounded-md p-2 mt-5 cursor-pointer"
          >
            Save Item To Shop
            <img src={icons.product_add_shop_arrow_icon} alt="Arrow" />
          </button>
        </div>
      </div>
    </form>
  );
};

export default AddItems;
