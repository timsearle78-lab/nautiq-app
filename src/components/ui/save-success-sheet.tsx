export default function SaveSuccessSheet({ message }: { message: string }) {
  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/30" />
      <div className="fixed bottom-16 left-0 right-0 z-50 rounded-t-2xl bg-white shadow-xl animate-in slide-in-from-bottom duration-200">
        <div className="flex flex-col items-center justify-center gap-3 px-4 py-12">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100">
            <svg className="h-7 w-7 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <p className="text-base font-semibold text-slate-900">{message}</p>
        </div>
      </div>
    </>
  );
}
