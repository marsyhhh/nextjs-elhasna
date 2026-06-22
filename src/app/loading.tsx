import { LoadingSpinner } from "@/components/loading/spinner"

export default function RootLoading() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <LoadingSpinner size="lg" text="Memuat..." />
    </div>
  )
}
