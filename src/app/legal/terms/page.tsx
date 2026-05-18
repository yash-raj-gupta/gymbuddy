import type { Metadata } from "next";

export const metadata: Metadata = { title: "Terms of Service" };

export default function TermsPage() {
  return (
    <main className="mx-auto max-w-2xl flex-1 px-6 py-16 prose prose-neutral dark:prose-invert">
      <h1>Terms of Service</h1>
      <p>Last updated: {new Date().getFullYear()}</p>
      <p>
        GymBuddy (&ldquo;the Service&rdquo;) is a workout-logging application
        operated by an independent solo developer. By creating an account you
        agree to these terms.
      </p>
      <h2>1. Use of the Service</h2>
      <p>
        You may use GymBuddy to record your own training data. You are
        responsible for the accuracy of what you log and for keeping your
        account credentials secure.
      </p>
      <h2>2. Plans &amp; payments</h2>
      <p>
        Paid plans are billed in INR via Razorpay. Founder Lifetime is a
        one-time purchase limited to the first 100 customers. Subscription
        renewals can be cancelled any time; access continues until the end of
        the paid period.
      </p>
      <h2>3. No medical advice</h2>
      <p>
        GymBuddy is a tracking tool, not a fitness or medical professional.
        Train within your own ability and consult a professional where
        appropriate.
      </p>
      <h2>4. Availability</h2>
      <p>
        The Service is provided &ldquo;as is&rdquo;. We aim for high uptime but
        do not guarantee uninterrupted access. Your locally logged data syncs
        when connectivity returns.
      </p>
      <h2>5. Termination</h2>
      <p>
        You may delete your account at any time. We may suspend accounts that
        abuse the Service or attempt to bypass plan limits.
      </p>
      <h2>6. Contact</h2>
      <p>Questions: support@gymbuddy.app</p>
      <p className="text-sm">
        This is boilerplate pending legal review and is not legal advice.
      </p>
    </main>
  );
}
