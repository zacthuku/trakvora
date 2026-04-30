import { useEffect, useState } from "react";
import { Mail, UserCheck, CheckCheck, Inbox, Loader2 } from "lucide-react";
import { useInboxStore } from "@/store/inboxStore";

function timeAgo(isoStr) {
  const diff = (Date.now() - new Date(isoStr).getTime()) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 86400 * 7) return `${Math.floor(diff / 86400)}d ago`;
  return new Date(isoStr).toLocaleDateString();
}

function MessageRow({ message, onExpand, expanded }) {
  const { markRead } = useInboxStore();
  const isInviteAccepted = message.message_type === "invite_accepted";

  const handleClick = () => {
    if (!message.is_read) markRead(message.id);
    onExpand();
  };

  return (
    <div
      className={`border border-slate-200 rounded-xl overflow-hidden transition-all ${!message.is_read ? "bg-orange-50/40 border-orange-200/60" : "bg-white"}`}
    >
      {/* Row header */}
      <button
        className="w-full flex items-start gap-4 p-4 text-left hover:bg-slate-50/80 transition-colors"
        onClick={handleClick}
      >
        {/* Icon */}
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${isInviteAccepted ? "bg-green-50" : "bg-slate-100"}`}>
          {isInviteAccepted
            ? <UserCheck className="w-5 h-5 text-green-600" />
            : <Mail className="w-5 h-5 text-slate-500" />}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <p className={`text-sm font-semibold leading-snug ${!message.is_read ? "text-slate-900" : "text-slate-600"}`}>
              {message.subject}
              {!message.is_read && (
                <span className="inline-block w-2 h-2 rounded-full bg-secondary ml-2 mb-0.5 align-middle" />
              )}
            </p>
            <span className="text-[10px] text-slate-400 shrink-0 mt-0.5">{timeAgo(message.created_at)}</span>
          </div>
          {message.sender_name && (
            <p className="text-[11px] text-slate-400 mt-0.5">From: {message.sender_name}</p>
          )}
          {!expanded && (
            <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
              {message.body.slice(0, 120)}{message.body.length > 120 ? "…" : ""}
            </p>
          )}
        </div>
      </button>

      {/* Expanded body */}
      {expanded && (
        <div className="px-4 pb-4 pt-0">
          <div className="ml-14 bg-slate-50 rounded-xl p-4 border border-slate-100">
            <p className="text-sm text-slate-700 whitespace-pre-line leading-relaxed">{message.body}</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default function InboxPage() {
  const { messages, unreadCount, isLoading, fetchMessages, markAllRead } = useInboxStore();
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => { fetchMessages(); }, []);

  const toggle = (id) => setExpandedId(prev => prev === id ? null : id);

  return (
    <div className="max-w-2xl mx-auto">
      {/* Page header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black font-heading text-slate-900 tracking-tight">Inbox</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {unreadCount > 0 ? `${unreadCount} unread message${unreadCount !== 1 ? "s" : ""}` : "All messages read"}
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllRead}
            className="flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-800 bg-white border border-slate-200 rounded-lg px-3 py-2 transition-colors hover:bg-slate-50"
          >
            <CheckCheck className="w-3.5 h-3.5" />
            Mark all read
          </button>
        )}
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 text-slate-400 animate-spin" />
        </div>
      )}

      {/* Empty state */}
      {!isLoading && messages.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
            <Inbox className="w-8 h-8 text-slate-300" />
          </div>
          <h3 className="font-heading font-bold text-slate-500 text-base">Your inbox is empty</h3>
          <p className="text-sm text-slate-400 mt-1 max-w-xs">
            Important messages like team updates and contact details will appear here.
          </p>
        </div>
      )}

      {/* Message list */}
      {!isLoading && messages.length > 0 && (
        <div className="flex flex-col gap-3">
          {messages.map(msg => (
            <MessageRow
              key={msg.id}
              message={msg}
              expanded={expandedId === msg.id}
              onExpand={() => toggle(msg.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
