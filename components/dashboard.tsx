"use client"

import { Plus, MessageSquare, Settings, Clock } from "lucide-react"
import { useAuth } from "@clerk/nextjs"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import Image from "next/image"
import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { format } from "date-fns"
import type { Doc } from "@/convex/_generated/dataModel"

export default function Dashboard() {
  const { userId, isLoaded } = useAuth()
  
  // Removed unused copyToClipboard helper

  // Fetch agents for the current user (only after Clerk is ready & signed in)
  const shouldQuery = isLoaded && !!userId
  const agents = (useQuery(api.agents.list, shouldQuery ? {} : "skip") || []) as Doc<"agents">[]
  const me = useQuery(api.users.getMe, shouldQuery ? {} : "skip")
  const totalOps = useQuery(api.sessions.countOperationsByOwner, shouldQuery ? {} : "skip") as number | undefined
  const isLoading = !isLoaded || !shouldQuery || agents === undefined || me === undefined

  const plan = (me?.plan as "free" | "basic" | "pro" | undefined) || "free"
  const planLimits: Record<"free" | "basic" | "pro", number> = { free: 1, basic: 3, pro: 5 }
  const maxAgents = planLimits[plan]
  const usedAgents = agents?.length || 0
  const displayedAgents = (agents || []).slice(0, maxAgents)
  const hiddenAgents = Math.max(0, usedAgents - displayedAgents.length)
  const planLabel = plan.charAt(0).toUpperCase() + plan.slice(1)

  if (!isLoaded || !userId) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6">
      <div className="flex justify-between items-center mb-4 md:mb-6">
        <Link href="/dashboard" className="flex items-center">
          <Image
            src="/logo.png"
            alt="Logo"
            width={200}
            height={50}
            className="h-0 md:h-0 w-auto object-contain"
            priority
          />
        </Link>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-4 md:mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-md font-medium text-black">Current plan: {planLabel}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-2xl font-bold text-blue-500">$0</p>
                <p className="text-sm text-black">Current cost</p>
              </div>
              <div>
                <p className="text-2xl font-bold">{usedAgents} / {maxAgents}</p>
                <p className="text-sm text-black">Chatbots used</p>
              </div>
            </div>
            <Button asChild className="mt-4 w-full sm:w-auto" variant="outline">
              <Link href="/pricing">Upgrade plan</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-md font-medium text-black">Operations</CardTitle>
          </CardHeader>
          <CardContent>
            {totalOps === undefined ? (
              <div className="text-sm text-gray-600">Loading…</div>
            ) : (
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold">{totalOps}</p>
                  <p className="text-sm text-black">Total operations (messages)</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="mb-6">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div className="flex items-center gap-3">
            <CardTitle className="text-lg font-medium text-black">Your Chatbots</CardTitle>
            <span className="text-xs rounded-full px-2 py-1 bg-gray-100 text-gray-700">
              {usedAgents} / {maxAgents}
            </span>
            <p className="text-sm text-gray-500 mt-1">Manage and interact with your AI agents</p>
          </div>
          <Button asChild size="sm" className="shrink-0" disabled={usedAgents >= maxAgents} title={usedAgents >= maxAgents ? `Plan limit reached (${maxAgents}). Upgrade to add more.` : undefined}>
            <Link href={usedAgents >= maxAgents ? "#" : "/create-agent"} className="flex items-center">
              <Plus className="w-4 h-4 mr-2" />
              New Chatbot
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="border rounded-lg p-4 animate-pulse">
                  <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-4 bg-gray-100 rounded w-1/2 mb-4"></div>
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-100 rounded"></div>
                    <div className="h-4 bg-gray-100 rounded"></div>
                  </div>
                  <div className="mt-4 flex space-x-2">
                    <div className="h-8 bg-gray-200 rounded flex-1"></div>
                    <div className="h-8 bg-gray-200 rounded flex-1"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : displayedAgents.length === 0 ? (
            <div className="text-center py-12">
              <MessageSquare className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900">No chatbots yet</h3>
              <p className="mt-1 text-sm text-gray-500">Get started by creating your first AI chatbot.</p>
              <div className="mt-6">
                <Button asChild>
                  <Link href="/create-agent" className="flex items-center justify-center">
                    <Plus className="w-4 h-4 mr-2" />
                    Create Chatbot
                  </Link>
                </Button>
              </div>
            </div>
          ) : (
            <>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {displayedAgents.map((agent) => (
                  <div key={agent._id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-3">
                      <div className="pr-2">
                        <h3 className="font-medium text-gray-900 truncate">{agent.name}</h3>
                        <p className="text-sm text-gray-500 flex items-center">
                          <Clock className="h-3.5 w-3.5 mr-1" />
                          {agent._creationTime ? format(new Date(agent._creationTime), 'MMM d, yyyy') : 'Just now'}
                        </p>
                      </div>
                      <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                        <MessageSquare className="h-5 w-5 text-blue-600" />
                      </div>
                    </div>
                    <div className="space-y-1 text-xs">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Status</span>
                        <span className="font-medium text-green-600">Active</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Model</span>
                        <span className="font-medium">GPT-4</span>
                      </div>
                    </div>
                    <div className="flex gap-1 mt-1">
                      <Button variant="outline" size="sm" className="flex-1 h-6 text-xs px-1" asChild>
                        <Link href={`/agent/${agent._id}/history`} className="flex items-center justify-center">
                          <MessageSquare className="h-2.5 w-2.5 mr-0.5" />
                          History
                        </Link>
                      </Button>
                      <Button variant="outline" size="sm" className="flex-1 h-6 text-xs px-1" asChild>
                        <Link href={`/agent/${agent._id}/settings`} className="flex items-center justify-center">
                          <Settings className="h-2.5 w-2.5 mr-0.5" />
                          Settings
                        </Link>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-6 border-t pt-4">
                {hiddenAgents > 0 ? (
                  <p className="text-sm text-gray-500 text-center">
                    Showing {displayedAgents.length} of {usedAgents} chatbots. Upgrade to Pro to access all.
                  </p>
                ) : (
                  <p className="text-sm text-gray-500 text-center">
                    Showing {displayedAgents.length} chatbot{displayedAgents.length !== 1 ? 's' : ''}
                  </p>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
