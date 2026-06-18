import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Input from "../../../components/ui/Input";
import { useLogin } from "../hooks/useAuth";
import useAuthStore from "../store/authStore";

const LoginForm = () => {
  const setAuth = useAuthStore((state) => state.setAuth);
  const loginMutation = useLogin();
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = location.state?.from?.pathname || "/products";
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [message, setMessage] = useState(null);
  const [showResetHelp, setShowResetHelp] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage(null);

    try {
      const data = await loginMutation.mutateAsync(formData);
      setAuth(data);
      navigate(redirectTo, { replace: true });
    } catch (error) {
      const status = error?.response?.status;
      const text = error?.response?.data?.message || "Login failed";

      // A 403 here means the account is registered but not yet approved —
      // that's expected, so present it as friendly info rather than an error.
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
    <form onSubmit={handleSubmit} className="space-y-6">
      {message ? (
        <div
          className={`rounded-2xl border px-4 py-3 text-sm font-medium ${
            message.type === "info"
              ? "border-amber-200 bg-amber-50 text-amber-800"
              : "border-red-200 bg-red-50 text-red-700"
          }`}
        >
          {message.text}
        </div>
      ) : null}

      <div className="space-y-1">
        <label className="block text-sm font-semibold text-slate-600 mb-2 ml-1">
          EMAIL
        </label>
        <Input
          name="email"
          type="email"
          placeholder="johndoe@example.com"
          value={formData.email}
          onChange={handleChange}
          name="email"
          isSearch={false}
        />
      </div>

      <div className="space-y-1">
        <div className="flex justify-between mb-2 px-1">
          <label className="text-sm font-semibold text-slate-600">
            PASSWORD
          </label>

          <button
            type="button"
            onClick={() => setShowResetHelp((value) => !value)}
            className="text-sm font-semibold text-primary hover:underline"
          >
            Forgot Password?
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
          name="password"
          isSearch={false}
        />
      </div>

      <button
        type="submit"
        className="w-full bg-primary-container text-on-primary-container font-semibold py-4 rounded-full border-4 border-white shadow-[0_4px_0_0_rgba(0,0,0,0.1)] transition-all active:translate-y-1 active:shadow-none"
      >
        Login
      </button>
    </form>
  );
};

export default LoginForm;
