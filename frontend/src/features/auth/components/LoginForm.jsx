import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const data = await loginMutation.mutateAsync(formData);
      setAuth(data);
      alert("Login successful");
      navigate(redirectTo, { replace: true });
    } catch (error) {
      alert(error?.response?.data?.message || "Login failed");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
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

          <Link
            to="/forgot-password"
            className="text-sm font-semibold text-primary hover:underline"
          >
            Forgot Password?
          </Link>
        </div>

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
