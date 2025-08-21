"use client"

import React, { useState, useEffect, useRef, useCallback } from "react"
import { useRouter, useParams } from "next/navigation"
import { useMutation, useQuery } from "convex/react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { api } from "@/convex/_generated/api"
import { Id } from "@/convex/_generated/dataModel"
import { useUser } from "@clerk/nextjs"
import { useToast } from "../../../../components/ui/use-toast"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"
import { Card, CardContent } from "@/components/ui/card"
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover"
import { 
  Upload as UploadIcon,
  Trash2,
  Puzzle
} from "lucide-react"

// Types
type FormField = {
  id: string;
  type: string;
  label: string;
  required: boolean;
  value?: string;
  isEditing?: boolean;
};

type FormState = {
  name: string;
  welcomeMessage: string;
  collectUserInfo: boolean;
  systemPrompt: string;
  headerColor: string;
  accentColor: string;
  backgroundColor: string;
  temperature: number;
  formFields: FormField[];
};

interface ExtractedContent {
  url: string;
  text: string;
  structured?: {
    tabs: Array<{ id: string; label: string }>;
    inputs: Array<{ id: string; type: string; label: string; required: boolean }>;
    buttons: Array<{ id: string; type: string; label: string; action: string }>;
    links: Array<{ text: string; href?: string }>;
  };
}

