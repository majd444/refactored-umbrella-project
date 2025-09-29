"use client"

import React from "react"
import { useParams } from "next/navigation"
import { useAuth } from "@clerk/nextjs"
import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Id, Doc } from "@/convex/_generated/dataModel"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { ChevronDown, ChevronRight, MessageSquare } from "lucide-react"

function DetailsButton({ info, onViewConversation }: { info: Record<string, string>; onViewConversation?: () => void }) {
  const [open, setOpen] = React.useState(false)
  const safeEntries = Object.entries(info || {}).filter(([_k, v]) => typeof v === 'string' && v.trim().length > 0)
  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>Details</Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Lead Details</DialogTitle>
            <DialogDescription>Submitted pre-chat information</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            {safeEntries.length === 0 ? (
              <div className="text-sm text-gray-600">No fields</div>
            ) : (
              safeEntries.map(([k, v]) => (
                <div key={k} className="text-sm flex justify-between gap-3">
                  <span className="text-gray-500 capitalize">{k}</span>
                  <span className="text-black break-all">{v}</span>
                </div>
              ))
            )}
          </div>
          {onViewConversation && (
            <div className="mt-4 flex justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  setOpen(false)
                  onViewConversation()
                }}
              >
                View Conversation
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}

export default function AgentHistoryPage() {
  const params = useParams()
  const { isLoaded, userId } = useAuth()
  const agentId = params?.id as string

  const agent = useQuery(api.agents.get, isLoaded && !!userId ? { id: agentId as Id<'agents'> } : "skip")
  const sessions = useQuery(api.sessions.listByAgent, isLoaded && !!userId ? { agentId: agentId as Id<'agents'> } : "skip") as Doc<'chatSessions'>[] | undefined

  const [openIds, setOpenIds] = React.useState<Set<string>>(new Set())
  const itemRefs = React.useRef<Record<string, HTMLDivElement | null>>({})
  const [flashId, setFlashId] = React.useState<string | null>(null)
  
  // Build a normalized list of leads from sessions
  const computeLeads = React.useCallback(() => {
    type Lead = { id: string; createdAt: number; userInfo: Record<string, string> };
    const list: Lead[] = (sessions || [])
      .map((s: Doc<'chatSessions'>) => {
        const info = ((s as unknown as { metadata?: { userInfo?: Record<string, string> } }).metadata?.userInfo) || {};
        const hasAny = info && typeof info === 'object' && Object.keys(info).some(k => (info as any)[k]?.toString().trim().length > 0);
        return hasAny ? { id: String((s as any)._id), createdAt: (s as any).createdAt as number, userInfo: info } : null;
      })
      .filter((x): x is Lead => Boolean(x));
    return list;
  }, [sessions])

  const toggleOpen = (id: string) => {
    setOpenIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }

  const exportLeadsCsv = () => {
    const leads = computeLeads();
    if (leads.length === 0) return;
    // Default to minimal style
    const headers: string[] = ['id','createdAt','name','email','phone'];
    const rows: string[] = [];
    rows.push(headers.join(','));
    const esc = (v: string) => {
      const s = (v ?? '').toString();
      return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
    };
    const pickFirst = (obj: Record<string, string>, keys: string[]): string => {
      for (const k of keys) {
        const v = obj[k];
        if (typeof v === 'string' && v.trim().length > 0) return v.trim();
      }
      return '';
    };
    for (const l of leads) {
      const cols: string[] = [];
      cols.push(esc(l.id));
      cols.push(esc(new Date(l.createdAt).toISOString()));
      const name = pickFirst(l.userInfo, ['name','fullName','full_name','firstName','first_name','contact_name','customer_name']);
      const email = pickFirst(l.userInfo, ['email','e-mail','emailAddress','email_address']);
      const phone = pickFirst(l.userInfo, ['phone','phoneNumber','phone_number','tel','telephone','mobile']);
      cols.push(esc(name));
      cols.push(esc(email));
      cols.push(esc(phone));
      rows.push(cols.join(','));
    }
    const csv = rows.join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `leads-${agentId}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const openSession = (id: string) => {
    setOpenIds(prev => new Set(prev).add(id))
    // Briefly highlight and scroll into view the matching session
    setFlashId(id)
    const el = itemRefs.current[id]
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
    window.setTimeout(() => setFlashId(current => (current === id ? null : current)), 1500)
  }

  if (!isLoaded || !userId) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </div>
    )
  }

  if (agent === null) {
    return (
      <div className="p-6">
        <p className="text-sm text-gray-600">Agent not found.</p>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-black">Chat History{agent ? ` – ${agent.name}` : ''}</h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={exportLeadsCsv}>Export Leads (CSV)</Button>
          <Button variant="outline" asChild>
            <a href={`/dashboard`}>Back to Dashboard</a>
          </Button>
        </div>
      </div>

      {Array.isArray(sessions) && sessions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg text-black">Leads</CardTitle>
          </CardHeader>
          <CardContent>
            {(() => {
              type Lead = { id: string; createdAt: number; userInfo: Record<string, string> };
              const leads: Lead[] = (sessions || [])
                .map((s: Doc<'chatSessions'>) => {
                  const info = ((s as unknown as { metadata?: { userInfo?: Record<string, string> } }).metadata?.userInfo) || {};
                  const hasAny = info && typeof info === 'object' && Object.keys(info).some(k => (info as any)[k]?.toString().trim().length > 0);
                  return hasAny ? { id: String((s as any)._id), createdAt: (s as any).createdAt as number, userInfo: info } : null;
                })
                .filter((x): x is Lead => Boolean(x));

              if (leads.length === 0) {
                return <div className="text-sm text-gray-600">No leads captured yet.</div>
              }

              return (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-gray-600 border-b">
                        <th className="py-2 pr-3">Name</th>
                        <th className="py-2 pr-3">Email</th>
                        <th className="py-2 pr-3">Phone</th>
                        <th className="py-2 pr-3">Created</th>
                        <th className="py-2 pr-3"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {leads.map(lead => {
                        const pickFirst = (obj: Record<string, string>, keys: string[]): string => {
                          for (const k of keys) {
                            const v = obj[k];
                            if (typeof v === 'string' && v.trim().length > 0) return v.trim();
                          }
                          return '';
                        };
                        const name = pickFirst(lead.userInfo, ['name','fullName','full_name','firstName','first_name','contact_name','customer_name']);
                        const email = pickFirst(lead.userInfo, ['email','e-mail','emailAddress','email_address']);
                        const phoneRaw = pickFirst(lead.userInfo, ['phone','phoneNumber','phone_number','tel','telephone','mobile']);
                        const phone = phoneRaw || '';
                        // If still empty, fall back to first non-empty fields
                        const entries = Object.entries(lead.userInfo).filter(([_,v]) => typeof v === 'string' && v.trim().length > 0);
                        const safeName = name || (entries[0]?.[1] || '');
                        const safeEmail = email || (entries.find(([k]) => /mail/i.test(k))?.[1] || '');
                        const safePhone = phone || (entries.find(([k]) => /(phone|tel)/i.test(k))?.[1] || '');
                        return (
                          <tr key={lead.id} className="border-b last:border-0">
                            <td className="py-2 pr-3 text-black">{safeName || '—'}</td>
                            <td className="py-2 pr-3 text-black">{safeEmail || '—'}</td>
                            <td className="py-2 pr-3 text-black">{safePhone || '—'}</td>
                            <td className="py-2 pr-3 text-gray-600">{new Date(lead.createdAt).toLocaleString()}</td>
                            <td className="py-2 pr-3 space-x-2">
                              <Button variant="outline" size="sm" onClick={() => openSession(lead.id)}>Open Session</Button>
                              <DetailsButton info={lead.userInfo} onViewConversation={() => openSession(lead.id)} />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )
            })()}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-lg text-black">Conversations</CardTitle>
        </CardHeader>
        <CardContent>
          {sessions === undefined ? (
            <div className="text-sm text-gray-600">Loading sessions…</div>
          ) : sessions.length === 0 ? (
            <div className="text-center py-12">
              <MessageSquare className="h-10 w-10 text-gray-300 mx-auto mb-3" />
              <p className="text-sm text-gray-600">No conversations yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {sessions.map((s) => (
                <HistoryItem
                  key={s._id}
                  sessionId={s._id as Id<'chatSessions'>}
                  open={openIds.has(String(s._id))}
                  onToggle={() => toggleOpen(String(s._id))}
                  meta={(s as any).metadata}
                  createdAt={s.createdAt as number}
                  lastActive={(s as any).lastActive as number}
                  refEl={(el: HTMLDivElement | null) => { itemRefs.current[String(s._id)] = el }}
                  isHighlighted={flashId === String(s._id)}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function HistoryItem({ sessionId, open, onToggle, meta, createdAt, lastActive, refEl, isHighlighted }: { sessionId: Id<'chatSessions'>; open: boolean; onToggle: () => void; meta?: any; createdAt?: number; lastActive?: number; refEl?: (el: HTMLDivElement | null) => void; isHighlighted?: boolean }) {
  const messages = useQuery(api.sessions.getSessionMessages, open ? { sessionId } : "skip")
  const info = meta?.userInfo as Record<string, string> | undefined

  return (
    <div ref={refEl} className={`border rounded-lg ${isHighlighted ? 'ring-2 ring-blue-300 ring-offset-2' : ''}`}>
      <button onClick={onToggle} className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50">
        <div className="text-left">
          <div className="text-sm font-medium text-black">Session {String(sessionId).slice(0, 8)}…</div>
          <div className="text-xs text-gray-500">{createdAt ? new Date(createdAt).toLocaleString() : ''} • Last active {lastActive ? new Date(lastActive).toLocaleString() : ''}</div>
          {info && (
            <div className="text-xs text-gray-600 mt-1">
              {Object.entries(info).slice(0, 4).map(([k, v]) => (
                <span key={k} className="mr-2"><span className="text-gray-500">{k}:</span> {v}</span>
              ))}
            </div>
          )}
        </div>
        {open ? <ChevronDown className="h-4 w-4 text-gray-500" /> : <ChevronRight className="h-4 w-4 text-gray-500" />}
      </button>
      {open && (
        <div className="border-t max-h-96 overflow-auto">
          {messages === undefined ? (
            <div className="p-3 text-sm text-gray-600">Loading…</div>
          ) : messages.length === 0 ? (
            <div className="p-3 text-sm text-gray-600">No messages</div>
          ) : (
            <div className="divide-y">
              {messages.map((m) => (
                <div key={(m as any)._id} className="p-3 text-sm">
                  <span className={`font-medium mr-2 ${(m as any).role === 'user' ? 'text-blue-600' : 'text-emerald-600'}`}>{(m as any).role}:</span>
                  <span className="whitespace-pre-wrap break-words">{(m as any).content}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
