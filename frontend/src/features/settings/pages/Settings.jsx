import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import useAuthStore from "../../auth/store/authStore";
import {
  useChangeMyPassword,
  useMyProfile,
  useUpdateMyProfile,
} from "../hooks/useSettings";
import { useDocumentTitle } from "../../../lib/useDocumentTitle";

const initialPasswordForm = {
  current_password: "",
  new_password: "",
  confirm_password: "",
};

const formatValue = (value) => {
  if (value === null || value === undefined || value === "") {
    return "Not available";
  }

  return value;
};

const formatRole = (role) => {
  if (!role) return "Not available";

  return role
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

const getStatusStyles = (status) => {
  if (status === "approved") {
    return "bg-primary-fixed text-on-primary-fixed border-primary-fixed-dim";
  }

  if (status === "pending") {
    return "bg-secondary-container text-on-secondary-container border-secondary-fixed-dim";
  }

  return "bg-error-container text-on-error-container border-tertiary-fixed-dim";
};

const getErrorMessage = (error, fallback) =>
  error?.response?.data?.message || fallback;

const InfoRow = ({ label, value }) => (
  <div className="flex flex-col gap-1 border-b border-outline-variant/70 py-4 last:border-b-0">
    <span className="text-xs font-semibold uppercase text-outline">
      {label}
    </span>
    <span className="break-words text-sm font-semibold text-on-surface">
      {formatValue(value)}
    </span>
  </div>
);

const Field = ({ label, ...props }) => (
  <label className="flex flex-col gap-2">
    <span className="text-xs font-semibold uppercase text-outline">
      {label}
    </span>
    <input
      {...props}
      className="rounded-lg border border-outline-variant bg-white px-4 py-3 text-sm font-semibold text-on-surface outline-none transition-colors focus:border-primary"
    />
  </label>
);

const SettingsSection = ({ title, description, children, action }) => (
  <section className="overflow-hidden rounded-lg border border-outline-variant bg-white shadow-sm">
    <div className="flex flex-col gap-3 border-b border-outline-variant/70 px-5 py-5 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h2 className="text-lg font-bold text-on-surface">{title}</h2>
        {description ? (
          <p className="mt-1 text-sm text-on-surface-variant">
            {description}
          </p>
        ) : null}
      </div>
      {action}
    </div>
    <div className="px-5 py-1">{children}</div>
  </section>
);

const Settings = () => {
  useDocumentTitle("Settings");
  const navigate = useNavigate();
  const fallbackUser = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const { data: profile, isLoading, isError, error } = useMyProfile();
  const updateProfileMutation = useUpdateMyProfile();
  const changePasswordMutation = useChangeMyPassword();
  const user = profile || fallbackUser;
  const status = user?.status || "pending";

  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({
    full_name: "",
    contact_number: "",
  });
  const [passwordForm, setPasswordForm] = useState(initialPasswordForm);

  const openProfileEditor = () => {
    setProfileForm({
      full_name: user?.full_name || "",
      contact_number: user?.contact_number || "",
    });
    setIsEditingProfile(true);
  };

  const handleProfileChange = (event) => {
    const { name, value } = event.target;
    setProfileForm((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handlePasswordChange = (event) => {
    const { name, value } = event.target;
    setPasswordForm((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleProfileSubmit = async (event) => {
    event.preventDefault();

    try {
      await updateProfileMutation.mutateAsync(profileForm);
      setIsEditingProfile(false);
      toast.success("Profile updated successfully");
    } catch (submitError) {
      toast.error(getErrorMessage(submitError, "Profile update failed"));
    }
  };

  const handlePasswordSubmit = async (event) => {
    event.preventDefault();

    try {
      await changePasswordMutation.mutateAsync(passwordForm);
      setPasswordForm(initialPasswordForm);
      toast.success("Password changed successfully");
    } catch (submitError) {
      toast.error(getErrorMessage(submitError, "Password change failed"));
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/", { replace: true });
  };

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
      <header className="flex flex-col gap-4 rounded-lg border border-outline-variant bg-surface-container-lowest px-6 py-6 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase text-primary">
            Account settings
          </p>
          <h1 className="mt-2 text-3xl font-bold text-on-surface">
            {isLoading ? "Loading profile..." : formatValue(user?.full_name)}
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-on-surface-variant">
            Manage the account details linked to your school thrift profile.
          </p>
          {isError ? (
            <p className="mt-3 text-sm font-semibold text-error">
              {getErrorMessage(error, "Could not load the latest profile.")}
            </p>
          ) : null}
        </div>

        <div
          className={`w-fit rounded-full border px-4 py-2 text-sm font-bold ${getStatusStyles(
            status,
          )}`}
        >
          {formatRole(status)}
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(300px,0.8fr)]">
        <div className="flex flex-col gap-6">
          <SettingsSection
            title="Profile"
            description="Personal details used for marketplace access and school account records."
            action={
              <button
                type="button"
                onClick={() =>
                  isEditingProfile
                    ? setIsEditingProfile(false)
                    : openProfileEditor()
                }
                className="rounded-full border border-primary px-4 py-2 text-sm font-bold text-primary transition-colors hover:bg-surface-container-low"
              >
                {isEditingProfile ? "Cancel" : "Edit profile"}
              </button>
            }
          >
            {isEditingProfile ? (
              <form className="grid gap-4 py-5" onSubmit={handleProfileSubmit}>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field
                    label="Full name"
                    name="full_name"
                    value={profileForm.full_name}
                    onChange={handleProfileChange}
                    required
                  />
                  <Field
                    label="Contact number"
                    name="contact_number"
                    value={profileForm.contact_number}
                    onChange={handleProfileChange}
                    required
                  />
                </div>
                <div className="flex flex-col gap-3 sm:flex-row">
                  <button
                    type="submit"
                    disabled={updateProfileMutation.isPending}
                    className="rounded-full bg-primary px-5 py-3 text-sm font-bold text-on-primary transition-colors hover:bg-on-primary-container disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {updateProfileMutation.isPending
                      ? "Saving..."
                      : "Save profile"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsEditingProfile(false)}
                    className="rounded-full border border-outline px-5 py-3 text-sm font-bold text-on-surface-variant transition-colors hover:bg-surface-container-low"
                  >
                    Keep current details
                  </button>
                </div>
              </form>
            ) : (
              <div className="grid gap-x-8 sm:grid-cols-2">
                <InfoRow label="Full name" value={user?.full_name} />
                <InfoRow label="Email" value={user?.email} />
                <InfoRow label="Contact number" value={user?.contact_number} />
                <InfoRow label="Role" value={formatRole(user?.role)} />
                <InfoRow label="User ID" value={user?.id} />
                <InfoRow label="Institution ID" value={user?.institution_id} />
              </div>
            )}
          </SettingsSection>

          <SettingsSection
            title="My institution"
            description="School or institution details connected to your marketplace account."
          >
            <div className="grid gap-x-8 sm:grid-cols-2">
              <InfoRow
                label="Institution name"
                value={user?.institution_name}
              />
              <InfoRow
                label="Institution category"
                value={user?.institution_category}
              />
              <InfoRow label="Institution type" value={user?.institution_type} />
              <InfoRow
                label="Institution status"
                value={formatRole(user?.institution_status)}
              />
            </div>
          </SettingsSection>
        </div>

        <aside className="flex flex-col gap-6">
          <SettingsSection
            title="Account status"
            description="Your approval status controls access to protected marketplace features."
          >
            <div className="py-5">
              <div
                className={`inline-flex rounded-full border px-4 py-2 text-sm font-bold ${getStatusStyles(
                  status,
                )}`}
              >
                {formatRole(status)}
              </div>
              <p className="mt-4 text-sm leading-6 text-on-surface-variant">
                {status === "approved"
                  ? "Your account is approved and ready to use."
                  : "Your account is waiting for review before all features are available."}
              </p>
            </div>
          </SettingsSection>

          <SettingsSection
            title="Security"
            description="Keep your account access current."
          >
            <form
              className="flex flex-col gap-3 py-5"
              onSubmit={handlePasswordSubmit}
            >
              <Field
                label="Current password"
                name="current_password"
                type="password"
                value={passwordForm.current_password}
                onChange={handlePasswordChange}
                required
              />
              <Field
                label="New password"
                name="new_password"
                type="password"
                value={passwordForm.new_password}
                onChange={handlePasswordChange}
                minLength={8}
                required
              />
              <Field
                label="Confirm password"
                name="confirm_password"
                type="password"
                value={passwordForm.confirm_password}
                onChange={handlePasswordChange}
                minLength={8}
                required
              />
              <button
                type="submit"
                disabled={changePasswordMutation.isPending}
                className="mt-2 w-full rounded-full bg-primary px-5 py-3 text-sm font-bold text-on-primary transition-colors hover:bg-on-primary-container disabled:cursor-not-allowed disabled:opacity-60"
              >
                {changePasswordMutation.isPending
                  ? "Changing..."
                  : "Change password"}
              </button>
              <button
                type="button"
                onClick={handleLogout}
                className="w-full rounded-full border border-error px-5 py-3 text-sm font-bold text-error transition-colors hover:bg-error-container"
              >
                Logout
              </button>
            </form>
          </SettingsSection>

          <SettingsSection
            title="Marketplace"
            description="Quick access to the areas tied to this account."
          >
            <div className="grid gap-3 py-5">
              <button
                type="button"
                onClick={() => navigate("/wishlist")}
                className="rounded-lg border border-outline-variant px-4 py-3 text-left text-sm font-bold text-on-surface transition-colors hover:bg-surface-container-low"
              >
                Wishlist
              </button>
              <button
                type="button"
                onClick={() => navigate("/cart")}
                className="rounded-lg border border-outline-variant px-4 py-3 text-left text-sm font-bold text-on-surface transition-colors hover:bg-surface-container-low"
              >
                Cart
              </button>
              <button
                type="button"
                onClick={() => navigate("/lost-found")}
                className="rounded-lg border border-outline-variant px-4 py-3 text-left text-sm font-bold text-on-surface transition-colors hover:bg-surface-container-low"
              >
                Lost and Found
              </button>
            </div>
          </SettingsSection>
        </aside>
      </div>
    </div>
  );
};

export default Settings;
