import { useState } from "react";
import { toast } from "react-toastify";
import { User, Lock } from "lucide-react";
import { PageHeader, cardClass, inputClass } from "../../../components/shared/ui";
import { useMe } from "../../auth/hook/useAuth";
import useAuthStore from "../../auth/store/authStore";
import { useChangePassword, useUpdateMe } from "../hooks/useAccount";

const Field = ({ label, children }) => (
  <label className="grid gap-1.5 text-sm">
    <span className="font-semibold text-on-surface-variant">{label}</span>
    {children}
  </label>
);

const AccountPage = () => {
  const storeUser = useAuthStore((state) => state.user);
  const { data: me } = useMe();
  const profileData = me || storeUser;
  const updateMe = useUpdateMe();
  const changePassword = useChangePassword();

  const [profile, setProfile] = useState({ full_name: "", contact_number: "" });
  const [pw, setPw] = useState({
    current_password: "",
    new_password: "",
    confirm: "",
  });

  // Seed the form from the loaded profile (render-time sync, no effect needed).
  const [syncedFrom, setSyncedFrom] = useState(null);
  if (profileData && profileData !== syncedFrom) {
    setSyncedFrom(profileData);
    setProfile({
      full_name: profileData.full_name || "",
      contact_number: profileData.contact_number || "",
    });
  }

  const handleProfile = async (event) => {
    event.preventDefault();
    try {
      await updateMe.mutateAsync(profile);
      toast.success("Profile updated");
    } catch (error) {
      toast.error(error?.response?.data?.message || "Could not update profile");
    }
  };

  const handlePassword = async (event) => {
    event.preventDefault();
    if (pw.new_password !== pw.confirm) {
      toast.error("New passwords do not match");
      return;
    }
    try {
      await changePassword.mutateAsync({
        current_password: pw.current_password,
        new_password: pw.new_password,
      });
      toast.success("Password changed");
      setPw({ current_password: "", new_password: "", confirm: "" });
    } catch (error) {
      toast.error(error?.response?.data?.message || "Could not change password");
    }
  };

  return (
    <div>
      <PageHeader title="Account" subtitle="Manage your profile and password." />

      <div className="grid gap-6 lg:grid-cols-2">
        <form onSubmit={handleProfile} className={`${cardClass} p-6`}>
          <div className="mb-5 flex items-center gap-2">
            <User size={18} className="text-primary" aria-hidden="true" />
            <h2 className="font-bold text-on-surface">Profile</h2>
          </div>

          <div className="grid gap-4">
            <Field label="Full name">
              <input
                value={profile.full_name}
                onChange={(event) =>
                  setProfile((prev) => ({ ...prev, full_name: event.target.value }))
                }
                className={inputClass}
              />
            </Field>
            <Field label="Contact number">
              <input
                value={profile.contact_number}
                onChange={(event) =>
                  setProfile((prev) => ({
                    ...prev,
                    contact_number: event.target.value,
                  }))
                }
                className={inputClass}
              />
            </Field>
            <Field label="Email">
              <input
                value={profileData?.email || ""}
                disabled
                className={`${inputClass} cursor-not-allowed opacity-60`}
              />
            </Field>
            <Field label="Institution">
              <input
                value={profileData?.institution_name || "—"}
                disabled
                className={`${inputClass} cursor-not-allowed opacity-60`}
              />
            </Field>
          </div>

          <button
            type="submit"
            disabled={updateMe.isPending}
            className="mt-6 rounded-xl bg-primary px-6 py-3 font-semibold text-on-primary transition-colors hover:bg-on-primary-container disabled:opacity-60"
          >
            {updateMe.isPending ? "Saving..." : "Save profile"}
          </button>
        </form>

        <form onSubmit={handlePassword} className={`${cardClass} p-6`}>
          <div className="mb-5 flex items-center gap-2">
            <Lock size={18} className="text-primary" aria-hidden="true" />
            <h2 className="font-bold text-on-surface">Password</h2>
          </div>

          <div className="grid gap-4">
            <Field label="Current password">
              <input
                type="password"
                value={pw.current_password}
                onChange={(event) =>
                  setPw((prev) => ({ ...prev, current_password: event.target.value }))
                }
                className={inputClass}
              />
            </Field>
            <Field label="New password">
              <input
                type="password"
                value={pw.new_password}
                onChange={(event) =>
                  setPw((prev) => ({ ...prev, new_password: event.target.value }))
                }
                className={inputClass}
              />
            </Field>
            <Field label="Confirm new password">
              <input
                type="password"
                value={pw.confirm}
                onChange={(event) =>
                  setPw((prev) => ({ ...prev, confirm: event.target.value }))
                }
                className={inputClass}
              />
            </Field>
          </div>

          <button
            type="submit"
            disabled={changePassword.isPending}
            className="mt-6 rounded-xl bg-primary px-6 py-3 font-semibold text-on-primary transition-colors hover:bg-on-primary-container disabled:opacity-60"
          >
            {changePassword.isPending ? "Updating..." : "Change password"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AccountPage;
