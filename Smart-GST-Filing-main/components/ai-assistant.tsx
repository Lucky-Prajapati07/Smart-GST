"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { MessageSquare, Send, X, Bot, User } from "lucide-react"

interface Message {
  id: string
  type: "user" | "bot"
  content: string
  timestamp: Date
}

export function AIAssistant() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      type: "bot",
      content: "Hello! I'm your GST assistant. How can I help you today?",
      timestamp: new Date(),
    },
  ])
  const [inputValue, setInputValue] = useState("")

  const handleSendMessage = () => {
    if (!inputValue.trim()) return

    const userMessage: Message = {
      id: Date.now().toString(),
      type: "user",
      content: inputValue,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInputValue("")

    // Simulate bot response
    setTimeout(() => {
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: "bot",
        content: getBotResponse(inputValue),
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, botMessage])
    }, 1000)
  }

  const getBotResponse = (userInput: string): string => {
    const input = userInput.toLowerCase()

    if (input.includes("gst") && input.includes("rate")) {
      return "GST rates in India are: 0%, 5%, 12%, 18%, and 28%. The rate depends on the type of goods or services. Would you like me to help you find the rate for a specific item?"
    }

    if (input.includes("invoice")) {
      return "I can help you with invoice-related queries! You can create invoices, upload them for OCR processing, or track their status. What specific help do you need with invoices?"
    }

    if (input.includes("filing") || input.includes("return")) {
      return "For GST filing, you need to file GSTR-1 (by 11th), GSTR-3B (by 20th), and annual returns. I can guide you through the process. Which return do you need help with?"
    }

    if (input.includes("due date") || input.includes("deadline")) {
      return "GST filing due dates: GSTR-1 - 11th of next month, GSTR-3B - 20th of next month, GSTR-9 (Annual) - 31st December. Need help with any specific return?"
    }

    return "I understand you're asking about GST compliance. I can help with GST rates, invoice management, filing returns, due dates, and general compliance questions. Could you please be more specific about what you need help with?"
  }

  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg bg-blue-600 hover:bg-blue-700 z-50"
        size="icon"
      >
        <MessageSquare className="w-6 h-6" />
      </Button>
    )
  }

  return (
    <div className="fixed bottom-6 right-6 w-80 h-[430px] shadow-xl z-50 flex flex-col rounded-2xl bg-white border border-gray-200">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-3 pb-2 border-b border-gray-100 rounded-t-2xl bg-white">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center">
            <MessageSquare className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="font-semibold text-base text-gray-900 leading-tight">GST Assistant</div>
            <div className="text-xs text-green-600 font-medium flex items-center gap-1">● Online</div>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} className="h-7 w-7">
          <X className="w-4 h-4" />
        </Button>
      </div>
      {/* Chat Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <ScrollArea className="flex-1 px-3 py-4">
          <div className="space-y-3">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex w-full ${message.type === "user" ? "justify-end" : "justify-start"}`}
              >
                {message.type === "bot" ? (
                  <div className="flex items-end gap-2 max-w-[90%]">
                    <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                      <Bot className="w-4 h-4 text-blue-600" />
                    </div>
                    <div className="bg-gray-100 text-gray-900 rounded-xl px-4 py-2 text-sm leading-relaxed shadow-sm break-words" style={{minWidth:'40px'}}>
                      {message.content}
                    </div>
                  </div>
                ) : (
                  <div className="flex items-end gap-2 max-w-[90%] flex-row-reverse">
                    <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
                      <User className="w-4 h-4 text-white" />
                    </div>
                    <div className="bg-blue-600 text-white rounded-xl px-4 py-2 text-sm leading-relaxed shadow-sm break-words" style={{minWidth:'40px'}}>
                      {message.content}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>
        {/* Input Area */}
        <div className="px-3 pb-3 pt-2 bg-white border-t border-gray-100">
          <div className="flex items-center gap-2 rounded-xl bg-gray-50 px-2 py-1 border border-gray-200">
            <Input
              placeholder="Ask about GST..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
              className="flex-1 border-none bg-transparent focus:ring-0 focus:outline-none text-sm"
            />
            {/* Optionally add a mic icon here for voice input */}
            <Button onClick={handleSendMessage} size="icon" className="bg-blue-600 hover:bg-blue-700 rounded-xl">
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
