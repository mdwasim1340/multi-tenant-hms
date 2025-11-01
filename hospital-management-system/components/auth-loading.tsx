import { Activity } from "lucide-react"

export function AuthLoading({ message = "Loading..." }: { message?: string }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5 flex items-center justify-center p-4">
      <div className="text-center space-y-6">
        {/* Animated Logo */}
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-primary/10 animate-pulse">
          <Activity className="w-10 h-10 text-primary animate-pulse" />
        </div>

        {/* Loading Spinner */}
        <div className="flex justify-center">
          <div className="relative w-16 h-16">
            <div className="absolute inset-0 border-4 border-primary/20 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        </div>

        {/* Message */}
        <div className="space-y-2">
          <h2 className="text-xl font-semibold text-foreground">MediFlow</h2>
          <p className="text-sm text-muted-foreground">{message}</p>
        </div>

        {/* Progress Bar */}
        <div className="w-64 h-1 bg-muted rounded-full overflow-hidden">
          <div className="h-full bg-primary rounded-full animate-[loading_1.5s_ease-in-out_infinite]"></div>
        </div>
      </div>
    </div>
  )
}
