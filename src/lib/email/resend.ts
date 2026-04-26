import { Resend } from "resend";
import type { Scholarship } from "@/lib/types";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendScholarshipDigest({
  to,
  scholarships,
}: {
  to: string;
  scholarships: Scholarship[];
}) {
  const fromEmail =
    process.env.RESEND_FROM_EMAIL ?? "notifications@scholarships.app";

  const scholarshipRows = scholarships
    .map(
      (s) => `
    <tr>
      <td style="padding:12px 0;border-bottom:1px solid #eee">
        <strong><a href="${s.link}" style="color:#1d4ed8;text-decoration:none">${s.title}</a></strong><br/>
        <span style="color:#666;font-size:13px">${s.country} &bull; ${s.field} &bull; ${s.degree_level}</span><br/>
        <span style="color:#ef4444;font-size:13px">Deadline: ${new Date(s.deadline).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</span>
      </td>
    </tr>`
    )
    .join("");

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"/></head>
<body style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px;color:#111">
  <h2 style="color:#1d4ed8;margin-bottom:4px">Your Scholarship Digest</h2>
  <p style="color:#666;margin-top:0">New opportunities matching your interests</p>
  <table style="width:100%;border-collapse:collapse">
    ${scholarshipRows}
  </table>
  <p style="color:#999;font-size:12px;margin-top:32px">
    You're receiving this because you signed up for scholarship alerts.<br/>
    <a href="${process.env.NEXT_PUBLIC_APP_URL}/preferences" style="color:#666">Update preferences</a>
  </p>
</body>
</html>`;

  return resend.emails.send({
    from: fromEmail,
    to,
    subject: `${scholarships.length} new scholarship${scholarships.length === 1 ? "" : "s"} for you`,
    html,
  });
}
