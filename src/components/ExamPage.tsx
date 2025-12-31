'use client';

import React, { useState, useEffect } from 'react';
import {
  GraduationCap,
  Calendar,
  CheckCircle,
  Loader2,
  AlertCircle,
  ChevronDown,
  BookOpen,
  Users,
} from 'lucide-react';
import { ClassSection, Student, ExamRecord, ExamPayload, ExamResponse } from '@/types';

const API_BASE_URL = 'http://localhost:8000';

interface ExamPageProps {
  isDarkMode: boolean;
}

export default function ExamPage({ isDarkMode }: ExamPageProps) {
  const [classes, setClasses] = useState<ClassSection[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [students, setStudents] = useState<Student[]>([]);
  const [marks, setMarks] = useState<Record<number, string>>({});
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [subject, setSubject] = useState<string>('');
  
  const [isLoadingClasses, setIsLoadingClasses] = useState(false);
  const [isLoadingStudents, setIsLoadingStudents] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Common subjects list
  const subjects = [
    'Mathematics',
    'Science',
    'English',
    'Hindi',
    'Social Studies',
    'Computer Science',
    'Physics',
    'Chemistry',
    'Biology',
    'History',
    'Geography',
  ];

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
      setMarks({});
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
    setMarks({});
    try {
      const response = await fetch(`${API_BASE_URL}/api/attendance/students/${classSection}`, {
        headers: { 'accept': 'application/json' },
      });
      if (!response.ok) throw new Error('Failed to fetch students');
      const data: Student[] = await response.json();
      setStudents(data);
      // Initialize all students with empty marks
      const initialMarks: Record<number, string> = {};
      data.forEach((student) => {
        initialMarks[student.student_id] = '';
      });
      setMarks(initialMarks);
    } catch (err) {
      setError('Failed to load students. Please try again.');
      console.error('Error fetching students:', err);
    } finally {
      setIsLoadingStudents(false);
    }
  };

  const handleMarksChange = (studentId: number, value: string) => {
    // Allow empty value
    if (value === '') {
      setMarks((prev) => ({ ...prev, [studentId]: '' }));
      return;
    }
    // Only allow numeric input
    if (!/^\d*$/.test(value)) return;
    
    const numValue = parseInt(value, 10);
    // Clamp between 0 and 100
    if (numValue > 100) {
      setMarks((prev) => ({ ...prev, [studentId]: '100' }));
    } else {
      setMarks((prev) => ({ ...prev, [studentId]: value }));
    }
  };

  const setAllMarks = (value: number) => {
    const newMarks: Record<number, string> = {};
    students.forEach((student) => {
      newMarks[student.student_id] = value.toString();
    });
    setMarks(newMarks);
  };

  const handleSubmit = async () => {
    if (!selectedClass || students.length === 0) {
      setError('Please select a class and ensure students are loaded.');
      return;
    }

    if (!subject) {
      setError('Please select a subject.');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    const records: ExamRecord[] = students.map((student) => ({
      student_id: student.student_id,
      marks: parseInt(marks[student.student_id], 10) || 0,
    }));

    const payload: ExamPayload = {
      class_section: selectedClass,
      exam_date: date,
      subject: subject,
      records: records,
    };

    try {
      const response = await fetch(`${API_BASE_URL}/api/exams/results`, {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error('Failed to submit exam results');

      const data: ExamResponse = await response.json();
      setSuccess(data.message);
    } catch (err) {
      setError('Failed to submit exam results. Please try again.');
      console.error('Error submitting exam results:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getNumericMarks = () => Object.values(marks).map(m => parseInt(m, 10) || 0);
  
  const averageMarks = students.length > 0
    ? (getNumericMarks().reduce((a, b) => a + b, 0) / students.length).toFixed(1)
    : 0;

  const highestMarks = students.length > 0 ? Math.max(...getNumericMarks()) : 0;
  const lowestMarks = students.length > 0 ? Math.min(...getNumericMarks()) : 0;

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div
        className="flex items-center justify-between p-4 border-b"
        style={{ borderColor: 'var(--border-color)' }}
      >
        <div className="flex items-center gap-3">
          <GraduationCap className="w-6 h-6" style={{ color: 'var(--primary)' }} />
          <h1 className="text-xl font-semibold">Exam Results Management</h1>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Class, Subject, and Date Selection */}
          <div
            className="p-6 rounded-xl"
            style={{ background: 'var(--message-bg)', border: '1px solid var(--border-color)' }}
          >
            <h2 className="text-lg font-medium mb-4">Exam Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

              {/* Subject Dropdown */}
              <div>
                <label className="block text-sm font-medium mb-2 opacity-70">Subject</label>
                <div className="relative">
                  <select
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full p-3 pr-10 rounded-lg appearance-none cursor-pointer transition-colors"
                    style={{
                      background: 'var(--input-bg)',
                      border: '1px solid var(--border-color)',
                      color: 'var(--text-primary)',
                    }}
                  >
                    <option value="">Select a subject...</option>
                    {subjects.map((subj) => (
                      <option key={subj} value={subj}>
                        {subj}
                      </option>
                    ))}
                  </select>
                  <BookOpen className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 opacity-50 pointer-events-none" />
                </div>
              </div>

              {/* Date Picker */}
              <div>
                <label className="block text-sm font-medium mb-2 opacity-70">Exam Date</label>
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
                      onClick={() => setAllMarks(100)}
                      className="px-3 py-1.5 text-sm rounded-lg bg-green-500/20 text-green-500 hover:bg-green-500/30 transition-colors"
                    >
                      Set All 100
                    </button>
                    <button
                      onClick={() => setAllMarks(0)}
                      className="px-3 py-1.5 text-sm rounded-lg bg-red-500/20 text-red-500 hover:bg-red-500/30 transition-colors"
                    >
                      Set All 0
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
                      className="flex items-center justify-between p-4 rounded-lg hover:bg-(--hover-bg) transition-colors"
                      style={{ border: '1px solid var(--border-color)' }}
                    >
                      <div className="flex items-center gap-4">
                        <span className="text-sm opacity-50 w-8">{index + 1}.</span>
                        <div>
                          <p className="font-medium">{student.name}</p>
                          <p className="text-sm opacity-50">ID: {student.student_id}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <input
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          value={marks[student.student_id] ?? ''}
                          onChange={(e) => handleMarksChange(student.student_id, e.target.value)}
                          placeholder="0"
                          className="w-20 p-2 text-center rounded-lg font-medium transition-colors"
                          style={{
                            background: 'var(--input-bg)',
                            border: '1px solid var(--border-color)',
                            color: 'var(--text-primary)',
                          }}
                        />
                        <span className="text-sm opacity-60">/ 100</span>
                        <div
                          className={`w-16 text-center px-2 py-1 rounded text-sm font-medium ${
                            (parseInt(marks[student.student_id], 10) || 0) >= 90
                              ? 'bg-green-500/20 text-green-500'
                              : (parseInt(marks[student.student_id], 10) || 0) >= 75
                              ? 'bg-blue-500/20 text-blue-500'
                              : (parseInt(marks[student.student_id], 10) || 0) >= 50
                              ? 'bg-yellow-500/20 text-yellow-500'
                              : (parseInt(marks[student.student_id], 10) || 0) >= 35
                              ? 'bg-orange-500/20 text-orange-500'
                              : 'bg-red-500/20 text-red-500'
                          }`}
                        >
                          {(parseInt(marks[student.student_id], 10) || 0) >= 90
                            ? 'A+'
                            : (parseInt(marks[student.student_id], 10) || 0) >= 75
                            ? 'A'
                            : (parseInt(marks[student.student_id], 10) || 0) >= 50
                            ? 'B'
                            : (parseInt(marks[student.student_id], 10) || 0) >= 35
                            ? 'C'
                            : 'F'}
                        </div>
                      </div>
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
                  <div className="text-center">
                    <p className="text-sm opacity-60">Average</p>
                    <p className="text-xl font-bold" style={{ color: 'var(--primary)' }}>
                      {averageMarks}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm opacity-60">Highest</p>
                    <p className="text-xl font-bold text-green-500">{highestMarks}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm opacity-60">Lowest</p>
                    <p className="text-xl font-bold text-red-500">{lowestMarks}</p>
                  </div>
                </div>
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting || students.length === 0 || !subject}
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
                      Submit Results
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
