export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface Document {
  id: string;
  name: string;
  size: number;
  type: string;
  uploadedAt: Date;
  status: 'uploading' | 'processing' | 'ready' | 'error';
}

export interface Chat {
  id: string;
  title: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
}

// Attendance Types
export interface ClassSection {
  class_section: string;
}

export interface Student {
  student_id: number;
  name: string;
  class_: string;
  section: string;
}

export interface AttendanceRecord {
  student_id: number;
  status: 'Present' | 'Absent';
}

export interface AttendancePayload {
  class_section: string;
  date: string;
  records: AttendanceRecord[];
}

export interface AttendanceResponse {
  success: boolean;
  message: string;
  date: string;
  class_section: string;
  total_records: number;
}

// Exam Types
export interface ExamRecord {
  student_id: number;
  marks: number;
}

export interface ExamPayload {
  class_section: string;
  exam_date: string;
  subject: string;
  records: ExamRecord[];
}

export interface ExamResponse {
  success: boolean;
  message: string;
  exam_date: string;
  class_section: string;
  subject: string;
  total_records: number;
}
