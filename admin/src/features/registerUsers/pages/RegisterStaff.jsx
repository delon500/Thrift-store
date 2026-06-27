import { useState } from "react";
import { toast } from "react-toastify";
import { useRegisterStaff } from "../hooks/useRegisterUser";
import useAuthStore from "../../auth/store/authStore";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "../../../components/shared/ui";

const RegisterStaff = () => {
  const token = useAuthStore((state) => state.token);
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    contactNumber: "",
    role: "admin",
    password: "",
    confirmPassword: "",
  });
  const registerStaffMutation = useRegisterStaff();
  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    registerStaffMutation.mutate(
      {
        formData: {
          full_name: formData.fullName,
          email: formData.email,
          contact_number: formData.contactNumber,
          role: formData.role,
          password: formData.password,
          confirm_password: formData.confirmPassword,
        },
        token,
      },
      {
        onSuccess: () => {
          toast.success("Admin account created.");
          navigate("/admin/registered-users/admin");
        },
      },
    );
  };

  return (
    <div className="w-full">
      <PageHeader
        title="Register admin"
        subtitle="Create an administrator account."
      />

      <form onSubmit={handleSubmit}>
        <div className="bg-white border border-outline-variant rounded-3xl p-6 shadow-sm">
          {/* Section Header */}
          <div className="mb-6">
            <h2 className="font-bold text-on-surface text-lg">
              Administrator Information
            </h2>
            <p className="text-sm text-on-surface-variant">
              Enter the details of the administrator you want to register.
            </p>
          </div>

          {/* Row 1 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-semibold text-on-surface-variant mb-2">
                Full Name
              </label>

              <input
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                placeholder="John Doe"
                required
                className="w-full border border-outline-variant rounded-xl px-4 py-3 outline-none focus:border-primary"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-on-surface-variant mb-2">
                Email Address
              </label>

              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="john@school.com"
                className="w-full border border-outline-variant rounded-xl px-4 py-3 outline-none focus:border-primary"
                required
              />
            </div>
          </div>

          {/* Row 2 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-5">
            <div>
              <label className="block text-sm font-semibold text-on-surface-variant mb-2">
                Contact Number
              </label>

              <input
                type="tel"
                name="contactNumber"
                value={formData.contactNumber}
                onChange={handleChange}
                placeholder="+27..."
                className="w-full border border-outline-variant rounded-xl px-4 py-3 outline-none focus:border-primary"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-on-surface-variant mb-2">
                Account Type
              </label>

              <select
                name="role"
                value={formData.role}
                onChange={handleChange}
                className="w-full border border-outline-variant rounded-xl px-4 py-3 outline-none focus:border-primary"
              >
                <option value="admin">Administrator</option>
              </select>
            </div>
          </div>

          {/* Divider */}
          <div className="my-8 border-t border-outline-variant"></div>

          {/* Security Section */}
          <div className="mb-6">
            <h2 className="font-bold text-on-surface text-lg">Security</h2>

            <p className="text-sm text-on-surface-variant">
              Create login credentials for the administrator.
            </p>
          </div>

          {/* Passwords */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-semibold text-on-surface-variant mb-2">
                Password
              </label>

              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="********"
                className="w-full border border-outline-variant rounded-xl px-4 py-3 outline-none focus:border-primary"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-on-surface-variant mb-2">
                Confirm Password
              </label>

              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="********"
                className="w-full border border-outline-variant rounded-xl px-4 py-3 outline-none focus:border-primary"
                required
              />
            </div>
          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-3 mt-10">
            <button
              type="button"
              className="px-6 py-3 rounded-xl border border-outline-variant font-medium hover:bg-surface-container-low"
              onClick={() => navigate(-1)}
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={registerStaffMutation.isPending}
              className="bg-primary text-white px-8 py-3 rounded-xl font-semibold hover:bg-on-primary-container transition disabled:opacity-60"
            >
              {registerStaffMutation.isPending
                ? "Registering..."
                : "Register Administrator"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default RegisterStaff;
