import {
  PackagePlus,
  Boxes,
  PackageCheck,
  Store,
  Shield,
  School,
  Users,
  GraduationCap,
  User,
  ClipboardList,
} from "lucide-react";

// `to` is relative — CardActions prepends "/admin/".
export const action_card = [
  {
    name: "Add items",
    description:
      "Upload a new lost-and-found or thrift item with photos and details, with AI auto-fill to speed things up.",
    color: "#dbf0ee",
    Icon: PackagePlus,
    to: "lost-and-found-management/add-items",
  },
  {
    name: "Manage inventory",
    description:
      "View, edit, and remove items across all schools, and update prices or availability.",
    color: "#d4e6e5",
    Icon: Boxes,
    to: "inventory",
  },
  {
    name: "Pickup & collections",
    description:
      "Verify reference numbers, track payments, and mark items as collected at the school.",
    color: "#d4e6e5",
    Icon: PackageCheck,
    to: "orders",
  },
  {
    name: "View store",
    description:
      "Preview the live marketplace the way students and parents see it.",
    color: "#d4e6e5",
    Icon: Store,
    to: "view-store",
  },
];

export const register_user_action_card = [
  {
    name: "Register admin",
    description:
      "Create an administrator account with the correct access and platform visibility.",
    color: "#dbf0ee",
    Icon: Shield,
    to: "/register-users/staff",
  },
  {
    name: "Register school",
    description:
      "Add a school profile with its main contact details and prepare it for onboarding.",
    color: "#d4e6e5",
    Icon: School,
    to: "/register-users/school",
  },
  {
    name: "Register parents",
    description:
      "Create a parent profile for learner activity, lost-item workflows, and store access.",
    color: "#ffe6e4",
    Icon: Users,
    to: "/register-users/parent",
  },
  {
    name: "Register university",
    description:
      "Add a university profile with its main contact details and prepare it for onboarding.",
    color: "#d4e6e5",
    Icon: GraduationCap,
    to: "/register-users/university",
  },
  {
    name: "Register students",
    description:
      "Register a student profile and link the student to the correct institution.",
    color: "#ffe6e4",
    Icon: User,
    to: "/register-users/student",
  },
];

// `to` is relative — CardActions prepends "/admin/". The last path segment is
// the backend user role (admin = staff).
export const registered_user_action_card = [
  {
    name: "Registration requests",
    description:
      "Review pending school, university, staff, parent, and student registration requests.",
    color: "#dbf0ee",
    Icon: ClipboardList,
    to: "registrations",
  },
  {
    name: "Registered schools",
    description: "View every school registered on the platform.",
    color: "#dbf0ee",
    Icon: School,
    to: "registered-users/school",
  },
  {
    name: "Registered universities",
    description: "View every university registered on the platform.",
    color: "#d4e6e5",
    Icon: GraduationCap,
    to: "registered-users/university",
  },
  {
    name: "Registered admins",
    description: "View platform administrators.",
    color: "#d4e6e5",
    Icon: Shield,
    to: "registered-users/admin",
  },
  {
    name: "Registered students",
    description: "View every registered student.",
    color: "#ffe6e4",
    Icon: User,
    to: "registered-users/student",
  },
  {
    name: "Registered parents",
    description: "View every registered parent.",
    color: "#dbf0ee",
    Icon: Users,
    to: "registered-users/parent",
  },
];
