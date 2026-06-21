import { ShoppingBag, Boxes, UserCheck, CreditCard, ShieldCheck } from "lucide-react";
import LoginForm from "../../components/LoginForm";

const POINTS = [
  { Icon: Boxes, title: "Manage inventory", desc: "List items and run the school store." },
  { Icon: UserCheck, title: "Approve registrations", desc: "Review and approve new accounts." },
  { Icon: CreditCard, title: "Reconcile payments", desc: "Confirm payments and collections." },
];

const AuthPage = () => {
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
            <h1 className="text-3xl font-bold leading-tight">Admin portal</h1>
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
            Authorized staff only.
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

            <h2 className="text-2xl font-bold text-on-surface">Welcome back</h2>
            <p className="mt-1 text-on-surface-variant">
              Sign in to the admin portal.
            </p>

            <div className="mt-6">
              <LoginForm />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default AuthPage;
