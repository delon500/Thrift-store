import { Link } from "react-router-dom";
import {
  Search,
  CreditCard,
  QrCode,
  PackageCheck,
  ShieldCheck,
  Clock,
  RefreshCw,
} from "lucide-react";
import { useDocumentTitle } from "../../../lib/useDocumentTitle";

const STEPS = [
  {
    Icon: Search,
    title: "Find an item",
    desc: "Browse the thrift store and lost & found from your registered school.",
  },
  {
    Icon: CreditCard,
    title: "Pay online",
    desc: "Check out securely with card, Instant EFT, or a supported wallet.",
  },
  {
    Icon: QrCode,
    title: "Get your pass",
    desc: "Each paid order gets a unique reference and a QR collection pass.",
  },
  {
    Icon: PackageCheck,
    title: "Collect at school",
    desc: "Show your reference or QR at the school to pick up your item.",
  },
];

const FAQS = [
  {
    Icon: ShieldCheck,
    q: "Is my payment secure?",
    a: "Yes. Payments are handled by PayFast — card and banking details are never stored in this app.",
  },
  {
    Icon: Clock,
    q: "How long do I have to collect?",
    a: "Once your payment is confirmed your item is reserved for you. Bring your reference to the school's collection desk.",
  },
  {
    Icon: RefreshCw,
    q: "What if my payment doesn't go through?",
    a: "The item is released back to the store and you can try checking out again from your cart.",
  },
];

const HowItWorks = () => {
  useDocumentTitle("How collection works");

  return (
    <div className="mx-auto max-w-[1000px]">
      <div className="rounded-3xl bg-primary px-6 py-12 text-center text-on-primary sm:px-10">
        <span className="inline-block rounded-full bg-on-primary/15 px-3 py-1 text-xs font-semibold">
          Buy online · Collect at school
        </span>
        <h1 className="mt-4 text-3xl font-bold sm:text-4xl">
          How collection works
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-on-primary/85">
          Buy a pre-loved item online and pick it up at your school in four
          simple steps.
        </p>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {STEPS.map(({ Icon, title, desc }, index) => (
          <div
            key={title}
            className="rounded-2xl border border-outline-variant bg-surface p-5"
          >
            <div className="flex items-center justify-between">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-container text-on-primary-container">
                <Icon size={20} aria-hidden="true" />
              </span>
              <span className="text-2xl font-bold text-outline-variant">
                {index + 1}
              </span>
            </div>
            <h2 className="mt-4 font-bold text-on-surface">{title}</h2>
            <p className="mt-1 text-sm text-on-surface-variant">{desc}</p>
          </div>
        ))}
      </div>

      <section className="mt-12">
        <h2 className="text-xl font-bold text-on-surface">Good to know</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {FAQS.map(({ Icon, q, a }) => (
            <div
              key={q}
              className="rounded-2xl border border-outline-variant bg-surface p-5"
            >
              <Icon size={20} className="text-primary" aria-hidden="true" />
              <h3 className="mt-3 font-semibold text-on-surface">{q}</h3>
              <p className="mt-1 text-sm text-on-surface-variant">{a}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="mt-12 flex flex-col items-center gap-4 rounded-2xl border border-outline-variant bg-surface py-10 text-center">
        <p className="text-lg font-bold text-on-surface">
          Ready to find something?
        </p>
        <Link
          to="/products"
          className="rounded-full bg-primary px-6 py-3 font-semibold text-on-primary hover:bg-on-primary-container"
        >
          Browse items
        </Link>
      </div>
    </div>
  );
};

export default HowItWorks;
