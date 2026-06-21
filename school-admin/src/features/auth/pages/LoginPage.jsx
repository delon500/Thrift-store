import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ShoppingBag,
  ScanLine,
  PackageCheck,
  ShieldCheck,
} from "lucide-react";
import { useLogin } from "../hook/useAuth";
import useAuthStore from "../store/authStore";

const SCHOOL_ROLES = ["school", "university"];

const POINTS = [
  { Icon: ScanLine, title: "Verify references", desc: "Check the order or item the buyer presents." },
  { Icon: PackageCheck, title: "Hand over items", desc: "Confirm payment and mark items collected." },
];

const inputClass =
  "w-full rounded-xl border border-outline-variant bg-surface px-4 py-3 text-sm text-on-surface outline-none focus:border-primary";

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
    <div className="min-h-screen bg-background p-4 sm:p-6">
      <div className="mx-auto grid min-h-[calc(100vh-3rem)] max-w-[1000px] overflow-hidden rounded-3xl border border-outline-variant bg-surface lg:grid-cols-2">
        <section className="hidden flex-col justify-between bg-primary p-10 text-on-primary lg:flex">
          <div className="flex items-center gap-2">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-on-primary/15">
              <ShoppingBag size={20} aria-hidden="true" />
            </span>
            <span className="text-xl font-extrabold tracking-tight">School Thrift</span>
          </div>

          <div className="space-y-7">
            <h1 className="text-3xl font-bold leading-tight">Collections desk</h1>
            <ul className="space-y-5">
              {POINTS.map(({ Icon, title, desc }) => (
                <li key={title} className="flex gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-on-primary/15">
                    <Icon size={18} aria-hidden="true" />
                  </span>
                  <div>
                    <p className="font-semibold">{title}</p>
                    <p className="text-sm text-on-primary/80">{desc}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <p className="flex items-center gap-2 text-sm text-on-primary/80">
            <ShieldCheck size={16} aria-hidden="true" />
            School staff only.
          </p>
        </section>

        <section className="flex flex-col justify-center p-6 sm:p-10">
          <div className="mx-auto w-full max-w-md">
            <div className="mb-6 flex items-center gap-2 lg:hidden">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-on-primary">
                <ShoppingBag size={18} aria-hidden="true" />
              </span>
              <span className="text-lg font-extrabold tracking-tight text-on-surface">
                School Thrift
              </span>
            </div>

            <h2 className="text-2xl font-bold text-on-surface">Collections sign in</h2>
            <p className="mt-1 text-on-surface-variant">
              Sign in to verify references and hand over collected items.
            </p>

            <form onSubmit={handleSubmit} className="mt-6 space-y-5">
              {error ? (
                <div className="rounded-xl border border-error-container bg-error-container/40 px-4 py-3 text-sm font-medium text-on-error-container">
                  {error}
                </div>
              ) : null}

              <div>
                <label className="mb-1.5 block text-sm font-semibold text-on-surface-variant">
                  Email
                </label>
                <input
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="staff@school.com"
                  aria-label="Email"
                  className={inputClass}
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-semibold text-on-surface-variant">
                  Password
                </label>
                <input
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  aria-label="Password"
                  className={inputClass}
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
          </div>
        </section>
      </div>
    </div>
  );
};

export default LoginPage;
