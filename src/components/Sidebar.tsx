'use client';

import React, { useState, useRef } from 'react';
import {
  Plus,
  FileText,
  Upload,
  Trash2,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Moon,
  Sun,
  Loader2,
  X,
  File,
  CheckCircle,
  AlertCircle,
  ClipboardList,
  CalendarDays,
  UserCheck,
  GraduationCap,
} from 'lucide-react';
import { Document, Chat } from '@/types';

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  documents: Document[];
  onDocumentUpload: (files: FileList) => void;
  onDocumentDelete: (id: string) => void;
  chats: Chat[];
  currentChatId: string | null;
  onChatSelect: (id: string) => void;
  onNewChat: () => void;
  onChatDelete: (id: string) => void;
  isDarkMode: boolean;
  onThemeToggle: () => void;
  currentPage: 'chat' | 'attendance' | 'monthly-attendance' | 'exam' | 'monthly-exam';
  onPageChange: (page: 'chat' | 'attendance' | 'monthly-attendance' | 'exam' | 'monthly-exam') => void;
}

export default function Sidebar({
  isOpen,
  onToggle,
  documents,
  onDocumentUpload,
  onDocumentDelete,
  chats,
  currentChatId,
  onChatSelect,
  onNewChat,
  onChatDelete,
  isDarkMode,
  onThemeToggle,
  currentPage,
  onPageChange,
}: SidebarProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isAttendanceExpanded, setIsAttendanceExpanded] = useState(false);
  const [isExamExpanded, setIsExamExpanded] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files.length > 0) {
      onDocumentUpload(e.dataTransfer.files);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onDocumentUpload(e.target.files);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const getStatusIcon = (status: Document['status']) => {
    switch (status) {
      case 'uploading':
      case 'processing':
        return <Loader2 className="w-4 h-4 animate-spin text-blue-500" />;
      case 'ready':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
    }
  };

  return (
    <>
      {/* Toggle Button */}
      <button
        onClick={onToggle}
        className={`fixed top-4 z-50 p-2 rounded-lg transition-all duration-300 hover:bg-(--hover-bg) ${
          isOpen ? 'left-67' : 'left-4'
        }`}
        style={{ background: 'var(--sidebar-bg)', border: '1px solid var(--border-color)' }}
      >
        {isOpen ? <ChevronLeft className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
      </button>

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 h-full z-40 transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{
          width: '260px',
          background: 'var(--sidebar-bg)',
          borderRight: '1px solid var(--border-color)',
        }}
      >
        <div className="flex flex-col h-full p-3">
          {/* New Chat Button */}
          <button
            onClick={() => {
              onNewChat();
              onPageChange('chat');
            }}
            className={`flex items-center gap-3 w-full p-3 rounded-lg border transition-colors hover:bg-(--hover-bg) ${
              currentPage === 'chat' ? 'bg-(--hover-bg)' : ''
            }`}
            style={{ borderColor: 'var(--border-color)' }}
          >
            <Plus className="w-5 h-5" />
            <span className="font-medium">New Chat</span>
          </button>

          {/* Attendance Section with Submenu */}
          <div className="mt-2">
            <button
              onClick={() => setIsAttendanceExpanded(!isAttendanceExpanded)}
              className={`flex items-center gap-3 w-full p-3 rounded-lg border transition-colors hover:bg-(--hover-bg) ${
                currentPage === 'attendance' || currentPage === 'monthly-attendance' ? 'bg-(--hover-bg)' : ''
              }`}
              style={{ borderColor: 'var(--border-color)' }}
            >
              <ClipboardList className="w-5 h-5" />
              <span className="font-medium flex-1 text-left">Attendance</span>
              <ChevronDown
                className={`w-4 h-4 transition-transform ${
                  isAttendanceExpanded ? 'rotate-180' : ''
                }`}
              />
            </button>
            
            {/* Submenu */}
            {isAttendanceExpanded && (
              <div className="ml-4 mt-1 space-y-1">
                <button
                  onClick={() => onPageChange('attendance')}
                  className={`flex items-center gap-3 w-full p-2 pl-3 rounded-lg transition-colors hover:bg-(--hover-bg) ${
                    currentPage === 'attendance' ? 'bg-(--hover-bg)' : ''
                  }`}
                >
                  <UserCheck className="w-4 h-4" />
                  <span className="text-sm">Mark Attendance</span>
                </button>
                <button
                  onClick={() => onPageChange('monthly-attendance')}
                  className={`flex items-center gap-3 w-full p-2 pl-3 rounded-lg transition-colors hover:bg-(--hover-bg) ${
                    currentPage === 'monthly-attendance' ? 'bg-(--hover-bg)' : ''
                  }`}
                >
                  <CalendarDays className="w-4 h-4" />
                  <span className="text-sm">Monthly View</span>
                </button>
              </div>
            )}
          </div>

          {/* Exam Section with Submenu */}
          <div className="mt-2">
            <button
              onClick={() => setIsExamExpanded(!isExamExpanded)}
              className={`flex items-center gap-3 w-full p-3 rounded-lg border transition-colors hover:bg-(--hover-bg) ${
                currentPage === 'exam' || currentPage === 'monthly-exam' ? 'bg-(--hover-bg)' : ''
              }`}
              style={{ borderColor: 'var(--border-color)' }}
            >
              <GraduationCap className="w-5 h-5" />
              <span className="font-medium flex-1 text-left">Exam Results</span>
              <ChevronDown
                className={`w-4 h-4 transition-transform ${
                  isExamExpanded ? 'rotate-180' : ''
                }`}
              />
            </button>
            
            {/* Submenu */}
            {isExamExpanded && (
              <div className="ml-4 mt-1 space-y-1">
                <button
                  onClick={() => onPageChange('exam')}
                  className={`flex items-center gap-3 w-full p-2 pl-3 rounded-lg transition-colors hover:bg-(--hover-bg) ${
                    currentPage === 'exam' ? 'bg-(--hover-bg)' : ''
                  }`}
                >
                  <UserCheck className="w-4 h-4" />
                  <span className="text-sm">Enter Marks</span>
                </button>
                <button
                  onClick={() => onPageChange('monthly-exam')}
                  className={`flex items-center gap-3 w-full p-2 pl-3 rounded-lg transition-colors hover:bg-(--hover-bg) ${
                    currentPage === 'monthly-exam' ? 'bg-(--hover-bg)' : ''
                  }`}
                >
                  <CalendarDays className="w-4 h-4" />
                  <span className="text-sm">Monthly View</span>
                </button>
              </div>
            )}
          </div>

          {/* Document Upload Area */}
          <div className="mt-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider opacity-60 mb-2 px-2">
              Documents
            </h3>
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-all ${
                isDragging
                  ? 'border-(--primary) bg-(--primary)/10'
                  : 'border-(--border-color) hover:border-(--primary)/50'
              }`}
            >
              <Upload className="w-8 h-8 mx-auto mb-2 opacity-60" />
              <p className="text-sm opacity-70">Drop files here or click to upload</p>
              <p className="text-xs opacity-50 mt-1">PDF, DOC, TXT supported</p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".pdf,.doc,.docx,.txt"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>

          {/* Document List */}
          {documents.length > 0 && (
            <div className="mt-4 shrink-0 max-h-50 overflow-y-auto">
              <div className="space-y-1">
                {documents.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center gap-2 p-2 rounded-lg hover:bg-(--hover-bg) group"
                  >
                    <File className="w-4 h-4 shrink-0 opacity-60" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm truncate">{doc.name}</p>
                      <p className="text-xs opacity-50">{formatFileSize(doc.size)}</p>
                    </div>
                    {getStatusIcon(doc.status)}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDocumentDelete(doc.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-500/20 rounded transition-opacity"
                    >
                      <X className="w-4 h-4 text-red-500" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Chat History */}
          <div className="mt-4 flex-1 overflow-hidden flex flex-col">
            <h3 className="text-xs font-semibold uppercase tracking-wider opacity-60 mb-2 px-2">
              Chat History
            </h3>
            <div className="flex-1 overflow-y-auto space-y-1">
              {chats.map((chat) => (
                <div
                  key={chat.id}
                  onClick={() => onChatSelect(chat.id)}
                  className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer group transition-colors ${
                    currentChatId === chat.id
                      ? 'bg-(--hover-bg)'
                      : 'hover:bg-(--hover-bg)'
                  }`}
                >
                  <MessageSquare className="w-4 h-4 shrink-0 opacity-60" />
                  <span className="flex-1 text-sm truncate">{chat.title}</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onChatDelete(chat.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-500/20 rounded transition-opacity"
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Theme Toggle */}
          <div className="mt-auto pt-4 border-t" style={{ borderColor: 'var(--border-color)' }}>
            <button
              onClick={onThemeToggle}
              className="flex items-center gap-3 w-full p-3 rounded-lg hover:bg-(--hover-bg) transition-colors"
            >
              {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              <span className="text-sm">{isDarkMode ? 'Light Mode' : 'Dark Mode'}</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
