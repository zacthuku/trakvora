import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import {
  User, Phone, Camera, Save, Bell, Shield,
  Eye, EyeOff, Lock, CheckCircle2, AlertCircle,
  LogOut, Trash2, Briefcase, CreditCard, MapPin, Zap,
} from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { useNotificationStore } from "@/store/notificationStore";
import { useNavigate } from "react-router-dom";
import apiClient from "@/services/apiClient";
import OtpChannelCard from "@/features/auth/components/OtpChannelCard";

const inputCls =
  "w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary transition-colors bg-white text-slate-800 placeholder:text-slate-400 disabled:bg-slate-50 disabled:text-slate-400";

function Toggle({ checked, onChange, label, sub, icon: Icon, iconColor }) {
  return (
    <div className="flex items-start gap-4 py-3.5 border-b border-slate-50 last:border-0">
      {Icon && (
        <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center shrink-0 mt-0.5">
          <Icon className={`w-4 h-4 ${iconColor || "text-slate-500"}`} />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-800">{label}</p>
        {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
      </div>
      <div onClick={onChange}
        className={`relative w-11 h-6 rounded-full shrink-0 mt-1 transition-colors cursor-pointer ${checked ? "bg-secondary" : "bg-slate-200"}`}>
        <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${checked ? "translate-x-5" : "translate-x-0"}`} />
      </div>
    </div>
  );
}

export default function DriverSettingsPage() {
  const { user, setAuth, clearAuth } = useAuthStore();
  const navigate = useNavigate();
  const { enabled, setEnabled } = useNotificationStore();

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteText, setDeleteText] = useState("");

  const deleteMutation = useMutation({
    mutationFn: () => apiClient.delete("/users/me"),
    onSuccess: () => { clearAuth(); navigate("/login"); },
  });

  const [profile, setProfile] = useState({
    full_name: user?.full_name || "",
    phone: user?.phone || "",
    company_name: user?.company_name || "",
    profile_photo_url: user?.profile_photo_url || "",
  });
  const [profileMsg, setProfileMsg] = useState(null);
  const [passwords, setPasswords] = useState({ current: "", next: "", confirm: "" });
  const [showPw, setShowPw] = useState({ current: false, next: false, confirm: false });
  const [pwMsg, setPwMsg] = useState(null);
  const [notifs, setNotifs] = useState({
    job_assigned: true,
    new_jobs_nearby: true,
    pickup_reminder: true,
    delivery_reminder: true,
    earnings_update: true,
    safety_alerts: true,
    email_digest: true,
    sms_alerts: false,
  });
  const [notifSaved, setNotifSaved] = useState(false);

  const setP = (k) => (e) => setProfile((f) => ({ ...f, [k]: e.target.value }));
  const setPw = (k) => (e) => setPasswords((f) => ({ ...f, [k]: e.target.value }));
  const toggleNotif = (k) => () => setNotifs((f) => ({ ...f, [k]: !f[k] }));

  const profileMutation = useMutation({
    mutationFn: (data) => apiClient.patch("/users/me", data).then((r) => r.data),
    onSuccess: (updated) => {
      const state = useAuthStore.getState();
      setAuth(updated, state.accessToken, state.refreshToken);
      setProfileMsg({ type: "ok", text: "Profile updated successfully." });
      setTimeout(() => setProfileMsg(null), 4000);
    },
    onError: (err) =>
      setProfileMsg({ type: "err", text: err?.response?.data?.detail || "Failed to save." }),
  });

  const initials = user?.full_name
    ? user.full_name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase()
    : "D";

  return (
    <div className="w-full max-w-2xl">
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mb-4 mx-auto">
              <Trash2 className="w-6 h-6 text-red-500" />
            </div>
            <h3 className="text-lg font-heading font-bold text-slate-900 text-center mb-2">Delete Account</h3>
            <p className="text-sm text-slate-500 text-center mb-5">
              This permanently deletes your driver account and all associated data. Cannot be undone.
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

      <div className="mb-7">
        <h1 className="text-2xl font-heading font-bold text-slate-900 tracking-tight">Settings</h1>
        <p className="text-slate-500 text-sm mt-1">Manage your driver profile and notification preferences.</p>
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

      {/* Profile */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden mb-5">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3 bg-slate-50/50">
          <div className="w-9 h-9 rounded-xl bg-slate-900 flex items-center justify-center"><User className="w-4 h-4 text-white" /></div>
          <div>
            <h2 className="font-heading font-semibold text-slate-900">Profile Information</h2>
            <p className="text-xs text-slate-500 mt-0.5">Your driver account details.</p>
          </div>
        </div>
        <div className="px-6 py-5">
          <div className="flex items-center gap-4 mb-5 pb-5 border-b border-slate-100">
            <div className="relative">
              <div className="w-14 h-14 rounded-full bg-slate-900 flex items-center justify-center border-2 border-slate-700">
                <span className="text-lg font-black text-white font-heading">{initials}</span>
              </div>
              <button className="absolute bottom-0 right-0 w-5 h-5 bg-secondary rounded-full flex items-center justify-center border-2 border-white shadow-sm">
                <Camera className="w-2.5 h-2.5 text-white" />
              </button>
            </div>
            <div>
              <p className="font-semibold text-slate-900">{user?.full_name}</p>
              <p className="text-xs text-slate-500">{user?.email}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="px-2 py-0.5 rounded-full bg-[#4fdbcc]/10 text-teal-700 text-[10px] font-bold uppercase tracking-wider">Driver</span>
                <span className="text-xs text-slate-400">{user?.total_trips || 0} trips completed</span>
              </div>
            </div>
          </div>

          {profileMsg && (
            <div className={`flex items-center gap-2 text-sm px-4 py-3 rounded-lg border mb-4 ${
              profileMsg.type === "ok" ? "bg-teal-50 text-teal-700 border-teal-200" : "bg-red-50 text-red-700 border-red-200"
            }`}>
              {profileMsg.type === "ok" ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
              {profileMsg.text}
            </div>
          )}

          <form onSubmit={(e) => { e.preventDefault(); profileMutation.mutate({ full_name: profile.full_name || undefined, phone: profile.phone || undefined }); }} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">Full Name</label>
                <input value={profile.full_name} onChange={setP("full_name")} placeholder="Your name" className={inputCls} />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">Phone</label>
                <input value={profile.phone} onChange={setP("phone")} placeholder="+254 7XX XXX XXX" className={inputCls} />
              </div>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">Email</label>
              <input value={user?.email} disabled className={inputCls} />
            </div>
            <div className="flex justify-end">
              <button type="submit" disabled={profileMutation.isPending}
                className="flex items-center gap-2 px-5 py-2.5 bg-secondary text-white rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50">
                {profileMutation.isPending ? "Saving…" : <><Save className="w-4 h-4" /> Save</>}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Notifications */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden mb-5">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3 bg-slate-50/50">
          <div className="w-9 h-9 rounded-xl bg-slate-900 flex items-center justify-center"><Bell className="w-4 h-4 text-white" /></div>
          <div>
            <h2 className="font-heading font-semibold text-slate-900">Notifications</h2>
            <p className="text-xs text-slate-500 mt-0.5">Choose which job and earning alerts you receive.</p>
          </div>
        </div>
        <div className="px-6 py-4">
          <div className="flex items-center justify-between py-3 mb-3 bg-slate-50 rounded-xl px-4 border border-slate-200">
            <div>
              <p className="text-sm font-semibold text-slate-900">All Notifications</p>
              <p className="text-xs text-slate-400 mt-0.5">{enabled ? "Receiving all enabled alerts" : "Paused"}</p>
            </div>
            <div onClick={() => setEnabled(!enabled)}
              className={`relative w-12 h-6 rounded-full cursor-pointer transition-colors ${enabled ? "bg-secondary" : "bg-slate-300"}`}>
              <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${enabled ? "translate-x-6" : "translate-x-0"}`} />
            </div>
          </div>
          <div className={`transition-opacity ${!enabled ? "opacity-40 pointer-events-none" : ""}`}>
            <Toggle checked={notifs.job_assigned} onChange={toggleNotif("job_assigned")} label="Job Assigned" sub="When a shipper accepts your bid." icon={Briefcase} iconColor="text-secondary" />
            <Toggle checked={notifs.new_jobs_nearby} onChange={toggleNotif("new_jobs_nearby")} label="New Jobs Nearby" sub="Available loads matching your truck type on your corridor." icon={MapPin} iconColor="text-sky-600" />
            <Toggle checked={notifs.pickup_reminder} onChange={toggleNotif("pickup_reminder")} label="Pickup Reminders" sub="30-minute reminder before your scheduled pickup time." icon={Bell} iconColor="text-amber-600" />
            <Toggle checked={notifs.delivery_reminder} onChange={toggleNotif("delivery_reminder")} label="Delivery Reminders" sub="Alerts when approaching the estimated delivery deadline." icon={Bell} iconColor="text-violet-600" />
            <Toggle checked={notifs.earnings_update} onChange={toggleNotif("earnings_update")} label="Earnings Updates" sub="When payment is released to your wallet after delivery." icon={CreditCard} iconColor="text-teal-600" />
            <Toggle checked={notifs.safety_alerts} onChange={toggleNotif("safety_alerts")} label="Safety Alerts" sub="Road closures, weather warnings, and checkpoint notifications." icon={Zap} iconColor="text-red-500" />
            <Toggle checked={notifs.sms_alerts} onChange={toggleNotif("sms_alerts")} label="SMS Alerts" sub="Critical notifications via SMS to your registered number." icon={Phone} iconColor="text-amber-600" />
          </div>
          <div className="flex justify-end mt-4 pt-4 border-t border-slate-100">
            <button onClick={() => setNotifSaved(true)}
              className="flex items-center gap-2 px-5 py-2.5 bg-secondary text-white rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity">
              <Save className="w-4 h-4" /> Save Preferences
            </button>
          </div>
          {notifSaved && (
            <p className="text-sm text-teal-600 flex items-center gap-1.5 mt-2 justify-end">
              <CheckCircle2 className="w-4 h-4" /> Saved
            </p>
          )}
        </div>
      </div>

      {/* Two-Factor Auth */}
      <OtpChannelCard user={user} onSaved={(updated) => {
        const s = useAuthStore.getState();
        setAuth(updated, s.accessToken, s.refreshToken);
      }} />

      {/* Danger zone */}
      <div className="bg-white rounded-xl border border-red-200 shadow-sm px-6 py-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-xl bg-red-50 flex items-center justify-center">
            <AlertCircle className="w-4 h-4 text-red-500" />
          </div>
          <div>
            <h2 className="font-heading font-semibold text-slate-900">Danger Zone</h2>
            <p className="text-xs text-slate-500 mt-0.5">Irreversible account actions.</p>
          </div>
        </div>
        <div className="space-y-3">
          <div className="flex items-center justify-between py-3 border border-slate-100 rounded-lg px-4">
            <div>
              <p className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                <LogOut className="w-4 h-4 text-slate-500" /> Sign Out
              </p>
              <p className="text-xs text-slate-400 mt-0.5">Sign out on this device.</p>
            </div>
            <button onClick={() => { clearAuth(); navigate("/login"); }}
              className="px-4 py-2 border border-slate-200 rounded-lg text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors">
              Sign Out
            </button>
          </div>
          <div className="flex items-center justify-between py-3 border border-red-100 rounded-lg px-4 bg-red-50/30">
            <div>
              <p className="text-sm font-semibold text-red-700 flex items-center gap-2">
                <Trash2 className="w-4 h-4" /> Delete Account
              </p>
              <p className="text-xs text-red-400 mt-0.5">Permanently deletes all data. Cannot be undone.</p>
            </div>
            <button onClick={() => setShowDeleteModal(true)}
              className="px-4 py-2 border border-red-200 rounded-lg text-sm font-semibold text-red-600 hover:bg-red-50 transition-colors">
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
