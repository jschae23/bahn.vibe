import { searchTrainPrices } from "@/lib/train-api"

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

const weekdays = {
  1: "Montag",
  2: "Dienstag",
  3: "Mittwoch",
  4: "Donnerstag",
  5: "Freitag",
  6: "Samstag",
  7: "Sonntag",
}

function getDayOfWeek(dayNumber: number): string {
  return weekdays[dayNumber as keyof typeof weekdays] || ""
}

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

  // Create the booking URL like the original PHP
  const klasseParam = klasse === "KLASSE_1" ? "1" : "2"
  const direktverbindung = maximaleUmstiege === "0" ? "true" : "false"

  // Format the departure time for the URL
  const departureTime = encodeURIComponent(abfahrtsZeitpunkt)

  const bookingUrl = `https://www.bahn.de/buchung/fahrplan/suche#sts=true&kl=${klasseParam}&hd=${departureTime}&soid=${encodeURIComponent(startStationId)}&zoid=${encodeURIComponent(zielStationId)}&bp=true&d=${direktverbindung}`

  return bookingUrl
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

    // Find min and max prices for color coding
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

    return (
      <div>
        <div className="mb-6 p-4 bg-green-50 rounded-lg">
          {startStation && zielStation && (
            <div className="text-sm text-gray-600 mt-2">
              Route: {startStation.name} → {zielStation.name}
            </div>
          )}
        </div>

        <div className="space-y-1">
          {Object.entries(results)
            .sort(([a], [b]) => new Date(a).getTime() - new Date(b).getTime())
            .map(([date, data]: [string, any]) => {
              const dayOfWeek = getDayOfWeek(new Date(date).getDay() || 7)
              const isWeekend = new Date(date).getDay() >= 6

              let priceColor = "text-orange-600"
              let priceLabel = ""
              if (data.preis === minPrice) {
                priceColor = "text-green-600"
                priceLabel = " 🏆"
              }
              if (data.preis === maxPrice) {
                priceColor = "text-red-600"
                priceLabel = " 💸"
              }

              // Create proper booking link
              const bookingLink =
                data.preis > 0 && data.abfahrtsZeitpunkt && startStation && zielStation
                  ? createBookingLink(
                      data.abfahrtsZeitpunkt,
                      startStation.id,
                      zielStation.id,
                      searchParams.klasse || "KLASSE_2",
                      searchParams.maximaleUmstiege || "0",
                    )
                  : null

              return (
                <div
                  key={date}
                  className={`p-3 rounded border-l-4 ${
                    data.preis === minPrice
                      ? "border-green-500 bg-green-50"
                      : data.preis === maxPrice
                        ? "border-red-500 bg-red-50"
                        : "border-orange-500 bg-orange-50"
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="font-medium">
                        {date} (<span className={isWeekend ? "font-bold" : ""}>{dayOfWeek}</span>)
                      </span>
                      <span className={`ml-3 font-bold text-lg ${priceColor}`}>
                        {data.preis}€{priceLabel}
                      </span>
                    </div>
                    {data.preis > 0 && bookingLink && (
                      <a
                        href={bookingLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium hover:underline bg-blue-100 px-3 py-1 rounded"
                      >
                        Buchen →
                      </a>
                    )}
                  </div>
                  {data.info && (
                    <div className="text-sm text-gray-600 mt-1">{data.preis > 0 ? data.info : data.info}</div>
                  )}
                  {data.preis > 0 && data.abfahrtsZeitpunkt && (
                    <div className="text-xs text-gray-500 mt-1">
                      Abfahrt: {new Date(data.abfahrtsZeitpunkt).toLocaleString("de-DE")}
                    </div>
                  )}
                </div>
              )
            })}
        </div>

        <div className="mt-6 p-3 bg-gray-100 rounded text-sm text-gray-600 text-center">
          Bestpreissuche abgeschlossen in {executionTime}s • {Object.keys(results).length} Tage durchsucht
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
