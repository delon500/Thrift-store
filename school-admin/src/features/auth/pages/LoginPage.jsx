import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLogin } from "../hook/useAuth";
import useAuthStore from "../store/authStore";

const SCHOOL_ROLES = ["school", "university"];

const LoginPage = () => {
  const setAuth = useAuthStore((state) => state.setAuth);
  const loginMutation = useLogin();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [error, setError] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const data = await loginMutation.mutateAsync(formData);

      if (!SCHOOL_ROLES.includes(data.user?.role)) {
        setError("This portal is for school staff only.");
        return;
      }

      setAuth(data);
      navigate("/school", { replace: true });
    } catch (err) {
      setError(err?.response?.data?.message || "Login failed");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center notebook-grid p-4">
      <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
        <p className="text-xs font-bold uppercase tracking-wide text-teal-600">
          School portal
        </p>
        <h1 className="mt-1 text-2xl font-black text-gray-800">
          Collections sign in
        </h1>
        <p className="mt-2 text-sm text-gray-500">
          Sign in to verify references and hand over collected items.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 grid gap-4">
          {error ? (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
              {error}
            </div>
          ) : null}

          <label className="grid gap-1 text-sm">
            <span className="font-semibold text-gray-600">Email</span>
            <input
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="staff@school.com"
              className="rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-teal-600"
            />
          </label>

          <label className="grid gap-1 text-sm">
            <span className="font-semibold text-gray-600">Password</span>
            <input
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="••••••••"
              className="rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-teal-600"
            />
          </label>

          <button
            type="submit"
            disabled={loginMutation.isPending}
            className="mt-2 rounded-lg bg-teal-600 px-4 py-3 font-bold text-white disabled:opacity-60"
          >
            {loginMutation.isPending ? "Signing in..." : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
