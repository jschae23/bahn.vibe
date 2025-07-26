"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Checkbox } from "@/components/ui/checkbox"
import { ArrowLeftRight } from "lucide-react"
import { useState } from "react"

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

interface TrainSearchFormProps {
  searchParams: SearchParams
}

export function TrainSearchForm({ searchParams }: TrainSearchFormProps) {
  const [start, setStart] = useState(searchParams.start || "")
  const [ziel, setZiel] = useState(searchParams.ziel || "")
  const [abfahrtab, setAbfahrtab] = useState(searchParams.abfahrtab || new Date().toISOString().split("T")[0])
  const [klasse, setKlasse] = useState(searchParams.klasse || "KLASSE_2")
  const [schnelleVerbindungen, setSchnelleVerbindungen] = useState(searchParams.schnelleVerbindungen === "1")
  const [nurDeutschlandTicket, setNurDeutschlandTicket] = useState(
    searchParams.nurDeutschlandTicketVerbindungen === "1",
  )
  const [maximaleUmstiege, setMaximaleUmstiege] = useState(searchParams.maximaleUmstiege || "0")
  const [dayLimit, setDayLimit] = useState(searchParams.dayLimit || "3")

  const switchStations = () => {
    const temp = start
    setStart(ziel)
    setZiel(temp)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const params = new URLSearchParams()
    if (start) params.set("start", start)
    if (ziel) params.set("ziel", ziel)
    if (abfahrtab) params.set("abfahrtab", abfahrtab)
    params.set("klasse", klasse)
    if (schnelleVerbindungen) params.set("schnelleVerbindungen", "1")
    if (nurDeutschlandTicket) params.set("nurDeutschlandTicketVerbindungen", "1")
    params.set("maximaleUmstiege", maximaleUmstiege)
    params.set("dayLimit", dayLimit)

    window.location.href = `/?${params.toString()}`
  }

  const handleReset = () => {
    setStart("")
    setZiel("")
    setAbfahrtab(new Date().toISOString().split("T")[0])
    setKlasse("KLASSE_2")
    setSchnelleVerbindungen(false)
    setNurDeutschlandTicket(false)
    setMaximaleUmstiege("0")
    setDayLimit("3")
  }

  return (
    <div className="bg-gray-50 p-6 rounded-lg">
      <h2 className="text-xl font-semibold mb-4 text-gray-800">Bestpreissuche</h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <Label htmlFor="start">Von (Startbahnhof)</Label>
            <Input
              id="start"
              type="text"
              placeholder="München"
              value={start}
              onChange={(e) => setStart(e.target.value)}
              required
            />
          </div>

          <Button type="button" variant="outline" size="icon" onClick={switchStations} className="mt-6 bg-transparent">
            <ArrowLeftRight className="h-4 w-4" />
          </Button>

          <div className="flex-1">
            <Label htmlFor="ziel">Nach (Zielbahnhof)</Label>
            <Input
              id="ziel"
              type="text"
              placeholder="Berlin"
              value={ziel}
              onChange={(e) => setZiel(e.target.value)}
              required
            />
          </div>
        </div>

        <div>
          <Label htmlFor="abfahrtab">Reisezeitraum ab</Label>
          <Input id="abfahrtab" type="date" value={abfahrtab} onChange={(e) => setAbfahrtab(e.target.value)} />
        </div>

        <div>
          <Label htmlFor="dayLimit">Anzahl Tage</Label>
          <Input
            id="dayLimit"
            type="number"
            min="1"
            max="30"
            value={dayLimit}
            onChange={(e) => setDayLimit(e.target.value)}
            className="w-24 mt-1"
          />
          <p className="text-sm text-gray-600 mt-1">
            Wie viele aufeinanderfolgende Tage sollen durchsucht werden? (1-30)
          </p>
        </div>

        <div>
          <Label>Klasse</Label>
          <RadioGroup value={klasse} onValueChange={setKlasse} className="flex gap-6 mt-2">
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="KLASSE_1" id="klasse1" />
              <Label htmlFor="klasse1">1. Klasse</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="KLASSE_2" id="klasse2" />
              <Label htmlFor="klasse2">2. Klasse</Label>
            </div>
          </RadioGroup>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center space-x-2">
            <Checkbox id="schnelle" checked={schnelleVerbindungen} onCheckedChange={setSchnelleVerbindungen} />
            <Label htmlFor="schnelle">Schnellste Verbindungen bevorzugen</Label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox id="deutschland" checked={nurDeutschlandTicket} onCheckedChange={setNurDeutschlandTicket} />
            <Label htmlFor="deutschland">Nur Deutschland-Ticket-Verbindungen</Label>
          </div>
        </div>

        <div>
          <Label htmlFor="umstiege">Maximale Umstiege</Label>
          <Input
            id="umstiege"
            type="number"
            min="0"
            max="5"
            value={maximaleUmstiege}
            onChange={(e) => setMaximaleUmstiege(e.target.value)}
            className="w-24 mt-1"
          />
        </div>

        <div className="flex gap-4">
          <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
            Bestpreise suchen
          </Button>
          <Button type="button" variant="outline" onClick={handleReset}>
            Zurücksetzen
          </Button>
        </div>

        <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded">
          <p className="font-medium">ℹ️ Bestpreissuche mit Kalenderansicht</p>
          <p>Findet die günstigsten Preise für {dayLimit} aufeinanderfolgende Tage.</p>
          <p>
            Verarbeitungszeit: ca. {Math.ceil(Number.parseInt(dayLimit) * 2)}–{Math.ceil(Number.parseInt(dayLimit) * 3)}{" "}
            Sekunden.
          </p>
        </div>
      </form>
    </div>
  )
}
