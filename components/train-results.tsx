"use client"

import { searchTrainPrices } from "@/lib/train-api"
import { PriceCalendar } from "./price-calendar"

interface SearchParams {
  start?: string
  ziel?: string
  abfahrtab?: string
  klasse?: string
  schnelleVerbindungen?: string
  nurDeutschlandTicketVerbindungen?: string
  maximaleUmstiege?: string
  dayLimit?: string
}

interface TrainResultsProps {
  searchParams: SearchParams
}

export async function TrainResults({ searchParams }: TrainResultsProps) {
  if (!searchParams.start || !searchParams.ziel) {
    return null
  }

  const startTime = Date.now()

  try {
    const response = await searchTrainPrices({
      start: searchParams.start,
      ziel: searchParams.ziel,
      abfahrtab: searchParams.abfahrtab || new Date().toISOString().split("T")[0],
      klasse: searchParams.klasse || "KLASSE_2",
      schnelleVerbindungen: searchParams.schnelleVerbindungen === "1",
      nurDeutschlandTicketVerbindungen: searchParams.nurDeutschlandTicketVerbindungen === "1",
      maximaleUmstiege: Number.parseInt(searchParams.maximaleUmstiege || "0"),
      dayLimit: Number.parseInt(searchParams.dayLimit || "3"),
    })

    const endTime = Date.now()
    const executionTime = Math.round((endTime - startTime) / 1000)

    // Extract metadata and results
    const { _meta, ...results } = response as any
    const startStation = _meta?.startStation
    const zielStation = _meta?.zielStation

    if (!results || Object.keys(results).length === 0) {
      return (
          <div className="text-center py-8">
            <p className="text-red-600 font-medium">Keine Bestpreise gefunden</p>
            <p className="text-gray-600 text-sm mt-2">
              Bitte überprüfen Sie Ihre Bahnhofsnamen und versuchen Sie es erneut.
            </p>
          </div>
      )
    }

    // Find min and max prices for summary
    const prices = Object.values(results)
        .map((r: any) => r.preis)
        .filter((p) => p > 0)

    if (prices.length === 0) {
      return (
          <div className="text-center py-8">
            <p className="text-orange-600 font-medium">Keine Preise verfügbar</p>
            <p className="text-gray-600 text-sm mt-2">Für den gewählten Zeitraum sind keine Bestpreise verfügbar.</p>
          </div>
      )
    }

    const minPrice = Math.min(...prices)
    const maxPrice = Math.max(...prices)
    const avgPrice = Math.round(prices.reduce((a, b) => a + b, 0) / prices.length)

    return (
        <div className="space-y-6">
          {/* Quick Summary */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-semibold text-blue-800 mb-2">📊 Preisübersicht ({Object.keys(results).length} Tage)</h3>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div className="text-center">
                <div className="text-green-600 font-bold text-lg">{minPrice}€</div>
                <div className="text-gray-600">Günstigster</div>
              </div>
              <div className="text-center">
                <div className="text-gray-600 font-bold text-lg">{avgPrice}€</div>
                <div className="text-gray-600">Durchschnitt</div>
              </div>
              <div className="text-center">
                <div className="text-red-600 font-bold text-lg">{maxPrice}€</div>
                <div className="text-gray-600">Teuerster</div>
              </div>
            </div>
          </div>

          {/* Calendar View */}
          <div>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              📅 Preiskalender
              <span className="text-sm font-normal text-gray-500">(Klicken zum Buchen)</span>
            </h3>
            <PriceCalendar
                results={results}
                startStation={startStation}
                zielStation={zielStation}
                searchParams={{
                  klasse: searchParams.klasse,
                  maximaleUmstiege: searchParams.maximaleUmstiege,
                }}
            />
          </div>

          {/* Processing Info */}
          <div className="text-center p-3 bg-gray-100 rounded text-sm text-gray-600">
            ✅ Bestpreissuche abgeschlossen in {executionTime}s • {Object.keys(results).length} Tage durchsucht
          </div>
        </div>
    )
  } catch (error) {
    return (
        <div className="text-center py-8">
          <p className="text-red-600 font-bold">Fehler bei der Bestpreissuche</p>
          <p className="text-sm text-gray-600 mt-2">{error instanceof Error ? error.message : "Unbekannter Fehler"}</p>
          <p className="text-sm text-gray-500 mt-2">
            Bitte versuchen Sie es später erneut oder überprüfen Sie Ihre Internetverbindung.
          </p>
        </div>
    )
  }
}
