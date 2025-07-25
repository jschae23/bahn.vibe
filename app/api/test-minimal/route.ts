import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { start, ziel } = body

    console.log("Testing with working curl format for:", { start, ziel })

    // First get station IDs
    const startResponse = await fetch(
      `https://www.bahn.de/web/api/reiseloesung/orte?suchbegriff=${encodeURIComponent(start)}&typ=ALL&limit=10`,
      {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:137.0) Gecko/20100101 Firefox/137.0",
          Accept: "application/json",
        },
      },
    )

    const zielResponse = await fetch(
      `https://www.bahn.de/web/api/reiseloesung/orte?suchbegriff=${encodeURIComponent(ziel)}&typ=ALL&limit=10`,
      {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:137.0) Gecko/20100101 Firefox/137.0",
          Accept: "application/json",
        },
      },
    )

    if (!startResponse.ok || !zielResponse.ok) {
      return NextResponse.json({ error: "Station search failed" }, { status: 400 })
    }

    const startData = await startResponse.json()
    const zielData = await zielResponse.json()

    if (!startData[0] || !zielData[0]) {
      return NextResponse.json({ error: "Stations not found" }, { status: 404 })
    }

    // Use original station IDs (don't normalize like we were doing before)
    const startId = startData[0].id
    const zielId = zielData[0].id

    console.log("Using original station IDs:", { startId, zielId })

    // Use the EXACT working curl request format
    const workingRequest = {
      abfahrtsHalt: startId,
      anfrageZeitpunkt: "2025-07-26T08:00:00", // Exact format from working curl
      ankunftsHalt: zielId,
      ankunftSuche: "ABFAHRT",
      klasse: "KLASSE_2",
      maxUmstiege: 0,
      produktgattungen: ["ICE", "EC_IC", "IR", "REGIONAL", "SBAHN", "BUS", "SCHIFF", "UBAHN", "TRAM", "ANRUFPFLICHTIG"],
      reisende: [
        {
          typ: "ERWACHSENER",
          ermaessigungen: [{ art: "KEINE_ERMAESSIGUNG", klasse: "KLASSENLOS" }],
          alter: [],
          anzahl: 1,
        },
      ],
      schnelleVerbindungen: true, // Boolean, not string
      sitzplatzOnly: false,
      bikeCarriage: false,
      reservierungsKontingenteVorhanden: false,
      nurDeutschlandTicketVerbindungen: false, // Boolean, not string
      deutschlandTicketVorhanden: false,
    }

    console.log("Working request format:", JSON.stringify(workingRequest, null, 2))

    // Use exact headers from working curl
    const priceResponse = await fetch("https://www.bahn.de/web/api/angebote/tagesbestpreis", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json; charset=utf-8",
        "Accept-Encoding": "gzip",
        Origin: "https://www.bahn.de",
        Referer: "https://www.bahn.de/buchung/fahrplan/suche",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:137.0) Gecko/20100101 Firefox/137.0",
        Connection: "close",
      },
      body: JSON.stringify(workingRequest),
    })

    console.log("Price response status:", priceResponse.status)

    if (!priceResponse.ok) {
      const errorText = await priceResponse.text().catch(() => "No error text")
      console.log("Price response error:", errorText)
      return NextResponse.json({
        error: `Price API returned ${priceResponse.status}`,
        errorText,
        request: workingRequest,
      })
    }

    const priceData = await priceResponse.text()
    console.log("Price response length:", priceData.length)

    try {
      const parsedData = JSON.parse(priceData)

      // Extract first price if available
      let firstPrice = null
      if (parsedData.intervalle && parsedData.intervalle.length > 0) {
        for (const interval of parsedData.intervalle) {
          if (interval.preis && interval.preis.betrag) {
            firstPrice = interval.preis.betrag
            break
          }
        }
      }

      return NextResponse.json({
        success: true,
        stations: {
          start: { name: startData[0].name, id: startId },
          ziel: { name: zielData[0].name, id: zielId },
        },
        hasIntervalle: !!parsedData.intervalle,
        intervalCount: parsedData.intervalle?.length || 0,
        firstPrice,
        request: workingRequest,
        message: "✅ Request successful with working curl format!",
      })
    } catch (parseError) {
      return NextResponse.json({
        error: "Failed to parse price response",
        rawResponse: priceData.slice(0, 500),
        request: workingRequest,
      })
    }
  } catch (error) {
    console.error("Test error:", error)
    return NextResponse.json({
      error: "Test failed",
      details: error instanceof Error ? error.message : "Unknown error",
    })
  }
}
