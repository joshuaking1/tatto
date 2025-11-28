import * as React from "react"
import { format } from "date-fns"
import { CalendarIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { subDays, subMonths, startOfYear } from 'date-fns'
import type { DateRange } from 'react-day-picker'

interface DateRangePickerProps {
  value?: DateRange
  onChange: (range: DateRange | undefined) => void
  placeholder?: string
  disabled?: boolean
  className?: string
}

export function DateRangePicker({
  value,
  onChange,
  placeholder = "Pick a date range",
  disabled = false,
  className,
}: DateRangePickerProps) {
  const [open, setOpen] = React.useState(false)

  const handleSelect = (range: DateRange | undefined) => {
    if (range) {
      onChange(range)
      setOpen(false)
    }
  }

  const handlePreset = (preset: string) => {
    const today = new Date()
    let from: Date
    let to: Date = today

    switch (preset) {
      case "7days":
        from = subDays(today, 7)
        break
      case "30days":
        from = subDays(today, 30)
        break
      case "3months":
        from = subMonths(today, 3)
        break
      case "6months":
        from = subMonths(today, 6)
        break
      case "1year":
        from = subMonths(today, 12)
        break
      case "ytd":
        from = startOfYear(today)
        to = today
        break
      default:
        return
    }

    onChange({ from, to })
    setOpen(false)
  }

  return (
    <div className={cn("grid gap-2", className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant={"outline"}
            className={cn(
              "justify-start text-left font-normal",
              !value?.from && "text-muted-foreground"
            )}
            disabled={disabled}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {value?.from ? (
              value.to ? (
                <>
                  {format(value.from, "LLL dd, y")} -{" "}
                  {format(value.to, "LLL dd, y")}
                </>
              ) : (
                format(value.from, "LLL dd, y")
              )
            ) : (
              <span>{placeholder}</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <div className="p-3 border-b">
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePreset("7days")}
                className="text-xs"
              >
                Last 7 Days
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePreset("30days")}
                className="text-xs"
              >
                Last 30 Days
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePreset("3months")}
                className="text-xs"
              >
                Last 3 Months
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePreset("6months")}
                className="text-xs"
              >
                Last 6 Months
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePreset("1year")}
                className="text-xs"
              >
                Last Year
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePreset("ytd")}
                className="text-xs"
              >
                Year to Date
              </Button>
            </div>
          </div>
          <Calendar
            mode="range"
            defaultMonth={value?.from}
            selected={value}
            onSelect={handleSelect}
            numberOfMonths={2}
            disabled={disabled}
          />
        </PopoverContent>
      </Popover>
    </div>
  )
}
