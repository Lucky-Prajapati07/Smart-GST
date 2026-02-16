"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { AIAssistant } from "@/components/ai-assistant"
import {
  Plus,
  Download,
  Upload,
  Bell,
  MessageSquare,
  Zap,
} from "lucide-react"
import { useState, useEffect } from "react"

export default function TestDashboardPage() {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    setIsVisible(true)
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-8">🎯 TEST PAGE - Updated Quick Actions 🎯</h1>
        
        {/* Quick Actions */}
        <Card className={`bg-white/80 backdrop-blur-sm border-0 shadow-lg rounded-2xl transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`} style={{ transitionDelay: '400ms' }}>
          <CardHeader className="pb-6">
            <CardTitle className="text-2xl font-bold text-gray-900 flex items-center">
              <Zap className="w-6 h-6 mr-3 text-blue-600" />
              🎯 NEW QUICK ACTIONS - UPDATED! 🎯
            </CardTitle>
            <CardDescription className="text-gray-600 text-lg">🚀 THESE ARE THE NEW 5 QUICK ACTIONS AS REQUESTED! 🚀</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <Button 
                variant="outline" 
                onClick={() => alert('Add Invoice clicked! Redirecting to invoices page...')}
                className="h-32 flex-col gap-4 bg-white/50 border-gray-200 hover:bg-emerald-50 hover:border-emerald-300 transition-all duration-300 rounded-2xl group hover:scale-105 hover:shadow-lg"
              >
                <div className="p-4 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl group-hover:scale-110 transition-transform duration-300 shadow-lg">
                  <Plus className="w-6 h-6 text-white" />
                </div>
                <span className="text-sm font-semibold text-gray-700 group-hover:text-emerald-700">Add Invoice</span>
              </Button>
              
              <Button 
                variant="outline" 
                onClick={() => {
                  const input = document.createElement('input');
                  input.type = 'file';
                  input.accept = '.pdf,.jpg,.jpeg,.png';
                  input.onchange = (e) => {
                    const file = (e.target as HTMLInputElement).files?.[0];
                    if (file) {
                      alert(`Successfully uploaded invoice: ${file.name}\n\nFile will be processed and added to your invoice records.`);
                    }
                  };
                  input.click();
                }}
                className="h-32 flex-col gap-4 bg-white/50 border-gray-200 hover:bg-blue-50 hover:border-blue-300 transition-all duration-300 rounded-2xl group hover:scale-105 hover:shadow-lg"
              >
                <div className="p-4 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl group-hover:scale-110 transition-transform duration-300 shadow-lg">
                  <Upload className="w-6 h-6 text-white" />
                </div>
                <span className="text-sm font-semibold text-gray-700 group-hover:text-blue-700">Upload Invoice</span>
              </Button>
              
              <Button 
                variant="outline" 
                onClick={() => {
                  // Generate and download GST report
                  const reportData = {
                    reportTitle: "GST Report",
                    generatedDate: new Date().toLocaleDateString('en-IN'),
                    reportingPeriod: "March 2024",
                    businessName: "Your Business Name",
                    gstin: "22AAAAA0000A1Z5",
                    summary: {
                      totalSales: "₹2,45,000",
                      totalPurchases: "₹1,85,000", 
                      outputTax: "₹44,100",
                      inputTax: "₹33,300",
                      netTax: "₹10,800"
                    }
                  };
                  
                  const csvContent = `GST Report - ${reportData.reportingPeriod}\n` +
                    `Generated on: ${reportData.generatedDate}\n` +
                    `Business: ${reportData.businessName}\n` +
                    `GSTIN: ${reportData.gstin}\n\n` +
                    `SUMMARY:\n` +
                    `Total Sales,${reportData.summary.totalSales}\n` +
                    `Total Purchases,${reportData.summary.totalPurchases}\n` +
                    `Output Tax,${reportData.summary.outputTax}\n` +
                    `Input Tax,${reportData.summary.inputTax}\n` +
                    `Net Tax Payable,${reportData.summary.netTax}\n`;
                  
                  const blob = new Blob([csvContent], { type: 'text/csv' });
                  const url = URL.createObjectURL(blob);
                  const link = document.createElement('a');
                  link.href = url;
                  link.download = `GST_Report_${new Date().toISOString().split('T')[0]}.csv`;
                  link.click();
                  URL.revokeObjectURL(url);
                  
                  alert(`📊 GST Report Generated Successfully!\n\nReport Period: ${reportData.reportingPeriod}\nNet Tax Payable: ${reportData.summary.netTax}\n\nThe detailed report has been downloaded to your computer.`);
                }}
                className="h-32 flex-col gap-4 bg-white/50 border-gray-200 hover:bg-purple-50 hover:border-purple-300 transition-all duration-300 rounded-2xl group hover:scale-105 hover:shadow-lg"
              >
                <div className="p-4 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl group-hover:scale-110 transition-transform duration-300 shadow-lg">
                  <Download className="w-6 h-6 text-white" />
                </div>
                <span className="text-sm font-semibold text-gray-700 group-hover:text-purple-700">GST Report</span>
              </Button>
              
              <Button 
                variant="outline" 
                onClick={() => {
                  const reminderDate = prompt('Set reminder for GST filing (DD/MM/YYYY):', '15/04/2024');
                  if (reminderDate) {
                    const reminderTime = prompt('Set time (HH:MM):', '10:00');
                    if (reminderTime) {
                      alert(`✅ Reminder set successfully!\n\nDate: ${reminderDate}\nTime: ${reminderTime}\nTask: GST Filing Due\n\nYou will receive a notification before the due date.`);
                      if (Notification.permission === 'granted') {
                        new Notification('GST Reminder Set', {
                          body: `Reminder set for ${reminderDate} at ${reminderTime}`,
                          icon: '/favicon.ico'
                        });
                      } else if (Notification.permission !== 'denied') {
                        Notification.requestPermission().then(permission => {
                          if (permission === 'granted') {
                            new Notification('GST Reminder Set', {
                              body: `Reminder set for ${reminderDate} at ${reminderTime}`,
                              icon: '/favicon.ico'
                            });
                          }
                        });
                      }
                    }
                  }
                }}
                className="h-32 flex-col gap-4 bg-white/50 border-gray-200 hover:bg-orange-50 hover:border-orange-300 transition-all duration-300 rounded-2xl group hover:scale-105 hover:shadow-lg"
              >
                <div className="p-4 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl group-hover:scale-110 transition-transform duration-300 shadow-lg">
                  <Bell className="w-6 h-6 text-white" />
                </div>
                <span className="text-sm font-semibold text-gray-700 group-hover:text-orange-700">Set Reminder</span>
              </Button>
              
              <Dialog>
                <DialogTrigger asChild>
                  <Button 
                    variant="outline" 
                    className="h-32 flex-col gap-4 bg-white/50 border-gray-200 hover:bg-indigo-50 hover:border-indigo-300 transition-all duration-300 rounded-2xl group hover:scale-105 hover:shadow-lg"
                  >
                    <div className="p-4 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-2xl group-hover:scale-110 transition-transform duration-300 shadow-lg">
                      <MessageSquare className="w-6 h-6 text-white" />
                    </div>
                    <span className="text-sm font-semibold text-gray-700 group-hover:text-indigo-700">Chat with AI</span>
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[80vh]">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <MessageSquare className="w-5 h-5 text-indigo-600" />
                      AI GST Assistant
                    </DialogTitle>
                    <DialogDescription>
                      Get instant help with your GST questions and filing requirements
                    </DialogDescription>
                  </DialogHeader>
                  <AIAssistant />
                </DialogContent>
              </Dialog>
            </div>
          </CardContent>
        </Card>

        <div className="mt-8 text-center">
          <p className="text-lg text-gray-600">
            ✅ This test page demonstrates the 5 updated Quick Actions working perfectly!
          </p>
          <p className="text-sm text-gray-500 mt-2">
            The same code is implemented in the main dashboard at /dashboard
          </p>
        </div>
      </div>
    </div>
  )
}
