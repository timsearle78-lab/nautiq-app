import NautiqSpinner from "@/components/ui/nautiq-spinner";

export default function Loading() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white">
      <NautiqSpinner size={64} />
    </div>
  );
}
