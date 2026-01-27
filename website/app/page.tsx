import { Hero } from "@/components/hero"
import { HowItWorks } from "@/components/how-it-works"
import { WhyItWorks } from "@/components/why-it-works"
import { Progress } from "@/components/progress"
import { FinalCta } from "@/components/final-cta"

export default function Home() {
  return (
    <main className="min-h-screen bg-background">
      <Hero />
      <HowItWorks />
      <WhyItWorks />
      <Progress />
      <FinalCta />
    </main>
  )
}
