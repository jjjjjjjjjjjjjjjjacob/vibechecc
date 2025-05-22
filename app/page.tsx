import { Header } from "@/components/header"
import { VibeCategoryRow } from "@/components/vibe-category-row"
import { sampleVibes } from "@/lib/sample-data"
import { CreateVibeButton } from "@/components/create-vibe-button"

export default function Home() {
  // Group vibes by tags
  const vibeTags = Array.from(new Set(sampleVibes.flatMap((vibe) => vibe.tags || [])))

  // Get popular vibes (most ratings)
  const popularVibes = [...sampleVibes].sort((a, b) => b.ratings.length - a.ratings.length).slice(0, 10)

  // Get highest rated vibes
  const highestRatedVibes = [...sampleVibes]
    .sort((a, b) => {
      const aAvg = a.ratings.reduce((sum, r) => sum + r.rating, 0) / a.ratings.length
      const bAvg = b.ratings.reduce((sum, r) => sum + r.rating, 0) / b.ratings.length
      return bAvg - aAvg
    })
    .slice(0, 10)

  // Get newest vibes
  const newestVibes = [...sampleVibes]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 10)

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold lowercase">discover vibes</h1>
          <CreateVibeButton />
        </div>

        <VibeCategoryRow title="popular vibes" vibes={popularVibes} />
        <VibeCategoryRow title="highest rated" vibes={highestRatedVibes} />
        <VibeCategoryRow title="fresh vibes" vibes={newestVibes} />

        {/* Category rows based on tags */}
        {vibeTags.map((tag) => (
          <VibeCategoryRow
            key={tag}
            title={tag.toLowerCase()}
            vibes={sampleVibes.filter((vibe) => vibe.tags?.includes(tag))}
          />
        ))}
      </main>
    </div>
  )
}
