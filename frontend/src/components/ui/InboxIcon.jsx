import { useEffect } from "react";
import { Link } from "react-router-dom";
import { Mail } from "lucide-react";
import { useInboxStore } from "@/store/inboxStore";

export default function InboxIcon({ to, variant = "light" }) {
  const { unreadCount, fetchUnreadCount } = useInboxStore();

  useEffect(() => { fetchUnreadCount(); }, []);

  const cls =
    variant === "dark"
      ? "p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-full transition-colors relative"
      : "p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-50 rounded-full transition-colors relative";

  return (
    <Link to={to} className={cls} aria-label="Inbox">
      <Mail className="w-5 h-5" />
      {unreadCount > 0 && (
        <span className="absolute top-1 right-1 min-w-[16px] h-4 bg-secondary rounded-full flex items-center justify-center text-[9px] font-bold text-white px-0.5 leading-none">
          {unreadCount > 9 ? "9+" : unreadCount}
        </span>
      )}
    </Link>
  );
}
