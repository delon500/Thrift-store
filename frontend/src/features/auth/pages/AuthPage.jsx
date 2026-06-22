import { useState } from "react";
import { ShoppingBag, Leaf, MapPin, ShieldCheck } from "lucide-react";
import LoginForm from "../components/LoginForm";
import RegisterForm from "../components/RegisterForm";
import { useDocumentTitle } from "../../../lib/useDocumentTitle";

const VALUE_PROPS = [
  { Icon: ShoppingBag, title: "Shop pre-loved", desc: "Quality second-hand school items at fair prices." },
  { Icon: Leaf, title: "Second life", desc: "Give uniforms and gear another term of use." },
  { Icon: MapPin, title: "Collect at school", desc: "Pay online, then collect with a reference number." },
];

const AuthPage = () => {
  useDocumentTitle("Sign in");
  const [mode, setMode] = useState("login");

  return (
    <div className="min-h-screen bg-background p-4 sm:p-6">
      <div className="mx-auto grid min-h-[calc(100vh-3rem)] max-w-[1100px] overflow-hidden rounded-3xl border border-outline-variant bg-surface lg:grid-cols-2">
        <section className="hidden flex-col justify-between bg-primary p-10 text-on-primary lg:flex">
          <div className="flex items-center gap-2">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-on-primary/15">
              <ShoppingBag size={20} aria-hidden="true" />
            </span>
            <span className="text-xl font-extrabold tracking-tight">
              School Thrift
            </span>
          </div>

          <div className="space-y-7">
            <h1 className="max-w-sm text-3xl font-bold leading-tight">
              The marketplace for your school's second-hand items.
            </h1>
            <ul className="space-y-5">
              {VALUE_PROPS.map(({ Icon, title, desc }) => (
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
            Approved by your institution. Payments handled securely.
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

            <h2 className="text-2xl font-bold text-on-surface">
              {mode === "login" ? "Welcome back" : "Create your account"}
            </h2>
            <p className="mt-1 text-on-surface-variant">
              {mode === "login"
                ? "Sign in to browse and collect items."
                : "Register, then sign in once an admin approves you."}
            </p>

            <div className="my-6 grid grid-cols-2 gap-1 rounded-full bg-surface-container-low p-1">
              <button
                type="button"
                onClick={() => setMode("login")}
                className={`rounded-full py-2.5 text-sm font-semibold transition-colors ${
                  mode === "login"
                    ? "bg-surface text-on-surface shadow-sm"
                    : "text-on-surface-variant"
                }`}
              >
                Sign in
              </button>
              <button
                type="button"
                onClick={() => setMode("register")}
                className={`rounded-full py-2.5 text-sm font-semibold transition-colors ${
                  mode === "register"
                    ? "bg-surface text-on-surface shadow-sm"
                    : "text-on-surface-variant"
                }`}
              >
                Register
              </button>
            </div>

            {mode === "login" ? <LoginForm /> : <RegisterForm />}

            <p className="mt-6 text-center text-sm text-on-surface-variant">
              {mode === "login" ? (
                <>
                  Don't have an account?{" "}
                  <button
                    type="button"
                    onClick={() => setMode("register")}
                    className="font-semibold text-primary hover:underline"
                  >
                    Register
                  </button>
                </>
              ) : (
                <>
                  Already have an account?{" "}
                  <button
                    type="button"
                    onClick={() => setMode("login")}
                    className="font-semibold text-primary hover:underline"
                  >
                    Sign in
                  </button>
                </>
              )}
            </p>
          </div>
        </section>
      </div>
    </div>
  );
};

export default AuthPage;
