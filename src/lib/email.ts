import { Resend } from "resend";
import { env } from "@/env";

const FROM = "GymBuddy <noreply@gymbuddy.app>";

// Lazy + guarded: email isn't wired in v1, so a missing key only errors
// if a send is actually attempted.
let _resend: Resend | null = null;
function getResend(): Resend {
  if (!_resend) {
    if (!env.RESEND_API_KEY) {
      throw new Error(
        "Resend not configured: set RESEND_API_KEY in .env.local",
      );
    }
    _resend = new Resend(env.RESEND_API_KEY);
  }
  return _resend;
}

export async function sendWelcomeEmail(to: string) {
  return getResend().emails.send({
    from: FROM,
    to,
    subject: "Welcome to GymBuddy 💪",
    html: `<div style="font-family:system-ui,sans-serif;max-width:480px">
      <h2>You're in.</h2>
      <p>Log every set. Beat last week. That's the whole app.</p>
      <p>Open GymBuddy, start a workout, and let the numbers do the talking.</p>
    </div>`,
  });
}
