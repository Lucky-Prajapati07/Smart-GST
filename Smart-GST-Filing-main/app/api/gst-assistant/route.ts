import { NextResponse } from "next/server"

type ChatRole = "user" | "assistant"

type ChatMessage = {
  role: ChatRole
  content: string
}

const IST_TIME_ZONE = "Asia/Kolkata"

function buildAssistantSystemPrompt(now: Date): string {
  const isoNow = now.toISOString()
  const nowInIst = new Intl.DateTimeFormat("en-IN", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
    timeZone: IST_TIME_ZONE,
  }).format(now)

  return [
    "You are Smart Assistant for business users.",
    "Answer clearly, accurately, and briefly unless the user asks for details.",
    "You can answer general questions across topics, not only GST.",
    "When the user asks GST questions, provide India-focused practical guidance for compliance, filing, invoices, ITC, and due dates.",
    "When rules can vary by case, mention assumptions and suggest verifying with latest official notifications.",
    "Do not invent legal citations, policy details, or portal actions.",
    `Current server datetime (ISO UTC): ${isoNow}.`,
    `Current India datetime (IST): ${nowInIst}.`,
    "If a user asks for today's date/day/time/current date, use the provided current datetime context and do not guess.",
    "If user asks for latest internet/live events, clearly say you may not have live browsing unless explicit source is provided.",
  ].join(" ")
}

function formatDateIst(date: Date): string {
  return new Intl.DateTimeFormat("en-IN", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
    timeZone: IST_TIME_ZONE,
  }).format(date)
}

function formatTimeIst(date: Date): string {
  return new Intl.DateTimeFormat("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
    timeZone: IST_TIME_ZONE,
  }).format(date)
}

function getRealtimeAnswer(userText: string, now: Date): string | null {
  const input = userText.toLowerCase()
  const compactInput = input.replace(/[^a-z0-9\s-]/g, " ").replace(/\s+/g, " ").trim()

  const asksDate = /\b(today|todays|current|now)\b/.test(compactInput) && /\b(date|day)\b/.test(compactInput)
  const asksTime = /\b(current time|time now|time)\b/.test(compactInput)

  if (asksDate && asksTime) {
    return `Today is ${formatDateIst(now)} and current time is ${formatTimeIst(now)} (IST).`
  }

  if (asksDate) {
    return `Today's date is ${formatDateIst(now)} (IST).`
  }

  if (asksTime) {
    return `Current time is ${formatTimeIst(now)} (IST) on ${formatDateIst(now)}.`
  }

  return null
}

function isGstQuery(input: string): boolean {
  return /\b(gst|igst|cgst|sgst|utgst|gstr|itc|hsn|sac|invoice|e-?invoice|reconciliation|input tax credit|tax slab)\b/i.test(input)
}

