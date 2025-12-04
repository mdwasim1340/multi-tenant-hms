"use client"

import { useState, useRef, useEffect } from "react"
import { MessageCircle, X, Send, Mic, MicOff, Stethoscope, Building2, AlertCircle, HelpCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import Link from "next/link"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
}

type Department = "opd" | "ward" | "emergency" | "general"

const DEPARTMENTS = [
  { value: "opd", label: "OPD (Outpatient)", icon: Stethoscope, color: "text-blue-500" },
  { value: "ward", label: "Ward Management", icon: Building2, color: "text-green-500" },
  { value: "emergency", label: "Emergency", icon: AlertCircle, color: "text-red-500" },
  { value: "general", label: "General Query", icon: HelpCircle, color: "text-purple-500" },
] as const

export function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false)
  const [department, setDepartment] = useState<Department>("general")
  const [sessionId] = useState(() => `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`)
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content:
        "Hello! I'm MediFlow AI Assistant. Please select a department above, and I'll connect you with the specialized AI agent to help you.",
      timestamp: new Date(),
    },
  ])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const recognitionRef = useRef<any>(null)
  
  // Use environment variable for API URL
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // Initialize speech recognition
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
    const currentInput = input
    setInput("")
    setIsLoading(true)

    try {
      // Call backend n8n integration
      const response = await fetch(`${API_URL}/api/n8n/chat`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "X-App-ID": "hospital-management",
          "X-API-Key": process.env.NEXT_PUBLIC_API_KEY || "hospital-dev-key-123"
        },
        body: JSON.stringify({
          message: currentInput,
          sessionId: sessionId,
          department: department,
        }),
      })

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || "Failed to get response from AI agent")
      }

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
        content: "Sorry, I encountered an error connecting to the AI agent. Please try again or select a different department.",
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleDepartmentChange = (newDept: Department) => {
    setDepartment(newDept)
    const deptInfo = DEPARTMENTS.find((d) => d.value === newDept)
    const welcomeMessage: Message = {
      id: Date.now().toString(),
      role: "assistant",
      content: `Switched to ${deptInfo?.label} agent. How can I assist you with ${deptInfo?.label.toLowerCase()} related queries?`,
      timestamp: new Date(),
    }
    setMessages((prev) => [...prev, welcomeMessage])
  }

  return (
    <>
      {/* Chat Widget Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-40 p-3 rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 transition-all duration-200 hover:scale-110"
        aria-label="Open chat"
      >
        {isOpen ? <X size={24} /> : <MessageCircle size={24} />}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <Card className="fixed bottom-24 right-6 w-96 max-w-[calc(100vw-24px)] h-[600px] max-h-[calc(100vh-120px)] flex flex-col shadow-2xl z-40 animate-fade-in">
          {/* Header */}
          <div className="bg-gradient-to-r from-primary to-accent p-4 text-primary-foreground rounded-t-lg">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="font-semibold">MediFlow AI Assistant</h3>
                <p className="text-xs opacity-90">n8n-powered department agents</p>
              </div>
              <Link href="/chat" className="text-xs hover:underline">
                Full Chat
              </Link>
            </div>
            {/* Department Selector */}
            <Select value={department} onValueChange={(value) => handleDepartmentChange(value as Department)}>
              <SelectTrigger className="w-full bg-white/10 border-white/20 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DEPARTMENTS.map((dept) => {
                  const Icon = dept.icon
                  return (
                    <SelectItem key={dept.value} value={dept.value}>
                      <div className="flex items-center gap-2">
                        <Icon className={`h-4 w-4 ${dept.color}`} />
                        <span>{dept.label}</span>
                      </div>
                    </SelectItem>
                  )
                })}
              </SelectContent>
            </Select>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-background">
            {messages.map((message) => (
              <div key={message.id} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-xs px-4 py-2 rounded-lg ${
                    message.role === "user"
                      ? "bg-primary text-primary-foreground rounded-br-none"
                      : "bg-muted text-foreground rounded-bl-none"
                  }`}
                >
                  <p className="text-sm">{message.content}</p>
                  <span className="text-xs opacity-70 mt-1 block">
                    {message.timestamp.toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-muted text-foreground px-4 py-2 rounded-lg rounded-bl-none">
                  <div className="flex space-x-2">
                    <div className="w-2 h-2 bg-foreground rounded-full animate-bounce" />
                    <div className="w-2 h-2 bg-foreground rounded-full animate-bounce delay-100" />
                    <div className="w-2 h-2 bg-foreground rounded-full animate-bounce delay-200" />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="border-t border-border p-4 bg-card space-y-2 rounded-b-lg">
            <div className="flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && !isLoading && handleSendMessage()}
                placeholder={`Ask ${DEPARTMENTS.find((d) => d.value === department)?.label} agent...`}
                disabled={isLoading}
                className="flex-1"
              />
              <Button
                onClick={toggleListening}
                variant={isListening ? "default" : "outline"}
                size="icon"
                title={isListening ? "Stop listening" : "Start voice input"}
                disabled={isLoading}
              >
                {isListening ? <MicOff size={18} /> : <Mic size={18} />}
              </Button>
              <Button onClick={handleSendMessage} disabled={isLoading || !input.trim()} size="icon">
                <Send size={18} />
              </Button>
            </div>
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                Connected to {DEPARTMENTS.find((d) => d.value === department)?.label}
              </p>
              <p className="text-xs text-muted-foreground">Session: {sessionId.slice(-8)}</p>
            </div>
          </div>
        </Card>
      )}
    </>
  )
}
