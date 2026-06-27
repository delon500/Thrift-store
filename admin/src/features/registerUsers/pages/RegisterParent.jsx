import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getInstitutions } from "../../institutions/api/institutionsApi";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { useRegisterParent } from "../hooks/useRegisterUser";
import useAuthStore from "../../auth/store/authStore";
import { PageHeader } from "../../../components/shared/ui";
const RegisterParent = () => {
  const token = useAuthStore((state) => state.token);
  const useRegisterParentMutation = useRegisterParent();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    contactNumber: "",
    schoolId: "",
    password: "",
    confirmPassword: "",
  });
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };
  const handleSchoolChange = (e) => {
    const { value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      schoolId: value,
    }));
  };

  const {
    data: institutions = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["institutions"],
    queryFn: getInstitutions,
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    useRegisterParentMutation.mutate(
      {
        formData: {
          full_name: formData.fullName,
          email: formData.email,
          contact_number: formData.contactNumber,
          institution_id: formData.schoolId,
          password: formData.password,
          confirm_password: formData.confirmPassword,
        },
        token,
      },
      {
        onSuccess: (data) => {
          toast.success(
            data?.emailed
              ? "Parent account created — login details emailed."
              : "Parent account created (login email not sent).",
          );
          navigate("/admin/registered-users/parent");
        },
      },
    );
  };

  return (
    <div className="w-full">
      <PageHeader
        title="Register parent"
        subtitle="Create a parent account. They can sign in once approved."
      />

      <form onSubmit={handleSubmit}>
        <div className="bg-white border border-outline-variant rounded-3xl p-6 shadow-sm">
          <div className="mb-6">
            <h2 className="font-bold text-on-surface text-lg">
              Parent Information
            </h2>
            <p className="text-sm text-on-surface-variant">
              Enter the details of the parent you want to register.
            </p>
          </div>

          {/* Form Fields */}

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
                School Name
              </label>

              <select
                value={formData.schoolId}
                onChange={handleSchoolChange}
                className="w-full border border-outline-variant rounded-xl px-4 py-3 outline-none focus:border-primary"
              >
                <option value="">Select School</option>

                {isLoading && <option value="">Loading schools...</option>}

                {isError && <option value="">Failed to load schools</option>}

                {institutions.map((institution) => (
                  <option key={institution.id} value={institution.id}>
                    {institution.institution_name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Divider */}
          <div className="my-8 border-t border-outline-variant"></div>

          {/* Security Section */}
          <div className="mb-6">
            <h2 className="font-bold text-on-surface text-lg">Security</h2>

            <p className="text-sm text-on-surface-variant">
              Create login credentials for the parent.
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
              disabled={useRegisterParentMutation.isPending}
              className="bg-primary text-white px-8 py-3 rounded-xl font-semibold hover:bg-on-primary-container transition disabled:opacity-60"
            >
              {useRegisterParentMutation.isPending
                ? "Registering..."
                : "Register Parent"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default RegisterParent;
