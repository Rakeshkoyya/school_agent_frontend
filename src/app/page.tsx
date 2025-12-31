'use client';

import { useState, useEffect } from 'react';
import { Sidebar, ChatArea, AttendancePage, ExamPage } from '@/components';
import { Message, Document, Chat } from '@/types';

export default function Home() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [chats, setChats] = useState<Chat[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState<'chat' | 'attendance' | 'exam'>('chat');

  // Initialize with dark mode
  useEffect(() => {
    document.documentElement.classList.add('dark');
  }, []);

  // Handle theme toggle
  const handleThemeToggle = () => {
    setIsDarkMode(!isDarkMode);
    document.documentElement.classList.toggle('dark');
  };

  // Generate unique ID
  const generateId = () => Math.random().toString(36).substring(2, 15);

  // Handle document upload
  const handleDocumentUpload = (files: FileList) => {
    const newDocuments: Document[] = Array.from(files).map((file) => ({
      id: generateId(),
      name: file.name,
      size: file.size,
      type: file.type,
      uploadedAt: new Date(),
      status: 'uploading' as const,
    }));

    setDocuments((prev) => [...prev, ...newDocuments]);

    // Simulate upload progress
    newDocuments.forEach((doc) => {
      setTimeout(() => {
        setDocuments((prev) =>
          prev.map((d) => (d.id === doc.id ? { ...d, status: 'processing' as const } : d))
        );
      }, 1000);

      setTimeout(() => {
        setDocuments((prev) =>
          prev.map((d) => (d.id === doc.id ? { ...d, status: 'ready' as const } : d))
        );
      }, 2500);
    });
  };

  // Handle document delete
  const handleDocumentDelete = (id: string) => {
    setDocuments((prev) => prev.filter((d) => d.id !== id));
  };

  // Handle new chat
  const handleNewChat = () => {
    const newChat: Chat = {
      id: generateId(),
      title: 'New Chat',
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    setChats((prev) => [newChat, ...prev]);
    setCurrentChatId(newChat.id);
    setMessages([]);
  };

  // Handle chat select
  const handleChatSelect = (id: string) => {
    setCurrentChatId(id);
    const chat = chats.find((c) => c.id === id);
    if (chat) {
      setMessages(chat.messages);
    }
  };

  // Handle chat delete
  const handleChatDelete = (id: string) => {
    setChats((prev) => prev.filter((c) => c.id !== id));
    if (currentChatId === id) {
      setCurrentChatId(null);
      setMessages([]);
    }
  };

  // Handle send message
  const handleSendMessage = async (content: string) => {
    // Create user message
    const userMessage: Message = {
      id: generateId(),
      role: 'user',
      content,
      timestamp: new Date(),
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);

    // Update or create chat
    if (!currentChatId) {
      const newChat: Chat = {
        id: generateId(),
        title: content.slice(0, 30) + (content.length > 30 ? '...' : ''),
        messages: newMessages,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      setChats((prev) => [newChat, ...prev]);
      setCurrentChatId(newChat.id);
    } else {
      setChats((prev) =>
        prev.map((c) =>
          c.id === currentChatId
            ? {
                ...c,
                messages: newMessages,
                updatedAt: new Date(),
                title:
                  c.messages.length === 0
                    ? content.slice(0, 30) + (content.length > 30 ? '...' : '')
                    : c.title,
              }
            : c
        )
      );
    }

    // Call backend API
    setIsLoading(true);

    try {
      const response = await fetch('http://127.0.0.1:8000/api/query', {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question: content,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      const assistantMessage: Message = {
        id: generateId(),
        role: 'assistant',
        content: data.answer || data.response || data.message || JSON.stringify(data),
        timestamp: new Date(),
      };

      setMessages((prev) => {
        const updated = [...prev, assistantMessage];
        // Update chat with new message
        setChats((prevChats) =>
          prevChats.map((c) =>
            c.id === currentChatId ? { ...c, messages: updated, updatedAt: new Date() } : c
          )
        );
        return updated;
      });
    } catch (error) {
      console.error('Error calling backend:', error);
      
      const errorMessage: Message = {
        id: generateId(),
        role: 'assistant',
        content: `Sorry, I couldn't connect to the server. Please make sure the backend is running at http://127.0.0.1:8000\n\nError: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date(),
      };

      setMessages((prev) => {
        const updated = [...prev, errorMessage];
        setChats((prevChats) =>
          prevChats.map((c) =>
            c.id === currentChatId ? { ...c, messages: updated, updatedAt: new Date() } : c
          )
        );
        return updated;
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="h-screen overflow-hidden" style={{ background: 'var(--chat-bg)' }}>
      <Sidebar
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
        documents={documents}
        onDocumentUpload={handleDocumentUpload}
        onDocumentDelete={handleDocumentDelete}
        chats={chats}
        currentChatId={currentChatId}
        onChatSelect={(id) => {
          handleChatSelect(id);
          setCurrentPage('chat');
        }}
        onNewChat={handleNewChat}
        onChatDelete={handleChatDelete}
        isDarkMode={isDarkMode}
        onThemeToggle={handleThemeToggle}
        currentPage={currentPage}
        onPageChange={setCurrentPage}
      />
      <div
        className={`h-full transition-all duration-300 ${
          sidebarOpen ? 'ml-[260px]' : 'ml-0'
        }`}
      >
        {currentPage === 'chat' ? (
          <ChatArea
            messages={messages}
            onSendMessage={handleSendMessage}
            isLoading={isLoading}
            sidebarOpen={sidebarOpen}
          />
        ) : currentPage === 'attendance' ? (
          <AttendancePage isDarkMode={isDarkMode} />
        ) : (
          <ExamPage isDarkMode={isDarkMode} />
        )}
      </div>
    </main>
  );
}
