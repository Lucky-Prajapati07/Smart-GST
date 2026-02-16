"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Navbar } from "@/components/navbar"
import {
  CheckCircle,
  Shield,
  Zap,
  Users,
  FileText,
  BarChart3,
  Star,
  ArrowRight,
  Phone,
  Mail,
  MapPin,
  TrendingUp,
  Clock,
  Award,
  ChevronRight,
  Play,
  Calculator,
  FileCheck,
  Brain,
  Eye,
  DollarSign,
  Target,
  Briefcase,
  Globe,
  Smartphone,
  Headphones,
  CreditCard,
  Building,
  Download,
  Upload,
  Lightbulb,
  PieChart,
  LineChart,
  Timer,
  MessageSquare,
  ShieldCheck,
} from "lucide-react"
import Link from "next/link"
import { useState, useEffect } from "react"
import { useLanguage } from "@/contexts/language-context"

export default function HomePage() {
  const { t } = useLanguage()
  const [isVisible, setIsVisible] = useState(false)
  const [currentTestimonial, setCurrentTestimonial] = useState(0)
  const [typedText, setTypedText] = useState("")
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })

  // Enhanced features array with detailed descriptions
  const features = [
    {
      icon: Brain,
      title: t('features.aiPowered.title'),
      description: t('features.aiPowered.description'),
      color: "from-purple-500 to-pink-500",
      benefits: ["Automated Error Detection", "Smart Data Processing", "Real-time Analysis", "Predictive Insights"]
    },
    {
      icon: Calculator,
      title: t('features.autoCalculation.title'),
      description: t('features.autoCalculation.description'),
      color: "from-green-500 to-emerald-500",
      benefits: ["Zero Manual Calculations", "Tax Optimization", "Multi-rate Support", "Instant Updates"]
    },
    {
      icon: FileCheck,
      title: t('features.compliantReturns.title'),
      description: t('features.compliantReturns.description'),
      color: "from-yellow-500 to-orange-500",
      benefits: ["Latest Regulations", "Automatic Updates", "Government Approved", "Audit Ready"]
    },
    {
      icon: Eye,
      title: t('features.realTimeValidation.title'),
      description: t('features.realTimeValidation.description'),
      color: "from-blue-500 to-cyan-500",
      benefits: ["Instant Validation", "GST Portal Sync", "Error Prevention", "Live Verification"]
    },
    {
      icon: Clock,
      title: t('features.smartReminders.title'),
      description: t('features.smartReminders.description'),
      color: "from-indigo-500 to-purple-500",
      benefits: ["Smart Notifications", "Custom Schedules", "Multi-channel Alerts", "Deadline Tracking"]
    },
    {
      icon: Shield,
      title: t('features.auditTrail.title'),
      description: t('features.auditTrail.description'),
      color: "from-red-500 to-pink-500",
      benefits: ["Complete History", "Change Tracking", "User Activity Logs", "Compliance Reports"]
    },
  ]

  const steps = [
    {
      step: "01",
      title: t('howItWorks.step1.title'),
      description: t('howItWorks.step1.description'),
      icon: Upload,
      details: ["Excel/CSV Import", "API Integration", "Manual Entry", "Bulk Upload"]
    },
    {
      step: "02",
      title: t('howItWorks.step2.title'),
      description: t('howItWorks.step2.description'),
      icon: Brain,
      details: ["Data Validation", "Tax Calculation", "Compliance Check", "Error Detection"]
    },
    {
      step: "03",
      title: t('howItWorks.step3.title'),
      description: t('howItWorks.step3.description'),
      icon: FileCheck,
      details: ["Portal Submission", "Acknowledgment", "Record Storage", "Status Tracking"]
    },
  ]

  const stats = [
    { 
      number: t('stats.returns'), 
      label: "Returns Filed", 
      icon: FileText, 
      description: "Successfully filed GST returns",
      color: "from-blue-500 to-purple-600"
    },
    { 
      number: t('stats.customers'), 
      label: "Happy Customers", 
      icon: Users, 
      description: "Businesses trust our platform",
      color: "from-green-500 to-emerald-600"
    },
    { 
      number: t('stats.accuracy'), 
      label: "Accuracy Rate", 
      icon: Award, 
      description: "Error-free filing guarantee",
      color: "from-yellow-500 to-orange-600"
    },
    { 
      number: t('stats.savings'), 
      label: "Avg. Savings", 
      icon: TrendingUp, 
      description: "Per business annually",
      color: "from-red-500 to-pink-600"
    },
  ]

  const testimonials = [
    {
      name: t('testimonials.name1'),
      business: t('testimonials.business1'),
      comment: t('testimonials.comment1'),
      rating: 5,
      image: "RK",
      location: "Mumbai, Maharashtra"
    },
    {
      name: t('testimonials.name2'),
      business: t('testimonials.business2'),
      comment: t('testimonials.comment2'),
      rating: 5,
      image: "PS",
      location: "Delhi, India"
    },
    {
      name: t('testimonials.name3'),
      business: t('testimonials.business3'),
      comment: t('testimonials.comment3'),
      rating: 5,
      image: "AP",
      location: "Bangalore, Karnataka"
    }
  ]

  const supportedReturns = [
    { 
      type: "GSTR-1", 
      name: "Outward Supplies", 
      description: "Monthly/Quarterly outward supply details",
      frequency: "Monthly/Quarterly",
      complexity: "Medium"
    },
    { 
      type: "GSTR-3B", 
      name: "Summary Return", 
      description: "Monthly summary of outward & inward supplies",
      frequency: "Monthly",
      complexity: "High"
    },
    { 
      type: "GSTR-4", 
      name: "Composition Return", 
      description: "Quarterly return for composition dealers",
      frequency: "Quarterly",
      complexity: "Low"
    },
    { 
      type: "GSTR-9", 
      name: "Annual Return", 
      description: "Annual return for regular taxpayers",
      frequency: "Annual",
      complexity: "High"
    },
    { 
      type: "GSTR-9C", 
      name: "Annual Audit", 
      description: "Reconciliation statement & audit report",
      frequency: "Annual",
      complexity: "Very High"
    },
    { 
      type: "GSTR-10", 
      name: "Final Return", 
      description: "Final return for cancellation of registration",
      frequency: "One-time",
      complexity: "Medium"
    }
  ]

  const pricingPlans = [
    {
      name: "Starter",
      price: "₹999",
      period: "/month",
      description: "Perfect for small businesses",
      features: [
        "Up to 100 invoices",
        "GSTR-1 & GSTR-3B filing",
        "Email support",
        "Basic reports",
        "Data backup",
        "Mobile app access"
      ],
      color: "from-blue-500 to-blue-600",
      savings: "Save ₹5,000/year"
    },
    {
      name: "Professional",
      price: "₹2,999",
      period: "/month",
      description: "Ideal for growing businesses",
      features: [
        "Unlimited invoices",
        "All GST returns",
        "Priority support",
        "Advanced analytics",
        "API access",
        "Multi-user support",
        "Custom integrations",
        "Audit trail"
      ],
      color: "from-purple-500 to-purple-600",
      popular: true,
      savings: "Save ₹15,000/year"
    },
    {
      name: "Enterprise",
      price: "₹9,999",
      period: "/month",
      description: "For large organizations",
      features: [
        "Multi-location support",
        "Dedicated account manager",
        "Custom integrations",
        "White-label solution",
        "24/7 phone support",
        "Advanced security",
        "Custom reports",
        "Training sessions"
      ],
      color: "from-green-500 to-green-600",
      savings: "Save ₹50,000/year"
    }
  ]

  const benefits = [
    {
      icon: Timer,
      title: "Save 90% Time",
      description: "Automated processing reduces filing time from hours to minutes",
      details: ["Instant calculations", "Auto-populated forms", "One-click submissions"]
    },
    {
      icon: Shield,
      title: "100% Compliant",
      description: "Always up-to-date with latest GST regulations and requirements",
      details: ["Government approved", "Regular updates", "Audit ready"]
    },
    {
      icon: Award,
      title: "99.9% Accuracy",
      description: "AI-powered validation ensures error-free GST return filing",
      details: ["Smart error detection", "Real-time validation", "Automated corrections"]
    },
    {
      icon: Users,
      title: "Expert Support",
      description: "Dedicated GST specialists available whenever you need help",
      details: ["24/7 chat support", "Phone consultation", "Email assistance"]
    }
  ]

  // Animation effects
  useEffect(() => {
    setIsVisible(true)
    
    // Testimonial rotation
    const testimonialInterval = setInterval(() => {
      setCurrentTestimonial((prev) => (prev + 1) % testimonials.length)
    }, 6000)

    // Typewriter effect for hero title
    const titleText = t('hero.title')
    let i = 0
    const typeInterval = setInterval(() => {
      if (i < titleText.length) {
        setTypedText(titleText.slice(0, i + 1))
        i++
      } else {
        clearInterval(typeInterval)
      }
    }, 150)

    // Mouse tracking
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY })
    }
    
    window.addEventListener('mousemove', handleMouseMove)
    
    return () => {
      clearInterval(testimonialInterval)
      clearInterval(typeInterval)
      window.removeEventListener('mousemove', handleMouseMove)
    }
  }, [t, testimonials.length])

  return (
    <div className="min-h-screen bg-white overflow-x-hidden">
      <Navbar />

      {/* Enhanced Hero Section with More Visual Elements */}
      <section className="relative pt-16 pb-20 px-4 overflow-hidden">
        {/* Complex Animated Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
          {/* Floating particles */}
          <div className="absolute inset-0">
            {[...Array(30)].map((_, i) => (
              <div
                key={i}
                className={`absolute rounded-full animate-float ${
                  i % 3 === 0 ? 'w-2 h-2 bg-blue-500/20' :
                  i % 3 === 1 ? 'w-3 h-3 bg-purple-500/15' :
                  'w-1 h-1 bg-indigo-500/25'
                }`}
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 8}s`,
                  animationDuration: `${4 + Math.random() * 6}s`
                }}
              ></div>
            ))}
          </div>
          
          {/* Dynamic gradient orbs */}
          <div 
            className="absolute w-96 h-96 bg-gradient-radial from-purple-500/10 via-blue-500/5 to-transparent rounded-full blur-3xl transition-all duration-500 pointer-events-none"
            style={{
              left: mousePosition.x - 192,
              top: mousePosition.y - 192,
            }}
          ></div>
          
          {/* Floating business elements */}
          <div className="absolute top-20 left-10 w-20 h-20 bg-gradient-to-br from-emerald-500/20 to-green-500/20 rounded-2xl animate-float backdrop-blur-sm flex items-center justify-center shadow-lg" style={{ animationDelay: '1s' }}>
            <Calculator className="w-10 h-10 text-emerald-600/70" />
          </div>
          <div className="absolute top-32 right-16 w-16 h-16 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-full animate-bounce flex items-center justify-center backdrop-blur-sm shadow-md" style={{ animationDelay: '2s' }}>
            <FileText className="w-8 h-8 text-purple-600/70" />
          </div>
          <div className="absolute bottom-32 left-1/4 w-18 h-18 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-xl animate-pulse flex items-center justify-center backdrop-blur-sm shadow-lg" style={{ animationDelay: '3s' }}>
            <BarChart3 className="w-9 h-9 text-blue-600/70" />
          </div>
          <div className="absolute top-48 right-1/3 w-14 h-14 bg-gradient-to-br from-orange-500/20 to-red-500/20 rounded-full animate-spin-slow flex items-center justify-center backdrop-blur-sm shadow-md">
            <Shield className="w-7 h-7 text-orange-600/70" />
          </div>
          <div className="absolute bottom-48 right-20 w-12 h-12 bg-gradient-to-br from-yellow-500/20 to-orange-500/20 rounded-lg animate-float flex items-center justify-center backdrop-blur-sm" style={{ animationDelay: '4s' }}>
            <Award className="w-6 h-6 text-yellow-600/70" />
          </div>
        </div>

        <div className="relative max-w-7xl mx-auto">
          <div className={`text-center transition-all duration-1200 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-16'}`}>
            {/* Premium notification badge */}
            <div className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-blue-100 via-purple-100 to-indigo-100 text-blue-800 rounded-full text-sm font-semibold mb-10 border border-blue-200/50 backdrop-blur-sm shadow-xl hover:shadow-2xl transition-all duration-300 cursor-pointer group">
              <div className="relative">
                <Zap className="w-5 h-5 group-hover:animate-bounce text-yellow-500" />
                <div className="absolute inset-0 bg-yellow-400 rounded-full animate-ping opacity-30"></div>
              </div>
              <span className="bg-gradient-to-r from-blue-800 via-purple-800 to-indigo-800 bg-clip-text text-transparent font-bold">
                {t('hero.badge')}
              </span>
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
              </div>
            </div>
            
            {/* Enhanced typewriter heading */}
            <h1 className="text-4xl md:text-6xl font-black text-gray-900 mb-6 relative leading-tight">
              <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
                {typedText}
              </span>
              <span className="animate-pulse text-blue-600">|</span>
              <br />
              <span className="text-3xl md:text-5xl bg-gradient-to-r from-gray-800 via-gray-700 to-gray-600 bg-clip-text text-transparent">
                {t('hero.subtitle')}
              </span>
            </h1>
            
            <p className="text-lg md:text-xl text-gray-600 mb-8 max-w-4xl mx-auto leading-relaxed">
              {t('hero.description')}
            </p>

            {/* Enhanced CTA buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-10">
              <Button 
                asChild 
                size="lg" 
                className="relative bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 hover:from-blue-700 hover:via-purple-700 hover:to-indigo-700 text-lg px-8 py-4 rounded-full shadow-2xl hover:shadow-blue-500/25 transform hover:scale-105 transition-all duration-300 group overflow-hidden"
              >
                <Link href="/signup">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                  <span className="relative flex items-center font-bold">
                    <Zap className="mr-2 w-5 h-5 group-hover:animate-spin" />
                    {t('hero.cta.primary')}
                    <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-2 transition-transform" />
                  </span>
                </Link>
              </Button>
              
              <Button 
                asChild 
                variant="outline" 
                size="lg" 
                className="text-lg px-8 py-4 rounded-full border-2 border-gray-300 hover:border-blue-500 hover:text-blue-600 hover:shadow-xl transition-all duration-300 group bg-white/80 backdrop-blur-sm"
              >
                <Link href="#demo">
                  <div className="flex items-center">
                    <div className="relative mr-2">
                      <Play className="w-5 h-5 group-hover:scale-110 transition-transform" />
                      <div className="absolute inset-0 bg-blue-500 rounded-full animate-ping opacity-20 group-hover:opacity-40"></div>
                    </div>
                    <span className="font-semibold">{t('hero.cta.secondary')}</span>
                  </div>
                </Link>
              </Button>
            </div>

            {/* Enhanced trust indicators */}
            <div className="flex flex-wrap justify-center gap-4 text-sm text-gray-700 mb-8">
              {[
                { icon: CheckCircle, text: t('hero.trust.freeTrial'), color: 'text-green-500' },
                { icon: Shield, text: t('hero.trust.security'), color: 'text-blue-500' },
                { icon: Award, text: t('hero.trust.accuracy'), color: 'text-purple-500' },
                { icon: Users, text: t('hero.trust.customers'), color: 'text-orange-500' }
              ].map((item, index) => (
                <div key={index} className="flex items-center gap-2 px-4 py-2 bg-white/80 rounded-full backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300 group cursor-pointer border border-gray-100">
                  <item.icon className={`w-4 h-4 ${item.color} group-hover:scale-110 transition-transform`} />
                  <span className="font-medium">{item.text}</span>
                </div>
              ))}
            </div>

            {/* Enhanced stats counter */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-5xl mx-auto">
              {stats.map((stat, index) => {
                const IconComponent = stat.icon
                return (
                  <div 
                    key={index}
                    className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 group cursor-pointer border border-gray-100/50"
                    style={{ animationDelay: `${index * 300}ms` }}
                  >
                    <div className="flex flex-col items-center space-y-3">
                      <div className={`p-3 bg-gradient-to-br ${stat.color} rounded-xl text-white group-hover:scale-110 transition-transform shadow-lg`}>
                        <IconComponent className="w-6 h-6" />
                      </div>
                      <div className="text-center">
                        <div className="text-2xl md:text-3xl font-black text-gray-900 group-hover:text-blue-600 transition-colors mb-1">
                          {stat.number}
                        </div>
                        <div className="text-xs text-gray-600 font-semibold mb-1">{stat.label}</div>
                        <div className="text-xs text-gray-500">{stat.description}</div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Enhanced Benefits Section */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-4">
              Why Businesses Love Us
            </h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Join thousands of successful businesses who have revolutionized their GST compliance
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {benefits.map((benefit, index) => (
              <Card 
                key={index} 
                className="group hover:shadow-2xl transition-all duration-500 border-0 bg-white/90 backdrop-blur-sm hover:scale-105 transform"
              >
                <CardHeader className="text-center pb-3">
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl mb-3 shadow-lg group-hover:scale-110 transition-transform duration-300">
                    <benefit.icon className="w-6 h-6 text-white" />
                  </div>
                  <CardTitle className="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                    {benefit.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-gray-600 text-center leading-relaxed mb-3 text-sm">
                    {benefit.description}
                  </CardDescription>
                  <div className="space-y-1">
                    {benefit.details.map((detail, detailIndex) => (
                      <div key={detailIndex} className="flex items-center space-x-2 text-xs text-gray-600">
                        <CheckCircle className="w-3 h-3 text-green-500 flex-shrink-0" />
                        <span>{detail}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Enhanced Features Section */}
      <section id="features" className="py-16 px-4 bg-gradient-to-b from-white to-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-4">
              {t('features.title')}
            </h2>
            <p className="text-lg text-gray-600 max-w-4xl mx-auto leading-relaxed">
              {t('features.subtitle')}
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-10">
            {features.map((feature, index) => (
              <Card 
                key={index} 
                className={`group hover:shadow-2xl transition-all duration-700 border-0 bg-white/90 backdrop-blur-sm hover:scale-105 transform ${
                  isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-20'
                }`}
                style={{ transitionDelay: `${index * 150}ms` }}
              >
                <CardHeader className="text-center pb-4">
                  <div className={`inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br ${feature.color} rounded-2xl mb-4 shadow-xl group-hover:scale-110 transition-transform duration-300`}>
                    <feature.icon className="w-8 h-8 text-white" />
                  </div>
                  <CardTitle className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors mb-3">
                    {feature.title}
                  </CardTitle>
                  <CardDescription className="text-gray-600 text-center leading-relaxed text-sm">
                    {feature.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {feature.benefits.map((benefit, benefitIndex) => (
                      <div key={benefitIndex} className="flex items-center space-x-2">
                        <CheckCircle className="w-3 h-3 text-green-500 flex-shrink-0" />
                        <span className="text-xs text-gray-600">{benefit}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Enhanced How It Works Section */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-4">{t('howItWorks.title')}</h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto leading-relaxed">
              {t('howItWorks.subtitle')}
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-12">
            {steps.map((step, index) => (
              <div 
                key={index}
                className={`relative text-center transform transition-all duration-1000 ${
                  isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-20'
                }`}
                style={{ transitionDelay: `${index * 300}ms` }}
              >
                {/* Connection line */}
                {index < steps.length - 1 && (
                  <div className="hidden md:block absolute top-20 left-1/2 w-full h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-indigo-500 transform translate-x-12 rounded-full"></div>
                )}
                
                <div className="relative bg-white p-8 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-500 border border-gray-100 group hover:scale-105">
                  {/* Icon container */}
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 via-purple-600 to-indigo-600 rounded-2xl mb-6 shadow-xl relative z-10 group-hover:scale-110 transition-transform">
                    <step.icon className="w-8 h-8 text-white" />
                  </div>
                  
                  {/* Step number */}
                  <div className="absolute -top-4 -right-4 w-12 h-12 bg-gradient-to-br from-yellow-400 via-orange-500 to-red-500 rounded-full flex items-center justify-center text-white font-black text-lg shadow-xl group-hover:scale-110 transition-transform">
                    {step.step}
                  </div>
                  
                  <h3 className="text-xl font-bold text-gray-900 mb-4">{step.title}</h3>
                  <p className="text-gray-600 leading-relaxed text-sm mb-4">{step.description}</p>
                  
                  <div className="space-y-2">
                    {step.details.map((detail, detailIndex) => (
                      <div key={detailIndex} className="flex items-center justify-center space-x-2">
                        <CheckCircle className="w-3 h-3 text-green-500" />
                        <span className="text-xs text-gray-600 font-medium">{detail}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Enhanced Testimonials Section */}
      <section className="py-16 px-4 bg-gradient-to-br from-blue-50 via-purple-50 to-indigo-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-4">
              {t('testimonials.title')}
            </h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto leading-relaxed">
              {t('testimonials.subtitle')}
            </p>
          </div>

          <div className="relative max-w-5xl mx-auto">
            <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-2xl overflow-hidden">
              <CardContent className="p-8">
                <div className="text-center">
                  <div className="flex justify-center mb-6">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-6 h-6 text-yellow-400 fill-current" />
                    ))}
                  </div>
                  
                  <blockquote className="text-xl md:text-2xl font-medium text-gray-900 mb-8 leading-relaxed italic">
                    "{testimonials[currentTestimonial].comment}"
                  </blockquote>
                  
                  <div className="flex items-center justify-center gap-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-500 via-purple-600 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg">
                      {testimonials[currentTestimonial].image}
                    </div>
                    <div className="text-left">
                      <div className="font-bold text-gray-900 text-lg mb-1">{testimonials[currentTestimonial].name}</div>
                      <div className="text-gray-600 text-sm mb-1">{testimonials[currentTestimonial].business}</div>
                      <div className="text-gray-500 text-xs">{testimonials[currentTestimonial].location}</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-center mt-6 gap-3">
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentTestimonial(index)}
                  className={`w-4 h-4 rounded-full transition-all duration-300 ${
                    index === currentTestimonial 
                      ? 'bg-blue-600 scale-125 shadow-lg' 
                      : 'bg-gray-300 hover:bg-gray-400'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Enhanced Supported Returns Section */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-4">
            {t('supportedReturns.title')}
          </h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto mb-12 leading-relaxed">
            {t('supportedReturns.subtitle')}
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {supportedReturns.map((returnItem, index) => (
              <div 
                key={index}
                className={`group p-6 bg-gradient-to-br from-gray-50 to-white rounded-2xl hover:from-blue-50 hover:to-purple-50 transition-all duration-500 transform hover:scale-105 shadow-lg hover:shadow-xl ${
                  isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-20'
                }`}
                style={{ transitionDelay: `${index * 150}ms` }}
              >
                <div className="flex flex-col items-center space-y-3">
                  <FileText className="w-8 h-8 text-blue-600 group-hover:scale-110 transition-transform" />
                  <div className="font-black text-lg text-gray-900 group-hover:text-blue-600 transition-colors">
                    {returnItem.type}
                  </div>
                  <div className="font-semibold text-sm text-gray-700 text-center">
                    {returnItem.name}
                  </div>
                  <div className="text-xs text-gray-500 text-center leading-relaxed mb-2">
                    {returnItem.description}
                  </div>
                  <div className="flex space-x-3 text-xs text-gray-400">
                    <div className="flex items-center space-x-1">
                      <Clock className="w-3 h-3" />
                      <span>{returnItem.frequency}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Target className="w-3 h-3" />
                      <span>{returnItem.complexity}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Enhanced Pricing Section */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Choose the perfect plan for your business size and requirements
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {pricingPlans.map((plan, index) => (
              <Card 
                key={index}
                className={`relative group hover:shadow-2xl transition-all duration-500 border-0 bg-white hover:scale-105 transform ${
                  plan.popular ? 'ring-4 ring-purple-500 ring-opacity-50' : ''
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-2 text-sm font-bold">
                      Most Popular
                    </Badge>
                  </div>
                )}
                
                <CardHeader className="text-center pb-6">
                  <div className={`inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br ${plan.color} rounded-xl mb-4 shadow-xl group-hover:scale-110 transition-transform duration-300`}>
                    <Zap className="w-8 h-8 text-white" />
                  </div>
                  
                  <CardTitle className="text-2xl font-bold text-gray-900 mb-2">
                    {plan.name}
                  </CardTitle>
                  
                  <div className="mb-3">
                    <span className="text-3xl font-black text-gray-900">{plan.price}</span>
                    <span className="text-gray-600 text-lg">{plan.period}</span>
                  </div>
                  
                  <CardDescription className="text-gray-600 text-sm mb-2">
                    {plan.description}
                  </CardDescription>
                  
                  {plan.savings && (
                    <div className="text-green-600 font-semibold text-sm">
                      {plan.savings}
                    </div>
                  )}
                </CardHeader>
                
                <CardContent className="pb-6">
                  <div className="space-y-3 mb-6">
                    {plan.features.map((feature, featureIndex) => (
                      <div key={featureIndex} className="flex items-center space-x-2">
                        <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                        <span className="text-sm text-gray-700">{feature}</span>
                      </div>
                    ))}
                  </div>
                  
                  <Button 
                    asChild 
                    size="lg" 
                    className={`w-full bg-gradient-to-r ${plan.color} hover:opacity-90 text-white font-bold py-3 rounded-xl shadow-xl hover:shadow-2xl transition-all duration-300 group-hover:scale-105`}
                  >
                    <Link href="/signup">
                      Choose {plan.name}
                      <ArrowRight className="ml-2 w-4 h-4" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Enhanced Expert Support Section */}
      <section className="py-16 px-4 bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700 text-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-black mb-4">
              {t('expertSupport.title')}
            </h2>
            <p className="text-lg max-w-4xl mx-auto leading-relaxed opacity-90">
              {t('expertSupport.subtitle')}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              {
                icon: Phone,
                title: t('expertSupport.phone.title'),
                description: t('expertSupport.phone.description'),
                contact: t('expertSupport.phone.contact'),
                color: "from-green-400 to-emerald-500",
                features: ["24/7 availability", "Dedicated GST experts", "Multilingual support"]
              },
              {
                icon: Mail,
                title: t('expertSupport.email.title'),
                description: t('expertSupport.email.description'),
                contact: t('expertSupport.email.contact'),
                color: "from-blue-400 to-cyan-500",
                features: ["Detailed responses", "Documentation included", "Priority handling"]
              },
              {
                icon: MessageSquare,
                title: t('expertSupport.chat.title'),
                description: t('expertSupport.chat.description'),
                contact: t('expertSupport.chat.contact'),
                color: "from-purple-400 to-pink-500",
                features: ["Instant responses", "Screen sharing", "File sharing"]
              }
            ].map((support, index) => (
              <Card 
                key={index}
                className="group bg-white/10 backdrop-blur-sm border-white/20 hover:bg-white/20 transition-all duration-500 hover:scale-105 transform"
              >
                <CardHeader className="text-center pb-6">
                  <div className={`inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br ${support.color} rounded-xl mb-4 shadow-xl group-hover:scale-110 transition-transform duration-300`}>
                    <support.icon className="w-8 h-8 text-white" />
                  </div>
                  
                  <CardTitle className="text-xl font-bold mb-3">
                    {support.title}
                  </CardTitle>
                  
                  <CardDescription className="text-white/80 text-sm leading-relaxed mb-4">
                    {support.description}
                  </CardDescription>
                  
                  <div className="text-white font-bold text-lg mb-3">
                    {support.contact}
                  </div>
                  
                  <div className="space-y-1">
                    {support.features.map((feature, featureIndex) => (
                      <div key={featureIndex} className="flex items-center space-x-2 text-xs text-white/70 justify-center">
                        <CheckCircle className="w-3 h-3 text-green-400 flex-shrink-0" />
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Enhanced Call to Action Section */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-7xl mx-auto text-center">
          <div className={`transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-16'}`}>
            <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-6 leading-tight">
              {t('cta.title')}
            </h2>
            
            <p className="text-lg md:text-xl text-gray-600 max-w-4xl mx-auto mb-8 leading-relaxed">
              {t('cta.subtitle')}
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Button 
                asChild 
                size="lg" 
                className="relative bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 hover:from-blue-700 hover:via-purple-700 hover:to-indigo-700 text-lg px-12 py-6 rounded-full shadow-2xl hover:shadow-blue-500/25 transform hover:scale-105 transition-all duration-300 group overflow-hidden"
              >
                <Link href="/signup">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                  <span className="relative flex items-center font-black">
                    <Zap className="mr-3 w-6 h-6 group-hover:animate-spin" />
                    {t('cta.button')}
                    <ArrowRight className="ml-3 w-6 h-6 group-hover:translate-x-2 transition-transform" />
                  </span>
                </Link>
              </Button>
            </div>

            {/* Enhanced guarantee badges */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              {[
                {
                  icon: Shield,
                  title: "30-Day Money Back",
                  description: "Not satisfied? Get full refund"
                },
                {
                  icon: ShieldCheck,
                  title: "100% Secure",
                  description: "Bank-grade security & encryption"
                },
                {
                  icon: Award,
                  title: "Expert Support",
                  description: "Dedicated GST specialists"
                }
              ].map((guarantee, index) => (
                <div key={index} className="flex flex-col items-center space-y-3 p-6 bg-gray-50 rounded-2xl hover:bg-gray-100 transition-all duration-300 group cursor-pointer">
                  <guarantee.icon className="w-10 h-10 text-blue-600 group-hover:scale-110 transition-transform" />
                  <div className="text-lg font-bold text-gray-900">{guarantee.title}</div>
                  <div className="text-gray-600 text-center text-sm">{guarantee.description}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Enhanced Footer */}
      <footer className="bg-gray-900 text-white pt-16 pb-8 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div className="space-y-6">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 via-purple-600 to-indigo-600 rounded-xl flex items-center justify-center">
                  <FileText className="w-6 h-6 text-white" />
                </div>
                <span className="text-2xl font-black">Smart GST</span>
              </div>
              <p className="text-gray-400 leading-relaxed max-w-sm">
                {t('footer.description')}
              </p>
              <div className="flex space-x-4">
                {[Globe, Smartphone, Mail, Phone].map((Icon, index) => (
                  <div key={index} className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-blue-600 transition-colors cursor-pointer group">
                    <Icon className="w-5 h-5 group-hover:scale-110 transition-transform" />
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-6">
              <h4 className="text-xl font-bold">{t('footer.product.title')}</h4>
              <ul className="space-y-3 text-gray-400">
                {[
                  t('footer.product.features'),
                  t('footer.product.pricing'),
                  t('footer.product.integrations'),
                  t('footer.product.api')
                ].map((item, index) => (
                  <li key={index}>
                    <Link href="#" className="hover:text-white transition-colors flex items-center group">
                      <ChevronRight className="w-4 h-4 mr-2 group-hover:translate-x-1 transition-transform" />
                      {item}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-6">
              <h4 className="text-xl font-bold">{t('footer.support.title')}</h4>
              <ul className="space-y-3 text-gray-400">
                {[
                  t('footer.support.help'),
                  t('footer.support.documentation'),
                  t('footer.support.training'),
                  t('footer.support.contact')
                ].map((item, index) => (
                  <li key={index}>
                    <Link href="#" className="hover:text-white transition-colors flex items-center group">
                      <ChevronRight className="w-4 h-4 mr-2 group-hover:translate-x-1 transition-transform" />
                      {item}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-6">
              <h4 className="text-xl font-bold">{t('footer.company.title')}</h4>
              <ul className="space-y-3 text-gray-400">
                {[
                  t('footer.company.about'),
                  t('footer.company.careers'),
                  t('footer.company.blog'),
                  t('footer.company.press')
                ].map((item, index) => (
                  <li key={index}>
                    <Link href="#" className="hover:text-white transition-colors flex items-center group">
                      <ChevronRight className="w-4 h-4 mr-2 group-hover:translate-x-1 transition-transform" />
                      {item}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
              <div className="text-gray-400 text-sm">
                © 2024 Smart GST Filing. {t('footer.rights')}
              </div>
              <div className="flex space-x-6 text-sm text-gray-400">
                <Link href="#" className="hover:text-white transition-colors">{t('footer.legal.privacy')}</Link>
                <Link href="#" className="hover:text-white transition-colors">{t('footer.legal.terms')}</Link>
                <Link href="#" className="hover:text-white transition-colors">{t('footer.legal.cookies')}</Link>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
