import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { useRegisterInstitution } from "../hooks/useRegisterUser";
import useAuthStore from "../../auth/store/authStore";
import { PageHeader } from "../../../components/shared/ui";

const RegisterSchool = () => {
  const navigate = useNavigate();
  const token = useAuthStore((state) => state.token);
  const registerSchoolMutation = useRegisterInstitution();
  const [formData, setFormData] = useState({
    contactName: "",
    contactEmail: "",
    contactNumber: "",
    institutionName: "",
    registrationNumber: "",
    institutionPhone: "",
    institutionType: "private",
    institutionCategory: "school",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    registerSchoolMutation.mutate(
      {
        formData: {
          contact_person_name: formData.contactName,
          contact_email: formData.contactEmail,
          contact_number: formData.contactNumber,
          institution_name: formData.institutionName,
          registration_number: formData.registrationNumber,
          institution_phone: formData.institutionPhone,
          institution_type: formData.institutionType,
          institution_category: formData.institutionCategory,
        },
        token,
      },
      {
        onSuccess: () => {
          toast.success("School registered. Add accounts for it from Institutions.");
          navigate("/admin/institutions");
        },
        onError: (error) => {
          toast.error(
            error?.response?.data?.message || "Could not register the school",
          );
        },
      },
    );
  };

  return (
    <div className="w-full">
      <PageHeader
        title="Register school"
        subtitle="Register the school. Add login accounts for it afterwards from Institutions."
      />

      <form onSubmit={handleSubmit}>
        <div className="bg-white border border-outline-variant rounded-3xl p-6 shadow-sm">
          <div className="mb-6">
            <h2 className="font-bold text-on-surface text-lg">
              School Information
            </h2>
            <p className="text-sm text-on-surface-variant">
              Enter the details of the school you want to register.
            </p>
          </div>

          {/* Row 1 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-semibold text-on-surface-variant mb-2">
                Contact Person Name
              </label>

              <input
                type="text"
                name="contactName"
                value={formData.contactName}
                onChange={handleChange}
                placeholder="John Doe"
                required
                className="w-full border border-outline-variant rounded-xl px-4 py-3 outline-none focus:border-primary"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-on-surface-variant mb-2">
                Contact Email Address
              </label>

              <input
                type="email"
                name="contactEmail"
                value={formData.contactEmail}
                onChange={handleChange}
                placeholder="saintmartins@school.com"
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
                Institution Name
              </label>

              <input
                type="text"
                name="institutionName"
                value={formData.institutionName}
                onChange={handleChange}
                placeholder="John Doe"
                required
                className="w-full border border-outline-variant rounded-xl px-4 py-3 outline-none focus:border-primary"
              />
            </div>
          </div>

          {/* Row 3 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-5">
            <div>
              <label className="block text-sm font-semibold text-on-surface-variant mb-2">
                Institution Phone
              </label>

              <input
                type="tel"
                name="institutionPhone"
                value={formData.institutionPhone}
                onChange={handleChange}
                placeholder="+27..."
                className="w-full border border-outline-variant rounded-xl px-4 py-3 outline-none focus:border-primary"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-on-surface-variant mb-2">
                Institution Type
              </label>

              <select
                name="institutionType"
                value={formData.institutionType}
                onChange={handleChange}
                className="w-full border border-outline-variant rounded-xl px-4 py-3 outline-none focus:border-primary"
              >
                <option value="private">Private</option>
                <option value="public">Public</option>
                <option value="Independent">Independent</option>
              </select>
            </div>
          </div>

          <div className="mt-5">
            <label className="block text-sm font-semibold text-on-surface-variant mb-2">
              Institution Registration Number
            </label>

            <input
              type="text"
              name="registrationNumber"
              value={formData.registrationNumber}
              onChange={handleChange}
              placeholder="TA-001"
              className="w-full border border-outline-variant rounded-xl px-4 py-3 outline-none focus:border-primary"
            />
          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-3 mt-10">
            <button
              type="button"
              className="px-6 py-3 rounded-xl border border-outline-variant font-medium hover:bg-surface-container-low  cursor-pointer"
              onClick={() => navigate(-1)}
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={registerSchoolMutation.isPending}
              className="bg-primary text-white px-8 py-3 rounded-xl font-semibold hover:bg-on-primary-container transition cursor-pointer disabled:opacity-60"
            >
              {registerSchoolMutation.isPending ? "Registering..." : "Register School"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default RegisterSchool;
