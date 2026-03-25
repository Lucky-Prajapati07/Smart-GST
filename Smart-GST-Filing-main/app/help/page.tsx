import Link from "next/link"
import { Navbar } from "@/components/navbar"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

const helpTopics = [
  {
    title: "Getting Started",
    description: "Set up your account, business profile, and initial filing preferences.",
  },
  {
    title: "Invoices and Data",
    description: "Create invoices, review records, and keep transaction data organized.",
  },
  {
    title: "GST Returns",
    description: "Follow guided steps to prepare, validate, and submit returns.",
  },
  {
    title: "Reminders and Tasks",
    description: "Track due work and schedule reminders to avoid missed deadlines.",
  },
  {
    title: "Reports and Exports",
    description: "Review summaries and export compliance data for your workflow.",
  },
  {
    title: "Account and Security",
    description: "Manage account details, access controls, and security settings.",
  },
]

export default function HelpPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="pt-24 pb-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-black text-gray-900 mb-4">Help Center</h1>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Find guidance for common tasks and support topics across the platform.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
            {helpTopics.map((topic) => (
              <Card key={topic.title} className="border-0 shadow-lg hover:shadow-xl transition-shadow">
                <CardHeader>
                  <CardTitle className="text-xl text-gray-900">{topic.title}</CardTitle>
                  <CardDescription>{topic.description}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button asChild className="bg-blue-600 hover:bg-blue-700">
              <Link href="/signup">Create Account</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/dashboard">Go to Dashboard</Link>
            </Button>
          </div>
        </div>
      </main>
    </div>
  )
}