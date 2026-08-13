import { useState } from "react";
import { Mail, MessageSquare, Send } from "lucide-react";
import { adminApi } from "@/lib/admin-api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PageHeader } from "./common";

export default function NotificationsPage() {
  const [channel, setChannel] = useState<"email" | "sms" | "push">("email"); const [to, setTo] = useState(""); const [subject, setSubject] = useState(""); const [message, setMessage] = useState(""); const [busy, setBusy] = useState(false); const [notice, setNotice] = useState(""); const [error, setError] = useState("");
  const send = async (e: React.FormEvent) => { e.preventDefault(); try { setBusy(true); setNotice(""); setError(""); if (channel === "email") await adminApi.sendEmail(to, subject, message); else if (channel === "sms") await adminApi.sendSms(to, message); else await adminApi.sendPush(to, message); setNotice("Notification queued successfully."); } catch (e) { setError(e instanceof Error ? e.message : "Unable to send notification."); } finally { setBusy(false); } };
  return <div><PageHeader title="Notifications" description="Send an operational message through the backend notification queue." /><form onSubmit={send} className="max-w-2xl rounded-xl border bg-card p-6"><div className="grid gap-3 sm:grid-cols-3">{[["email","Email",Mail],["sms","SMS",MessageSquare],["push","Push",Send]].map(([value,label,Icon]) => <button type="button" key={value as string} onClick={() => setChannel(value as typeof channel)} className={`flex items-center justify-center gap-2 rounded-lg border p-3 text-sm ${channel === value ? "border-slate-900 bg-slate-900 text-white" : "hover:bg-slate-50"}`}><Icon className="size-4" />{label as string}</button>)}</div>
    {notice && <div className="mt-4 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700">{notice}</div>}{error && <div className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>}
    <div className="mt-5 space-y-4"><div><Label>Recipient</Label><Input className="mt-2" value={to} onChange={e => setTo(e.target.value)} placeholder={channel === "email" ? "customer@example.com" : "Recipient address"} required /></div>{channel === "email" && <div><Label>Subject</Label><Input className="mt-2" value={subject} onChange={e => setSubject(e.target.value)} required /></div>}<div><Label>Message</Label><Textarea className="mt-2 min-h-36" value={message} onChange={e => setMessage(e.target.value)} required /></div></div>
    <div className="mt-6 flex justify-end"><Button disabled={busy}><Send />{busy ? "Sending…" : "Send notification"}</Button></div></form></div>;
}
