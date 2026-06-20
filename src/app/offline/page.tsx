export default function OfflinePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-ocean-900 to-ocean-700 flex flex-col items-center justify-center px-4 text-center">
      <div className="w-16 h-16 rounded-2xl bg-ocean-500/20 border border-ocean-500/30 flex items-center justify-center mx-auto mb-6">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" opacity="0.3"/>
          <path d="M4.93 4.93l14.14 14.14"/>
          <path d="M8.46 2.81a10 10 0 0 0-5.65 5.65M21.19 10.54a10 10 0 0 0-5.65-5.65M2.81 15.54a10 10 0 0 0 5.65 5.65M15.54 21.19a10 10 0 0 0 5.65-5.65"/>
        </svg>
      </div>
      <h1 className="text-2xl font-bold text-white mb-2">You're offline</h1>
      <p className="text-ocean-200/70 text-sm max-w-xs">
        NautIQ needs a connection to sync your boat data. Check your internet and try again.
      </p>
      <button
        onClick={() => window.location.reload()}
        className="mt-8 rounded-xl bg-ocean-500 px-6 py-2.5 text-sm font-semibold text-white hover:bg-ocean-600 transition"
      >
        Try again
      </button>
    </div>
  );
}
