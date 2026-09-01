import { useState } from "react";
import { Mail, Send } from "lucide-react";
import { adminApi } from "@/lib/admin-api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PageHeader } from "./common";

export default function NotificationsPage() {
  const [to, setTo] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!to.trim() || !subject.trim() || !message.trim()) {
      setError("Please fill in recipient email, subject, and message.");
      return;
    }

    try {
      setBusy(true);
      setNotice("");
      setError("");
      await adminApi.sendEmail(to.trim(), subject.trim(), message.trim());
      setNotice("Email dispatched successfully.");
      setTo("");
      setSubject("");
      setMessage("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to send notification.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Email notifications"
        description="Send transactional and operational messages directly through Resend email delivery."
      />
      <form onSubmit={send} className="max-w-2xl rounded-xl border bg-card p-6">
        <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
          <Mail className="size-4 text-slate-900" />
          <span>Transactional Email Channel (Resend)</span>
        </div>

        {notice && (
          <div className="mt-4 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700">
            {notice}
          </div>
        )}
        {error && (
          <div className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="mt-5 space-y-4">
          <div>
            <Label htmlFor="recipient">Recipient Email</Label>
            <Input
              id="recipient"
              className="mt-2"
              type="email"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              placeholder="customer@example.com"
              required
            />
          </div>

          <div>
            <Label htmlFor="subject">Subject</Label>
            <Input
              id="subject"
              className="mt-2"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Order update / Notice"
              required
            />
          </div>

          <div>
            <Label htmlFor="message">Message Body (HTML / Text)</Label>
            <Textarea
              id="message"
              className="mt-2 min-h-40"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="<p>Dear customer, your order has been processed.</p>"
              required
            />
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <Button disabled={busy}>
            <Send className="mr-2 size-4" />
            {busy ? "Sending…" : "Send email"}
          </Button>
        </div>
      </form>
    </div>
  );
}
