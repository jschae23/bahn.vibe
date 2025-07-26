"use client"

import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useState } from "react"

interface PriceData {
    preis: number
    info: string
    abfahrtsZeitpunkt: string
    ankunftsZeitpunkt: string
}

interface PriceResults {
    [date: string]: PriceData
}

interface PriceCalendarProps {
    results: PriceResults
    startStation?: { name: string; id: string }
    zielStation?: { name: string; id: string }
    searchParams: {
        klasse?: string
        maximaleUmstiege?: string
    }
}

const weekdays = ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"]
const months = [
    "Januar",
    "Februar",
    "März",
    "April",
    "Mai",
    "Juni",
    "Juli",
    "August",
    "September",
    "Oktober",
    "November",
    "Dezember",
]

function createBookingLink(
    abfahrtsZeitpunkt: string,
    startStationId: string,
    zielStationId: string,
    klasse: string,
    maximaleUmstiege: string,
): string {
    if (!abfahrtsZeitpunkt || !startStationId || !zielStationId) {
        return ""
    }

    const klasseParam = klasse === "KLASSE_1" ? "1" : "2"
    const direktverbindung = maximaleUmstiege === "0" ? "true" : "false"
    const departureTime = encodeURIComponent(abfahrtsZeitpunkt)

    return `https://www.bahn.de/buchung/fahrplan/suche#sts=true&kl=${klasseParam}&hd=${departureTime}&soid=${encodeURIComponent(startStationId)}&zoid=${encodeURIComponent(zielStationId)}&bp=true&d=${direktverbindung}`
}

