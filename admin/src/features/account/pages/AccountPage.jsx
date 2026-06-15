import { useState } from "react";
import { useMe } from "../../auth/hook/useAuth";
import { useChangePassword, useUpdateMe } from "../hooks/useAccount";

const formatDate = (value) =>
  value ? new Date(value).toLocaleDateString(undefined, { dateStyle: "long" }) : "—";

const Banner = ({ message }) =>
  message ? (
    <div
      className={`rounded-lg px-4 py-2 text-sm font-medium ${
        message.type === "success"
          ? "bg-emerald-50 text-emerald-700"
          : "bg-red-50 text-red-700"
      }`}
    >
      {message.text}
    </div>
  ) : null;

const AccountPage = () => {
  const { data: me } = useMe();
  const updateMe = useUpdateMe();
  const changePassword = useChangePassword();

  const [profile, setProfile] = useState({ full_name: "", contact_number: "" });
  const [passwords, setPasswords] = useState({
    current_password: "",
    new_password: "",
    confirm_password: "",
  });
  const [profileMsg, setProfileMsg] = useState(null);
  const [passwordMsg, setPasswordMsg] = useState(null);

  // Populate the form from the loaded profile (render-time sync, no effect).
  const meKey = me ? `${me.id}:${me.full_name}:${me.contact_number}` : "";
  const [prevMeKey, setPrevMeKey] = useState("");
  if (me && meKey !== prevMeKey) {
    setPrevMeKey(meKey);
    setProfile({
      full_name: me.full_name || "",
      contact_number: me.contact_number || "",
    });
  }

  const handleProfileSave = async (e) => {
    e.preventDefault();
    setProfileMsg(null);

    try {
      await updateMe.mutateAsync(profile);
      setProfileMsg({ type: "success", text: "Profile updated." });
    } catch (error) {
      setProfileMsg({
        type: "error",
        text: error?.response?.data?.message || "Could not update profile",
      });
    }
  };

  const handlePasswordSave = async (e) => {
    e.preventDefault();
    setPasswordMsg(null);

    if (passwords.new_password !== passwords.confirm_password) {
      setPasswordMsg({ type: "error", text: "New passwords do not match." });
      return;
    }

    try {
      await changePassword.mutateAsync(passwords);
      setPasswordMsg({ type: "success", text: "Password changed." });
      setPasswords({
        current_password: "",
        new_password: "",
        confirm_password: "",
      });
    } catch (error) {
      setPasswordMsg({
        type: "error",
        text: error?.response?.data?.message || "Could not change password",
      });
    }
  };

  const inputClass =
    "rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-teal-600";

  return (
    <div className="p-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-black text-teal-600">Account</h1>
        <p className="text-sm font-medium text-gray-500">
          Manage your profile, password, and platform details.
        </p>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        {/* Profile */}
        <form
          onSubmit={handleProfileSave}
          className="rounded-2xl border border-gray-200 bg-white p-6"
        >
          <h2 className="text-lg font-black text-gray-800">Profile</h2>
          <div className="mt-4 grid gap-4">
            <Banner message={profileMsg} />
            <label className="grid gap-1 text-sm">
              <span className="font-semibold text-gray-600">Full name</span>
              <input
                value={profile.full_name}
                onChange={(e) =>
                  setProfile((p) => ({ ...p, full_name: e.target.value }))
                }
                className={inputClass}
              />
            </label>
            <label className="grid gap-1 text-sm">
              <span className="font-semibold text-gray-600">Email</span>
              <input
                value={me?.email || ""}
                disabled
                className={`${inputClass} bg-gray-50 text-gray-500`}
              />
            </label>
            <label className="grid gap-1 text-sm">
              <span className="font-semibold text-gray-600">Contact number</span>
              <input
                value={profile.contact_number}
                onChange={(e) =>
                  setProfile((p) => ({ ...p, contact_number: e.target.value }))
                }
                className={inputClass}
              />
            </label>
            <button
              type="submit"
              disabled={updateMe.isPending}
              className="mt-1 w-fit rounded-lg bg-teal-600 px-4 py-2 font-bold text-white disabled:opacity-60"
            >
              {updateMe.isPending ? "Saving..." : "Save profile"}
            </button>
          </div>
        </form>

        {/* Password */}
        <form
          onSubmit={handlePasswordSave}
          className="rounded-2xl border border-gray-200 bg-white p-6"
        >
          <h2 className="text-lg font-black text-gray-800">Change password</h2>
          <div className="mt-4 grid gap-4">
            <Banner message={passwordMsg} />
            <label className="grid gap-1 text-sm">
              <span className="font-semibold text-gray-600">Current password</span>
              <input
                type="password"
                value={passwords.current_password}
                onChange={(e) =>
                  setPasswords((p) => ({ ...p, current_password: e.target.value }))
                }
                className={inputClass}
              />
            </label>
            <label className="grid gap-1 text-sm">
              <span className="font-semibold text-gray-600">New password</span>
              <input
                type="password"
                value={passwords.new_password}
                onChange={(e) =>
                  setPasswords((p) => ({ ...p, new_password: e.target.value }))
                }
                className={inputClass}
              />
            </label>
            <label className="grid gap-1 text-sm">
              <span className="font-semibold text-gray-600">Confirm new password</span>
              <input
                type="password"
                value={passwords.confirm_password}
                onChange={(e) =>
                  setPasswords((p) => ({ ...p, confirm_password: e.target.value }))
                }
                className={inputClass}
              />
            </label>
            <button
              type="submit"
              disabled={changePassword.isPending}
              className="mt-1 w-fit rounded-lg bg-teal-600 px-4 py-2 font-bold text-white disabled:opacity-60"
            >
              {changePassword.isPending ? "Saving..." : "Change password"}
            </button>
          </div>
        </form>
      </div>

      {/* Platform info */}
      <div className="mt-6 rounded-2xl border border-gray-200 bg-white p-6">
        <h2 className="text-lg font-black text-gray-800">Platform</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-3 text-sm">
          <div>
            <p className="text-gray-400">Role</p>
            <p className="font-bold capitalize text-gray-800">{me?.role || "—"}</p>
          </div>
          <div>
            <p className="text-gray-400">Member since</p>
            <p className="font-bold text-gray-800">{formatDate(me?.created_at)}</p>
          </div>
          <div>
            <p className="text-gray-400">Account status</p>
            <p className="font-bold capitalize text-gray-800">{me?.status || "—"}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccountPage;
