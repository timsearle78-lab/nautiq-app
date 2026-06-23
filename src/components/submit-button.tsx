"use client";

import { useFormStatus } from "react-dom";

export function SubmitButton({
  children,
}: {
  children: React.ReactNode;
}) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-xl bg-ocean-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-ocean-700 disabled:opacity-50"
    >
      {pending ? "Saving..." : children}
    </button>
  );
}