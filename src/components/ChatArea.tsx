'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Send, Loader2, Bot, User, Copy, Check } from 'lucide-react';
import { Message } from '@/types';

interface ChatAreaProps {
  messages: Message[];
  onSendMessage: (content: string) => void;
  isLoading: boolean;
  sidebarOpen: boolean;
}

export default function ChatArea({ messages, onSendMessage, isLoading, sidebarOpen }: ChatAreaProps) {
  const [input, setInput] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isLoading) {
      onSendMessage(input.trim());
      setInput('');
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    // Auto-resize textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 200) + 'px';
    }
  };

  const copyToClipboard = async (content: string, id: string) => {
    await navigator.clipboard.writeText(content);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div
      className={`flex flex-col h-screen transition-all duration-300 ${
        sidebarOpen ? 'ml-65' : 'ml-0'
      }`}
    >
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center px-4">
            <div className="text-center max-w-2xl">
              <div
                className="w-16 h-16 rounded-full mx-auto mb-6 flex items-center justify-center"
                style={{ background: 'var(--primary)' }}
              >
                <Bot className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-2xl font-semibold mb-2">How can I help you today?</h1>
              <p className="opacity-60 mb-8">
                Upload documents in the sidebar and ask me questions about them, or just start a
                conversation.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-left">
                {[
                  'Summarize the uploaded document',
                  'What are the key points?',
                  'Explain the main concepts',
                  'Find specific information',
                ].map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => setInput(suggestion)}
                    className="p-4 rounded-xl border hover:bg-(--hover-bg) transition-colors text-left"
                    style={{ borderColor: 'var(--border-color)' }}
                  >
                    <span className="text-sm">{suggestion}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="max-w-3xl mx-auto py-8 px-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`mb-6 ${message.role === 'user' ? 'flex justify-end' : ''}`}
              >
                <div
                  className={`flex gap-4 max-w-[85%] ${
                    message.role === 'user' ? 'flex-row-reverse' : ''
                  }`}
                >
                  {/* Avatar */}
                  <div
                    className={`w-8 h-8 rounded-full shrink-0 flex items-center justify-center ${
                      message.role === 'user' ? 'bg-blue-600' : ''
                    }`}
                    style={message.role === 'assistant' ? { background: 'var(--primary)' } : {}}
                  >
                    {message.role === 'user' ? (
                      <User className="w-5 h-5 text-white" />
                    ) : (
                      <Bot className="w-5 h-5 text-white" />
                    )}
                  </div>

                  {/* Message Content */}
                  <div className="flex-1">
                    <div
                      className={`rounded-2xl px-4 py-3 ${
                        message.role === 'user'
                          ? 'bg-blue-600 text-white rounded-tr-sm'
                          : 'bg-(--user-message-bg) rounded-tl-sm'
                      }`}
                    >
                      <p className="whitespace-pre-wrap">{message.content}</p>
                    </div>
                    <div
                      className={`flex items-center gap-2 mt-1 text-xs opacity-50 ${
                        message.role === 'user' ? 'justify-end' : ''
                      }`}
                    >
                      <span>{formatTime(message.timestamp)}</span>
                      {message.role === 'assistant' && (
                        <button
                          onClick={() => copyToClipboard(message.content, message.id)}
                          className="p-1 hover:opacity-100 opacity-60 transition-opacity"
                        >
                          {copiedId === message.id ? (
                            <Check className="w-3 h-3" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {/* Loading Indicator */}
            {isLoading && (
              <div className="mb-6">
                <div className="flex gap-4 max-w-[85%]">
                  <div
                    className="w-8 h-8 rounded-full shrink-0 flex items-center justify-center"
                    style={{ background: 'var(--primary)' }}
                  >
                    <Bot className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="rounded-2xl rounded-tl-sm px-4 py-3 bg-(--user-message-bg)">
                      <div className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span className="opacity-60">Thinking...</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="border-t p-4" style={{ borderColor: 'var(--border-color)' }}>
        <form onSubmit={handleSubmit} className="max-w-3xl mx-auto">
          <div
            className="flex items-end gap-3 rounded-2xl border p-3"
            style={{
              background: 'var(--input-bg)',
              borderColor: 'var(--input-border)',
            }}
          >
            <textarea
              ref={textareaRef}
              value={input}
              onChange={handleTextareaChange}
              onKeyDown={handleKeyDown}
              placeholder="Message School Agent..."
              rows={1}
              className="flex-1 resize-none bg-transparent outline-none placeholder-opacity-50 max-h-50"
              style={{ minHeight: '24px' }}
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className={`p-2 rounded-lg transition-all ${
                input.trim() && !isLoading
                  ? 'bg-(--primary) hover:bg-(--primary-hover) text-white'
                  : 'opacity-40 cursor-not-allowed'
              }`}
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </button>
          </div>
          <p className="text-xs text-center mt-2 opacity-50">
            School Agent can make mistakes. Please verify important information.
          </p>
        </form>
      </div>
    </div>
  );
}
