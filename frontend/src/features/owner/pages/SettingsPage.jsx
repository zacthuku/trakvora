import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  User, Building2, Phone, Mail, Camera, Save,
  Bell, Shield, Eye, EyeOff, Lock, CheckCircle2,
  AlertCircle, Smartphone, Globe, Moon, Zap,
  LogOut, Trash2,
} from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { useNavigate } from "react-router-dom";
import OtpChannelCard from "@/features/auth/components/OtpChannelCard";
import apiClient from "@/services/apiClient";

const inputCls =
  "w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary transition-colors bg-white text-slate-800 placeholder:text-slate-400 disabled:bg-slate-50 disabled:text-slate-400";

function Toggle({ checked, onChange, label, sub }) {
  return (
    <label className="flex items-start gap-4 cursor-pointer py-3 group">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-800 group-hover:text-slate-900 transition-colors">{label}</p>
        {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
      </div>
      <div
        onClick={onChange}
        className={`relative w-11 h-6 rounded-full shrink-0 mt-0.5 transition-colors cursor-pointer ${checked ? "bg-secondary" : "bg-slate-200"}`}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${checked ? "translate-x-5" : "translate-x-0"}`}
        />
      </div>
    </label>
  );
}

function SectionHeader({ icon: Icon, title, sub }) {
  return (
    <div className="flex items-center gap-3 mb-5">
      <div className="w-9 h-9 rounded-xl bg-slate-900 flex items-center justify-center shrink-0">
        <Icon className="w-4 h-4 text-white" />
      </div>
      <div>
        <h2 className="font-heading font-semibold text-slate-900">{title}</h2>
        {sub && <p className="text-xs text-slate-500 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const { user, setAuth, clearAuth } = useAuthStore();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteText, setDeleteText] = useState("");

  const deleteMutation = useMutation({
    mutationFn: () => apiClient.delete("/users/me"),
    onSuccess: () => { clearAuth(); navigate("/login"); },
  });

  // Profile form
  const [profile, setProfile] = useState({
    full_name: user?.full_name || "",
    phone: user?.phone || "",
    company_name: user?.company_name || "",
    profile_photo_url: user?.profile_photo_url || "",
  });
  const [profileMsg, setProfileMsg] = useState(null);

  // Password form
  const [passwords, setPasswords] = useState({ current: "", next: "", confirm: "" });
  const [showPw, setShowPw] = useState({ current: false, next: false, confirm: false });
  const [pwMsg, setPwMsg] = useState(null);

  // Notification prefs (local state only — no backend yet)
  const [notifs, setNotifs] = useState({
    load_claimed: true,
    truck_assigned: true,
    payment_received: true,
    document_expiry: true,
    system_updates: false,
    sms_alerts: false,
    email_digest: true,
  });
  const [notifSaved, setNotifSaved] = useState(false);

  const setP = (k) => (e) => setProfile((f) => ({ ...f, [k]: e.target.value }));
  const setPw = (k) => (e) => setPasswords((f) => ({ ...f, [k]: e.target.value }));
  const toggleNotif = (k) => () => setNotifs((f) => ({ ...f, [k]: !f[k] }));

  const profileMutation = useMutation({
    mutationFn: (data) => apiClient.patch("/users/me", data).then((r) => r.data),
    onSuccess: (updated) => {
      const current = useAuthStore.getState();
      setAuth(updated, current.accessToken, current.refreshToken);
      setProfileMsg({ type: "ok", text: "Profile updated successfully." });
      setTimeout(() => setProfileMsg(null), 4000);
    },
    onError: (err) => {
      setProfileMsg({ type: "err", text: err?.response?.data?.detail || "Failed to save profile." });
    },
  });

  const handleProfileSave = (e) => {
    e.preventDefault();
    setProfileMsg(null);
    profileMutation.mutate({
      full_name: profile.full_name || undefined,
      phone: profile.phone || undefined,
      company_name: profile.company_name || undefined,
      profile_photo_url: profile.profile_photo_url || undefined,
    });
  };

  const handlePasswordSave = (e) => {
    e.preventDefault();
    if (passwords.next !== passwords.confirm) {
      setPwMsg({ type: "err", text: "New passwords do not match." });
      return;
    }
    if (passwords.next.length < 8) {
      setPwMsg({ type: "err", text: "New password must be at least 8 characters." });
      return;
    }
    setPwMsg({ type: "ok", text: "Password change will be available in the next update." });
    setTimeout(() => setPwMsg(null), 4000);
  };

  const handleNotifSave = () => {
    setNotifSaved(true);
    setTimeout(() => setNotifSaved(false), 3000);
  };

  const initials = user?.full_name
    ? user.full_name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase()
    : "O";

  return (
    <div className="w-full max-w-3xl">
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mb-4 mx-auto">
              <Trash2 className="w-6 h-6 text-red-500" />
            </div>
            <h3 className="text-lg font-heading font-bold text-slate-900 text-center mb-2">Delete Account</h3>
            <p className="text-sm text-slate-500 text-center mb-5">
              This permanently deletes your account, fleet data, and all associated records. Cannot be undone.
            </p>
            <p className="text-xs font-semibold text-slate-700 mb-2 uppercase tracking-wider">
              Type <span className="text-red-600 font-mono">DELETE</span> to confirm
            </p>
            <input value={deleteText} onChange={(e) => setDeleteText(e.target.value)} placeholder="DELETE"
              className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm mb-4 focus:outline-none focus:border-red-400" />
            <div className="flex gap-3">
              <button onClick={() => { setShowDeleteModal(false); setDeleteText(""); }}
                className="flex-1 px-4 py-2.5 border border-slate-200 rounded-lg text-sm font-semibold text-slate-600 hover:bg-slate-50">
                Cancel
              </button>
              <button onClick={() => deleteMutation.mutate()}
                disabled={deleteText !== "DELETE" || deleteMutation.isPending}
                className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg text-sm font-semibold hover:bg-red-700 disabled:opacity-50">
                {deleteMutation.isPending ? "Deleting…" : "Delete Account"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Page header */}
      <div className="mb-7">
        <h1 className="text-2xl font-heading font-bold text-slate-900 tracking-tight">Settings</h1>
        <p className="text-slate-500 text-sm mt-1">Manage your profile, security, and notification preferences.</p>
      </div>

      {!user?.phone && (
        <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl mb-5">
          <Phone className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-amber-800">Add your phone number</p>
            <p className="text-xs text-amber-600 mt-0.5">Required for SMS alerts and two-factor authentication. Update it in your profile below.</p>
          </div>
        </div>
      )}

      {/* ── Profile section ── */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm px-6 py-6 mb-5">
        <SectionHeader icon={User} title="Profile Information" sub="Update your personal and company details." />

        {/* Avatar */}
        <div className="flex items-center gap-5 mb-6">
          <div className="relative">
            {user?.profile_photo_url ? (
              <img src={user.profile_photo_url} alt="avatar"
                className="w-16 h-16 rounded-full object-cover border-2 border-slate-200" />
            ) : (
              <div className="w-16 h-16 rounded-full bg-slate-900 flex items-center justify-center border-2 border-slate-700">
                <span className="text-xl font-black text-white font-heading">{initials}</span>
              </div>
            )}
            <button className="absolute bottom-0 right-0 w-6 h-6 bg-secondary rounded-full flex items-center justify-center border-2 border-white shadow-sm hover:opacity-90 transition-opacity">
              <Camera className="w-3 h-3 text-white" />
            </button>
          </div>
          <div>
            <p className="font-semibold text-slate-900">{user?.full_name}</p>
            <p className="text-xs text-slate-500">{user?.email}</p>
            <span className="inline-block mt-1 px-2 py-0.5 rounded-full bg-[#4fdbcc]/10 text-teal-700 text-[10px] font-bold uppercase tracking-wider">
              Fleet Owner
            </span>
          </div>
        </div>

        {profileMsg && (
          <div className={`flex items-center gap-2 text-sm px-4 py-3 rounded-lg border mb-4 ${
            profileMsg.type === "ok"
              ? "bg-teal-50 text-teal-700 border-teal-200"
              : "bg-red-50 text-red-700 border-red-200"
          }`}>
            {profileMsg.type === "ok"
              ? <CheckCircle2 className="w-4 h-4 shrink-0" />
              : <AlertCircle className="w-4 h-4 shrink-0" />}
            {profileMsg.text}
          </div>
        )}

        <form onSubmit={handleProfileSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">Full Name</label>
              <input value={profile.full_name} onChange={setP("full_name")} placeholder="Your full name" className={inputCls} />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">Phone</label>
              <input value={profile.phone} onChange={setP("phone")} placeholder="+254 7XX XXX XXX" className={inputCls} />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">Company Name</label>
            <input value={profile.company_name} onChange={setP("company_name")} placeholder="Your transport company (optional)" className={inputCls} />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">Email Address</label>
            <input value={user?.email} disabled className={inputCls} />
            <p className="text-xs text-slate-400 mt-1">Email cannot be changed. Contact support if you need to update it.</p>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">Profile Photo URL</label>
            <input value={profile.profile_photo_url} onChange={setP("profile_photo_url")}
              placeholder="https://example.com/photo.jpg" className={inputCls} />
          </div>

          <div className="flex justify-end pt-2">
            <button type="submit" disabled={profileMutation.isPending}
              className="flex items-center gap-2 px-5 py-2.5 bg-secondary text-white rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50">
              {profileMutation.isPending
                ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Saving…</>
                : <><Save className="w-4 h-4" /> Save Profile</>}
            </button>
          </div>
        </form>
      </div>

      {/* ── Security section ── */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm px-6 py-6 mb-5">
        <SectionHeader icon={Shield} title="Security" sub="Manage your password and account access." />

        {pwMsg && (
          <div className={`flex items-center gap-2 text-sm px-4 py-3 rounded-lg border mb-4 ${
            pwMsg.type === "ok"
              ? "bg-teal-50 text-teal-700 border-teal-200"
              : "bg-red-50 text-red-700 border-red-200"
          }`}>
            {pwMsg.type === "ok" ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
            {pwMsg.text}
          </div>
        )}

        <form onSubmit={handlePasswordSave} className="space-y-4">
          {["current", "next", "confirm"].map((key) => {
            const labels = { current: "Current Password", next: "New Password", confirm: "Confirm New Password" };
            return (
              <div key={key}>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">
                  {labels[key]}
                </label>
                <div className="relative">
                  <input
                    type={showPw[key] ? "text" : "password"}
                    value={passwords[key]}
                    onChange={setPw(key)}
                    placeholder="••••••••"
                    className={`${inputCls} pr-10`}
                  />
                  <button type="button" onClick={() => setShowPw((s) => ({ ...s, [key]: !s[key] }))}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
                    {showPw[key] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            );
          })}

          <div className="flex justify-end pt-2">
            <button type="submit"
              className="flex items-center gap-2 px-5 py-2.5 border border-slate-200 text-slate-700 rounded-lg text-sm font-semibold hover:bg-slate-50 transition-colors">
              <Lock className="w-4 h-4" /> Change Password
            </button>
          </div>
        </form>

        {/* Account info */}
        <div className="mt-6 pt-5 border-t border-slate-100 grid grid-cols-2 gap-4">
          <div>
            <p className="text-[11px] text-slate-400 uppercase tracking-wider mb-1">Account Status</p>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-teal-50 text-teal-700 text-[10px] font-bold uppercase">
              <span className="w-1.5 h-1.5 rounded-full bg-teal-400" /> Active
            </span>
          </div>
          <div>
            <p className="text-[11px] text-slate-400 uppercase tracking-wider mb-1">Member Since</p>
            <p className="text-sm font-medium text-slate-700">
              {user?.created_at
                ? new Date(user.created_at).toLocaleDateString("en-KE", { day: "numeric", month: "long", year: "numeric" })
                : "—"}
            </p>
          </div>
          <div>
            <p className="text-[11px] text-slate-400 uppercase tracking-wider mb-1">Verification</p>
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
              user?.is_verified ? "bg-teal-50 text-teal-700" : "bg-amber-50 text-amber-700"
            }`}>
              {user?.is_verified ? <CheckCircle2 className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
              {user?.is_verified ? "Email Verified" : "Pending"}
            </span>
          </div>
          <div>
            <p className="text-[11px] text-slate-400 uppercase tracking-wider mb-1">Total Trips</p>
            <p className="text-sm font-bold font-heading text-slate-900">{user?.total_trips || 0}</p>
          </div>
        </div>
      </div>

      {/* ── Two-Factor Auth ── */}
      <OtpChannelCard user={user} onSaved={(updated) => {
        const current = useAuthStore.getState();
        setAuth(updated, current.accessToken, current.refreshToken);
      }} />

      {/* ── Notification preferences ── */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm px-6 py-6 mb-5">
        <SectionHeader icon={Bell} title="Notification Preferences" sub="Choose how and when trakvora notifies you." />

        <div className="divide-y divide-slate-100">
          <Toggle
            checked={notifs.load_claimed}
            onChange={toggleNotif("load_claimed")}
            label="Load Claimed"
            sub="When you successfully claim a load from the marketplace."
          />
          <Toggle
            checked={notifs.truck_assigned}
            onChange={toggleNotif("truck_assigned")}
            label="Truck Assigned"
            sub="When one of your trucks is assigned to a load."
          />
          <Toggle
            checked={notifs.payment_received}
            onChange={toggleNotif("payment_received")}
            label="Payment Received"
            sub="When funds are released to your wallet after delivery."
          />
          <Toggle
            checked={notifs.document_expiry}
            onChange={toggleNotif("document_expiry")}
            label="Document Expiry Alerts"
            sub="Reminders 60, 30, and 7 days before certificates expire."
          />
          <Toggle
            checked={notifs.system_updates}
            onChange={toggleNotif("system_updates")}
            label="Platform Updates"
            sub="Release notes and new feature announcements."
          />
          <Toggle
            checked={notifs.sms_alerts}
            onChange={toggleNotif("sms_alerts")}
            label="SMS Alerts"
            sub="Critical alerts via SMS to your registered phone number."
          />
          <Toggle
            checked={notifs.email_digest}
            onChange={toggleNotif("email_digest")}
            label="Weekly Email Digest"
            sub="Weekly summary of fleet activity and earnings sent every Monday."
          />
        </div>

        <div className="flex items-center justify-between mt-5 pt-4 border-t border-slate-100">
          {notifSaved && (
            <span className="flex items-center gap-1.5 text-sm text-teal-600">
              <CheckCircle2 className="w-4 h-4" /> Preferences saved
            </span>
          )}
          <div className="ml-auto">
            <button
              onClick={handleNotifSave}
              className="flex items-center gap-2 px-5 py-2.5 bg-secondary text-white rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity"
            >
              <Save className="w-4 h-4" /> Save Preferences
            </button>
          </div>
        </div>
      </div>

      {/* ── Danger zone ── */}
      <div className="bg-white rounded-xl border border-red-200 shadow-sm px-6 py-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-9 h-9 rounded-xl bg-red-50 flex items-center justify-center shrink-0">
            <AlertCircle className="w-4 h-4 text-red-500" />
          </div>
          <div>
            <h2 className="font-heading font-semibold text-slate-900">Danger Zone</h2>
            <p className="text-xs text-slate-500 mt-0.5">Irreversible account actions — proceed with caution.</p>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between py-3 border border-slate-100 rounded-lg px-4">
            <div>
              <p className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                <LogOut className="w-4 h-4 text-slate-500" /> Sign Out
              </p>
              <p className="text-xs text-slate-400 mt-0.5">Sign out of this account on this device.</p>
            </div>
            <button
              onClick={() => { clearAuth(); navigate("/login"); }}
              className="px-4 py-2 border border-slate-200 rounded-lg text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
            >
              Sign Out
            </button>
          </div>

          <div className="flex items-center justify-between py-3 border border-red-100 rounded-lg px-4 bg-red-50/30">
            <div>
              <p className="text-sm font-semibold text-red-700 flex items-center gap-2">
                <Trash2 className="w-4 h-4" /> Delete Account
              </p>
              <p className="text-xs text-red-400 mt-0.5">Permanently delete your account and all fleet data. Cannot be undone.</p>
            </div>
            <button
              onClick={() => setShowDeleteModal(true)}
              className="px-4 py-2 border border-red-200 rounded-lg text-sm font-semibold text-red-600 hover:bg-red-50 transition-colors"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
