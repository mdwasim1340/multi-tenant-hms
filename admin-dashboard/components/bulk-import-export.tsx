"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Download, Upload } from "lucide-react"

interface BulkImportExportProps {
  data: any[]
  filename: string
  onImport?: (data: any[]) => void
  columns: string[]
}

export function BulkImportExport({ data, filename, onImport, columns }: BulkImportExportProps) {
  const [isImporting, setIsImporting] = useState(false)

  const handleExport = () => {
    const csv = [
      columns.join(","),
      ...data.map((item) => columns.map((col) => JSON.stringify(item[col] || "")).join(",")),
    ].join("\n")

    const blob = new Blob([csv], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${filename}-${new Date().toISOString().split("T")[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const csv = event.target?.result as string
        const lines = csv.split("\n")
        const headers = lines[0].split(",")
        const importedData = lines.slice(1).map((line) => {
          const values = line.split(",")
          const obj: any = {}
          headers.forEach((header, index) => {
            obj[header.trim()] = values[index]?.trim()
          })
          return obj
        })
        onImport?.(importedData.filter((item) => Object.values(item).some((v) => v)))
        setIsImporting(false)
      } catch (error) {
        console.error("Import error:", error)
      }
    }
    reader.readAsText(file)
  }

  return (
    <div className="flex gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={handleExport}
        className="gap-2 border-border text-foreground hover:bg-muted bg-transparent"
      >
        <Download className="w-4 h-4" />
        Export CSV
      </Button>
      <div className="relative">
        <input type="file" accept=".csv" onChange={handleImport} className="hidden" id="csv-import" />
        <label htmlFor="csv-import">
          <Button
            variant="outline"
            size="sm"
            className="gap-2 border-border text-foreground hover:bg-muted cursor-pointer bg-transparent"
            asChild
          >
            <span>
              <Upload className="w-4 h-4" />
              Import CSV
            </span>
          </Button>
        </label>
      </div>
    </div>
  )
}
