"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { X, RefreshCw, Upload, Link2, FileText, Plus, Trash2, Globe, File, User, Mail, Puzzle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Slider } from "@/components/ui/slider"
import dynamic from 'next/dynamic';
import Image from 'next/image';

// Dynamically import ChatInterface with no SSR
const ChatInterface = dynamic(
  () => import('@/components/chat-interface'),
  { ssr: false }
);
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"


const pluginLogos = [
  {
    id: "wordpress",
    name: "WordPress",
    logoUrl: "https://s.w.org/style/images/about/WordPress-logotype-wmark.png",
  },
  {
    id: "whatsapp",
    name: "WhatsApp",
    logoUrl: "https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg",
  },
  {
    id: "html-css",
    name: "HTML & CSS Plugin",
    logoUrl: "https://upload.wikimedia.org/wikipedia/commons/6/61/HTML5_logo_and_wordmark.svg",
  },
  {
    id: "instagram",
    name: "Instagram",
    logoUrl: "https://upload.wikimedia.org/wikipedia/commons/e/e7/Instagram_logo_2016.svg",
  },
  {
    id: "messenger",
    name: "Meta",
    logoUrl: "https://upload.wikimedia.org/wikipedia/commons/0/05/Facebook_Logo_%282019%29.png",
  },
  {
    id: "telegram",
    name: "Telegram",
    logoUrl: "https://upload.wikimedia.org/wikipedia/commons/8/82/Telegram_logo.svg",
  },
  {
    id: "discord",
    name: "Discord",
    logoUrl:
      "https://assets-global.website-files.com/6257adef93867e50d84d30e2/636e0a6a49cf127bf92de1e2_icon_clyde_blurple_RGB.png",
  },
]

