interface TrainSearchConfig {
  start: string
  ziel: string
  abfahrtab: string
  klasse: string
  schnelleVerbindungen: boolean
  nurDeutschlandTicketVerbindungen: boolean
  maximaleUmstiege: number
  dayLimit: number
}

interface TrainResult {
  preis: number
  info: string
  abfahrtsZeitpunkt: string
  ankunftsZeitpunkt: string
}

interface TrainResults {
  [date: string]: TrainResult
}

export async function searchBahnhof(search: string): Promise<string | null> {
  if (!search) return null

  const encodedSearch = encodeURIComponent(search)
  const url = `https://www.bahn.de/web/api/reiseloesung/orte?suchbegriff=${encodedSearch}&typ=ALL&limit=10`

  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:137.0) Gecko/20100101 Firefox/137.0",
      },
    })

    if (!response.ok) return null

    const data = await response.json()
    if (!data || data.length === 0) return null

    const id = data[0].id

    // Parse and normalize the ID string
    const params = new URLSearchParams(id.replace(/@/g, "&"))
    const pValue = params.get("p")
    if (pValue) {
      params.set("p", "0".repeat(pValue.length))
    }

    return params.toString().replace(/&/g, "@") + "@"
  } catch (error) {
    console.error("Error searching station:", error)
    return null
  }
}

export async function getCheapestTrain(
  config: TrainSearchConfig & {
    abfahrtsHalt: string
    ankunftsHalt: string
    anfrageZeitpunkt: number
  },
): Promise<TrainResults | null> {
  const datum = new Date(config.anfrageZeitpunkt).toISOString().slice(0, 19)
  const tag = new Date(config.anfrageZeitpunkt).toISOString().split("T")[0]

  const requestBody = {
    abfahrtsHalt: config.abfahrtsHalt,
    anfrageZeitpunkt: datum,
    ankunftsHalt: config.ankunftsHalt,
    ankunftSuche: "ABFAHRT",
    klasse: config.klasse,
    maxUmstiege: config.maximaleUmstiege,
    produktgattungen: ["ICE", "EC_IC", "IR", "REGIONAL", "SBAHN", "BUS", "SCHIFF", "UBAHN", "TRAM", "ANRUFPFLICHTIG"],
    reisende: [
      {
        typ: "ERWACHSENER",
        ermaessigungen: [
          {
            art: "KEINE_ERMAESSIGUNG",
            klasse: "KLASSENLOS",
          },
        ],
        alter: [],
        anzahl: 1,
      },
    ],
    schnelleVerbindungen: config.schnelleVerbindungen,
    sitzplatzOnly: false,
    bikeCarriage: false,
    reservierungsKontingenteVorhanden: false,
    nurDeutschlandTicketVerbindungen: config.nurDeutschlandTicketVerbindungen,
    deutschlandTicketVorhanden: false,
  }

  try {
    const response = await fetch("https://www.bahn.de/web/api/angebote/tagesbestpreis", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json; charset=utf-8",
        "Accept-Encoding": "gzip",
        Origin: "https://www.bahn.de",
        Referer: "https://www.bahn.de/buchung/fahrplan/suche",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:137.0) Gecko/20100101 Firefox/137.0",
      },
      body: JSON.stringify(requestBody),
    })

    if (!response.ok) {
      return null
    }

    const data = await response.json()

    if (!data.intervalle) {
      return { [tag]: { preis: 0, info: "Kein Bestpreis verfügbar!", abfahrtsZeitpunkt: "", ankunftsZeitpunkt: "" } }
    }

    const preise: { [key: string]: number } = {}
    let ersteFahrt: any = null

    for (const iv of data.intervalle) {
      if (iv.preis?.betrag) {
        const newPreis = iv.preis.betrag
        ersteFahrt = iv.verbindungen[0]?.verbindung?.verbindungsAbschnitte[0]

        if (ersteFahrt) {
          const abfahrt = new Date(ersteFahrt.abfahrtsZeitpunkt).toLocaleString("de-DE")
          const ankunft = new Date(ersteFahrt.ankunftsZeitpunkt).toLocaleString("de-DE")
          const info = `${abfahrt} ${ersteFahrt.abfahrtsOrt} -> ${ankunft} ${ersteFahrt.ankunftsOrt}`

          preise[info + newPreis] = newPreis
        }
      }
    }

    if (Object.keys(preise).length === 0) {
      return { [tag]: { preis: 0, info: "Kein Bestpreis verfügbar!", abfahrtsZeitpunkt: "", ankunftsZeitpunkt: "" } }
    }

    const minPreis = Math.min(...Object.values(preise))
    const infoKey = Object.keys(preise).find((key) => preise[key] === minPreis)
    const info = infoKey ? infoKey.replace(minPreis.toString(), "") : ""

    return {
      [tag]: {
        preis: minPreis,
        info,
        abfahrtsZeitpunkt: ersteFahrt?.abfahrtsZeitpunkt || "",
        ankunftsZeitpunkt: ersteFahrt?.ankunftsZeitpunkt || "",
      },
    }
  } catch (error) {
    console.error("Error fetching train data:", error)
    return null
  }
}

export async function searchTrainPrices(config: TrainSearchConfig): Promise<TrainResults> {
  try {
    // Get the base URL for API calls
    const baseUrl =
      process.env.NEXT_PUBLIC_BASE_URL ||
      (typeof window !== "undefined" ? window.location.origin : "http://localhost:3000")

    const response = await fetch(`${baseUrl}/api/search-prices`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(config),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: "Unknown error" }))
      throw new Error(errorData.error || `HTTP ${response.status}: Bestpreissuche fehlgeschlagen`)
    }

    const results = await response.json()
    return results
  } catch (error) {
    console.error("Error in bestpreissuche:", error)
    throw error
  }
}
