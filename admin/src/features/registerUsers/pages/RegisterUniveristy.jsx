import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useRegisterInstitution } from "../hooks/useRegisterUser";
import useAuthStore from "../../auth/store/authStore";

const RegisterUniveristy = () => {
  const token = useAuthStore((state) => state.token);
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    contactName: "",
    contactEmail: "",
    contactNumber: "",
    institutionName: "",
    registrationNumber: "",
    institutionPhone: "",
    institutionType: "private",
    password: "",
    confirmPassword: "",
  });

  const registerUniversityMutation = useRegisterInstitution();
  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = {
      contact_person_name: formData.contactName,
      contact_email: formData.contactEmail,
      contact_number: formData.contactNumber,
      institution_name: formData.institutionName,
      registration_number: formData.registrationNumber,
      institution_phone: formData.institutionPhone,
      institution_type: formData.institutionType,
      institution_category: "university",
      password: formData.password,
      confirm_password: formData.confirmPassword,
    };
    console.log("Submitting registration with payload:", payload);
    registerUniversityMutation.mutate({ formData: payload, token });
  };
  return (
    <div className="w-full">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-black text-teal-600">
          Register University
        </h1>

        <p className="text-sm text-gray-500">
          Create university accounts to manage inventory, verify pickups,
          monitor orders, and operate the university shop.
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="mt-8">
        <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm">
          <div className="mb-6">
            <h2 className="font-bold text-gray-800 text-lg">
              University Information
            </h2>
            <p className="text-sm text-gray-500">
              Enter the details of the university you want to register.
            </p>
          </div>

          {/* Row 1 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-2">
                Contact Person Name
              </label>

              <input
                type="text"
                name="contactName"
                value={formData.contactName}
                onChange={handleChange}
                placeholder="John Doe"
                required
                className="w-full border border-gray-300 rounded-xl px-4 py-3 outline-none focus:border-teal-500"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-2">
                Contact Email Address
              </label>

              <input
                type="email"
                name="contactEmail"
                value={formData.contactEmail}
                onChange={handleChange}
                placeholder="saintmartins@school.com"
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
                Institution Name
              </label>

              <input
                type="text"
                name="institutionName"
                value={formData.institutionName}
                onChange={handleChange}
                placeholder="John Doe"
                required
                className="w-full border border-gray-300 rounded-xl px-4 py-3 outline-none focus:border-teal-500"
              />
            </div>
          </div>

          {/* Row 3 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-5">
            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-2">
                Institution Phone
              </label>

              <input
                type="tel"
                name="institutionPhone"
                value={formData.institutionPhone}
                onChange={handleChange}
                placeholder="+27..."
                className="w-full border border-gray-300 rounded-xl px-4 py-3 outline-none focus:border-teal-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-2">
                Institution Type
              </label>

              <select
                name="institutionType"
                value={formData.institutionType}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-xl px-4 py-3 outline-none focus:border-teal-500"
              >
                <option value="private">Private</option>
                <option value="public">Public</option>
                <option value="independent">Independent</option>
              </select>
            </div>
          </div>

          <div className="mt-5">
            <label className="block text-sm font-semibold text-gray-600 mb-2">
              Institution Registration Number
            </label>

            <input
              type="text"
              name="registrationNumber"
              value={formData.registrationNumber}
              onChange={handleChange}
              placeholder="TA-001"
              className="w-full border border-gray-300 rounded-xl px-4 py-3 outline-none focus:border-teal-500"
            />
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
              className="bg-teal-600 text-white px-8 py-3 rounded-xl font-semibold hover:bg-teal-700 transition cursor-pointer"
            >
              Register University
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default RegisterUniveristy;
