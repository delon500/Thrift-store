import React, { useState } from "react";
import { useRegisterStaff } from "../hooks/useRegisterUser";
import useAuthStore from "../../auth/store/authStore";
import { useNavigate } from "react-router-dom";

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
    registerStaffMutation.mutate({
      formData: {
        full_name: formData.fullName,
        email: formData.email,
        contact_number: formData.contactNumber,
        role: formData.role,
        password: formData.password,
        confirm_password: formData.confirmPassword,
      },
      token,
    });
  };

  return (
    <div className="w-full">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-black text-teal-600">Register Staff</h1>

        <p className="text-sm text-gray-500">
          Create staff and administrator accounts to manage inventory, verify
          pickups, monitor orders, and operate the school shop.
        </p>
      </div>

      {/* Form Card */}
      <form onSubmit={handleSubmit} className="mt-8">
        <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm">
          {/* Section Header */}
          <div className="mb-6">
            <h2 className="font-bold text-gray-800 text-lg">
              Staff Information
            </h2>
            <p className="text-sm text-gray-500">
              Enter the details of the staff member you want to register.
            </p>
          </div>

          {/* Row 1 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-2">
                Full Name
              </label>

              <input
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                placeholder="John Doe"
                required
                className="w-full border border-gray-300 rounded-xl px-4 py-3 outline-none focus:border-teal-500"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-2">
                Email Address
              </label>

              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="john@school.com"
                className="w-full border border-gray-300 rounded-xl px-4 py-3 outline-none focus:border-teal-500"
                required
              />
            </div>
          </div>

          {/* Row 2 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-5">
            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-2">
                Contact Number
              </label>

              <input
                type="tel"
                name="contactNumber"
                value={formData.contactNumber}
                onChange={handleChange}
                placeholder="+27..."
                className="w-full border border-gray-300 rounded-xl px-4 py-3 outline-none focus:border-teal-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-2">
                Account Type
              </label>

              <select
                name="role"
                value={formData.role}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-xl px-4 py-3 outline-none focus:border-teal-500"
              >
                <option value="admin">Administrator</option>
              </select>
            </div>
          </div>

          {/* Divider */}
          <div className="my-8 border-t border-gray-200"></div>

          {/* Security Section */}
          <div className="mb-6">
            <h2 className="font-bold text-gray-800 text-lg">Security</h2>

            <p className="text-sm text-gray-500">
              Create login credentials for the staff member.
            </p>
          </div>

          {/* Passwords */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-2">
                Password
              </label>

              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="********"
                className="w-full border border-gray-300 rounded-xl px-4 py-3 outline-none focus:border-teal-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-2">
                Confirm Password
              </label>

              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="********"
                className="w-full border border-gray-300 rounded-xl px-4 py-3 outline-none focus:border-teal-500"
                required
              />
            </div>
          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-3 mt-10">
            <button
              type="button"
              className="px-6 py-3 rounded-xl border border-gray-300 font-medium hover:bg-gray-50"
              onClick={() => navigate(-1)}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="bg-teal-600 text-white px-8 py-3 rounded-xl font-semibold hover:bg-teal-700 transition"
            >
              Register Staff
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default RegisterStaff;
