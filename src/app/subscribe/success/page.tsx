import Link from "next/link";

export default function SubscribeSuccessPage() {
  return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm text-center space-y-4">
        <div className="text-4xl">⚓</div>
        <h1 className="text-2xl font-bold text-slate-900">You&apos;re all set!</h1>
        <p className="text-slate-500 text-sm">
          Welcome aboard. Your NautIQ subscription is now active — start logging trips and tracking your boat.
        </p>
        <Link
          href="/"
          className="inline-block w-full rounded-xl btn-primary px-4 py-2.5 text-sm font-medium text-white text-center"
        >
          Go to my boat
        </Link>
      </div>
    </main>
  );
}
