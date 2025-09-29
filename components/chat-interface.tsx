import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
}

interface ChatInterfaceProps {
  assistantName: string;
  profileImage?: string;
  welcomeMessage: string;
  headerColor: string;
  accentColor: string;
  // Should return the assistant's reply to display
  onSendMessage: (message: string) => Promise<string | void> | string | void;
  // Called when user clicks the reload button in the header
  onReload?: () => void;
  className?: string;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({
  assistantName,
  profileImage,
  welcomeMessage,
  headerColor,
  accentColor = '#3B82F6', // Default blue color if not provided
  onSendMessage,
  onReload,
  className = ''
}) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: welcomeMessage,
      role: 'assistant',
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const handleReload = () => {
    // Reset local chat state to initial welcome message
    setMessages([
      {
        id: '1',
        content: welcomeMessage,
        role: 'assistant',
        timestamp: new Date()
      }
    ]);
    setInputValue('');
    // Let parent clear any external session state
    onReload?.();
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      content: inputValue,
      role: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, newMessage]);
    const outgoing = inputValue;
    setInputValue('');

    try {
      const maybeReply = await onSendMessage(outgoing);
      const replyText = typeof maybeReply === 'string' && maybeReply.trim().length > 0
        ? maybeReply
        : '...';
      const assistantMsg: Message = {
        id: (Date.now() + 1).toString(),
        content: replyText,
        role: 'assistant',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, assistantMsg]);
    } catch (err) {
      const assistantMsg: Message = {
        id: (Date.now() + 1).toString(),
        content: 'Sorry, I had trouble responding.',
        role: 'assistant',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, assistantMsg]);
      console.error('[ChatInterface] onSendMessage failed:', err);
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Header */}
      <div className="p-4 flex items-center justify-between border-b" style={{ backgroundColor: headerColor }}>
        <div className="flex items-center">
          {profileImage ? (
            <Image
              src={profileImage}
              alt={assistantName}
              width={40}
              height={40}
              className="rounded-full mr-3"
            />
          ) : (
            <div
              className="w-10 h-10 rounded-full mr-3 flex items-center justify-center text-white"
              style={{ backgroundColor: accentColor }}
            >
              {assistantName.charAt(0).toUpperCase()}
            </div>
          )}
          <h2 className="text-lg font-semibold text-white">{assistantName}</h2>
        </div>
        <button
          onClick={handleReload}
          title="Reload chat"
          className="text-white hover:bg-white/20 p-2 rounded-full"
        >
          {/* Refresh/Reload icon */}
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="23 4 23 10 17 10" />
            <polyline points="1 20 1 14 7 14" />
            <path d="M3.51 9a9 9 0 0 1 14.13-3.36L23 10" />
            <path d="M20.49 15a9 9 0 0 1-14.13 3.36L1 14" />
          </svg>
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div 
            key={message.id}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {message.role === 'assistant' && profileImage && (
              <Image 
                src={profileImage} 
                alt={assistantName} 
                width={32}
                height={32}
                className="rounded-full mr-2 self-end mb-2"
              />
            )}
            <div 
              className={`max-w-[80%] p-3 rounded-lg ${
                message.role === 'user' 
                  ? 'text-white' 
                  : 'bg-gray-100 text-gray-800'
              }`}
              style={message.role === 'user' ? { backgroundColor: accentColor } : {}}
            >
              <p className="text-sm">
                {message.id === '1' && message.role === 'assistant' 
                  ? welcomeMessage 
                  : message.content}
              </p>
              <p className="text-xs opacity-70 mt-1">
                {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSendMessage} className="p-4 border-t">
        <div className="flex space-x-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            className="px-4 py-2 text-white rounded-md hover:opacity-90 focus:outline-none focus:ring-2 transition-opacity"
            style={{ 
              backgroundColor: accentColor,
              '--tw-ring-color': `${accentColor}80`
            } as React.CSSProperties}
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
};

export default ChatInterface;