function trimHistory(messages: ChatMessage[]): ChatMessage[] {
  return messages
    .filter((m) => m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string")
    .map((m) => ({ role: m.role, content: m.content.trim().slice(0, 4000) }))
    .filter((m) => !!m.content)
    .slice(-12)
}

function fallbackReply(userText: string): string {
  const input = userText.toLowerCase()
  const compactInput = input.replace(/[^a-z0-9\s-]/g, " ").replace(/\s+/g, " ").trim()

  const realtimeAnswer = getRealtimeAnswer(userText, new Date())
  if (realtimeAnswer) return realtimeAnswer

  if (
    /\b(current|who is|who's|present)\b/.test(compactInput) &&
    /\b(president)\b/.test(compactInput) &&
    /\b(usa|us|united states|america)\b/.test(compactInput)
  ) {
    return "As of March 2026, the current President of the United States is Donald Trump."
  }

  if (/(^|\s)(hi|hello|hey|hii|namaste)(\s|$)/.test(input)) {
    return "Hello. I can help with general questions and GST topics. Ask me anything you want."
  }

  if (input.includes("how are you")) {
    return "I am doing well and ready to help. Ask me any question, including GST, business, or general topics."
  }

  if (input.includes("milk") && (input.includes("gst") || input.includes("rate"))) {
    return "For milk, GST treatment depends on product type and packing. Fresh/unprocessed milk is generally exempt (0%). Some processed or flavored milk products can attract GST (commonly 5% or higher based on classification). Share the exact product label/HSN and I can help you with a safer classification checklist."
  }

  if (/\bigst\b/.test(compactInput) || compactInput.includes("integrated gst")) {
    return "IGST (Integrated GST) is charged on inter-state supplies (seller and buyer in different states) and on imports. It is collected by the Central Government and later apportioned between Centre and destination state. For intra-state sales, CGST + SGST apply instead of IGST."
  }

  if (/\bcgst\b/.test(compactInput) || /\bsgst\b/.test(compactInput)) {
    return "CGST and SGST apply on intra-state supplies. Tax is split equally: half as CGST (Centre) and half as SGST (State). For inter-state transactions, IGST is usually charged instead."
  }

  if ((input.includes("gst") || input.includes("tax")) && input.includes("rate")) {
    return "Common GST slabs are 0%, 5%, 12%, 18%, and 28%, but the exact rate depends on HSN/SAC classification and product nature. Tell me the exact item/service name and if it is packed/branded/processed, and I will guide you with likely slab logic."
  }

  if (input.includes("gstr-1") || input.includes("gstr1")) {
    return "GSTR-1 is generally for outward supplies. Keep invoice details, B2B/B2C breakup, credit/debit notes, and amendments ready. If you want, I can give you a step-by-step filing checklist for your month or quarter."
  }

  if (input.includes("gstr-3b") || input.includes("gstr3b")) {
    return "For GSTR-3B, reconcile outward tax liability, eligible ITC, and cash/credit ledger balances before filing. A practical flow is: reconcile books -> verify ITC -> offset liability -> file and save ARN."
  }

  if (input.includes("itc")) {
    return "Input Tax Credit should be claimed only on eligible business purchases with valid tax invoices and compliance conditions. Reconcile with purchase records and vendor filing status before final claim."
  }

  if (input.includes("due") || input.includes("deadline")) {
    return "GST due dates depend on return type and filing frequency. Tell me your return type (for example GSTR-1 or GSTR-3B) and whether monthly or quarterly, and I will give the exact due-date logic."
  }

  if (input.includes("invoice")) {
    return "For GST invoices, ensure GSTIN, invoice number/date, place of supply, tax breakup (CGST/SGST/IGST), and HSN/SAC are correct. If you share your issue, I can help you validate line-by-line."
  }

  if (input.includes("reconcile") || input.includes("reconciliation")) {
    return "A practical GST reconciliation flow is: sales register vs GSTR-1, purchase register vs GSTR-2B, tax liability vs GSTR-3B, then fix mismatches before filing. I can provide a template checklist if you share your filing type."
  }

  if (input.includes("thank")) {
    return "You are welcome. If you want, ask your next GST question and I will answer step-by-step."
  }

  if (isGstQuery(compactInput)) {
    return `For \"${userText.trim()}\", I can help with a practical GST answer. Share your exact context (item/service, state type, return period, or invoice details), and I will give step-by-step guidance.`
  }

  return `I can answer general questions too. For \"${userText.trim()}\", please share a little more context so I can give a precise answer.`
}

async function askGemini(messages: ChatMessage[], systemPrompt: string) {
  const apiKey = process.env.GOOGLE_API_KEY
  if (!apiKey) return null

  const parsedTemperature = Number.parseFloat(process.env.GEMINI_TEMPERATURE || "0.15")
  const temperature = Number.isFinite(parsedTemperature)
    ? Math.min(Math.max(parsedTemperature, 0), 1)
    : 0.15

  const parsedMaxTokens = Number.parseInt(process.env.GEMINI_MAX_OUTPUT_TOKENS || "1000", 10)
  const maxOutputTokens = Number.isFinite(parsedMaxTokens)
    ? Math.min(Math.max(parsedMaxTokens, 256), 4096)
    : 1000

  const configuredModel = (process.env.GEMINI_MODEL || "").trim()
  const candidateModels = [
    configuredModel,
    "gemini-2.5-pro",
    "gemini-2.5-pro-latest",
    "gemini-2.5-flash",
    "gemini-2.5-flash-lite",
    "gemini-2.0-flash",
    "gemini-2.0-flash-lite",
    "gemini-2.0-flash-exp",
    "gemini-1.5-flash-latest",
    "gemini-1.5-pro-latest",
    "gemini-1.5-flash",
  ].filter((model, index, all) => !!model && all.indexOf(model) === index)

  const contents = [
    ...messages.map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    })),
  ]

  let lastError: string | null = null

  for (const model of candidateModels) {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemInstruction: {
            parts: [{ text: systemPrompt }],
          },
          contents,
          generationConfig: {
            temperature,
            topP: 0.9,
            maxOutputTokens,
          },
        }),
      },
    )

    if (!res.ok) {
      const err = await res.text()

      let parsedErrorMessage = ""
      try {
        const parsed = JSON.parse(err)
        parsedErrorMessage = parsed?.error?.message || ""
      } catch {
        parsedErrorMessage = ""
      }

      const conciseError = parsedErrorMessage || `HTTP ${res.status}`
      lastError = `Gemini API error (${res.status}) with model ${model}: ${conciseError}`

      // Rotate to next Gemini model on common availability/limit/transient failures.
      if (res.status === 404 || res.status === 429 || res.status === 500 || res.status === 503) {
        continue
      }

      throw new Error(lastError)
    }

    const data = await res.json()
    const text = data?.candidates?.[0]?.content?.parts?.map((p: any) => p?.text || "").join("\n").trim()

    if (!text) {
      lastError = `Gemini returned empty response for model ${model}`
      continue
    }

    return { text, provider: "gemini", model }
  }

  throw new Error(lastError || "No working Gemini model found")
}

