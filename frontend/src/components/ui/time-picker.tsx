import * as React from "react"
import { Clock } from "lucide-react"

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

interface TimePickerProps {
    value?: string // HH:mm format
    onChange: (time: string) => void
    disabled?: boolean
}

export function TimePicker({ value, onChange, disabled = false }: TimePickerProps) {
    const [hours, minutes] = value ? value.split(':') : ['09', '00']

    const handleHoursChange = (newHours: string) => {
        onChange(`${newHours}:${minutes}`)
    }

    const handleMinutesChange = (newMinutes: string) => {
        onChange(`${hours}:${newMinutes}`)
    }

    // Generate hours 00-23
    const hourOptions = Array.from({ length: 24 }, (_, i) => {
        const hour = i.toString().padStart(2, '0')
        return { value: hour, label: hour }
    })

    // Generate minutes in 15-minute intervals
    const minuteOptions = ['00', '15', '30', '45'].map(min => ({
        value: min,
        label: min,
    }))

    return (
        <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <Select value={hours} onValueChange={handleHoursChange} disabled={disabled}>
                <SelectTrigger className="w-[70px]">
                    <SelectValue placeholder="HH" />
                </SelectTrigger>
                <SelectContent>
                    {hourOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                            {option.label}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
            <span className="text-muted-foreground">:</span>
            <Select value={minutes} onValueChange={handleMinutesChange} disabled={disabled}>
                <SelectTrigger className="w-[70px]">
                    <SelectValue placeholder="MM" />
                </SelectTrigger>
                <SelectContent>
                    {minuteOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                            {option.label}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    )
}
