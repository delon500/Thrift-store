import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import useAuthStore from "../auth/store/authStore";
import { useLogin } from "../auth/hook/useAuth";

const inputClass =
  "w-full rounded-xl border border-outline-variant bg-surface px-4 py-3 text-sm text-on-surface outline-none focus:border-primary";

const Field = ({ label, children }) => (
  <div>
    <label className="mb-1.5 block text-sm font-semibold text-on-surface-variant">
      {label}
    </label>
    {children}
  </div>
);

const LoginForm = () => {
  const setAuth = useAuthStore((state) => state.setAuth);
  const loginMutation = useLogin();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: "", password: "" });

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      const data = await loginMutation.mutateAsync(formData);
      setAuth(data);
      toast.success("Login successful");
      navigate("/admin");
    } catch (error) {
      toast.error(error?.response?.data?.message || "Login failed");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <Field label="Email">
        <input
          type="email"
          name="email"
          placeholder="admin@example.com"
          value={formData.email}
          onChange={handleChange}
          aria-label="Email"
          className={inputClass}
        />
      </Field>
      <Field label="Password">
        <input
          type="password"
          name="password"
          placeholder="••••••••"
          value={formData.password}
          onChange={handleChange}
          aria-label="Password"
          className={inputClass}
        />
      </Field>
      <button
        type="submit"
        disabled={loginMutation.isPending}
        className="w-full rounded-full bg-primary py-3.5 font-semibold text-on-primary transition-colors hover:bg-on-primary-container disabled:opacity-60"
      >
        {loginMutation.isPending ? "Signing in..." : "Sign in"}
      </button>
    </form>
  );
};

export default LoginForm;
