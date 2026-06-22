import { Search } from "lucide-react";

const Input = ({
  placeholder,
  value,
  onChange,
  onFocus,
  type = "text",
  isSearch = false,
  name = "",
}) => {
  return (
    <div className="relative">
      {isSearch ? (
        <Search
          size={18}
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-outline"
          aria-hidden="true"
        />
      ) : null}
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        onFocus={onFocus}
        name={name}
        aria-label={placeholder}
        className={`w-full rounded-xl border border-outline-variant bg-surface py-3 text-sm text-on-surface outline-none transition-colors focus:border-primary disabled:cursor-not-allowed disabled:bg-surface-container-low ${
          isSearch ? "pl-10 pr-4" : "px-4"
        }`}
      />
    </div>
  );
};

export default Input;