function toClientProviderError(message: string): string {
  const normalized = message.toLowerCase()

  if (normalized.includes("429") || normalized.includes("quota") || normalized.includes("resource_exhausted")) {
    return "Gemini quota exceeded or rate-limited. Using fallback response."
  }

  if (normalized.includes("api key") || normalized.includes("permission") || normalized.includes("unauthorized")) {
    return "Gemini configuration/auth failed. Check API key and project access."
  }

  if (normalized.includes("404") || normalized.includes("not found") || normalized.includes("no working gemini model")) {
    return "Gemini model unavailable. Using fallback response."
  }

  return "Gemini is temporarily unavailable. Using fallback response."
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const incoming = Array.isArray(body?.messages) ? body.messages : []
    const messages = trimHistory(incoming)

    if (!messages.length) {
      return NextResponse.json({ error: "At least one message is required" }, { status: 400 })
    }

    const lastUser = [...messages].reverse().find((m) => m.role === "user")
    if (!lastUser) {
      return NextResponse.json({ error: "No user message found" }, { status: 400 })
    }

    const now = new Date()
    const realtimeAnswer = getRealtimeAnswer(lastUser.content, now)
    if (realtimeAnswer) {
      return NextResponse.json({
        reply: realtimeAnswer,
        provider: "realtime",
        model: "clock-ist",
      })
    }

    const systemPrompt = buildAssistantSystemPrompt(now)

    const providerErrors: string[] = []

    try {
      const geminiResult = await askGemini(messages, systemPrompt)
      if (geminiResult) {
        return NextResponse.json({
          reply: geminiResult.text,
          provider: geminiResult.provider,
          model: geminiResult.model,
        })
      }
      providerErrors.push("Gemini is not configured")
    } catch (providerError: any) {
      const message = providerError?.message || "Gemini request failed"
      providerErrors.push(toClientProviderError(message))
      console.error("GST assistant Gemini error:", providerError)
    }

    return NextResponse.json({
      reply: fallbackReply(lastUser.content),
      provider: "fallback",
      model: "rules",
      meta: {
        providerErrors,
      },
    })
  } catch (error) {
    console.error("GST assistant route error:", error)
    return NextResponse.json({ error: "Failed to process chat request" }, { status: 500 })
  }
}
