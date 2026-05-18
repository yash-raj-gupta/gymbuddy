import type { Metadata } from "next";

export const metadata: Metadata = { title: "Privacy Policy" };

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-2xl flex-1 px-6 py-16 prose prose-neutral dark:prose-invert">
      <h1>Privacy Policy</h1>
      <p>Last updated: {new Date().getFullYear()}</p>
      <p>
        We collect only what GymBuddy needs to work: your email and
        authentication identity (via Clerk), and the workout data you log.
      </p>
      <h2>1. What we store</h2>
      <ul>
        <li>Account: email, authentication ID.</li>
        <li>Training data: exercises, sets, reps, weight, routines you create.</li>
        <li>
          Payment metadata via Razorpay — we never see or store full card
          details.
        </li>
      </ul>
      <h2>2. Processors</h2>
      <p>
        We use Clerk (auth), Supabase (database hosting), Razorpay (payments),
        Resend (email), and privacy-respecting product analytics. Each processes
        data only to deliver the Service.
      </p>
      <h2>3. Offline data</h2>
      <p>
        Workouts logged offline are stored on your device and synced to your
        account when you reconnect. Clearing site data before syncing will lose
        unsynced logs.
      </p>
      <h2>4. Your rights</h2>
      <p>
        You can export your data (Pro) and request account deletion at any time,
        which removes your training data from our database.
      </p>
      <h2>5. Contact</h2>
      <p>Privacy requests: privacy@gymbuddy.app</p>
      <p className="text-sm">
        This is boilerplate pending legal review and is not legal advice.
      </p>
    </main>
  );
}
