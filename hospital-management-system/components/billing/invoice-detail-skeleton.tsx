import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent } from "@/components/ui/card"

export function InvoiceDetailSkeleton() {
  return (
    <div className="space-y-6">
      {/* Invoice Info Grid */}
      <div className="grid grid-cols-2 gap-4">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index}>
            <Skeleton className="h-3 w-24 mb-2" />
            <Skeleton className="h-5 w-32" />
          </div>
        ))}
      </div>

      {/* Line Items Section */}
      <div>
        <Skeleton className="h-5 w-24 mb-3" />
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="flex justify-between items-center">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-4 w-16" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payment History Section */}
      <div>
        <Skeleton className="h-5 w-32 mb-3" />
        <div className="space-y-2">
          {Array.from({ length: 2 }).map((_, index) => (
            <Card key={index}>
              <CardContent className="pt-4">
                <div className="flex justify-between items-center">
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                  <Skeleton className="h-6 w-20 rounded-full" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Notes Section */}
      <div>
        <Skeleton className="h-5 w-16 mb-2" />
        <Skeleton className="h-16 w-full" />
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2 pt-4 border-t">
        <Skeleton className="h-10 flex-1" />
        <Skeleton className="h-10 flex-1" />
      </div>
    </div>
  )
}
