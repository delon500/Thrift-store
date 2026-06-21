import { LayoutGrid, Shirt, PackageSearch } from "lucide-react";

// Primary browse navigation, shared by the desktop sidebar and the mobile
// drawer. Icons are lucide components (no PNG assets).
export const navItems = [
  { to: "/products", label: "Browse all", Icon: LayoutGrid },
  { to: "/thrift-store", label: "Thrift store", Icon: Shirt },
  { to: "/lost-found", label: "Lost & found", Icon: PackageSearch },
];
