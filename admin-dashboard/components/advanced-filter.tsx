"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Filter, Save, X } from "lucide-react"

interface FilterConfig {
  id: string
  name: string
  filters: Record<string, any>
}

interface AdvancedFilterProps {
  onFilterChange: (filters: Record<string, any>) => void
  filterOptions: Array<{
    key: string
    label: string
    type: "text" | "select" | "date" | "multiselect"
    options?: Array<{ value: string; label: string }>
  }>
}

export function AdvancedFilter({ onFilterChange, filterOptions }: AdvancedFilterProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [filters, setFilters] = useState<Record<string, any>>({})
  const [savedFilters, setSavedFilters] = useState<FilterConfig[]>([])
  const [filterName, setFilterName] = useState("")

  const handleFilterChange = (key: string, value: any) => {
    const newFilters = { ...filters, [key]: value }
    setFilters(newFilters)
    onFilterChange(newFilters)
  }

  const handleSaveFilter = () => {
    if (filterName.trim()) {
      const newFilter: FilterConfig = {
        id: Date.now().toString(),
        name: filterName,
        filters: { ...filters },
      }
      setSavedFilters([...savedFilters, newFilter])
      setFilterName("")
    }
  }

  const handleLoadFilter = (filter: FilterConfig) => {
    setFilters(filter.filters)
    onFilterChange(filter.filters)
  }

  const handleDeleteFilter = (id: string) => {
    setSavedFilters(savedFilters.filter((f) => f.id !== id))
  }

  const handleClearFilters = () => {
    setFilters({})
    onFilterChange({})
  }

  const activeFilterCount = Object.values(filters).filter((v) => v !== "" && v !== null).length

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsOpen(!isOpen)}
          className="gap-2 border-border text-foreground hover:bg-muted"
        >
          <Filter className="w-4 h-4" />
          Filters{" "}
          {activeFilterCount > 0 && (
            <span className="bg-primary text-primary-foreground px-2 py-0.5 rounded-full text-xs">
              {activeFilterCount}
            </span>
          )}
        </Button>
        {activeFilterCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearFilters}
            className="text-muted-foreground hover:text-foreground"
          >
            Clear
          </Button>
        )}
      </div>

      {isOpen && (
        <Card className="p-4 bg-card border-border space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filterOptions.map((option) => (
              <div key={option.key} className="space-y-2">
                <label className="text-sm font-medium text-foreground">{option.label}</label>
                {option.type === "text" && (
                  <Input
                    placeholder={`Filter by ${option.label.toLowerCase()}`}
                    value={filters[option.key] || ""}
                    onChange={(e) => handleFilterChange(option.key, e.target.value)}
                    className="bg-input border-border text-foreground"
                  />
                )}
                {option.type === "select" && (
                  <select
                    value={filters[option.key] || ""}
                    onChange={(e) => handleFilterChange(option.key, e.target.value)}
                    className="w-full px-3 py-2 border border-border rounded-md bg-input text-foreground"
                  >
                    <option value="">All</option>
                    {option.options?.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                )}
                {option.type === "date" && (
                  <Input
                    type="date"
                    value={filters[option.key] || ""}
                    onChange={(e) => handleFilterChange(option.key, e.target.value)}
                    className="bg-input border-border text-foreground"
                  />
                )}
              </div>
            ))}
          </div>

          <div className="border-t border-border pt-4 space-y-3">
            <div className="flex gap-2">
              <Input
                placeholder="Save this filter as..."
                value={filterName}
                onChange={(e) => setFilterName(e.target.value)}
                className="bg-input border-border text-foreground"
              />
              <Button
                size="sm"
                onClick={handleSaveFilter}
                disabled={!filterName.trim()}
                className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
              >
                <Save className="w-4 h-4" />
                Save
              </Button>
            </div>

            {savedFilters.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">Saved Filters</p>
                <div className="flex flex-wrap gap-2">
                  {savedFilters.map((filter) => (
                    <div key={filter.id} className="flex items-center gap-2 px-3 py-1 bg-muted rounded-full text-sm">
                      <button
                        onClick={() => handleLoadFilter(filter)}
                        className="text-foreground hover:text-primary transition-colors"
                      >
                        {filter.name}
                      </button>
                      <button
                        onClick={() => handleDeleteFilter(filter.id)}
                        className="text-muted-foreground hover:text-destructive transition-colors"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  )
}