export default function CreateAgentPage() {
  const router = useRouter();
  const onClose = () => router.back();
  const [activeTab, setActiveTab] = useState("configuration")
  const [showError, setShowError] = useState(false)
  const [extractionUrl, setExtractionUrl] = useState("")
  const [extractedLinks, setExtractedLinks] = useState<string[]>([])
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([])
  const [isExtracting, setIsExtracting] = useState(false)
  const [assistantName, setAssistantName] = useState("AI Assistant")

  const handleExtractLinks = () => {
    if (!extractionUrl) return

    setIsExtracting(true)

    // Simulate extraction process
    setTimeout(() => {
      // Mock extracted links
      const mockLinks = [
        "https://example.com/document1.pdf",
        "https://example.com/resource/page1",
        "https://example.com/api/documentation",
      ]
      setExtractedLinks(mockLinks)
      setIsExtracting(false)
    }, 1500)
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return

    // Simulate file upload
    const newFiles = Array.from(files).map((file) => file.name)
    setUploadedFiles([...uploadedFiles, ...newFiles])
  }

  const removeFile = (index: number) => {
    const newFiles = [...uploadedFiles]
    newFiles.splice(index, 1)
    setUploadedFiles(newFiles)
  }

  const removeLink = (index: number) => {
    const newLinks = [...extractedLinks]
    newLinks.splice(index, 1)
    setExtractedLinks(newLinks)
  }

  return (
    <div className="fixed inset-0 z-50 bg-white flex flex-col h-screen w-screen">
      <div className="border-b border-gray-200 p-4 flex items-center justify-between">
        <h2 className="text-xl font-bold text-black">Create New Agent</h2>
        <div className="flex items-center space-x-3">
          <button onClick={onClose} className="text-black hover:text-gray-700">
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <div className="w-2/3 overflow-y-auto p-6 border-r border-gray-200">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid grid-cols-4 mb-6">
              <TabsTrigger value="configuration" className="text-black data-[state=active]:text-black">
                Configuration
              </TabsTrigger>
              <TabsTrigger value="fine-tuning" className="text-black data-[state=active]:text-black">
                Fine-tuning
              </TabsTrigger>
              <TabsTrigger value="style" className="text-black data-[state=active]:text-black">
                Style
              </TabsTrigger>
              <TabsTrigger value="plugins" className="text-black data-[state=active]:text-black">
                Plugins
              </TabsTrigger>
            </TabsList>

            <TabsContent value="configuration" className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2 text-black">Name</label>
                <Input 
                  placeholder="AI Assistant" 
                  value={assistantName}
                  onChange={(e) => setAssistantName(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-black">Language Model</label>
                <div className="relative">
                  <select className="w-full p-2 border border-gray-300 rounded-md appearance-none pr-10 text-black">
                    <option>Llama 3.1 Nemetron Nano 8B (Free)</option>
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="m6 9 6 6 6-6" />
                    </svg>
                  </div>
                </div>
              </div>

              <div>
                <div className="flex justify-between mb-2">
                  <label className="block text-sm font-medium text-black">Temperature: 0.7</label>
                  <span className="text-sm text-black">Balanced</span>
                </div>
                <Slider defaultValue={[70]} max={100} step={1} />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-black">System Prompt</label>
                <Textarea
                  placeholder="You are a helpful AI assistant."
                  defaultValue="You are a helpful AI assistant."
                  className="min-h-[100px]"
                />
                <p className="text-xs text-black mt-1">
                  This prompt defines your assistant's personality and capabilities.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-black">Welcome Message</label>
                <Textarea
                  placeholder="👋 Hi, I'm an AI Assistant! I can help with information."
                  defaultValue="👋 Hi, I'm an AI Assistant! I can help with information."
                  className="min-h-[80px]"
                />
                <p className="text-xs text-black mt-1">
                  This is the first message users will see when they start a chat.
                </p>
              </div>

              <div>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <label className="block text-sm font-medium text-black">Collect User Information</label>
                    <p className="text-xs text-black">Enable a form to collect user info before chat</p>
                  </div>
                  <Switch />
                </div>

                <div className="border rounded-lg p-4 bg-gray-50">
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-black mb-3">Add Field Templates</h4>
                    <div className="flex flex-wrap gap-2">
                      <Button variant="outline" size="sm">
                        <User className="mr-1 h-3 w-3" />
                        Name Field
                      </Button>
                      <Button variant="outline" size="sm">
                        <Mail className="mr-1 h-3 w-3" />
                        Email Field
                      </Button>
                      <Button variant="outline" size="sm">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="24"
                          height="24"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="m6 9 6 6 6-6" />
                        </svg>
                        <span className="ml-1">Inquiry Dropdown</span>
                      </Button>
                      <Button variant="outline" size="sm">
                        <Plus className="mr-1 h-3 w-3" />
                        Custom Field
                      </Button>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-medium text-black">Active Fields</h4>
                      <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
                        Clear All
                      </Button>
                    </div>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                      <p className="text-sm text-black">No fields added. Use the templates above to add fields.</p>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="fine-tuning" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Link Extraction Section */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center text-black">
                      <Link2 className="h-5 w-5 mr-2 text-blue-500" />
                      Extract Links
                    </CardTitle>
                    <CardDescription className="text-black">
                      Extract links from websites to use as training data
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex space-x-2">
                        <Input
                          placeholder="Enter URL to extract links"
                          value={extractionUrl}
                          onChange={(e) => setExtractionUrl(e.target.value)}
                        />
                        <Button
                          onClick={handleExtractLinks}
                          disabled={isExtracting || !extractionUrl}
                          className="whitespace-nowrap"
                        >
                          {isExtracting ? (
                            <>
                              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                              Extracting...
                            </>
                          ) : (
                            <>
                              <Globe className="h-4 w-4 mr-2" />
                              Extract
                            </>
                          )}
                        </Button>
                      </div>

                      <div>
                        <h4 className="text-sm font-medium mb-2 text-black">
                          Extracted Links ({extractedLinks.length})
                        </h4>
                        {extractedLinks.length > 0 ? (
                          <div className="space-y-2 max-h-40 overflow-y-auto">
                            {extractedLinks.map((link, index) => (
                              <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded-md">
                                <div className="flex items-center text-sm truncate">
                                  <Globe className="h-4 w-4 mr-2 text-black flex-shrink-0" />
                                  <span className="truncate text-black">{link}</span>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeLink(index)}
                                  className="ml-2 flex-shrink-0"
                                >
                                  <Trash2 className="h-4 w-4 text-black" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-4 text-black text-sm">No links extracted yet</div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* File Upload Section */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center text-black">
                      <FileText className="h-5 w-5 mr-2 text-blue-500" />
                      Upload Files
                    </CardTitle>
                    <CardDescription className="text-black">
                      Upload documents to train your AI assistant
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div
                        className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:bg-gray-50 transition-colors cursor-pointer"
                        onClick={() => document.getElementById("file-upload")?.click()}
                      >
                        <Upload className="h-8 w-8 mx-auto text-black mb-2" />
                        <p className="text-sm font-medium text-black">Drag and drop files here</p>
                        <p className="text-xs text-black mt-1">or click to browse</p>
                        <input type="file" id="file-upload" className="hidden" multiple onChange={handleFileUpload} />
                        <div className="mt-2">
                          <Badge variant="outline" className="text-xs text-black">
                            PDF
                          </Badge>
                          <Badge variant="outline" className="text-xs ml-1 text-black">
                            DOCX
                          </Badge>
                          <Badge variant="outline" className="text-xs ml-1 text-black">
                            TXT
                          </Badge>
                          <Badge variant="outline" className="text-xs ml-1 text-black">
                            CSV
                          </Badge>
                        </div>
                      </div>

                      <div>
                        <h4 className="text-sm font-medium mb-2 text-black">Uploaded Files ({uploadedFiles.length})</h4>
                        {uploadedFiles.length > 0 ? (
                          <div className="space-y-2 max-h-40 overflow-y-auto">
                            {uploadedFiles.map((file, index) => (
                              <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded-md">
                                <div className="flex items-center text-sm truncate">
                                  <File className="h-4 w-4 mr-2 text-black flex-shrink-0" />
                                  <span className="truncate text-black">{file}</span>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeFile(index)}
                                  className="ml-2 flex-shrink-0"
                                >
                                  <Trash2 className="h-4 w-4 text-black" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-4 text-black text-sm">No files uploaded yet</div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Separator className="my-6" />

              <div>
                <h3 className="text-lg font-medium mb-4 text-black">Training Data Summary</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-black">Links</span>
                      <Badge className="text-black">{extractedLinks.length}</Badge>
                    </div>
                    <div className="text-2xl font-bold text-black">{extractedLinks.length}</div>
                    <div className="text-sm text-black">Web pages for training</div>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-black">Files</span>
                      <Badge className="text-black">{uploadedFiles.length}</Badge>
                    </div>
                    <div className="text-2xl font-bold text-black">{uploadedFiles.length}</div>
                    <div className="text-sm text-black">Documents for training</div>
                  </div>
                </div>

                <div className="mt-6">
                  <Button className="w-full" disabled={extractedLinks.length === 0 && uploadedFiles.length === 0}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Training Data to Agent
                  </Button>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="style" className="space-y-6">
              <div className="p-4 bg-gray-50 rounded-lg mb-4">
                <h3 className="text-lg font-medium text-black">Chatbot Appearance</h3>
                <p className="text-sm text-blue-600">
                  Customize the appearance of your chatbot to match your brand or website design.
                </p>
              </div>

              <div className="grid grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-2 text-black">Top Color</label>
                  <div className="flex items-center">
                    <div className="h-10 w-10 rounded bg-[#003087] mr-2"></div>
                    <Input defaultValue="#003087" className="flex-1" />
                  </div>
                  <p className="text-xs text-black mt-1">Deep blue for header area</p>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 text-black">Accent Color</label>
                  <div className="flex items-center">
                    <div className="h-10 w-10 rounded bg-[#00D4FF] mr-2"></div>
                    <Input defaultValue="#00D4FF" className="flex-1" />
                  </div>
                  <p className="text-xs text-black mt-1">Bright cyan for buttons and highlights</p>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 text-black">Background Color</label>
                  <div className="flex items-center">
                    <div className="h-10 w-10 rounded bg-[#F9F9F9] mr-2"></div>
                    <Input defaultValue="#F9F9F9" className="flex-1" />
                  </div>
                  <p className="text-xs text-black mt-1">Off-white for chat background</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-black">Agent Avatar</label>
                <div className="flex items-center">
                  <div className="h-16 w-16 rounded-full bg-gray-200 flex items-center justify-center mr-4">
                    <span className="text-black">Logo</span>
                  </div>
                  <div className="flex-1">
                    <Button variant="outline" className="flex items-center text-black mb-2">
                      <Upload className="h-4 w-4 mr-2" />
                      Upload Company Logo
                    </Button>
                    <p className="text-xs text-black">Recommended: PNG format, 512x512 pixels, max 2MB</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-2 text-black">Text Style</label>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-black">Font Family</span>
                      <select className="p-2 border border-gray-300 rounded-md text-black" defaultValue="Roboto">
                        <option value="Roboto">Roboto</option>
                        <option value="Inter">Inter</option>
                        <option value="Open Sans">Open Sans</option>
                        <option value="System Default">System Default</option>
                      </select>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-black">Size</span>
                      <select className="p-2 border border-gray-300 rounded-md text-black" defaultValue="Medium">
                        <option value="Small">Small</option>
                        <option value="Medium">Medium</option>
                        <option value="Large">Large</option>
                      </select>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-black">Alignment</span>
                      <select className="p-2 border border-gray-300 rounded-md text-black" defaultValue="Left">
                        <option value="Left">Left</option>
                        <option value="Center">Center</option>
                        <option value="Right">Right</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 text-black">Button Style</label>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-black">Shape</span>
                      <select className="p-2 border border-gray-300 rounded-md text-black" defaultValue="Rounded">
                        <option value="Square">Square</option>
                        <option value="Rounded">Rounded</option>
                        <option value="Pill">Pill</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm mb-1 text-black">Button Text</label>
                      <Input defaultValue="Talk to Support" />
                    </div>
                    <div className="flex justify-center">
                      <div className="bg-[#00D4FF] text-white px-4 py-2 rounded-md">Talk to Support</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium mb-2 text-black">Preview</label>
                <div className="border rounded-lg p-4 bg-[#F9F9F9]">
                  <div className="bg-[#003087] text-white p-3 rounded-t-lg flex items-center">
                    <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center mr-2">
                      <span className="text-xs text-black">Logo</span>
                    </div>
                    <span className="font-medium">Company Support</span>
                  </div>
                  <div className="h-40 p-3 flex flex-col justify-end">
                    <div className="bg-white p-3 rounded-lg inline-block max-w-[80%] mb-2 shadow-sm">
                      <p className="text-sm text-black">How can I help you today?</p>
                    </div>
                  </div>
                  <div className="border-t p-3 flex">
                    <Input placeholder="Type your message..." className="flex-1 mr-2" />
                    <Button className="bg-[#00D4FF] hover:bg-[#00bfe6]">Send</Button>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="plugins" className="space-y-6">
              <div className="p-4 bg-gray-50 rounded-lg mb-4">
                <h3 className="text-lg font-medium text-black">Available Plugins</h3>
                <p className="text-sm text-black">
                  Connect your chatbot with popular platforms and services to extend its functionality.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {pluginLogos.map((plugin) => (
                  <Card key={plugin.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="h-10 w-10 rounded bg-white border flex items-center justify-center mr-3 p-1">
                            <div className="relative h-full w-full">
                                <Image
                                  src={plugin.logoUrl || "/placeholder.svg"}
                                  alt={`${plugin.name} logo`}
                                  fill
                                  className="object-contain"
                                  onError={(e) => {
                                    // Fallback to text if image fails to load
                                    const target = e.target as HTMLImageElement;
                                    target.style.display = "none";
                                    const parent = target.parentElement;
                                    if (parent) {
                                      parent.innerHTML = `<span class="text-black font-bold text-sm">${plugin.name.substring(0, 2).toUpperCase()}</span>`;
                                      parent.className = "h-10 w-10 rounded bg-gray-100 flex items-center justify-center mr-3";
                                    }
                                  }}
                                />
                              </div>
                          </div>
                          <div>
                            <h4 className="font-medium text-black">{plugin.name}</h4>
                            <p className="text-sm text-black">
                              {plugin.id === "wordpress" && "Embed chatbot on WordPress sites"}
                              {plugin.id === "whatsapp" && "Connect via WhatsApp Business API"}
                              {plugin.id === "html-css" && "Custom HTML/CSS integration"}
                              {plugin.id === "instagram" && "Instagram Direct Messages integration"}
                              {plugin.id === "messenger" && "Facebook Messenger integration via Meta"}
                              {plugin.id === "telegram" && "Telegram Bot API integration"}
                              {plugin.id === "discord" && "Discord bot integration"}
                            </p>
                          </div>
                        </div>
                        <Switch />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="mt-6">
                <h3 className="text-lg font-medium mb-4 text-black">Plugin Configuration</h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-black mb-3">
                    Enable plugins above to configure their settings. Each plugin will require specific API keys or
                    authentication tokens.
                  </p>
                  <Button variant="outline" className="text-black">
                    <Puzzle className="mr-2 h-4 w-4" />
                    View Plugin Documentation
                  </Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          {showError && (
            <Alert variant="destructive" className="mt-6 bg-amber-50 border-amber-200 text-amber-800">
              <AlertDescription className="flex items-center">
                <span className="mr-2">⚠️</span>
                <div>
                  <p className="font-medium">Extraction Service Unavailable</p>
                  <p>
                    The document extraction service is not running. Please start the service to upload and manage
                    documents.
                  </p>
                </div>
              </AlertDescription>
              <Button
                variant="outline"
                className="mt-2 border-amber-300 text-amber-800 hover:bg-amber-100 flex items-center"
                onClick={() => setShowError(false)}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry Connection
              </Button>
            </Alert>
          )}
        </div>

        <div className="w-1/3 p-4 bg-gray-50">
          <ChatInterface
            assistantName={assistantName}
            welcomeMessage={`👋 Hi there! I&apos;m ${assistantName}. How can I help you today?`}
            headerColor="#3B82F6"
            accentColor="#3B82F6"
            className="h-full"
            onSendMessage={(message) => {
              // Handle message sending
              void message;
              return;
            }}
            onClose={() => {}}
          />
        </div>
      </div>

      <div className="border-t border-gray-200 p-4 flex justify-end space-x-2">
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button onClick={() => setShowError(true)}>Save Agent</Button>
      </div>
    </div>
  )
}
