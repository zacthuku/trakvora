import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import {
  User, Phone, Mail, Camera, Save,
  Bell, Shield, Eye, EyeOff, Lock,
  CheckCircle2, AlertCircle, LogOut, Trash2,
  Gavel, Truck, CreditCard, Navigation2, Zap,
  Smartphone, ShieldCheck,
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
    <label className="flex items-start gap-4 cursor-pointer py-3.5 group border-b border-slate-50 last:border-0">
      {Icon && (
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 bg-slate-50`}>
          <Icon className={`w-4 h-4 ${iconColor || "text-slate-500"}`} />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-800">{label}</p>
        {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
      </div>
      <div
        onClick={onChange}
        className={`relative w-11 h-6 rounded-full shrink-0 mt-1 transition-colors cursor-pointer ${checked ? "bg-secondary" : "bg-slate-200"}`}
      >
        <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${checked ? "translate-x-5" : "translate-x-0"}`} />
      </div>
    </label>
  );
}

function SectionCard({ icon: Icon, title, sub, children }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden mb-5">
      <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3 bg-slate-50/50">
        <div className="w-9 h-9 rounded-xl bg-slate-900 flex items-center justify-center shrink-0">
          <Icon className="w-4 h-4 text-white" />
        </div>
        <div>
          <h2 className="font-heading font-semibold text-slate-900">{title}</h2>
          {sub && <p className="text-xs text-slate-500 mt-0.5">{sub}</p>}
        </div>
      </div>
      <div className="px-6 py-5">{children}</div>
    </div>
  );
}

