import { TrainSearchForm } from "@/components/train-search-form"
import { TrainResults } from "@/components/train-results"
import { Suspense } from "react"
import { LoadingSpinner } from "@/components/loading-spinner"

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

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const params = await searchParams
  const hasSearch = params.start && params.ziel

  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <header className="mb-8">
          <h1 className="text-4xl font-bold mb-2">
            <a href="/" className="text-blue-600 hover:text-blue-800">
              bahn.vibe
            </a>
          </h1>
          <p className="text-gray-600 italic">Findet die günstigste Bahnreise für jeden Tag des Monats.</p>
        </header>

        <section className="mb-8">
          <TrainSearchForm searchParams={params} />
        </section>

        <section className="mb-8">
          {hasSearch ? (
            <Suspense fallback={<LoadingSpinner />}>
              <TrainResults searchParams={params} />
            </Suspense>
          ) : (
            <div className="text-red-600 font-bold">Bitte Start + Ziel befüllen!</div>
          )}
        </section>
      </div>
    </div>
  )
}
