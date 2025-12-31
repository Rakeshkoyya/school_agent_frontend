'use client';

import React, { useState, useEffect } from 'react';
import {
  Users,
  Calendar,
  CheckCircle,
  XCircle,
  Loader2,
  AlertCircle,
  ChevronDown,
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
