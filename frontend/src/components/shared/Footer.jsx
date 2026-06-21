import { Link } from "react-router-dom";
import { ShoppingBag } from "lucide-react";

const linkClass = "text-on-surface-variant transition-colors hover:text-primary";

const Footer = () => {
  return (
    <footer className="mt-16 border-t border-outline-variant bg-surface">
      <div className="mx-auto max-w-[1400px] px-4 py-10 sm:px-6">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div className="max-w-xs">
            <div className="flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-on-primary">
                <ShoppingBag size={18} aria-hidden="true" />
              </span>
              <span className="text-lg font-extrabold tracking-tight text-on-surface">
                School Thrift
              </span>
            </div>
            <p className="mt-3 text-sm text-on-surface-variant">
              Give pre-loved school items a second life. Buy online, then collect
              at school with your reference number.
            </p>
          </div>

          <div>
            <h2 className="text-sm font-bold text-on-surface">Browse</h2>
            <ul className="mt-3 space-y-2 text-sm">
              <li><Link to="/products" className={linkClass}>Browse all</Link></li>
              <li><Link to="/thrift-store" className={linkClass}>Thrift store</Link></li>
              <li><Link to="/lost-found" className={linkClass}>Lost &amp; found</Link></li>
              <li><Link to="/how-it-works" className={linkClass}>How it works</Link></li>
            </ul>
          </div>

          <div>
            <h2 className="text-sm font-bold text-on-surface">Your account</h2>
            <ul className="mt-3 space-y-2 text-sm">
              <li><Link to="/orders" className={linkClass}>My orders</Link></li>
              <li><Link to="/wishlist" className={linkClass}>Wishlist</Link></li>
              <li><Link to="/settings" className={linkClass}>Settings</Link></li>
            </ul>
          </div>

          <div>
            <h2 className="text-sm font-bold text-on-surface">How it works</h2>
            <ol className="mt-3 space-y-2 text-sm text-on-surface-variant">
              <li>1. Buy an item online</li>
              <li>2. Get a reference number</li>
              <li>3. Collect it at your school</li>
            </ol>
            <Link
              to="/how-it-works"
              className="mt-3 inline-block text-sm font-semibold text-primary hover:underline"
            >
              Learn more
            </Link>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-2 border-t border-outline-variant pt-6 text-xs text-on-surface-variant sm:flex-row">
          <span>© {new Date().getFullYear()} School Thrift</span>
          <span>Buy online · Collect at school</span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
