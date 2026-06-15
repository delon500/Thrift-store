import { useMemo, useState } from "react";
import { useInventory } from "../hooks/useInventory";

const LISTING_TYPES = ["Thrift Store", "Lost and Found"];

const ViewStore = () => {
  const { data: products = [], isLoading, isError, error } = useInventory();
  const [school, setSchool] = useState("");
  const [listingType, setListingType] = useState("");

  // The marketplace only shows items that are actually buyable.
  const available = useMemo(
    () => products.filter((product) => product.status === "Available"),
    [products],
  );

  const schools = useMemo(
    () =>
      [...new Set(available.map((product) => product.schoolName).filter(Boolean))].sort(),
    [available],
  );

  const visible = useMemo(
    () =>
      available.filter(
        (product) =>
          (!school || product.schoolName === school) &&
          (!listingType || product.listing_type === listingType),
      ),
    [available, school, listingType],
  );

  return (
    <div className="p-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-black text-teal-600">Store Preview</h1>
        <p className="text-sm font-medium text-gray-500">
          See the marketplace the way students and parents do — only available items appear.
        </p>
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <select
          value={school}
          onChange={(e) => setSchool(e.target.value)}
          className="rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm outline-none focus:border-teal-600"
        >
          <option value="">All schools</option>
          {schools.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>
        <select
          value={listingType}
          onChange={(e) => setListingType(e.target.value)}
          className="rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm outline-none focus:border-teal-600"
        >
          <option value="">All listings</option>
          {LISTING_TYPES.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
      </div>

      {isError ? (
        <p className="mt-4 text-sm font-semibold text-red-600">
          {error?.response?.data?.message || "Could not load the store"}
        </p>
      ) : null}

      {isLoading ? (
        <p className="mt-6 text-gray-500">Loading store...</p>
      ) : visible.length === 0 ? (
        <p className="mt-6 text-gray-500">No available items to show.</p>
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {visible.map((product) => (
            <div
              key={product.id}
              className="overflow-hidden rounded-2xl border border-gray-200 bg-white"
            >
              <div className="aspect-square w-full bg-gray-100">
                {product.image?.[0] ? (
                  <img
                    src={product.image[0]}
                    alt={product.name}
                    className="h-full w-full object-cover"
                  />
                ) : null}
              </div>
              <div className="flex flex-col gap-1 p-4">
                <span className="w-fit rounded-full bg-teal-50 px-2 py-0.5 text-[10px] font-bold uppercase text-teal-700">
                  {product.listing_type}
                </span>
                <p className="mt-1 font-bold text-gray-800">{product.name}</p>
                <p className="text-xs text-gray-500">{product.schoolName}</p>
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-xs text-gray-500">{product.condition}</span>
                  <span className="text-lg font-black text-teal-600">
                    R{product.price}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ViewStore;
