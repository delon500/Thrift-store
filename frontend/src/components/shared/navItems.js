import { icons } from "../../assets/icon/icons";

// Single source of truth for the customer app's primary navigation, shared by
// the desktop Sidebar and the mobile drawer. `activeIcon` falls back to `icon`
// for links that don't have a distinct active variant.
export const navItems = [
  {
    to: "/products",
    label: "Home",
    icon: icons.inactive_home_icon,
    activeIcon: icons.active_home_icon,
  },
  {
    to: "/thrift-store",
    label: "Thrift Store",
    icon: icons.inactive_lost_icon,
    activeIcon: icons.active_lost_icon,
  },
  {
    to: "/lost-found",
    label: "Lost and Found",
    icon: icons.lost_and_found_inactive_icon,
    activeIcon: icons.lost_and_found_active_icon,
  },
  // {
  //   to: "/cart",
  //   label: "Cart",
  //   icon: icons.inactive_cart_icon,
  //   activeIcon: icons.active_cart_icon,
  // },
  // {
  //   to: "/orders",
  //   label: "My Orders",
  //   icon: icons.order_icon,
  //   activeIcon: icons.order_icon,
  // },
  // {
  //   to: "/settings",
  //   label: "Settings",
  //   icon: icons.inactive_settings_icon,
  //   activeIcon: icons.active_settings_icon,
  // },
];
