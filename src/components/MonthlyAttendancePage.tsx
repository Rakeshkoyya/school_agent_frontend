'use client';

import React, { useState, useEffect } from 'react';
import {
  Users,
  Calendar,
  Loader2,
  AlertCircle,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { ClassSection, MonthlyAttendanceResponse } from '@/types';

const API_BASE_URL = 'http://localhost:8000';

interface MonthlyAttendancePageProps {
  isDarkMode: boolean;
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export default function MonthlyAttendancePage({ isDarkMode }: MonthlyAttendancePageProps) {
  const [classes, setClasses] = useState<ClassSection[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);
  const [attendanceData, setAttendanceData] = useState<MonthlyAttendanceResponse | null>(null);

  const [isLoadingClasses, setIsLoadingClasses] = useState(false);
  const [isLoadingAttendance, setIsLoadingAttendance] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch classes on component mount
  useEffect(() => {
    fetchClasses();
  }, []);

  // Fetch attendance when class, year, or month changes
  useEffect(() => {
    if (selectedClass) {
      fetchMonthlyAttendance();
    } else {
      setAttendanceData(null);
    }
  }, [selectedClass, selectedYear, selectedMonth]);

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

  const fetchMonthlyAttendance = async () => {
    if (!selectedClass) return;
    
    setIsLoadingAttendance(true);
    setError(null);
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/attendance/monthly/${selectedClass}?year=${selectedYear}&month=${selectedMonth}`,
        {
          headers: { 'accept': 'application/json' },
        }
      );
      if (!response.ok) throw new Error('Failed to fetch monthly attendance');
      const data: MonthlyAttendanceResponse = await response.json();
      setAttendanceData(data);
    } catch (err) {
      setError('Failed to load attendance data. Please try again.');
      console.error('Error fetching monthly attendance:', err);
    } finally {
      setIsLoadingAttendance(false);
    }
  };

  const handlePreviousMonth = () => {
    if (selectedMonth === 1) {
      setSelectedMonth(12);
      setSelectedYear(selectedYear - 1);
    } else {
      setSelectedMonth(selectedMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonth === 12) {
      setSelectedMonth(1);
      setSelectedYear(selectedYear + 1);
    } else {
      setSelectedMonth(selectedMonth + 1);
    }
  };

  const generateYears = () => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let i = currentYear - 5; i <= currentYear + 1; i++) {
      years.push(i);
    }
    return years;
  };

  const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  interface DayInfo {
    day: number;
    dayName: string;
    dayOfWeek: number; // 0 = Sunday, 1 = Monday, etc.
  }

  interface WeekGroup {
    weekNumber: number;
    days: DayInfo[];
  }

  const getWeeksWithDays = (): WeekGroup[] => {
    if (!attendanceData) return [];
    
    const weeks: WeekGroup[] = [];
    let currentWeek: DayInfo[] = [];
    let weekNumber = 1;

    for (let day = 1; day <= attendanceData.days_in_month; day++) {
      const date = new Date(selectedYear, selectedMonth - 1, day);
      const dayOfWeek = date.getDay(); // 0 = Sunday, 1 = Monday, etc.

      // Skip Sundays
      if (dayOfWeek === 0) continue;

      const dayInfo: DayInfo = {
        day,
        dayName: DAY_NAMES[dayOfWeek],
        dayOfWeek,
      };

      currentWeek.push(dayInfo);

      // End of week (Saturday) or last day of month
      if (dayOfWeek === 6 || day === attendanceData.days_in_month) {
        if (currentWeek.length > 0) {
          weeks.push({ weekNumber, days: currentWeek });
          weekNumber++;
          currentWeek = [];
        }
      }
    }

    // Handle any remaining days
    if (currentWeek.length > 0) {
      weeks.push({ weekNumber, days: currentWeek });
    }

    return weeks;
  };

  const getAllDaysExcludingSundays = (): DayInfo[] => {
    const weeks = getWeeksWithDays();
    return weeks.flatMap(week => week.days);
  };

  const getAttendanceStatus = (studentAttendance: Record<string, 'P' | 'A'>, day: number) => {
    return studentAttendance[day.toString()] || '-';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'P':
        return 'bg-green-500/20 text-green-600 dark:text-green-400';
      case 'A':
        return 'bg-red-500/20 text-red-600 dark:text-red-400';
      default:
        return 'text-gray-400';
    }
  };

  const calculateStats = (studentAttendance: Record<string, 'P' | 'A'>) => {
    const entries = Object.values(studentAttendance);
    const present = entries.filter(s => s === 'P').length;
    const absent = entries.filter(s => s === 'A').length;
    const total = present + absent;
    const percentage = total > 0 ? ((present / total) * 100).toFixed(1) : '-';
    return { present, absent, percentage };
  };

  return (
    <div className="flex flex-col h-full p-6 overflow-hidden">
      {/* Header */}
      <div className="shrink-0 mb-6">
        <div className="flex items-center gap-3 mb-2">
          <Calendar className="w-8 h-8 text-(--primary)" />
          <h1 className="text-2xl font-bold">Monthly Attendance View</h1>
        </div>
        <p className="text-sm opacity-70">View student attendance records for any month</p>
      </div>

      {/* Controls */}
      <div className="shrink-0 mb-6">
        <div className="flex flex-wrap gap-4 items-end">
          {/* Class Selection */}
          <div className="min-w-50">
            <label className="block text-sm font-medium mb-2">Select Class</label>
            <div className="relative">
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                disabled={isLoadingClasses}
                className="w-full p-3 pr-10 rounded-lg appearance-none cursor-pointer transition-colors"
                style={{
                  background: 'var(--input-bg)',
                  border: '1px solid var(--border-color)',
                }}
              >
                <option value="">Select a class</option>
                {classes.map((cls) => (
                  <option key={cls.class_section} value={cls.class_section}>
                    {cls.class_section}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 opacity-60 pointer-events-none" />
              {isLoadingClasses && (
                <Loader2 className="absolute right-10 top-1/2 -translate-y-1/2 w-5 h-5 animate-spin" />
              )}
            </div>
          </div>

          {/* Month/Year Navigation */}
          <div className="flex items-center gap-2">
            <button
              onClick={handlePreviousMonth}
              className="p-3 rounded-lg hover:bg-(--hover-bg) transition-colors"
              style={{ border: '1px solid var(--border-color)' }}
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            
            <div className="flex gap-2">
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                className="p-3 pr-10 rounded-lg appearance-none cursor-pointer transition-colors"
                style={{
                  background: 'var(--input-bg)',
                  border: '1px solid var(--border-color)',
                }}
              >
                {MONTHS.map((month, index) => (
                  <option key={month} value={index + 1}>
                    {month}
                  </option>
                ))}
              </select>

              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="p-3 pr-10 rounded-lg appearance-none cursor-pointer transition-colors"
                style={{
                  background: 'var(--input-bg)',
                  border: '1px solid var(--border-color)',
                }}
              >
                {generateYears().map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={handleNextMonth}
              className="p-3 rounded-lg hover:bg-(--hover-bg) transition-colors"
              style={{ border: '1px solid var(--border-color)' }}
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="shrink-0 mb-4 flex items-center gap-2 p-4 rounded-lg bg-red-500/10 border border-red-500/30 text-red-500">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Loading State */}
      {isLoadingAttendance && (
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-10 h-10 animate-spin text-(--primary)" />
            <span className="text-sm opacity-70">Loading attendance data...</span>
          </div>
        </div>
      )}

      {/* No Class Selected */}
      {!selectedClass && !isLoadingAttendance && (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Users className="w-16 h-16 mx-auto mb-4 opacity-30" />
            <p className="text-lg opacity-70">Select a class to view monthly attendance</p>
          </div>
        </div>
      )}

      {/* Attendance Table */}
      {selectedClass && attendanceData && !isLoadingAttendance && (
        <div className="flex-1 overflow-auto rounded-lg border" style={{ borderColor: 'var(--border-color)' }}>
          <table className="w-full border-collapse min-w-max">
            <thead>
              {/* Week Headers Row */}
              <tr style={{ background: 'var(--hover-bg)' }}>
                <th
                  rowSpan={2}
                  className="sticky left-0 z-20 p-3 text-left font-semibold border-b border-r"
                  style={{ 
                    borderColor: 'var(--border-color)',
                    background: 'var(--hover-bg)',
                    minWidth: '200px'
                  }}
                >
                  Student Name
                </th>
                {getWeeksWithDays().map((week) => (
                  <th
                    key={`week-${week.weekNumber}`}
                    colSpan={week.days.length}
                    className="p-2 text-center font-semibold border-b border-r text-(--primary)"
                    style={{ borderColor: 'var(--border-color)' }}
                  >
                    Week {week.weekNumber}
                  </th>
                ))}
                <th
                  rowSpan={2}
                  className="sticky right-0 z-20 p-3 text-center font-semibold border-b"
                  style={{ 
                    borderColor: 'var(--border-color)',
                    background: 'var(--hover-bg)',
                    minWidth: '100px'
                  }}
                >
                  Stats
                </th>
              </tr>
              {/* Day Names & Numbers Row */}
              <tr style={{ background: 'var(--hover-bg)' }}>
                {getWeeksWithDays().map((week, weekIdx) => (
                  <React.Fragment key={`days-week-${week.weekNumber}`}>
                    {week.days.map((dayInfo, dayIdx) => (
                      <th
                        key={`day-${dayInfo.day}`}
                        className={`p-1 text-center border-b min-w-11.25 ${
                          dayIdx === week.days.length - 1 && weekIdx < getWeeksWithDays().length - 1 ? 'border-r' : ''
                        }`}
                        style={{ borderColor: 'var(--border-color)' }}
                      >
                        <div className="text-xs opacity-60">{dayInfo.dayName}</div>
                        <div className="font-semibold">{dayInfo.day}</div>
                      </th>
                    ))}
                  </React.Fragment>
                ))}
              </tr>
            </thead>
            <tbody>
              {attendanceData.students.length === 0 ? (
                <tr>
                  <td
                    colSpan={getAllDaysExcludingSundays().length + 2}
                    className="p-8 text-center opacity-70"
                  >
                    No attendance records found for this month
                  </td>
                </tr>
              ) : (
                attendanceData.students.map((student, index) => {
                  const stats = calculateStats(student.attendance);
                  const weeks = getWeeksWithDays();
                  return (
                    <tr
                      key={student.student_id}
                      className="hover:bg-(--hover-bg) transition-colors"
                      style={{
                        background: index % 2 === 0 ? 'transparent' : 'var(--hover-bg)',
                      }}
                    >
                      <td
                        className="sticky left-0 z-10 p-3 border-b border-r font-medium"
                        style={{ 
                          borderColor: 'var(--border-color)',
                          background: index % 2 === 0 ? 'var(--main-bg)' : 'var(--hover-bg)',
                        }}
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-(--primary)/20 flex items-center justify-center text-sm font-bold text-(--primary)">
                            {student.name.charAt(0)}
                          </div>
                          <span>{student.name}</span>
                        </div>
                      </td>
                      {weeks.map((week, weekIdx) => (
                        <React.Fragment key={`student-${student.student_id}-week-${week.weekNumber}`}>
                          {week.days.map((dayInfo, dayIdx) => {
                            const status = getAttendanceStatus(student.attendance, dayInfo.day);
                            return (
                              <td
                                key={`student-${student.student_id}-day-${dayInfo.day}`}
                                className={`p-2 text-center border-b ${
                                  dayIdx === week.days.length - 1 && weekIdx < weeks.length - 1 ? 'border-r' : ''
                                }`}
                                style={{ borderColor: 'var(--border-color)' }}
                              >
                                <span
                                  className={`inline-flex items-center justify-center w-7 h-7 rounded text-xs font-bold ${getStatusColor(
                                    status
                                  )}`}
                                >
                                  {status}
                                </span>
                              </td>
                            );
                          })}
                        </React.Fragment>
                      ))}
                      <td
                        className="sticky right-0 z-10 p-3 border-b text-center"
                        style={{ 
                          borderColor: 'var(--border-color)',
                          background: index % 2 === 0 ? 'var(--main-bg)' : 'var(--hover-bg)',
                        }}
                      >
                        <div className="text-xs">
                          <div className="text-green-500 font-medium">P: {stats.present}</div>
                          <div className="text-red-500 font-medium">A: {stats.absent}</div>
                          <div className="font-bold mt-1">{stats.percentage}%</div>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Legend */}
      {selectedClass && attendanceData && !isLoadingAttendance && (
        <div className="shrink-0 mt-4 flex items-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center justify-center w-6 h-6 rounded bg-green-500/20 text-green-600 dark:text-green-400 text-xs font-bold">
              P
            </span>
            <span>Present</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center justify-center w-6 h-6 rounded bg-red-500/20 text-red-600 dark:text-red-400 text-xs font-bold">
              A
            </span>
            <span>Absent</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center justify-center w-6 h-6 rounded text-gray-400 text-xs font-bold">
              -
            </span>
            <span>No Record</span>
          </div>
        </div>
      )}
    </div>
  );
}
