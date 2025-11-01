export default function Loading() {
  return (
    <div className="flex h-screen bg-background">
      <div className="w-64 bg-sidebar border-r border-sidebar-border" />
      <div className="flex-1 flex flex-col">
        <div className="h-16 border-b border-border bg-card" />
        <div className="flex-1 overflow-auto pt-20 pb-8">
          <div className="max-w-7xl mx-auto px-6 space-y-8">
            <div className="h-10 bg-muted rounded-lg w-1/3 animate-pulse" />
            <div className="grid grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-32 bg-muted rounded-lg animate-pulse" />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
