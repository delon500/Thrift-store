// import { add_items } from "../assets/icons/icons";

import { icons } from "../assets/icons/icons";

// `to` is relative — CardActions prepends "/admin/".
export const action_card = [
  {
    name: "Add Items",
    description:
      "Upload a new lost-and-found or thrift item with photos and details, with AI auto-fill to speed things up.",
    color: "#dbf0ee",
    icons: icons.add_items,
    to: "lost-and-found-management/add-items",
  },
  {
    name: "Manage Inventory",
    description:
      "View, edit, and remove items across all schools, and update prices or availability.",
    color: "#d4e6e5",
    icons: icons.manage_shop_icon,
    to: "inventory",
  },
  {
    name: "Pickup & Collections",
    description:
      "Verify reference numbers, track payments, and mark items as collected at the school.",
    color: "#d4e6e5",
    icons: icons.payment_verification,
    to: "orders",
  },
  {
    name: "View Store",
    description:
      "Preview the live marketplace the way students and parents see it.",
    color: "#d4e6e5",
    icons: icons.manage_shop_icon,
    to: "view-store",
  },
];

export const register_user_action_card = [
  {
    name: "Register Staff Members",
    description:
      "Create a staff member prohle With the correct access, responsibilities, and internal platform visibility",
    color: "#dbf0ee",
    icons: icons.admin_staff_icon,
    to: "/register-users/staff",
  },
  {
    name: "Register School",
    description:
      "Add a school profile with its main contact details and prepare it for onboarding into SchoolThrifties.",
    color: "#d4e6e5",
    icons: icons.admin_school_icon,
    to: "/register-users/school",
  },
  {
    name: "Register Parents",
    description:
      "Create a patent prome tot learner-hnned activity, asset tracking. lost item workflows. and store access",
    color: "#ffe6e4",
    icons: icons.admin_parent_icon,
    to: "/register-users/parent",
  },
  {
    name: "Register University",
    description:
      "Add a unwerstty prohEe With Its man contact details and prepare it for onboarding into SchoolThrifties.",
    color: "#d4e6e5",
    icons: icons.admin_university_icon,
    to: "/register-users/university",
  },
  {
    name: "Register Students",
    description:
      "Register a university student profile and link the student to the correct university for EduThrift onboarding.",
    color: "#ffe6e4",
    icons: icons.admin_student_icon,
    to: "/register-users/student",
  },
];

export const condition_card = [
  { key: "Excellent", name: "Excellent", icon: icons.excellent_condition_icon },
  { key: "Good", name: "Good", icon: icons.good_condition_icon },
  { key: "Fair", name: "Fair", icon: icons.fair_condition_icon },
  { key: "Poor", name: "Poor", icon: icons.poor_condition_icon },
];
