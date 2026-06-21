import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Input from "../../../components/ui/Input";
import { useLogin } from "../hooks/useAuth";
import useAuthStore from "../store/authStore";

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
  const location = useLocation();
  const redirectTo = location.state?.from?.pathname || "/products";
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [message, setMessage] = useState(null);
  const [showResetHelp, setShowResetHelp] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage(null);

    try {
      const data = await loginMutation.mutateAsync(formData);
      setAuth(data);
      navigate(redirectTo, { replace: true });
    } catch (error) {
      const status = error?.response?.status;
      const text = error?.response?.data?.message || "Login failed";
      if (status === 403) {
        setMessage({
          type: "info",
          text: `${text}. You'll be able to log in once an admin approves your registration.`,
        });
      } else {
        setMessage({ type: "error", text });
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {message ? (
        <div
          className={`rounded-xl border px-4 py-3 text-sm font-medium ${
            message.type === "info"
              ? "border-tertiary/30 bg-tertiary-container/50 text-on-tertiary-container"
              : "border-error/30 bg-error-container/50 text-on-error-container"
          }`}
        >
          {message.text}
        </div>
      ) : null}

      <Field label="Email">
        <Input
          name="email"
          type="email"
          placeholder="you@example.com"
          value={formData.email}
          onChange={handleChange}
        />
      </Field>

      <div>
        <div className="mb-1.5 flex items-center justify-between">
          <label className="text-sm font-semibold text-on-surface-variant">
            Password
          </label>
          <button
            type="button"
            onClick={() => setShowResetHelp((value) => !value)}
            className="text-sm font-semibold text-primary hover:underline"
          >
            Forgot password?
          </button>
        </div>
        {showResetHelp ? (
          <p className="mb-2 rounded-lg bg-surface-container-low px-3 py-2 text-xs text-on-surface-variant">
            Password resets are handled by your school. Please contact your
            school administrator to have your password reset.
          </p>
        ) : null}
        <Input
          name="password"
          type="password"
          placeholder="••••••••"
          value={formData.password}
          onChange={handleChange}
        />
      </div>

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
