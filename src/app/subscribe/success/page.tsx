import Link from "next/link";
import NautiqLogo from "@/components/ui/nautiq-logo";
import NautiqAnchorIcon from "@/components/ui/nautiq-anchor-icon";

export default function SubscribeSuccessPage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6" style={{ background: "#EEF1F5" }}>
      <div className="w-full max-w-sm text-center space-y-5">
        {/* Circle icon */}
        <div className="flex justify-center">
          <div
            className="flex items-center justify-center"
            style={{
              width: 80,
              height: 80,
              borderRadius: "50%",
              background: "radial-gradient(120% 140% at 85% 0%, #0D4A73 0%, #0B2942 50%, #061D31 100%)",
            }}
          >
            <NautiqAnchorIcon size={44} color="#FFFFFF" />
          </div>
        </div>

        {/* Wordmark */}
        <div className="flex justify-center">
          <NautiqLogo size={22} />
        </div>

        <div className="space-y-2">
          <h1 style={{ fontSize: 24, fontWeight: 700, color: "#0B2942", letterSpacing: "-0.02em" }}>
            You&apos;re all set!
          </h1>
          <p style={{ fontSize: 14, color: "#64748B", lineHeight: 1.6 }}>
            Welcome aboard. Your NautIQ subscription is now active — start logging trips and tracking your boat.
          </p>
        </div>

        <Link
          href="/"
          className="inline-block w-full rounded-xl btn-primary px-4 py-3 text-sm font-semibold text-white text-center"
        >
          Go to my boat
        </Link>
      </div>
    </main>
  );
}
