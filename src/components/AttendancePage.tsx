'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Users,
  Calendar,
  CheckCircle,
  XCircle,
  Loader2,
  AlertCircle,
  ChevronDown,
  Upload,
  FileSpreadsheet,
  X,
} from 'lucide-react';
import { ClassSection, Student, AttendanceRecord, AttendancePayload, AttendanceResponse } from '@/types';

const API_BASE_URL = 'http://localhost:8000';

interface AttendancePageProps {
  isDarkMode: boolean;
}

export default function AttendancePage({ isDarkMode }: AttendancePageProps) {
  const [classes, setClasses] = useState<ClassSection[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [students, setStudents] = useState<Student[]>([]);
  const [attendance, setAttendance] = useState<Record<number, 'Present' | 'Absent'>>({});
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  
  const [isLoadingClasses, setIsLoadingClasses] = useState(false);
  const [isLoadingStudents, setIsLoadingStudents] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // File upload states
  const [isDragging, setIsDragging] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResponse, setUploadResponse] = useState<{
    success: boolean;
    message: string;
    total_records?: number;
    inserted_records?: number;
    updated_records?: number;
    new_students_created?: number;
    errors?: string[];
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch classes on component mount
  useEffect(() => {
    fetchClasses();
  }, []);

  // Fetch students when class is selected
  useEffect(() => {
    if (selectedClass) {
      fetchStudents(selectedClass);
    } else {
      setStudents([]);
      setAttendance({});
    }
  }, [selectedClass]);

  const fetchClasses = async () => {
    setIsLoadingClasses(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/api/attendance/classes`, {
        headers: { 'accept': 'application/json' },
      });
      if (!response.ok) throw new Error('Failed to fetch classes');
      const data: ClassSection[] = await response.json();
      setClasses(data);
    } catch (err) {
      setError('Failed to load classes. Please try again.');
      console.error('Error fetching classes:', err);
    } finally {
      setIsLoadingClasses(false);
    }
  };

  const fetchStudents = async (classSection: string) => {
    setIsLoadingStudents(true);
    setError(null);
    setStudents([]);
    setAttendance({});
    try {
      const response = await fetch(`${API_BASE_URL}/api/attendance/students/${classSection}`, {
        headers: { 'accept': 'application/json' },
      });
      if (!response.ok) throw new Error('Failed to fetch students');
      const data: Student[] = await response.json();
      setStudents(data);
      // Initialize all students as Present by default
      const initialAttendance: Record<number, 'Present' | 'Absent'> = {};
      data.forEach((student) => {
        initialAttendance[student.student_id] = 'Present';
      });
      setAttendance(initialAttendance);
    } catch (err) {
      setError('Failed to load students. Please try again.');
      console.error('Error fetching students:', err);
    } finally {
      setIsLoadingStudents(false);
    }
  };

  const toggleAttendance = (studentId: number) => {
    setAttendance((prev) => ({
      ...prev,
      [studentId]: prev[studentId] === 'Present' ? 'Absent' : 'Present',
    }));
  };

  const markAllPresent = () => {
    const newAttendance: Record<number, 'Present' | 'Absent'> = {};
    students.forEach((student) => {
      newAttendance[student.student_id] = 'Present';
    });
    setAttendance(newAttendance);
  };

  const markAllAbsent = () => {
    const newAttendance: Record<number, 'Present' | 'Absent'> = {};
    students.forEach((student) => {
      newAttendance[student.student_id] = 'Absent';
    });
    setAttendance(newAttendance);
  };

  const handleSubmit = async () => {
    if (!selectedClass || students.length === 0) {
      setError('Please select a class and ensure students are loaded.');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    const records: AttendanceRecord[] = students.map((student) => ({
      student_id: student.student_id,
      status: attendance[student.student_id] || 'Present',
    }));

    const payload: AttendancePayload = {
      class_section: selectedClass,
      date: date,
      records: records,
    };

    try {
      const response = await fetch(`${API_BASE_URL}/api/attendance/attendance`, {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error('Failed to submit attendance');

      const data: AttendanceResponse = await response.json();
      setSuccess(data.message);
    } catch (err) {
      setError('Failed to submit attendance. Please try again.');
      console.error('Error submitting attendance:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const presentCount = Object.values(attendance).filter((s) => s === 'Present').length;
  const absentCount = Object.values(attendance).filter((s) => s === 'Absent').length;

  // File upload handlers
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
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleFileSelect = (file: File) => {
    // Validate file type
    const validTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      '.xlsx',
      '.xls'
    ];
    const fileExtension = file.name.toLowerCase().split('.').pop();
    
    if (!validTypes.includes(file.type) && !['xlsx', 'xls'].includes(fileExtension || '')) {
      setError('Please upload a valid Excel file (.xlsx or .xls)');
      return;
    }
    
    setUploadedFile(file);
    setError(null);
    setUploadResponse(null);
  };

  const handleFileUpload = async () => {
    if (!uploadedFile) return;

    setIsUploading(true);
    setError(null);
    setSuccess(null);
    setUploadResponse(null);

    const formData = new FormData();
    formData.append('file', uploadedFile);

    try {
      const response = await fetch(`${API_BASE_URL}/api/attendance/upload-excel`, {
        method: 'POST',
        headers: {
          'accept': 'application/json',
        },
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || data.message || 'Failed to upload file');
      }

      setUploadResponse(data);
      if (data.success) {
        setSuccess(data.message);
        setUploadedFile(null);
      } else {
        setError(data.message || 'Upload failed');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to upload file. Please try again.';
      setError(errorMessage);
      console.error('Error uploading file:', err);
    } finally {
      setIsUploading(false);
    }
  };

  const clearUploadedFile = () => {
    setUploadedFile(null);
    setUploadResponse(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div
        className="flex items-center justify-between p-4 border-b"
        style={{ borderColor: 'var(--border-color)' }}
      >
        <div className="flex items-center gap-3">
          <Users className="w-6 h-6" style={{ color: 'var(--primary)' }} />
          <h1 className="text-xl font-semibold">Attendance Management</h1>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Class Selection and Date */}
          <div
            className="p-6 rounded-xl"
            style={{ background: 'var(--message-bg)', border: '1px solid var(--border-color)' }}
          >
            <h2 className="text-lg font-medium mb-4">Select Class & Date</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Class Dropdown */}
              <div>
                <label className="block text-sm font-medium mb-2 opacity-70">Class Section</label>
                <div className="relative">
                  <select
                    value={selectedClass}
                    onChange={(e) => setSelectedClass(e.target.value)}
                    disabled={isLoadingClasses}
                    className="w-full p-3 pr-10 rounded-lg appearance-none cursor-pointer transition-colors"
                    style={{
                      background: 'var(--input-bg)',
                      border: '1px solid var(--border-color)',
                      color: 'var(--text-primary)',
                    }}
                  >
                    <option value="">Select a class...</option>
                    {classes.map((cls) => (
                      <option key={cls.class_section} value={cls.class_section}>
                        {cls.class_section}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 opacity-50 pointer-events-none" />
                  {isLoadingClasses && (
                    <Loader2 className="absolute right-10 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin" />
                  )}
                </div>
              </div>

              {/* Date Picker */}
              <div>
                <label className="block text-sm font-medium mb-2 opacity-70">Date</label>
                <div className="relative">
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full p-3 rounded-lg transition-colors"
                    style={{
                      background: 'var(--input-bg)',
                      border: '1px solid var(--border-color)',
                      color: 'var(--text-primary)',
                    }}
                  />
                  <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 opacity-50 pointer-events-none" />
                </div>
              </div>
            </div>
          </div>

          {/* File Upload Section - Hidden when class is selected */}
          {!selectedClass && (
            <div
              className="p-6 rounded-xl"
              style={{ background: 'var(--message-bg)', border: '1px solid var(--border-color)' }}
            >
              <div className="flex items-center gap-2 mb-4">
                <Upload className="w-5 h-5" style={{ color: 'var(--primary)' }} />
                <h2 className="text-lg font-medium">Upload Attendance File</h2>
              </div>
              <p className="text-sm opacity-60 mb-4">
                Or upload an Excel file to import attendance records in bulk. Supported formats: .xlsx, .xls
              </p>

              {/* Drag and Drop Zone */}
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
                  isDragging
                    ? 'border-[var(--primary)] bg-[var(--primary)]/10'
                    : 'border-[var(--border-color)] hover:border-[var(--primary)]/50 hover:bg-[var(--hover-bg)]'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
                  onChange={handleFileInputChange}
                  className="hidden"
                />
                
                {isUploading ? (
                  <div className="flex flex-col items-center gap-3">
                    <Loader2 className="w-12 h-12 animate-spin" style={{ color: 'var(--primary)' }} />
                    <p className="font-medium">Uploading...</p>
                    <p className="text-sm opacity-60">Please wait while we process your file</p>
                  </div>
                ) : uploadedFile ? (
                  <div className="flex flex-col items-center gap-3">
                    <FileSpreadsheet className="w-12 h-12 text-green-500" />
                    <p className="font-medium">{uploadedFile.name}</p>
                    <p className="text-sm opacity-60">
                      {(uploadedFile.size / 1024).toFixed(1)} KB
                    </p>
                    <div className="flex items-center gap-3 mt-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleFileUpload();
                        }}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all"
                        style={{ background: 'var(--primary)', color: 'white' }}
                      >
                        <Upload className="w-4 h-4" />
                        Upload File
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          clearUploadedFile();
                        }}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all bg-red-500/20 text-red-500 hover:bg-red-500/30"
                      >
                        <X className="w-4 h-4" />
                        Remove
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-3">
                    <Upload className="w-12 h-12 opacity-40" />
                    <p className="font-medium">
                      {isDragging ? 'Drop your file here' : 'Drag & drop your Excel file here'}
                    </p>
                    <p className="text-sm opacity-60">or click to browse</p>
                  </div>
                )}
              </div>

              {/* Upload Response Details */}
              {uploadResponse && uploadResponse.success && (
                <div className="mt-4 p-4 rounded-lg bg-green-500/10 border border-green-500/30">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-green-500 font-medium mb-2">Upload Successful!</p>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                        <div className="p-2 rounded-lg bg-green-500/10">
                          <p className="opacity-60">Total Records</p>
                          <p className="font-medium text-green-500">{uploadResponse.total_records}</p>
                        </div>
                        <div className="p-2 rounded-lg bg-green-500/10">
                          <p className="opacity-60">Inserted</p>
                          <p className="font-medium text-green-500">{uploadResponse.inserted_records}</p>
                        </div>
                        <div className="p-2 rounded-lg bg-blue-500/10">
                          <p className="opacity-60">Updated</p>
                          <p className="font-medium text-blue-500">{uploadResponse.updated_records}</p>
                        </div>
                        <div className="p-2 rounded-lg bg-purple-500/10">
                          <p className="opacity-60">New Students</p>
                          <p className="font-medium text-purple-500">{uploadResponse.new_students_created}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Upload Errors */}
              {uploadResponse && uploadResponse.errors && uploadResponse.errors.length > 0 && (
                <div className="mt-4 p-4 rounded-lg bg-red-500/10 border border-red-500/30">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-500 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-red-500 font-medium mb-2">Errors occurred during upload:</p>
                      <ul className="list-disc list-inside text-sm text-red-500 space-y-1">
                        {uploadResponse.errors.map((err, index) => (
                          <li key={index}>{err}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div
              className="flex items-center gap-3 p-4 rounded-lg bg-red-500/10 border border-red-500/30"
            >
              <AlertCircle className="w-5 h-5 text-red-500" />
              <span className="text-red-500">{error}</span>
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div
              className="flex items-center gap-3 p-4 rounded-lg bg-green-500/10 border border-green-500/30"
            >
              <CheckCircle className="w-5 h-5 text-green-500" />
              <span className="text-green-500">{success}</span>
            </div>
          )}

          {/* Student List */}
          {selectedClass && (
            <div
              className="p-6 rounded-xl"
              style={{ background: 'var(--message-bg)', border: '1px solid var(--border-color)' }}
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-medium">
                  Students - {selectedClass}
                  {students.length > 0 && (
                    <span className="ml-2 text-sm opacity-60">({students.length} students)</span>
                  )}
                </h2>
                {students.length > 0 && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={markAllPresent}
                      className="px-3 py-1.5 text-sm rounded-lg bg-green-500/20 text-green-500 hover:bg-green-500/30 transition-colors"
                    >
                      Mark All Present
                    </button>
                    <button
                      onClick={markAllAbsent}
                      className="px-3 py-1.5 text-sm rounded-lg bg-red-500/20 text-red-500 hover:bg-red-500/30 transition-colors"
                    >
                      Mark All Absent
                    </button>
                  </div>
                )}
              </div>

              {isLoadingStudents ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin opacity-50" />
                  <span className="ml-3 opacity-60">Loading students...</span>
                </div>
              ) : students.length === 0 ? (
                <div className="text-center py-12 opacity-60">
                  <Users className="w-12 h-12 mx-auto mb-3 opacity-40" />
                  <p>No students found in this class.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {students.map((student, index) => (
                    <div
                      key={student.student_id}
                      className="flex items-center justify-between p-4 rounded-lg hover:bg-[var(--hover-bg)] transition-colors"
                      style={{ border: '1px solid var(--border-color)' }}
                    >
                      <div className="flex items-center gap-4">
                        <span className="text-sm opacity-50 w-8">{index + 1}.</span>
                        <div>
                          <p className="font-medium">{student.name}</p>
                          <p className="text-sm opacity-50">ID: {student.student_id}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => toggleAttendance(student.student_id)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                          attendance[student.student_id] === 'Present'
                            ? 'bg-green-500/20 text-green-500 hover:bg-green-500/30'
                            : 'bg-red-500/20 text-red-500 hover:bg-red-500/30'
                        }`}
                      >
                        {attendance[student.student_id] === 'Present' ? (
                          <>
                            <CheckCircle className="w-5 h-5" />
                            Present
                          </>
                        ) : (
                          <>
                            <XCircle className="w-5 h-5" />
                            Absent
                          </>
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Summary and Submit */}
          {students.length > 0 && (
            <div
              className="p-6 rounded-xl"
              style={{ background: 'var(--message-bg)', border: '1px solid var(--border-color)' }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span className="text-green-500 font-medium">{presentCount} Present</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <XCircle className="w-5 h-5 text-red-500" />
                    <span className="text-red-500 font-medium">{absentCount} Absent</span>
                  </div>
                </div>
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting || students.length === 0}
                  className="flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    background: 'var(--primary)',
                    color: 'white',
                  }}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-5 h-5" />
                      Submit Attendance
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
