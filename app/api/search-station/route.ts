import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const search = searchParams.get("search")

  if (!search) {
    return NextResponse.json({ error: "Search parameter required" }, { status: 400 })
  }

  try {
    const encodedSearch = encodeURIComponent(search)
    const url = `https://www.bahn.de/web/api/reiseloesung/orte?suchbegriff=${encodedSearch}&typ=ALL&limit=10`

    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:137.0) Gecko/20100101 Firefox/137.0",
        Accept: "application/json",
        "Accept-Language": "de-DE,de;q=0.9,en;q=0.8",
        Referer: "https://www.bahn.de/",
      },
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()

    if (!data || data.length === 0) {
      return NextResponse.json({ error: "No stations found" }, { status: 404 })
    }

    const id = data[0].id

    // Parse and normalize the ID string
    const params = new URLSearchParams(id.replace(/@/g, "&"))
    const pValue = params.get("p")
    if (pValue) {
      params.set("p", "0".repeat(pValue.length))
    }

    const normalizedId = params.toString().replace(/&/g, "@") + "@"

    return NextResponse.json({ id: normalizedId, name: data[0].name })
  } catch (error) {
    console.error("Error searching station:", error)
    return NextResponse.json({ error: "Failed to search station" }, { status: 500 })
  }
}