export function PriceCalendar({ results, startStation, zielStation, searchParams }: PriceCalendarProps) {
    // State for calendar navigation
    const [currentMonth, setCurrentMonth] = useState(new Date())

    // Get the date range from results
    const dates = Object.keys(results).sort()
    if (dates.length === 0) return null

    const firstDate = new Date(dates[0])
    const lastDate = new Date(dates[dates.length - 1])

    // Find min and max prices for color coding
    const prices = Object.values(results)
        .map((r) => r.preis)
        .filter((p) => p > 0)

    const minPrice = prices.length > 0 ? Math.min(...prices) : 0
    const maxPrice = prices.length > 0 ? Math.max(...prices) : 0

    // Generate calendar days for current month
    const generateCalendarDays = () => {
        const year = currentMonth.getFullYear()
        const month = currentMonth.getMonth()

        // First day of the month
        const firstDayOfMonth = new Date(year, month, 1)
        // Last day of the month
        const lastDayOfMonth = new Date(year, month + 1, 0)

        // Start from the first Sunday of the week containing the first day
        const startDate = new Date(firstDayOfMonth)
        startDate.setDate(startDate.getDate() - startDate.getDay())

        // End at the last Saturday of the week containing the last day
        const endDate = new Date(lastDayOfMonth)
        endDate.setDate(endDate.getDate() + (6 - endDate.getDay()))

        const days = []
        const current = new Date(startDate)

        while (current <= endDate) {
            days.push(new Date(current))
            current.setDate(current.getDate() + 1)
        }

        return days
    }

    const calendarDays = generateCalendarDays()

    const goToPreviousMonth = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))
    }

    const goToNextMonth = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))
    }

    const formatDateKey = (date: Date) => {
        return date.toISOString().split("T")[0]
    }

    const getPriceColor = (price: number) => {
        if (price === 0) return "text-gray-400"
        if (price === minPrice) return "text-green-600"
        if (price === maxPrice) return "text-red-600"
        return "text-orange-600"
    }

    const getPriceBg = (price: number) => {
        if (price === 0) return "bg-gray-50"
        if (price === minPrice) return "bg-green-50 border-green-200 rounded"
        if (price === maxPrice) return "bg-red-50 border-red-200 rounded"
        return "bg-orange-50 border-orange-200 rounded"
    }

    return (
        <div className="bg-white rounded-lg border">
            {/* Calendar Header */}
            <div className="flex items-center justify-between p-4 border-b">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={goToPreviousMonth}
                    disabled={currentMonth <= new Date(firstDate.getFullYear(), firstDate.getMonth(), 1)}
                >
                    <ChevronLeft className="h-4 w-4" />
                </Button>

                <h3 className="text-lg font-semibold">
                    {months[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                </h3>

                <Button
                    variant="outline"
                    size="sm"
                    onClick={goToNextMonth}
                    disabled={currentMonth >= new Date(lastDate.getFullYear(), lastDate.getMonth(), 1)}
                >
                    <ChevronRight className="h-4 w-4" />
                </Button>
            </div>

            {/* Calendar Grid */}
            <div className="p-4">
                {/* Weekday Headers */}
                <div className="grid grid-cols-7 gap-1 mb-2">
                    {weekdays.map((day) => (
                        <div key={day} className="p-2 text-center text-sm font-medium text-gray-500">
                            {day}
                        </div>
                    ))}
                </div>

                {/* Calendar Days */}
                <div className="grid grid-cols-7 gap-1">
                    {calendarDays.map((day) => {
                        const dateKey = formatDateKey(day)
                        const priceData = results[dateKey]
                        const isCurrentMonth = day.getMonth() === currentMonth.getMonth()
                        const isToday = dateKey === new Date().toISOString().split("T")[0]
                        const hasPrice = priceData && priceData.preis > 0

                        return (
                            <div
                                key={dateKey}
                                className={`
                  relative min-h-[80px] p-2 border rounded-lg transition-all hover:shadow-sm
                  ${!isCurrentMonth ? "opacity-30" : ""}
                  ${isToday ? "ring-2 ring-blue-500" : ""}
                  ${hasPrice ? getPriceBg(priceData.preis) : "bg-gray-50"}
                  ${hasPrice ? "cursor-pointer hover:shadow-md" : ""}
                `}
                                onClick={() => {
                                    if (hasPrice && priceData.abfahrtsZeitpunkt && startStation && zielStation) {
                                        const bookingLink = createBookingLink(
                                            priceData.abfahrtsZeitpunkt,
                                            startStation.id,
                                            zielStation.id,
                                            searchParams.klasse || "KLASSE_2",
                                            searchParams.maximaleUmstiege || "0",
                                        )
                                        if (bookingLink) {
                                            window.open(bookingLink, "_blank")
                                        }
                                    }
                                }}
                            >
                                {/* Day Number */}
                                <div className="text-sm font-medium text-gray-900 mb-1">{day.getDate()}</div>

                                {/* Price */}
                                {priceData && (
                                    <div className="space-y-1">
                                        <div className={`text-sm font-bold ${getPriceColor(priceData.preis)}`}>
                                            {priceData.preis > 0 ? `${priceData.preis}€` : "N/A"}
                                        </div>

                                        {/* Price indicators */}
                                        {priceData.preis > 0 && (
                                            <div className="text-xs">
                                                {priceData.preis === minPrice && <span>🏆</span>}
                                                {priceData.preis === maxPrice && <span>💸</span>}
                                            </div>
                                        )}

                                        {/* Departure time */}
                                        {priceData.preis > 0 && priceData.abfahrtsZeitpunkt && (
                                            <div className="text-xs text-gray-500">
                                                {new Date(priceData.abfahrtsZeitpunkt).toLocaleTimeString("de-DE", {
                                                    hour: "2-digit",
                                                    minute: "2-digit",
                                                })}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )
                    })}
                </div>
            </div>

            {/* Route Info */}
            {startStation && zielStation && (
                <div className="p-4 border-t bg-gray-50 text-center text-sm text-gray-600">
                    <div className="font-medium">
                        {startStation.name} → {zielStation.name}
                    </div>
                    <div className="text-xs mt-1">
                        Klicken Sie auf einen Tag mit Preis zum Buchen • {dates.length} Tage durchsucht
                    </div>
                </div>
            )}
        </div>
    )
}
