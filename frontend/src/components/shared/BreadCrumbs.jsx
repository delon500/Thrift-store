import { Link, useLocation } from "react-router-dom";
import { useProductStore } from "../../features/products/store/productStore";

const BreadCrumbs = () => {
  const location = useLocation();
  const products = useProductStore((state) => state.products);

  const parts = location.pathname.split("/").filter(Boolean);

  let currentLink = "";

  const crumbs = parts.map((part, index) => {
    currentLink += `/${part}`;
    const isLast = index === parts.length - 1;

    let label = part.charAt(0).toUpperCase() + part.slice(1);

    if (parts[0] === "product" && index === 1) {
      const product = products.find((item) => String(item.id) === part);
      label = product?.name || "Product";
    }

    return (
      <div key={currentLink} className="flex items-center gap-2">
        <span>/</span>
        {isLast ? (
          <span className="text-gray-500">{label}</span>
        ) : (
          <Link
            to={currentLink}
            className="capitalize text-gray-600 hover:text-teal-500"
          >
            {label}
          </Link>
        )}
      </div>
    );
  });

  return (
    <div className="flex items-center gap-2 text-sm">
      <Link to="/" className="text-gray-600 hover:text-teal-500">
        Home
      </Link>
      {crumbs}
    </div>
  );
};

export default BreadCrumbs;
