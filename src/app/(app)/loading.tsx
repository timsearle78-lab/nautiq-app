import NautiqSpinner from "@/components/ui/nautiq-spinner";

export default function Loading() {
  return (
    <div className="flex flex-1 items-center justify-center h-full py-24">
      <NautiqSpinner size={56} />
    </div>
  );
}
