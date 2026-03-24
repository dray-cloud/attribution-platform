import { Resend } from "resend";

const resend = new Resend(process.env.EMAIL_API_KEY);
const FROM = process.env.EMAIL_FROM ?? "alerts@yourdomain.com";

export interface AlertEmailOptions {
  to: string;
  subject: string;
  alertLabel: string;
  message: string;
  clientName: string;
  severity: "high" | "medium" | "low";
  dashboardUrl: string;
}

export async function sendAlertEmail(opts: AlertEmailOptions): Promise<void> {
  const severityColor =
    opts.severity === "high" ? "#C0392B" : opts.severity === "medium" ? "#BA7517" : "#1D6A3A";

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width"></head>
<body style="margin:0;padding:0;background:#f4f4f2;font-family:'Helvetica Neue',sans-serif">
  <div style="max-width:560px;margin:40px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08)">
    <div style="background:${severityColor};padding:20px 28px">
      <div style="color:#fff;font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;opacity:0.8;margin-bottom:6px">
        ${opts.severity.toUpperCase()} ALERT — ${opts.clientName}
      </div>
      <div style="color:#fff;font-size:20px;font-weight:700">${opts.alertLabel}</div>
    </div>
    <div style="padding:24px 28px">
      <p style="margin:0 0 20px;font-size:14px;line-height:1.6;color:#444">${opts.message}</p>
      <a href="${opts.dashboardUrl}" style="display:inline-block;padding:10px 20px;background:${severityColor};color:#fff;text-decoration:none;border-radius:8px;font-size:13px;font-weight:600">
        View Dashboard →
      </a>
    </div>
    <div style="padding:14px 28px;border-top:1px solid #f0f0f0;background:#fafafa">
      <p style="margin:0;font-size:11px;color:#aaa">
        Attribution Platform · You're receiving this because you have email alerts enabled.<br>
        <a href="${opts.dashboardUrl}/settings" style="color:#aaa">Manage alerts</a>
      </p>
    </div>
  </div>
</body>
</html>`;

  await resend.emails.send({
    from: FROM,
    to: opts.to,
    subject: opts.subject,
    html,
  });
}
