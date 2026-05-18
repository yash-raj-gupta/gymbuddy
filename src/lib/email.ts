import { Resend } from "resend";
import { env } from "@/env";

const resend = new Resend(env.RESEND_API_KEY);

const FROM = "GymBuddy <noreply@gymbuddy.app>";

export async function sendWelcomeEmail(to: string) {
  return resend.emails.send({
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