// Main Component
export default function AgentSettingsPage() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  // User is not currently used but kept for future use
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { user: _user } = useUser();
  
  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // State
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showPluginModal, setShowPluginModal] = useState(false);
  const [currentPlugin, setCurrentPlugin] = useState<{id: string, name: string} | null>(null);
  const [activeTab, setActiveTab] = useState("configuration");
  const [formState, setFormState] = useState<FormState>({
    name: "",
    welcomeMessage: "",
    collectUserInfo: false,
    systemPrompt: "You are a helpful AI assistant.",
    headerColor: "#3B82F6",
    accentColor: "#00D4FF",
    backgroundColor: "#FFFFFF",
    temperature: 0.7,
    formFields: []
  });

  // File upload state
  const [extractionUrl, setExtractionUrl] = useState("");
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractedContents, setExtractedContents] = useState<ExtractedContent[]>([]);
  
  // Color picker state
  const [isTopColorPopoverOpen, setIsTopColorPopoverOpen] = useState(false);
  const [isAccentColorPopoverOpen, setIsAccentColorPopoverOpen] = useState(false);
  const [isBackgroundColorPopoverOpen, setIsBackgroundColorPopoverOpen] = useState(false);

  // Convex mutations
  const updateAgent = useMutation(api.agents.update);
  const agent = useQuery(api.agents.get, { id: params.id as Id<"agents"> });

  // Update form state when agent data loads
  useEffect(() => {
    if (agent) {
      setFormState(prev => ({
        ...prev,
        name: agent.name || "",
        welcomeMessage: agent.welcomeMessage || "",
        collectUserInfo: agent.collectUserInfo || false,
        systemPrompt: agent.systemPrompt || "You are a helpful AI assistant.",
        headerColor: agent.headerColor || "#3B82F6",
        accentColor: agent.accentColor || "#00D4FF",
        backgroundColor: agent.backgroundColor || "#FFFFFF",
        temperature: agent.temperature || 0.7,
        formFields: agent.formFields || []
      }));
      setIsLoading(false);
    }
  }, [agent]);

  // Update form state helper
  const updateFormState = useCallback((updates: Partial<FormState>) => {
    setFormState(prev => ({
      ...prev,
      ...updates
    }));
  }, []);

  // Handle plugin card click
  const handlePluginClick = (plugin: {id: string, name: string}) => {
    setCurrentPlugin(plugin);
    setShowPluginModal(true);
  };

  // Handle form submission
  const handleSave = async () => {
    if (!formState.name.trim()) {
      toast({
        title: "Error",
        description: "Agent name is required",
        className: "bg-red-500 text-white"
      });
      return;
    }

    try {
      setIsLoading(true);
      
      // Ensure formFields is properly initialized and has at least one valid field
      const formFields = (Array.isArray(formState.formFields) ? formState.formFields : [])
        .filter(field => field && typeof field === 'object' && field.id)
        .map(field => ({
          id: String(field.id || `field-${Date.now()}`),
          type: String(field.type || 'text'),
          label: String(field.label || 'Untitled Field'),
          required: Boolean(field.required),
          value: field.value ? String(field.value) : ''
        }));
      
      // Add a default field if no valid fields exist
      const validatedFormFields = formFields.length > 0 ? formFields : [{
        id: `field-${Date.now()}`,
        type: 'text',
        label: 'Name',
        required: true,
        value: ''
      }];
      
      // Prepare the update data with all required fields
      const updateData = {
        id: params.id as Id<"agents">,
        name: String(formState.name || 'Untitled Agent').trim(),
        welcomeMessage: String(formState.welcomeMessage || '').trim(),
        systemPrompt: String(formState.systemPrompt || 'You are a helpful AI assistant.').trim(),
        temperature: typeof formState.temperature === 'number' ? 
          Math.max(0, Math.min(1, formState.temperature)) : 0.7,
        headerColor: /^#[0-9A-Fa-f]{6}$/.test(formState.headerColor) ? 
          formState.headerColor : "#3B82F6",
        accentColor: /^#[0-9A-Fa-f]{6}$/.test(formState.accentColor) ? 
          formState.accentColor : "#00D4FF",
        backgroundColor: /^#[0-9A-Fa-f]{6}$/.test(formState.backgroundColor) ? 
          formState.backgroundColor : "#FFFFFF",
        collectUserInfo: Boolean(formState.collectUserInfo),
        formFields: validatedFormFields
      };
      
      console.log('Sending update data:', JSON.stringify(updateData, null, 2));
      
      const result = await updateAgent(updateData);
      console.log('Update result:', result);
      
      toast({
        title: "Success",
        description: "Agent updated successfully",
        className: "bg-green-500 text-white"
      });
      
      router.push('/agents');
    } catch (error) {
      console.error("Error updating agent:", error);
      
      // Log more detailed error information
      if (error instanceof Error) {
        console.error('Error details:', {
          name: error.name,
          message: error.message,
          stack: error.stack,
          cause: error.cause
        });
      }
      
      toast({
        title: "Error",
        description: error instanceof Error ? 
          `Failed to update agent: ${error.message}` : 
          "An unknown error occurred while updating the agent.",
        className: "bg-red-500 text-white"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Process files for upload
  const processFiles = useCallback(async (files: FileList): Promise<{ processedFiles: string[]; errors: string[] }> => {
    const errors: string[] = [];
    const processedFiles: string[] = [];
    const allowedExtensions = ['.txt', '.md', '.json', '.pdf'];
    const allowedTypes = ['text/', 'application/pdf'];

    for (const file of Array.from(files)) {
      try {
        const fileExt = file.name.split('.').pop()?.toLowerCase() || '';
        const isAllowedType = allowedTypes.some(type => file.type.startsWith(type)) || 
                           allowedExtensions.includes(`.${fileExt}`);
        
        if (!isAllowedType) {
          throw new Error(`Unsupported file type: ${file.name}`);
        }

        processedFiles.push(file.name);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        errors.push(errorMessage);
      }
    }

    return { processedFiles, errors };
  }, []);

  // Handle file upload
  const handleFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    
    try {
      const { processedFiles, errors } = await processFiles(e.target.files);
      
      if (processedFiles.length > 0) {
        toast({
          title: "Success",
          description: `Processed ${processedFiles.length} file(s)`,
          className: "bg-green-500 text-white"
        });
      }
      if (errors.length > 0) {
        toast({
          title: "Error",
          description: `Failed to process files: ${errors.join(", ")}`,
          className: "bg-red-500 text-white"
        });
      }
    } catch (error) {
      console.error("Error processing files:", error);
      toast({
        title: "Error",
        description: "Failed to process files",
        className: "bg-red-500 text-white"
      });
    }
  }, [processFiles, toast]);

  // Handle URL extraction
  const handleExtract = useCallback(async () => {
    if (!extractionUrl) return;
    
    try {
      setIsExtracting(true);
      
      // This is a placeholder for actual extraction logic
      // In a real app, you would call an API to extract content from the URL
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const mockExtractedContent: ExtractedContent = {
        url: extractionUrl,
        text: `Extracted content from ${extractionUrl}`,
        structured: {
          tabs: [
            { id: 'tab1', label: 'Tab 1' },
            { id: 'tab2', label: 'Tab 2' }
          ],
          inputs: [
            { id: 'input1', type: 'text', label: 'Name', required: true },
            { id: 'input2', type: 'email', label: 'Email', required: true }
          ],
          buttons: [
            { id: 'btn1', type: 'submit', label: 'Submit', action: 'submit' },
            { id: 'btn2', type: 'reset', label: 'Reset', action: 'reset' }
          ],
          links: [
            { text: 'Privacy Policy', href: '#' },
            { text: 'Terms of Service', href: '#' }
          ]
        }
      };
      
      setExtractedContents(prev => [...prev, mockExtractedContent]);
      
      toast({
        title: 'Success',
        description: 'Content extracted successfully',
        className: 'bg-green-500 text-white'
      });
    } catch (error) {
      console.error('Error extracting content:', error);
      toast({
        title: 'Error',
        description: 'Failed to extract content from URL',
        className: 'bg-red-500 text-white'
      });
    } finally {
      setIsExtracting(false);
    }
  }, [extractionUrl]);

  // Remove a link from extracted content
  const removeLink = useCallback((index: number) => {
    setExtractedContents(prev => prev.filter((_, i) => i !== index));
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <div className="border-b p-4">
        <h2 className="text-lg font-semibold">Agent Settings</h2>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4">
        <Tabs 
          value={activeTab} 
          onValueChange={setActiveTab}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="configuration">Configuration</TabsTrigger>
            <TabsTrigger value="fine-tuning">Fine Tuning</TabsTrigger>
            <TabsTrigger value="style">Style</TabsTrigger>
            <TabsTrigger value="plugins">Plugins</TabsTrigger>
          </TabsList>
          
          <TabsContent value="configuration" className="mt-4">
            <Card>
              <CardContent className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Agent Name
                  </label>
                  <Input
                    value={formState.name}
                    onChange={(e) => updateFormState({ name: e.target.value })}
                    placeholder="My AI Agent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Welcome Message
                  </label>
                  <Textarea
                    value={formState.welcomeMessage}
                    onChange={(e) => updateFormState({ welcomeMessage: e.target.value })}
                    placeholder="Hello! How can I help you today?"
                    rows={3}
                  />
                </div>
                
                <div className="flex items-center space-x-2">
                  <Switch
                    id="collect-user-info"
                    checked={formState.collectUserInfo}
                    onCheckedChange={(checked) => updateFormState({ collectUserInfo: checked })}
                  />
                  <label htmlFor="collect-user-info" className="text-sm font-medium text-gray-700">
                    Collect user information
                  </label>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    System Prompt
                  </label>
                  <Textarea
                    value={formState.systemPrompt}
                    onChange={(e) => updateFormState({ systemPrompt: e.target.value })}
                    placeholder="You are a helpful AI assistant..."
                    rows={6}
                    className="font-mono text-sm"
                  />
                </div>
                
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-sm font-medium text-gray-700">
                      Temperature: {formState.temperature.toFixed(1)}
                    </label>
                    <span className="text-xs text-gray-500">
                      {formState.temperature < 0.3 
                        ? "Deterministic" 
                        : formState.temperature < 0.7 
                          ? "Balanced" 
                          : "Creative"}
                    </span>
                  </div>
                  <Slider
                    value={[formState.temperature]}
                    onValueChange={(value) => updateFormState({ temperature: value[0] })}
                    min={0}
                    max={1}
                    step={0.1}
                    className="w-full"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="fine-tuning" className="mt-4">
            <Card>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-medium mb-2">Add Knowledge Base</h3>
                    <p className="text-sm text-gray-500 mb-4">
                      Upload documents or add website URLs to train your AI agent.
                    </p>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Website URL
                        </label>
                        <div className="flex space-x-2">
                          <Input
                            value={extractionUrl}
                            onChange={(e) => setExtractionUrl(e.target.value)}
                            placeholder="https://example.com"
                            className="flex-1"
                          />
                          <Button 
                            onClick={handleExtract}
                            disabled={!extractionUrl || isExtracting}
                          >
                            {isExtracting ? 'Extracting...' : 'Extract'}
                          </Button>
                        </div>
                      </div>
                      
                      <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                          <div className="w-full border-t border-gray-300"></div>
                        </div>
                        <div className="relative flex justify-center text-sm">
                          <span className="px-2 bg-white text-gray-500">OR</span>
                        </div>
                      </div>
                      
                      <div>
                        <input
                          type="file"
                          ref={fileInputRef}
                          onChange={handleFileUpload}
                          className="hidden"
                          accept=".txt,.md,.json,.pdf,text/*,application/pdf"
                          multiple
                        />
                        <Button
                          variant="outline"
                          className="w-full"
                          onClick={() => fileInputRef.current?.click()}
                        >
                          <UploadIcon className="mr-2 h-4 w-4" />
                          Upload Files
                        </Button>
                        <p className="mt-1 text-xs text-gray-500">
                          Supported formats: .txt, .md, .json, .pdf (Max 10MB)
                        </p>
                      </div>
                      
                      {extractedContents.length > 0 && (
                        <div className="mt-4">
                          <h4 className="text-sm font-medium text-gray-700 mb-2">
                            Extracted Content
                          </h4>
                          <div className="space-y-2">
                            {extractedContents.map((content, index) => (
                              <div 
                                key={index}
                                className="flex items-center justify-between p-2 border rounded-md hover:bg-gray-50"
                              >
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium truncate">
                                    {content.url}
                                  </p>
                                  <p className="text-xs text-gray-500 truncate">
                                    {content.text.substring(0, 100)}{content.text.length > 100 ? '...' : ''}
                                  </p>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() => removeLink(index)}
                                >
                                  <Trash2 className="h-4 w-4 text-red-500" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="style" className="mt-4">
            <Card>
              <CardContent className="p-6 space-y-6">
                <div>
                  <h3 className="text-lg font-medium mb-4">Appearance</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Color Customization */}
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Header Color
                        </label>
                        <Popover
                          open={isTopColorPopoverOpen}
                          onOpenChange={setIsTopColorPopoverOpen}
                        >
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className="w-full justify-start"
                            >
                              <div
                                className="h-4 w-4 rounded-full mr-2"
                                style={{ backgroundColor: formState.headerColor }}
                              />
                              {formState.headerColor}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-64 p-4">
                            <div className="grid grid-cols-7 gap-2">
                              {['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#6B7280', '#000000'].map((color) => (
                                <button
                                  key={color}
                                  className="h-6 w-6 rounded-full border border-gray-200"
                                  style={{ backgroundColor: color }}
                                  onClick={() => {
                                    updateFormState({ headerColor: color });
                                    setIsTopColorPopoverOpen(false);
                                  }}
                                />
                              ))}
                            </div>
                            <div className="mt-4">
                              <input
                                type="color"
                                value={formState.headerColor}
                                onChange={(e) => updateFormState({ headerColor: e.target.value })}
                                className="w-full"
                              />
                            </div>
                          </PopoverContent>
                        </Popover>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Accent Color
                        </label>
                        <Popover
                          open={isAccentColorPopoverOpen}
                          onOpenChange={setIsAccentColorPopoverOpen}
                        >
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className="w-full justify-start"
                            >
                              <div
                                className="h-4 w-4 rounded-full mr-2"
                                style={{ backgroundColor: formState.accentColor }}
                              />
                              {formState.accentColor}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-64 p-4">
                            <div className="grid grid-cols-7 gap-2">
                              {['#00D4FF', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#6B7280', '#000000'].map((color) => (
                                <button
                                  key={color}
                                  className="h-6 w-6 rounded-full border border-gray-200"
                                  style={{ backgroundColor: color }}
                                  onClick={() => {
                                    updateFormState({ accentColor: color });
                                    setIsAccentColorPopoverOpen(false);
                                  }}
                                />
                              ))}
                            </div>
                            <div className="mt-4">
                              <input
                                type="color"
                                value={formState.accentColor}
                                onChange={(e) => updateFormState({ accentColor: e.target.value })}
                                className="w-full"
                              />
                            </div>
                          </PopoverContent>
                        </Popover>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Background Color
                        </label>
                        <Popover
                          open={isBackgroundColorPopoverOpen}
                          onOpenChange={setIsBackgroundColorPopoverOpen}
                        >
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className="w-full justify-start"
                            >
                              <div
                                className="h-4 w-4 rounded-full border border-gray-300"
                                style={{ backgroundColor: formState.backgroundColor }}
                              />
                              {formState.backgroundColor}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-64 p-4">
                            <div className="grid grid-cols-7 gap-2">
                              {['#FFFFFF', '#F9FAFB', '#F3F4F6', '#E5E7EB', '#D1D5DB', '#9CA3AF', '#6B7280'].map((color) => (
                                <button
                                  key={color}
                                  className="h-6 w-6 rounded-full border border-gray-200"
                                  style={{ backgroundColor: color }}
                                  onClick={() => {
                                    updateFormState({ backgroundColor: color });
                                    setIsBackgroundColorPopoverOpen(false);
                                  }}
                                />
                              ))}
                            </div>
                            <div className="mt-4">
                              <input
                                type="color"
                                value={formState.backgroundColor}
                                onChange={(e) => updateFormState({ backgroundColor: e.target.value })}
                                className="w-full"
                              />
                            </div>
                          </PopoverContent>
                        </Popover>
                      </div>
                    </div>
                    
                    {/* Preview Section */}
                    <div className="border rounded-lg overflow-hidden"
                      style={{
                        backgroundColor: formState.backgroundColor,
                        color: formState.headerColor === '#FFFFFF' ? '#000000' : '#FFFFFF'
                      }}
                    >
                      {/* Chat Header */}
                      <div 
                        className="p-4 flex items-center justify-between"
                        style={{ backgroundColor: formState.headerColor }}
                      >
                        <div className="flex items-center space-x-3">
                          <div 
                            className="h-8 w-8 rounded-full flex items-center justify-center text-sm font-medium"
                            style={{ 
                              backgroundColor: formState.accentColor,
                              color: formState.headerColor === formState.accentColor 
                                ? (formState.backgroundColor === '#FFFFFF' ? '#000000' : '#FFFFFF')
                                : (formState.headerColor === '#FFFFFF' ? '#000000' : '#FFFFFF')
                            }}
                          >
                            AI
                          </div>
                          <div>
                            <p className="font-medium">AI Assistant</p>
                            <p className="text-xs opacity-70">Online</p>
                          </div>
                        </div>
                      </div>
                      
                      {/* Chat Body */}
                      <div className="p-4 space-y-4 h-48 overflow-y-auto">
                        <div className="flex justify-start">
                          <div 
                            className="px-4 py-2 rounded-lg max-w-xs"
                            style={{ 
                              backgroundColor: formState.accentColor,
                              color: formState.headerColor === formState.accentColor 
                                ? (formState.backgroundColor === '#FFFFFF' ? '#000000' : '#FFFFFF')
                                : (formState.headerColor === '#FFFFFF' ? '#000000' : '#FFFFFF')
                            }}
                          >
                            {formState.welcomeMessage || "Hello! How can I help you today?"}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="plugins" className="mt-4">
            <Card>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Available Plugins</h3>
                  <p className="text-sm text-gray-500">
                    Enable plugins to extend your agent's capabilities.
                  </p>
                  
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-4">
                    {[
                      { id: 'wordpress', name: 'WordPress' },
                      { id: 'whatsapp', name: 'WhatsApp' },
                      { id: 'html-css', name: 'HTML & CSS' },
                      { id: 'instagram', name: 'Instagram' },
                      { id: 'messenger', name: 'Messenger' },
                      { id: 'telegram', name: 'Telegram' },
                      { id: 'discord', name: 'Discord' },
                    ].map((plugin) => (
                      <div 
                        key={plugin.id} 
                        className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer"
                        onClick={() => handlePluginClick(plugin)}
                      >
                        <div className="flex items-center space-x-3">
                          <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                            <Puzzle className="h-5 w-5 text-gray-500" />
                          </div>
                          <div>
                            <p className="font-medium">{plugin.name}</p>
                            <p className="text-xs text-gray-500">Plugin</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      
      <div className="border-t p-4 flex justify-end space-x-2">
        <Button variant="outline" onClick={() => router.back()}>Cancel</Button>
        <Button onClick={handleSave} disabled={isLoading}>
          {isLoading ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>

      {/* Plugin Integration Modal */}
      <Dialog open={showPluginModal} onOpenChange={setShowPluginModal}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{currentPlugin?.name} Integration</DialogTitle>
            <DialogDescription>
              Add this code to your website to integrate the {currentPlugin?.name} plugin.
            </DialogDescription>
          </DialogHeader>
          
          {currentPlugin?.id === 'html-css' && (
            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">1. Add this to your HTML's &lt;head&gt; section:</h4>
                <pre className="bg-gray-100 p-4 rounded-md overflow-x-auto text-sm">
{`<link rel="stylesheet" href="http://localhost:8005/chat-widget.css">
<script src="http://localhost:8005/chat-widget.js"></script>`}
                </pre>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">2. Add this script before the closing &lt;/body&gt; tag:</h4>
                <pre className="bg-gray-100 p-4 rounded-md overflow-x-auto text-sm">
{`<script>
  window.ChatWidget.init({
    agentId: '${params.id}',
    apiBaseUrl: window.location.origin,
    theme: {
      primaryColor: '#4f46e5',
      accentColor: '#6366f1',
      backgroundColor: '#ffffff',
      textColor: '#1f2937'
    },
    texts: {
      title: 'Chat with us',
      subtitle: 'How can we help?',
      placeholder: 'Type a message...',
      sendButton: 'Send'
    }
  });
</script>`}
                </pre>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">3. Optional: Control the widget programmatically</h4>
                <pre className="bg-gray-100 p-4 rounded-md overflow-x-auto text-sm">
{`// Show/hide the widget
window.ChatWidget.show();
window.ChatWidget.hide();

// Toggle visibility
window.ChatWidget.toggle();

// Check if widget is open
const isOpen = window.ChatWidget.isOpen();

// Listen for events
window.ChatWidget.on('message', (message) => {
  console.log('New message:', message);
});`}
                </pre>
              </div>
            </div>
          )}
          
          {currentPlugin?.id !== 'html-css' && (
            <div className="text-center py-8">
              <p className="text-gray-500">Integration guide for {currentPlugin?.name} will be available soon.</p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