export default function ShipperSettingsPage() {
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
    new_bids: true,
    bid_accepted: true,
    shipment_status: true,
    delivery_confirmed: true,
    payment_released: true,
    dispatch_alerts: true,
    email_digest: true,
    sms_alerts: false,
    platform_updates: false,
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
      setProfileMsg({ type: "err", text: err?.response?.data?.detail || "Failed to save profile." }),
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
      setPwMsg({ type: "err", text: "Password must be at least 8 characters." });
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
    : "S";

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
              This permanently deletes your account, all shipment history, and cannot be undone.
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

      {/* ── Profile ── */}
      <SectionCard icon={User} title="Profile Information" sub="Update your personal and company details.">
        {/* Avatar row */}
        <div className="flex items-center gap-4 mb-5 pb-5 border-b border-slate-100">
          <div className="relative">
            {user?.profile_photo_url ? (
              <img src={user.profile_photo_url} alt="avatar"
                className="w-14 h-14 rounded-full object-cover border-2 border-slate-200" />
            ) : (
              <div className="w-14 h-14 rounded-full bg-slate-900 flex items-center justify-center border-2 border-slate-700">
                <span className="text-lg font-black text-white font-heading">{initials}</span>
              </div>
            )}
            <button className="absolute bottom-0 right-0 w-5 h-5 bg-secondary rounded-full flex items-center justify-center border-2 border-white shadow-sm">
              <Camera className="w-2.5 h-2.5 text-white" />
            </button>
          </div>
          <div>
            <p className="font-semibold text-slate-900">{user?.full_name}</p>
            <p className="text-xs text-slate-500">{user?.email}</p>
            <span className="inline-block mt-1 px-2 py-0.5 rounded-full bg-secondary/10 text-secondary text-[10px] font-bold uppercase tracking-wider">
              Shipper
            </span>
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
            <input value={profile.company_name} onChange={setP("company_name")} placeholder="Your company (optional)" className={inputCls} />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">Email Address</label>
            <input value={user?.email} disabled className={inputCls} />
            <p className="text-xs text-slate-400 mt-1">Email cannot be changed. Contact support to update it.</p>
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">Profile Photo URL</label>
            <input value={profile.profile_photo_url} onChange={setP("profile_photo_url")} placeholder="https://…" className={inputCls} />
          </div>
          <div className="flex justify-end pt-1">
            <button type="submit" disabled={profileMutation.isPending}
              className="flex items-center gap-2 px-5 py-2.5 bg-secondary text-white rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50">
              {profileMutation.isPending
                ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Saving…</>
                : <><Save className="w-4 h-4" /> Save Profile</>}
            </button>
          </div>
        </form>
      </SectionCard>

      {/* ── Notifications ── */}
      <SectionCard icon={Bell} title="Notifications" sub="Choose which alerts you receive and how.">
        {/* Master toggle */}
        <div className="flex items-center justify-between py-3 mb-2 bg-slate-50 rounded-xl px-4 border border-slate-200">
          <div>
            <p className="text-sm font-semibold text-slate-900">All Notifications</p>
            <p className="text-xs text-slate-400 mt-0.5">
              {enabled ? "You are receiving all enabled alerts" : "All notifications paused"}
            </p>
          </div>
          <div
            onClick={() => setEnabled(!enabled)}
            className={`relative w-12 h-6 rounded-full cursor-pointer transition-colors ${enabled ? "bg-secondary" : "bg-slate-300"}`}
          >
            <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${enabled ? "translate-x-6" : "translate-x-0"}`} />
          </div>
        </div>

        <div className={`transition-opacity ${!enabled ? "opacity-40 pointer-events-none" : ""}`}>
          <Toggle checked={notifs.new_bids} onChange={toggleNotif("new_bids")}
            label="New Bids Received" sub="When a carrier submits a bid on your load."
            icon={Gavel} iconColor="text-secondary" />
          <Toggle checked={notifs.bid_accepted} onChange={toggleNotif("bid_accepted")}
            label="Bid Accepted" sub="Confirmation when your bid acceptance creates a shipment."
            icon={CheckCircle2} iconColor="text-teal-600" />
          <Toggle checked={notifs.shipment_status} onChange={toggleNotif("shipment_status")}
            label="Shipment Status Updates" sub="En route, loaded, and in-transit updates from the carrier."
            icon={Truck} iconColor="text-sky-600" />
          <Toggle checked={notifs.delivery_confirmed} onChange={toggleNotif("delivery_confirmed")}
            label="Delivery Confirmed" sub="When the carrier marks your shipment as delivered."
            icon={CheckCircle2} iconColor="text-[#4fdbcc]" />
          <Toggle checked={notifs.payment_released} onChange={toggleNotif("payment_released")}
            label="Payment Released" sub="When escrow funds are released after successful delivery."
            icon={CreditCard} iconColor="text-green-600" />
          <Toggle checked={notifs.dispatch_alerts} onChange={toggleNotif("dispatch_alerts")}
            label="Dispatch Alerts" sub="When a carrier is dispatched to your pickup location."
            icon={Navigation2} iconColor="text-violet-600" />
          <Toggle checked={notifs.email_digest} onChange={toggleNotif("email_digest")}
            label="Weekly Email Digest" sub="Summary of your shipments and spend every Monday morning."
            icon={Mail} iconColor="text-slate-600" />
          <Toggle checked={notifs.sms_alerts} onChange={toggleNotif("sms_alerts")}
            label="SMS Alerts" sub="Critical alerts via SMS to your registered phone number."
            icon={Phone} iconColor="text-amber-600" />
          <Toggle checked={notifs.platform_updates} onChange={toggleNotif("platform_updates")}
            label="Platform Updates" sub="New features and release announcements from trakvora."
            icon={Zap} iconColor="text-violet-500" />
        </div>

        <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-100">
          {notifSaved && (
            <span className="flex items-center gap-1.5 text-sm text-teal-600">
              <CheckCircle2 className="w-4 h-4" /> Preferences saved
            </span>
          )}
          <div className="ml-auto">
            <button onClick={handleNotifSave}
              className="flex items-center gap-2 px-5 py-2.5 bg-secondary text-white rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity">
              <Save className="w-4 h-4" /> Save Preferences
            </button>
          </div>
        </div>
      </SectionCard>

      {/* ── Two-Factor Auth ── */}
      <OtpChannelCard user={user} onSaved={(updated) => {
        const s = useAuthStore.getState();
        setAuth(updated, s.accessToken, s.refreshToken);
      }} />

      {/* ── Security ── */}
      <SectionCard icon={Shield} title="Security" sub="Manage your password and account access.">
        {pwMsg && (
          <div className={`flex items-center gap-2 text-sm px-4 py-3 rounded-lg border mb-4 ${
            pwMsg.type === "ok" ? "bg-teal-50 text-teal-700 border-teal-200" : "bg-red-50 text-red-700 border-red-200"
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
                <label className="block text-[11px] font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">{labels[key]}</label>
                <div className="relative">
                  <input type={showPw[key] ? "text" : "password"} value={passwords[key]}
                    onChange={setPw(key)} placeholder="••••••••" className={`${inputCls} pr-10`} />
                  <button type="button" onClick={() => setShowPw((s) => ({ ...s, [key]: !s[key] }))}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
                    {showPw[key] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            );
          })}
          <div className="flex justify-end pt-1">
            <button type="submit"
              className="flex items-center gap-2 px-5 py-2.5 border border-slate-200 text-slate-700 rounded-lg text-sm font-semibold hover:bg-slate-50 transition-colors">
              <Lock className="w-4 h-4" /> Change Password
            </button>
          </div>
        </form>

        <div className="mt-5 pt-5 border-t border-slate-100 grid grid-cols-2 gap-3">
          <div>
            <p className="text-[11px] text-slate-400 uppercase tracking-wider mb-1">Status</p>
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
              {user?.is_verified ? "Verified" : "Pending"}
            </span>
          </div>
          <div>
            <p className="text-[11px] text-slate-400 uppercase tracking-wider mb-1">Total Trips</p>
            <p className="text-sm font-bold font-heading text-slate-900">{user?.total_trips || 0}</p>
          </div>
        </div>
      </SectionCard>

      {/* ── Danger zone ── */}
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
              <p className="text-xs text-slate-400 mt-0.5">Sign out of trakvora on this device.</p>
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
