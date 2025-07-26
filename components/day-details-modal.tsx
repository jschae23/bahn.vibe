"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { MapPin, ArrowRight, Euro, Calendar, Train, TrendingUp } from "lucide-react"

interface IntervalData {
  preis: number
  abfahrtsZeitpunkt: string
  ankunftsZeitpunkt: string
  abfahrtsOrt: string
  ankunftsOrt: string
  info: string
}

interface PriceData {
  preis: number
  info: string
  abfahrtsZeitpunkt: string
  ankunftsZeitpunkt: string
  allIntervals?: IntervalData[]
}

interface DayDetailsModalProps {
  isOpen: boolean
  onClose: () => void
  date: string
  priceData: PriceData | null
  startStation?: { name: string; id: string }
  zielStation?: { name: string; id: string }
  searchParams: {
    klasse?: string
    maximaleUmstiege?: string
  }
  minPrice: number
  maxPrice: number
}

const weekdays = ["Sonntag", "Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag"]

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

export function DayDetailsModal({
  isOpen,
  onClose,
  date,
  priceData,
  startStation,
  zielStation,
  searchParams,
  minPrice,
  maxPrice,
}: DayDetailsModalProps) {
  if (!priceData) return null

  const dateObj = new Date(date)
  const dayOfWeek = weekdays[dateObj.getDay()]
  const isWeekend = dateObj.getDay() === 0 || dateObj.getDay() === 6

  const formattedDate = dateObj.toLocaleDateString("de-DE", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  const intervals = priceData.allIntervals || []
  const hasMultipleIntervals = intervals.length > 1

  const calculateDuration = (departure: string, arrival: string) => {
    const dep = new Date(departure)
    const arr = new Date(arrival)
    const duration = arr.getTime() - dep.getTime()
    const hours = Math.floor(duration / (1000 * 60 * 60))
    const minutes = Math.floor((duration % (1000 * 60 * 60)) / (1000 * 60))
    return `${hours}h ${minutes}min`
  }

  const getIntervalPriceColor = (price: number) => {
    const minIntervalPrice = Math.min(...intervals.map((i) => i.preis))
    const maxIntervalPrice = Math.max(...intervals.map((i) => i.preis))

    if (price === minIntervalPrice) return "text-green-600 bg-green-50"
    if (price === maxIntervalPrice) return "text-red-600 bg-red-50"
    return "text-orange-600 bg-orange-50"
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Calendar className="h-5 w-5 text-blue-600" />
            {formattedDate}
            {isWeekend && <Badge variant="secondary">Wochenende</Badge>}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Best Price Overview */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-800">Bestpreis für diesen Tag</h3>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Euro className="h-5 w-5 text-green-600" />
                <span className="text-3xl font-bold text-green-600">{priceData.preis}€</span>
              </div>

              <div className="text-sm text-gray-600">
                <div>Klasse: {searchParams.klasse === "KLASSE_1" ? "1. Klasse" : "2. Klasse"}</div>
                <div>Max. Umstiege: {searchParams.maximaleUmstiege || "0"}</div>
                {hasMultipleIntervals && <div>Gefundene Verbindungen: {intervals.length}</div>}
              </div>
            </div>
          </div>

          {/* All Available Connections */}
          {hasMultipleIntervals && (
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-semibold text-blue-800 mb-4 flex items-center gap-2">
                <Train className="h-4 w-4" />
                Alle verfügbaren Verbindungen ({intervals.length})
              </h3>

              <div className="space-y-3 overflow-y-auto">
                {intervals.map((interval, index) => {
                  const bookingLink =
                    startStation && zielStation
                      ? createBookingLink(
                          interval.abfahrtsZeitpunkt,
                          startStation.id,
                          zielStation.id,
                          searchParams.klasse || "KLASSE_2",
                          searchParams.maximaleUmstiege || "0",
                        )
                      : null

                  return (
                    <div
                      key={index}
                      className={`p-3 rounded border-l-4 ${
                        interval.preis === priceData.preis ? "border-green-500 bg-green-50" : "border-gray-300 bg-white"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <span
                            className={`font-bold text-lg px-2 py-1 rounded ${getIntervalPriceColor(interval.preis)}`}
                          >
                            {interval.preis}€
                          </span>
                          {interval.preis === priceData.preis && (
                            <Badge className="bg-green-100 text-green-800">Bestpreis</Badge>
                          )}
                        </div>

                        {bookingLink && (
                          <Button
                            size="sm"
                            onClick={() => window.open(bookingLink, "_blank")}
                            className="bg-blue-600 hover:bg-blue-700"
                          >
                            Buchen
                          </Button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                        <div>
                          <div className="text-gray-600 mb-1">Abfahrt</div>
                          <div className="font-medium">
                            {new Date(interval.abfahrtsZeitpunkt).toLocaleTimeString("de-DE", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </div>
                          <div className="text-xs text-gray-500">{interval.abfahrtsOrt}</div>
                        </div>

                        <div>
                          <div className="text-gray-600 mb-1">Ankunft</div>
                          <div className="font-medium">
                            {new Date(interval.ankunftsZeitpunkt).toLocaleTimeString("de-DE", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </div>
                          <div className="text-xs text-gray-500">{interval.ankunftsOrt}</div>
                        </div>

                        <div>
                          <div className="text-gray-600 mb-1">Reisedauer</div>
                          <div className="font-medium">
                            {calculateDuration(interval.abfahrtsZeitpunkt, interval.ankunftsZeitpunkt)}
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Route Information */}
          {startStation && zielStation && (
            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="font-semibold text-green-800 mb-3 flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Strecke
              </h3>

              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{startStation.name}</span>
                </div>

                <ArrowRight className="h-4 w-4 text-gray-400" />

                <div className="flex items-center gap-2">
                  <span className="font-medium">{zielStation.name}</span>
                </div>
              </div>
            </div>
          )}

          {/* Price Statistics */}
          {hasMultipleIntervals && (
            <div className="bg-yellow-50 p-4 rounded-lg">
              <h3 className="font-semibold text-yellow-800 mb-3 flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Preisstatistik für diesen Tag
              </h3>

              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-sm text-gray-600 mb-1">Günstigste Verbindung</div>
                  <div className="font-bold text-green-600">{Math.min(...intervals.map((i) => i.preis))}€</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600 mb-1">Durchschnitt</div>
                  <div className="font-bold text-blue-600">
                    {Math.round(intervals.reduce((sum, i) => sum + i.preis, 0) / intervals.length)}€
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-600 mb-1">Teuerste Verbindung</div>
                  <div className="font-bold text-red-600">{Math.max(...intervals.map((i) => i.preis))}€</div>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            {priceData.abfahrtsZeitpunkt && startStation && zielStation && (
              <Button
                onClick={() => {
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
                }}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                <Train className="h-4 w-4 mr-2" />
                Bestpreis buchen ({priceData.preis}€)
              </Button>
            )}

            <Button variant="outline" onClick={onClose}>
              Schließen
            </Button>
          </div>

          {/* Booking Info */}
          <div className="text-xs text-gray-500 text-center bg-blue-50 p-3 rounded">
            💡 Sie werden zur offiziellen Deutsche Bahn Website weitergeleitet. Alle Suchparameter werden automatisch
            übertragen. {hasMultipleIntervals && `${intervals.length} verschiedene Verbindungen verfügbar.`}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
