// User Types
export type UserRole = 'student' | 'trainer' | 'admin' | 'dean' | 'director' | 'hod' | 'finance' | 'timetabler';

export interface BaseUser {
  id: string;
  email: string;
  name: string;
  profilePicUrl?: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}

export interface Student extends BaseUser {
  role: 'student';
  admissionNumber: string;
  course: string;
  yearOfStudy: string;
  skills?: string[];
}

export interface Trainer extends BaseUser {
  role: 'trainer';
  employeeId: string;
  department: string;
  expertise: string[];
  qualifications: string[];
  cv?: string;
}

export interface Admin extends BaseUser {
  role: 'admin' | 'dean' | 'director' | 'hod' | 'finance' | 'timetabler';
  department?: string;
  permissions: string[];
}

// Course Types
export interface Course {
  id: string;
  title: string;
  code: string;
  description: string;
  credits: number;
  department: string;
  yearLevel: number;
  prerequisites?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Enrollment {
  id: string;
  studentId: string;
  courseId: string;
  enrolledAt: Date;
  status: 'active' | 'completed' | 'dropped' | 'failed';
  finalGrade?: string;
  poeProgress: number;
}

// Schedule Types
export interface ScheduledClass {
  id: string;
  courseId: string;
  trainerId: string;
  topic: string;
  dayOfWeek: string;
  startTime: string;
  durationHours: number;
  venue?: string;
  isPractical?: boolean;
  isCommonCourse?: boolean;
}

// Assessment Types
export interface Assessment {
  id: string;
  courseId: string;
  trainerId: string;
  title: string;
  description: string;
  type: 'quiz' | 'assignment' | 'project' | 'exam' | 'practical';
  totalMarks: number;
  dueDate: Date;
  createdAt: Date;
}

export interface StudentMark {
  id: string;
  assessmentId: string;
  studentId: string;
  mark: number;
  feedback?: string;
  submittedAt?: Date;
  gradedAt?: Date;
}

// Lesson Plan Types
export interface LessonPlan {
  id: string;
  trainerId: string;
  courseId: string;
  topic: string;
  objectives: string[];
  duration: number;
  materials: string[];
  activities: string[];
  assessment: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

// AI Types
export interface AIRequest {
  id: string;
  userId: string;
  type: 'lesson_plan' | 'academic_question' | 'performance_analysis' | 'timetable_analysis';
  input: Record<string, any>;
  output?: Record<string, any>;
  status: 'pending' | 'completed' | 'failed';
  createdAt: Date;
  completedAt?: Date;
}

// Notification Types
export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
  read: boolean;
  actionUrl?: string;
  createdAt: Date;
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Form Types
export interface FormState {
  isLoading: boolean;
  error?: string;
  success?: boolean;
}

// Component Props Types
export interface PageProps {
  params: { [key: string]: string };
  searchParams: { [key: string]: string | string[] | undefined };
}

export interface LayoutProps {
  children: React.ReactNode;
  params: { [key: string]: string };
}