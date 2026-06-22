import { LoadingSpinner } from "@/components/loading/spinner"

export default function AdminLoading() {
  return (
    <div className="flex items-center justify-center min-h-[80vh]">
      <LoadingSpinner size="lg" text="Memuat..." />
    </div>
  )
}
