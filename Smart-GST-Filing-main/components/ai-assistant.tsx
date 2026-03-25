"use client"

import { useEffect, useRef, useState } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { MessageSquare, Send, X, Bot, User } from "lucide-react"

interface Message {
  id: string
  type: "user" | "bot"
  content: string
  timestamp: Date
}

type ChatApiMessage = {
  role: "user" | "assistant"
  content: string
}

type AssistantProvider = "gemini" | "realtime" | "fallback" | "unknown"

export function AIAssistant() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      type: "bot",
      content: "Hello! I'm your Smart Assistant. I can help with GST and general questions. How can I help you today?",
      timestamp: new Date(),
    },
  ])
  const [inputValue, setInputValue] = useState("")
  const [isSending, setIsSending] = useState(false)
  const [assistantProvider, setAssistantProvider] = useState<AssistantProvider>("fallback")
  const [assistantModel, setAssistantModel] = useState("rules")
  const [assistantStatusNote, setAssistantStatusNote] = useState("")
  const bottomAnchorRef = useRef<HTMLDivElement | null>(null)

  const getProviderLabel = (provider: AssistantProvider): string => {
    if (provider === "gemini") return "Gemini"
    if (provider === "realtime") return "Realtime"
    if (provider === "fallback") return "Fallback"
    return "Unknown"
  }

  const toStatusNote = (value: string): string => {
    const text = value.trim()
    if (!text) return ""
    return text.length > 90 ? `${text.slice(0, 87)}...` : text
  }

  const toChatApiMessages = (history: Message[]): ChatApiMessage[] =>
    history.map((message) => ({
      role: message.type === "user" ? "user" : "assistant",
      content: message.content,
    }))

  useEffect(() => {
    if (searchParams.get('assistant') !== 'open') {
      return
    }

    setIsOpen(true)

    const params = new URLSearchParams(searchParams.toString())
    params.delete('assistant')
    const nextQuery = params.toString()
    router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname)
  }, [pathname, router, searchParams])

  useEffect(() => {
    if (!isOpen) return

    bottomAnchorRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "end",
    })
  }, [messages, isSending, isOpen])

  const handleSendMessage = async () => {
    const trimmedInput = inputValue.trim()
    if (!trimmedInput || isSending) return

    const userMessage: Message = {
      id: Date.now().toString(),
      type: "user",
      content: trimmedInput,
      timestamp: new Date(),
    }

    const updatedHistory = [...messages, userMessage]
    setMessages(updatedHistory)
    setInputValue("")
    setIsSending(true)

    try {
      const response = await fetch("/api/gst-assistant", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: toChatApiMessages(updatedHistory),
        }),
      })

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}))
        throw new Error(payload?.error || "Failed to get AI response")
      }

      const payload = await response.json()
      const replyText = typeof payload?.reply === "string" && payload.reply.trim().length
        ? payload.reply.trim()
        : "I could not generate an answer. Please try again."
      const provider: AssistantProvider = payload?.provider || "unknown"
      setAssistantProvider(provider)
      setAssistantModel(typeof payload?.model === "string" ? payload.model : "unknown")

      const providerErrors = Array.isArray(payload?.meta?.providerErrors)
        ? payload.meta.providerErrors.filter((item: unknown) => typeof item === "string")
        : []
      if (provider === "fallback" && providerErrors.length > 0) {
        setAssistantStatusNote(toStatusNote(providerErrors[0]))
      } else {
        setAssistantStatusNote("")
      }

      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: "bot",
        content: replyText,
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, botMessage])
    } catch (error) {
      setAssistantProvider("fallback")
      setAssistantModel("rules")
      setAssistantStatusNote(toStatusNote("Request failed"))

      const fallbackMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: "bot",
        content:
          "I am unable to answer right now. Please try again in a moment. You can ask GST or general questions, and I will try again.",
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, fallbackMessage])
      console.error("Assistant error:", error)
    } finally {
      setIsSending(false)
    }
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
    <div className="fixed bottom-6 right-6 w-[360px] h-[460px] min-w-[300px] min-h-[340px] max-w-[92vw] max-h-[85vh] resize overflow-hidden shadow-xl z-50 flex flex-col rounded-2xl bg-white border border-gray-200">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-3 pb-2 border-b border-gray-100 rounded-t-2xl bg-white">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center">
            <MessageSquare className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="font-semibold text-base text-gray-900 leading-tight">Smart Assistant</div>
            <div className="text-xs text-green-600 font-medium flex items-center gap-1">● Online ({getProviderLabel(assistantProvider)})</div>
            <div className="text-[11px] text-gray-500 leading-tight">
              Engine: {assistantModel}
              {assistantStatusNote ? ` | ${assistantStatusNote}` : ""}
            </div>
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
                    <div className="bg-gray-100 text-gray-900 rounded-xl px-4 py-2 text-xs leading-relaxed shadow-sm break-words" style={{minWidth:'40px'}}>
                      {message.content}
                    </div>
                  </div>
                ) : (
                  <div className="flex items-end gap-2 max-w-[90%] flex-row-reverse">
                    <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
                      <User className="w-4 h-4 text-white" />
                    </div>
                    <div className="bg-blue-600 text-white rounded-xl px-4 py-2 text-xs leading-relaxed shadow-sm break-words" style={{minWidth:'40px'}}>
                      {message.content}
                    </div>
                  </div>
                )}
              </div>
            ))}
            <div ref={bottomAnchorRef} />
          </div>
        </ScrollArea>
        {/* Input Area */}
        <div className="px-3 pb-3 pt-2 bg-white border-t border-gray-100">
          <div className="flex items-center gap-2 rounded-xl bg-gray-50 px-2 py-1 border border-gray-200">
            <Input
              placeholder="Ask anything..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault()
                  handleSendMessage()
                }
              }}
              className="flex-1 border-none bg-transparent focus:ring-0 focus:outline-none text-xs"
              disabled={isSending}
            />
            {/* Optionally add a mic icon here for voice input */}
            <Button onClick={handleSendMessage} size="icon" className="bg-blue-600 hover:bg-blue-700 rounded-xl" disabled={isSending}>
              <Send className="w-4 h-4" />
            </Button>
          </div>
          {isSending && <p className="text-xs text-gray-500 mt-2">Smart Assistant is typing...</p>}
        </div>
      </div>
    </div>
  )
}
