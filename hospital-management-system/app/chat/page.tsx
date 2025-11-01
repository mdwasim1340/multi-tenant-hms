"use client"

import { useState, useRef, useEffect } from "react"
import { Send, Mic, MicOff, Download, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Sidebar } from "@/components/sidebar"
import { TopBar } from "@/components/top-bar"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content:
        "Welcome to MediFlow Assistant! I'm here to help with:\n\n• Appointment scheduling and management\n• Patient information and medical records\n• Hospital services and departments\n• General FAQs and inquiries\n• Billing and insurance questions\n\nHow can I assist you today?",
      timestamp: new Date(),
    },
  ])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const recognitionRef = useRef<any>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition = window.SpeechRecognition || (window as any).webkitSpeechRecognition
      if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition()
        recognitionRef.current.continuous = false
        recognitionRef.current.interimResults = false
        recognitionRef.current.onresult = (event: any) => {
          const transcript = Array.from(event.results)
            .map((result: any) => result[0].transcript)
            .join("")
          setInput(transcript)
        }
        recognitionRef.current.onend = () => {
          setIsListening(false)
        }
      }
    }
  }, [])

  const toggleListening = () => {
    if (recognitionRef.current) {
      if (isListening) {
        recognitionRef.current.stop()
        setIsListening(false)
      } else {
        recognitionRef.current.start()
        setIsListening(true)
      }
    }
  }

  const handleSendMessage = async () => {
    if (!input.trim()) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsLoading(true)

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: messages.map((m) => ({ role: m.role, content: m.content })),
          userMessage: input,
        }),
      })

      const data = await response.json()

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.response,
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, assistantMessage])
    } catch (error) {
      console.error("Chat error:", error)
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "Sorry, I encountered an error. Please try again.",
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const downloadChat = () => {
    const chatText = messages.map((m) => `${m.role.toUpperCase()}: ${m.content}`).join("\n\n")
    const element = document.createElement("a")
    element.setAttribute("href", `data:text/plain;charset=utf-8,${encodeURIComponent(chatText)}`)
    element.setAttribute("download", `chat-${new Date().toISOString()}.txt`)
    element.style.display = "none"
    document.body.appendChild(element)
    element.click()
    document.body.removeChild(element)
  }

  const clearChat = () => {
    if (confirm("Are you sure you want to clear the chat history?")) {
      setMessages([
        {
          id: "1",
          role: "assistant",
          content: "Chat cleared. How can I help you?",
          timestamp: new Date(),
        },
      ])
    }
  }

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <TopBar />
        <main className="flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="border-b border-border bg-card p-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold">MediFlow Assistant</h1>
                <p className="text-sm text-muted-foreground">AI-powered support for hospital services and inquiries</p>
              </div>
              <div className="flex gap-2">
                <Button onClick={downloadChat} variant="outline" size="sm" className="gap-2 bg-transparent">
                  <Download size={16} />
                  Download
                </Button>
                <Button onClick={clearChat} variant="outline" size="sm" className="gap-2 bg-transparent">
                  <Trash2 size={16} />
                  Clear
                </Button>
              </div>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.map((message) => (
              <div key={message.id} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                <Card
                  className={`max-w-2xl px-6 py-4 ${
                    message.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"
                  }`}
                >
                  <p className="whitespace-pre-wrap text-sm">{message.content}</p>
                  <span className="text-xs opacity-70 mt-2 block">{message.timestamp.toLocaleTimeString()}</span>
                </Card>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <Card className="bg-muted px-6 py-4">
                  <div className="flex space-x-2">
                    <div className="w-2 h-2 bg-foreground rounded-full animate-bounce" />
                    <div className="w-2 h-2 bg-foreground rounded-full animate-bounce delay-100" />
                    <div className="w-2 h-2 bg-foreground rounded-full animate-bounce delay-200" />
                  </div>
                </Card>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="border-t border-border bg-card p-6">
            <div className="max-w-4xl mx-auto space-y-4">
              <div className="flex gap-3">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                  placeholder="Ask me anything about hospital services, appointments, patient info..."
                  disabled={isLoading}
                  className="flex-1"
                />
                <Button
                  onClick={toggleListening}
                  variant={isListening ? "default" : "outline"}
                  size="icon"
                  title={isListening ? "Stop listening" : "Start voice input"}
                >
                  {isListening ? <MicOff size={20} /> : <Mic size={20} />}
                </Button>
                <Button onClick={handleSendMessage} disabled={isLoading || !input.trim()} size="icon">
                  <Send size={20} />
                </Button>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setInput("Schedule an appointment")}
                  className="text-xs"
                >
                  Schedule Appointment
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setInput("What are your visiting hours?")}
                  className="text-xs"
                >
                  Visiting Hours
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setInput("How do I check my bill?")}
                  className="text-xs"
                >
                  Check Bill
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setInput("What departments do you have?")}
                  className="text-xs"
                >
                  Departments
                </Button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
