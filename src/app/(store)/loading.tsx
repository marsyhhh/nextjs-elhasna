import { LoadingSpinner } from "@/components/loading/spinner"

export default function StoreLoading() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <LoadingSpinner size="lg" text="Memuat..." />
    </div>
  )
}
