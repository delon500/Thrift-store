import { useMemo, useState } from "react";
import { Users, User } from "lucide-react";
import Input from "../../../components/ui/Input";
import { roleCards } from "../../../data/data.js";
import RoleCard from "./RoleCard";
import { useRegisterParentStudent } from "../hooks/useAuth.js";
import { useQuery } from "@tanstack/react-query";
import { getInstitutions } from "../../institutions/api/institutionApi.js";

const ROLE_ICONS = {
  parent: Users,
  student: User,
};

const Field = ({ label, children }) => (
  <div>
    <label className="mb-1.5 block text-sm font-semibold text-on-surface-variant">
      {label}
    </label>
    {children}
  </div>
);

const RegisterForm = () => {
  const parentStudentMutation = useRegisterParentStudent();
  const [formData, setFormData] = useState({
    role: "parent",
    fullName: "",
    email: "",
    contactNumber: "",
    institutionSearch: "",
    selectedInstitution: null,
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
    return institutions.filter((institution) =>
      institution.institution_name.toLowerCase().includes(query),
    );
  }, [formData.institutionSearch, institutions]);

  const handleSelectInstitution = (institution) => {
    setFormData((prev) => ({
      ...prev,
      institutionSearch: institution.institution_name,
      selectedInstitution: institution,
    }));
    setShowSuggestions(false);
  };

  const handleRoleChange = (role) => {
    setFormData((prev) => ({ ...prev, role }));
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
      ...(name === "institutionSearch" ? { selectedInstitution: null } : {}),
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage(null);

    try {
      const result = await parentStudentMutation.mutateAsync(formData);
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
        <p className="mb-2 text-sm font-semibold text-on-surface-variant">
          Register as
        </p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {roleCards.map((role) => (
            <RoleCard
              key={role.key}
              label={role.label}
              desc={role.desc}
              icon={ROLE_ICONS[role.key]}
              active={formData.role === role.key}
              onClick={() => handleRoleChange(role.key)}
            />
          ))}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Full name">
          <Input
            name="fullName"
            type="text"
            placeholder="Your name"
            value={formData.fullName}
            onChange={handleChange}
          />
        </Field>
        <Field label="Email">
          <Input
            name="email"
            type="email"
            placeholder="you@example.com"
            value={formData.email}
            onChange={handleChange}
          />
        </Field>
      </div>

      <Field label="Contact number">
        <Input
          name="contactNumber"
          type="tel"
          placeholder="+27 12 345 6789"
          value={formData.contactNumber}
          onChange={handleChange}
        />
      </Field>

      <div className="relative">
        <Field label="Your school or university">
          <Input
            name="institutionSearch"
            type="text"
            placeholder="Type to search..."
            value={formData.institutionSearch}
            onChange={(event) => {
              handleChange(event);
              setShowSuggestions(true);
            }}
            onFocus={() => setShowSuggestions(true)}
          />
        </Field>
        {showSuggestions && formData.institutionSearch.trim() !== "" ? (
          <div className="absolute z-20 mt-2 max-h-56 w-full overflow-auto rounded-xl border border-outline-variant bg-surface shadow-lg">
            {filteredInstitutions.length > 0 ? (
              filteredInstitutions.map((institution) => (
                <button
                  key={institution.id}
                  type="button"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => handleSelectInstitution(institution)}
                  className="block w-full border-b border-outline-variant px-4 py-3 text-left transition-colors last:border-0 hover:bg-surface-container-low"
                >
                  <span className="font-semibold text-on-surface">
                    {institution.institution_name}
                  </span>
                </button>
              ))
            ) : (
              <div className="px-4 py-3 text-sm text-on-surface-variant">
                No matching institution found
              </div>
            )}
          </div>
        ) : null}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Password">
          <Input
            name="password"
            type="password"
            placeholder="Create a password"
            value={formData.password}
            onChange={handleChange}
          />
        </Field>
        <Field label="Confirm password">
          <Input
            name="confirmPassword"
            type="password"
            placeholder="Repeat password"
            value={formData.confirmPassword}
            onChange={handleChange}
          />
        </Field>
      </div>

      {message ? (
        <div
          className={`rounded-xl border px-4 py-3 text-sm font-medium ${
            message.type === "success"
              ? "border-primary/30 bg-primary-container/50 text-on-primary-container"
              : "border-error/30 bg-error-container/50 text-on-error-container"
          }`}
        >
          {message.text}
        </div>
      ) : null}

      <button
        type="submit"
        disabled={parentStudentMutation.isPending}
        className="w-full rounded-full bg-primary py-3.5 font-semibold text-on-primary transition-colors hover:bg-on-primary-container disabled:opacity-60"
      >
        {parentStudentMutation.isPending ? "Submitting..." : "Submit registration"}
      </button>
    </form>
  );
};

export default RegisterForm;
