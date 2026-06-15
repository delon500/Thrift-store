import { useMemo, useState } from "react";
import Input from "../../../components/ui/Input";
import { roleCards } from "../../../data/data.js";
import RoleCard from "./RoleCard";
import {
  useRegisterInstitution,
  useRegisterParentStudent,
} from "../hooks/useAuth.js";
import { useQuery } from "@tanstack/react-query";
import { getInstitutions } from "../../institutions/api/institutionApi.js";

const RegisterForm = () => {
  const parentStudentMutation = useRegisterParentStudent();
  const institutionMutation = useRegisterInstitution();
  const [formData, setFormData] = useState({
    role: "parent",
    fullName: "",
    email: "",
    contactNumber: "",
    institutionSearch: "",
    selectedInstitution: null,

    contactPerson: "",
    institutionName: "",
    institutionType: "",
    registrationNumber: "",
    institutionPhone: "",

    password: "",
    confirmPassword: "",
  });

  const { data: institutions = [] } = useQuery({
    queryKey: ["institutions"],
    queryFn: getInstitutions,
  });

  const [showSuggestions, setShowSuggestions] = useState(false);
  const [message, setMessage] = useState(null);

  const filteredInstitutions = useMemo(() => {
    const query = formData.institutionSearch.trim().toLowerCase();
    if (!query) return institutions;
    console.log(
      institutions.filter((institution) =>
        institution.institution_name.toLowerCase().includes(query),
      ),
    );
    return institutions.filter((institution) =>
      institution.institution_name.toLowerCase().includes(query),
    );
  }, [formData.institutionSearch, institutions]);

  const handleSelectInstitution = (institution) => {
    setFormData((prev) => ({
      ...prev,
      institutionSearch: institution.institution_name,
      institutionName: institution.institution_name,
      selectedInstitution: institution,
    }));
    setShowSuggestions(false);
  };

  const isInstitutionAccount =
    formData.role === "school" || formData.role === "university";

  const handleRoleChange = (role) => {
    setFormData((prev) => ({
      ...prev,
      role,
      institutionSearch: "",
      selectedInstitution: null,
      institutionName: "",
    }));
    setShowSuggestions(false);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
      ...(name === "institutionSearch"
        ? { selectedInstitution: null, institutionName: value }
        : {}),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage(null);

    try {
      const result = isInstitutionAccount
        ? await institutionMutation.mutateAsync(formData)
        : await parentStudentMutation.mutateAsync(formData);

      setMessage({
        type: "success",
        text:
          result?.message ||
          "Registration submitted. You'll be able to log in once an admin approves it.",
      });
    } catch (error) {
      setMessage({
        type: "error",
        text: error?.response?.data?.message || "Something went wrong",
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className="block text-sm font-semibold text-slate-600 mb-3 ml-1">
          REGISTER AS
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {roleCards.map((role) => {
            const active = formData.role === role.key;
            return (
              <RoleCard
                key={role.key}
                label={role.label}
                desc={role.desc}
                active={active}
                onClick={() => handleRoleChange(role.key)}
              />
            );
          })}
        </div>
      </div>

      {isInstitutionAccount ? (
        <>
          <div className="flex flex-col sm:flex-row space-x-5">
            <div>
              <label className="block text-sm font-semibold text-slate-600 mb-2 ml-1">
                NAME / CONTACT PERSON
              </label>
              <Input
                name="contactPerson"
                type="text"
                placeholder="John Smith"
                value={formData.contactPerson}
                onChange={handleChange}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-600 mb-2 ml-1">
                CONTACT EMAIL
              </label>
              <Input
                name="email"
                type="email"
                placeholder="contact@school.com"
                value={formData.email}
                onChange={handleChange}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-600 mb-2 ml-1">
              CONTACT NUMBER
            </label>
            <Input
              name="contactNumber"
              type="tel"
              placeholder="+27 123 456 789"
              value={formData.contactNumber}
              onChange={handleChange}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-600 mb-2 ml-1">
              INSTITUTION NAME
            </label>
            <Input
              name="institutionName"
              type="text"
              placeholder="Enter school or university name"
              value={formData.institutionName}
              onChange={handleChange}
            />
          </div>

          <div className="flex flex-col sm:flex-row space-x-5 items-center">
            <div>
              <label className="block text-sm font-semibold text-slate-600 mb-2 ml-1">
                REGISTRATION / INSTITUTION NUMBER
              </label>
              <Input
                name="registrationNumber"
                type="text"
                placeholder="#  OPTIONAL"
                value={formData.registrationNumber}
                onChange={handleChange}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-600 mb-2 ml-1">
                INSTITUTION PHONE
              </label>
              <Input
                name="institutionPhone"
                type="tel"
                placeholder="Institution phone number"
                value={formData.institutionPhone}
                onChange={handleChange}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-600 mb-3 ml-1">
              INSTITUTION TYPE
            </label>
            <select
              name="institutionType"
              value={formData.institutionType}
              onChange={handleChange}
              className="w-full rounded-full border-2 px-4 py-3 text-sm outline-none transition-all bg-white text-on-surface placeholder:text-slate-400 border-surface-container-high focus:border-primary focus:shadow-[0_0_0_4px_rgba(0,106,99,0.08)] disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400 "
            >
              <option value="#">Select Type</option>
              <option value="public">Public</option>
              <option value="private">Private</option>
              <option value="Independent">Independent</option>
              <option value="public University">Public University</option>
              <option value="private University">Private University</option>
            </select>
          </div>
        </>
      ) : (
        <>
          <div className="flex flex-col sm:flex-row space-x-5">
            <div>
              <label className="block text-sm font-semibold text-slate-600 mb-2 ml-1">
                FULL NAME
              </label>
              <Input
                name="fullName"
                type="text"
                placeholder="Your name"
                value={formData.fullName}
                onChange={handleChange}
                isSearch={false}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-600 mb-2 ml-1">
                EMAIL
              </label>
              <Input
                name="email"
                type="email"
                placeholder="johndoe@example.com"
                value={formData.email}
                onChange={handleChange}
                isSearch={false}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-600 mb-2 ml-1">
              CONTACT NUMBER
            </label>
            <Input
              name="contactNumber"
              type="tel"
              placeholder="+27 123 456 789"
              value={formData.contactNumber}
              onChange={handleChange}
            />
          </div>

          <div className="relative">
            <label className="block text-sm font-semibold text-slate-600 mb-2 ml-1">
              SEARCH FOR INSTITUTION
            </label>
            <Input
              name="institutionSearch"
              type="text"
              placeholder="Type institution name"
              value={formData.institutionSearch}
              onChange={(e) => {
                handleChange(e);
                setShowSuggestions(true);
              }}
              onFocus={() => setShowSuggestions(true)}
            />
            {showSuggestions && formData.institutionSearch.trim() !== "" && (
              <div className="absolute z-20 mt-2 w-full  rounded-2xl border border-surface-container-high bg-white shadow-lg max-h-56 overflow-auto">
                {filteredInstitutions.length > 0 ? (
                  filteredInstitutions.map((institution) => (
                    <button
                      key={institution.id}
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => handleSelectInstitution(institution)}
                      className="w-full text-left px-4 py-3 hover:bg-surface-container-low transition-colors border-b border-surface-container-low last:border-b-0 cursor-pointer"
                    >
                      <div className="font-semibold text-on-surface">
                        {institution.institution_name}
                      </div>
                      <div className="text-sm text-on-surface-variant">
                        {institution.institution_name}
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="px-4 py-3 text-sm text-on-surface-variant">
                    No matching institution found
                  </div>
                )}
              </div>
            )}
          </div>
        </>
      )}

      <div className="flex flex-col sm:flex-row space-x-5">
        <div>
          <label className="block text-sm font-semibold text-slate-600 mb-2 ml-1">
            PASSWORD
          </label>
          <Input
            name="password"
            type="password"
            placeholder="Create a password"
            value={formData.password}
            onChange={handleChange}
            isSearch={false}
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-600 mb-2 ml-1">
            CONFIRM PASSWORD
          </label>
          <Input
            name="confirmPassword"
            type="password"
            placeholder="Repeat password"
            value={formData.confirmPassword}
            onChange={handleChange}
            isSearch={false}
          />
        </div>
      </div>

      {message ? (
        <div
          className={`rounded-2xl border px-4 py-3 text-sm font-medium ${
            message.type === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border-red-200 bg-red-50 text-red-700"
          }`}
        >
          {message.text}
        </div>
      ) : null}

      <button
        type="submit"
        className="w-full bg-primary-container text-on-primary-container font-semibold py-4 rounded-full border-4 border-white shadow-[0_4px_0_0_rgba(0,0,0,0.1)] transition-all active:translate-y-1 active:shadow-none"
      >
        Submit Registration Request
      </button>
    </form>
  );
};

export default RegisterForm;
