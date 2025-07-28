import { z } from 'zod';

// Common validation patterns
const emailSchema = z.string().email('Please enter a valid email address');
const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character');

const phoneSchema = z
  .string()
  .regex(/^\+?[1-9]\d{1,14}$/, 'Please enter a valid phone number');

// Auth schemas
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
});

export const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: emailSchema,
  password: passwordSchema,
  confirmPassword: z.string(),
  role: z.enum(['student', 'trainer'], {
    required_error: 'Please select a role',
  }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export const phoneLoginSchema = z.object({
  phoneNumber: phoneSchema,
});

export const verificationCodeSchema = z.object({
  code: z.string().length(6, 'Verification code must be 6 digits'),
});

// Profile schemas
export const studentProfileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: emailSchema,
  admissionNumber: z.string().min(1, 'Admission number is required'),
  course: z.string().min(1, 'Course is required'),
  yearOfStudy: z.string().min(1, 'Year of study is required'),
  skills: z.array(z.string()).optional(),
  profilePicUrl: z.string().url().optional().or(z.literal('')),
});

export const trainerProfileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: emailSchema,
  employeeId: z.string().min(1, 'Employee ID is required'),
  department: z.string().min(1, 'Department is required'),
  expertise: z.array(z.string()).min(1, 'At least one area of expertise is required'),
  qualifications: z.array(z.string()).min(1, 'At least one qualification is required'),
  cv: z.string().optional(),
  profilePicUrl: z.string().url().optional().or(z.literal('')),
});

// Academic schemas
export const lessonPlanSchema = z.object({
  topic: z.string().min(1, 'Topic is required'),
  courseId: z.string().min(1, 'Course is required'),
  objectives: z.array(z.string()).min(1, 'At least one objective is required'),
  duration: z.number().min(1, 'Duration must be at least 1 hour'),
  materials: z.array(z.string()).min(1, 'At least one material is required'),
  activities: z.array(z.string()).min(1, 'At least one activity is required'),
  assessment: z.string().min(1, 'Assessment method is required'),
  notes: z.string().optional(),
});

export const assessmentSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  type: z.enum(['quiz', 'assignment', 'project', 'exam', 'practical']),
  totalMarks: z.number().min(1, 'Total marks must be at least 1'),
  dueDate: z.date({
    required_error: 'Due date is required',
  }),
  courseId: z.string().min(1, 'Course is required'),
});

export const markEntrySchema = z.object({
  studentId: z.string().min(1, 'Student ID is required'),
  assessmentId: z.string().min(1, 'Assessment ID is required'),
  mark: z.number().min(0, 'Mark cannot be negative'),
  feedback: z.string().optional(),
});

// Schedule schemas  
export const scheduleClassSchema = z.object({
  courseId: z.string().min(1, 'Course is required'),
  topic: z.string().min(1, 'Topic is required'),
  dayOfWeek: z.enum(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']),
  startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Invalid time format (HH:MM)'),
  durationHours: z.number().min(0.5, 'Duration must be at least 30 minutes').max(8, 'Duration cannot exceed 8 hours'),
  venue: z.string().optional(),
  isPractical: z.boolean().optional(),
  isCommonCourse: z.boolean().optional(),
});

// AI schemas
export const academicQuestionSchema = z.object({
  question: z.string().min(10, 'Question must be at least 10 characters'),
  course: z.string().optional(),
  topic: z.string().optional(),
  context: z.string().optional(),
});

export const aiLessonNotesSchema = z.object({
  lessonTopic: z.string().min(1, 'Lesson topic is required'),
  noteFormat: z.enum(['detailed', 'summary', 'bullet-points']),
  studentAudience: z.string().optional(),
  keyPointsForNotes: z.string().optional(),
  languageOutputStyle: z.enum(['standard', 'simplified-english']).default('standard'),
});

// Utility functions
export type LoginFormData = z.infer<typeof loginSchema>;
export type RegisterFormData = z.infer<typeof registerSchema>;
export type StudentProfileFormData = z.infer<typeof studentProfileSchema>;
export type TrainerProfileFormData = z.infer<typeof trainerProfileSchema>;
export type LessonPlanFormData = z.infer<typeof lessonPlanSchema>;
export type AssessmentFormData = z.infer<typeof assessmentSchema>;
export type ScheduleClassFormData = z.infer<typeof scheduleClassSchema>;
export type AcademicQuestionFormData = z.infer<typeof academicQuestionSchema>;
export type AILessonNotesFormData = z.infer<typeof aiLessonNotesSchema>;