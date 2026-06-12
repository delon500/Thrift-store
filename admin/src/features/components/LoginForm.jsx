import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import useAuthStore from "../auth/store/authStore";
import { useLogin } from "../auth/hook/useAuth";

const LoginForm = () => {
  const setAuth = useAuthStore((state) => state.setAuth);
  const token = useAuthStore((state) => state.token);
  const loginMutation = useLogin();
  console.log(token);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const navigate = useNavigate();
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

      console.log(data);
      navigate("/admin");
      alert("Login successful");
    } catch (error) {
      alert(error?.response?.data?.message || "Login failed");
    }
  };
  return (
    <form
      className="border border-gray-300 p-6 sm:p-10 lg:p-20 flex flex-col justify-center bg-white"
      onSubmit={handleSubmit}
    >
      <div className="flex flex-col gap-2">
        <h1 className="text-center font-bold text-primary text-lg">
          Thrift School
        </h1>
        <span className="text-md font-normal text-center">
          Administrator Portal
        </span>
      </div>

      {/* Inputs */}

      <div className="mt-6 flex flex-col gap-4">
        <div className="space-y-1">
          <label className="block text-sm font-semibold text-slate-600 mb-2 ml-1">
            EMAIL
          </label>
          <input
            type="email"
            name="email"
            placeholder="admin@example.com"
            value={formData.email}
            onChange={handleChange}
            className="w-full rounded-md border-2 px-4 py-3 text-sm border-gray-300 placeholder:text-slate-400 border-surface-container-high focus:border-primary"
          />
        </div>

        <div className="space-y-1">
          <div className="flex justify-between mb-2 px-1">
            <label className="text-sm font-semibold text-slate-600">
              PASSWORD
            </label>{" "}
          </div>

          <input
            name="password"
            type="password"
            placeholder="••••••••"
            value={formData.password}
            onChange={handleChange}
            className="w-full rounded-md border-2 px-4 py-3 text-sm border-gray-300 placeholder:text-slate-400 border-surface-container-high focus:border-primary"
          />
        </div>
      </div>

      <button
        type="submit"
        className="bg-primary py-2 px-5 w-full mt-6 text-white text-sm shadow-md rounded-md"
      >
        Login
      </button>
    </form>
  );
};

export default LoginForm;
