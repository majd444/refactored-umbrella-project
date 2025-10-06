"use client"

import React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Clipboard, ExternalLink, Loader2, Code2, Sparkles } from "lucide-react"

interface DefaultChatbotConfigProps {
  agentId: string
}

export default function DefaultChatbotConfig({ agentId }: DefaultChatbotConfigProps) {
  const [copied, setCopied] = React.useState(false)
  const [position, setPosition] = React.useState<"bottom-right" | "bottom-left">("bottom-right")
  const [theme, setTheme] = React.useState<"light" | "dark" | "auto">("auto")
  const [bubble, setBubble] = React.useState(true)

  const origin = process.env.NEXT_PUBLIC_WIDGET_ORIGIN || "https://improved-seven.vercel.app"
  const snippet = `<script src="${origin}/widget.js" data-bot-id="${agentId}" data-theme="${theme}" data-position="${position}" data-bubble="${bubble ? "true" : "false"}"></script>`

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(snippet)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {}
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-indigo-500" />
          Default Chatbot Integration
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <AlertDescription>
            <div className="space-y-2 text-sm">
              <p className="font-medium">Steps:</p>
              <ol className="list-decimal list-inside space-y-1">
                <li>Click Copy and paste the embed snippet into your website&apos;s HTML.</li>
                <li>No keys required. The widget uses your Agent configuration automatically.</li>
                <li>Customize the Agent under Configuration and Style tabs for name, colors, and welcome message.</li>
              </ol>
              <div className="flex items-center gap-2 mt-2 text-xs">
                <Code2 className="h-3.5 w-3.5" />
                Your agent ID is used client-side to fetch public settings; no secrets are exposed.
              </div>
            </div>
          </AlertDescription>
        </Alert>

        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Status:</span>
          <Badge variant={agentId ? "default" : "secondary"}>{agentId ? "Ready" : "Missing Agent"}</Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="space-y-1">
            <label className="text-sm font-medium">Widget Position</label>
            <select
              className="w-full p-2 border border-gray-300 rounded-md text-sm"
              value={position}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setPosition(e.target.value as "bottom-right" | "bottom-left")}
            >
              <option value="bottom-right">Bottom Right</option>
              <option value="bottom-left">Bottom Left</option>
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Theme</label>
            <select
              className="w-full p-2 border border-gray-300 rounded-md text-sm"
              value={theme}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setTheme(e.target.value as "light" | "dark" | "auto")}
            >
              <option value="auto">Auto</option>
              <option value="light">Light</option>
              <option value="dark">Dark</option>
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Show Chat Bubble</label>
            <select
              className="w-full p-2 border border-gray-300 rounded-md text-sm"
              value={bubble ? "true" : "false"}
              onChange={(e) => setBubble(e.target.value === "true")}
            >
              <option value="true">Yes</option>
              <option value="false">No</option>
            </select>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Embed Snippet</label>
          <pre className="bg-gray-100 text-black p-3 rounded overflow-auto text-sm whitespace-pre-wrap break-words">
            <code>{snippet}</code>
          </pre>
          <div className="flex gap-2 justify-end">
            <Button variant="secondary" onClick={copy} disabled={!agentId} className="flex items-center gap-2">
              {copied ? <Loader2 className="h-4 w-4 animate-spin" /> : <Clipboard className="h-4 w-4" />} {copied ? "Copied" : "Copy"}
            </Button>
            <Button asChild variant="outline">
              <a href={`${origin}/preview?bot=${encodeURIComponent(agentId)}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2">
                <ExternalLink className="h-4 w-4" /> Preview
              </a>
            </Button>
          </div>
        </div>

        <Alert>
          <AlertDescription>
            <div className="text-sm">
              Want deeper customization? Adjust your agent&apos;s name, colors, welcome message, and form fields in the Configuration and Style tabs. The widget will reflect those settings automatically.
            </div>
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  )
}
