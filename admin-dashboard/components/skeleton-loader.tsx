export function TableSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 p-4 border border-border rounded-lg animate-pulse">
          <div className="w-10 h-10 bg-muted rounded-full" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-muted rounded w-1/4" />
            <div className="h-3 bg-muted rounded w-1/3" />
          </div>
          <div className="h-8 bg-muted rounded w-20" />
        </div>
      ))}
    </div>
  )
}

export function CardSkeleton() {
  return (
    <div className="space-y-4 p-6 border border-border rounded-lg bg-card">
      <div className="h-6 bg-muted rounded w-1/3 animate-pulse" />
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-4 bg-muted rounded animate-pulse" />
        ))}
      </div>
    </div>
  )
}

export function ChartSkeleton() {
  return (
    <div className="space-y-4 p-6 border border-border rounded-lg bg-card">
      <div className="h-6 bg-muted rounded w-1/4 animate-pulse" />
      <div className="h-64 bg-muted rounded animate-pulse" />
    </div>
  )
}

export function StatsSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="p-6 border border-border rounded-lg bg-card animate-pulse">
          <div className="h-4 bg-muted rounded w-1/2 mb-3" />
          <div className="h-8 bg-muted rounded w-1/3" />
        </div>
      ))}
    </div>
  )
}
