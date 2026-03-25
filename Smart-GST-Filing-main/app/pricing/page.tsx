import { Navbar } from "@/components/navbar"
import { PricingCards } from "@/components/pricing-cards"

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="pt-24 pb-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-black text-gray-900 mb-4">Pricing</h1>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Choose your billing category: Monthly, Half Yearly, or Yearly.
            </p>
          </div>

          <PricingCards />
        </div>
      </main>
    </div>
  )
}