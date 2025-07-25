"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function DebugPage() {
  const [start, setStart] = useState("München")
  const [ziel, setZiel] = useState("Berlin")
  const [result, setResult] = useState<any>(null)
  const [minimalResult, setMinimalResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const testAPI = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/search-prices", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          start,
          ziel,
          abfahrtab: new Date().toISOString().split("T")[0],
          klasse: "KLASSE_2",
          schnelleVerbindungen: false,
          nurDeutschlandTicketVerbindungen: false,
          maximaleUmstiege: 0,
        }),
      })

      const data = await response.json()
      setResult({ status: response.status, data })
    } catch (error) {
      setResult({ error: error instanceof Error ? error.message : "Unknown error" })
    } finally {
      setLoading(false)
    }
  }

  const testMinimal = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/test-minimal", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ start, ziel }),
      })

      const data = await response.json()
      setMinimalResult({ status: response.status, data })
    } catch (error) {
      setMinimalResult({ error: error instanceof Error ? error.message : "Unknown error" })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <h1 className="text-2xl font-bold mb-6">API Debug Page - 422 Error Investigation</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div>
          <Label htmlFor="start">Start Station</Label>
          <Input id="start" value={start} onChange={(e) => setStart(e.target.value)} />
        </div>

        <div>
          <Label htmlFor="ziel">Destination Station</Label>
          <Input id="ziel" value={ziel} onChange={(e) => setZiel(e.target.value)} />
        </div>
      </div>

      <div className="flex gap-4 mb-6">
        <Button onClick={testAPI} disabled={loading}>
          {loading ? "Testing..." : "Test Full API"}
        </Button>
        <Button onClick={testMinimal} disabled={loading} variant="outline">
          {loading ? "Testing..." : "Test Minimal Request"}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {result && (
          <div className="bg-gray-100 p-4 rounded">
            <h3 className="font-bold mb-2">Full API Response:</h3>
            <pre className="text-sm overflow-auto max-h-96">{JSON.stringify(result, null, 2)}</pre>
          </div>
        )}

        {minimalResult && (
          <div className="bg-blue-50 p-4 rounded">
            <h3 className="font-bold mb-2">Minimal Request Response:</h3>
            <pre className="text-sm overflow-auto max-h-96">{JSON.stringify(minimalResult, null, 2)}</pre>
          </div>
        )}
      </div>

      <div className="mt-8 text-sm text-gray-600 bg-yellow-50 p-4 rounded">
        <p className="font-bold mb-2">🔍 Debugging 422 Error:</p>
        <ol className="list-decimal list-inside space-y-1">
          <li>Try "München" and "Berlin" first (major stations)</li>
          <li>Test "Minimal Request" to see if basic structure works</li>
          <li>Compare the request structures between working and failing calls</li>
          <li>Check server console for detailed logs</li>
          <li>Look for differences in station ID format or request parameters</li>
        </ol>
        <p className="mt-3 font-medium">
          The minimal test strips down to the absolute basics to isolate what's causing the 422 error.
        </p>
      </div>
    </div>
  )
}
