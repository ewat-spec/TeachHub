
export interface Student {
  id: string;
  name: string;
  admissionNumber: string;
}

export interface Course {
  id: string;
  name: string;
  level: string;
  code: string;
  trainerId: string; // To associate courses with a trainer
  sharedVideoLinks?: string[];
  sharedImageLinks?: string[];
}

export interface Enrollment {
  studentId: string;
  courseId: string;
}

export interface AssessmentGrading {
  id: string;
  courseId: string; // The course this assessment belongs to
  topic: string; // The topic of the assessment
  title: string;
  totalMarks: number;
}

export interface StudentMarkEntry {
  studentId: string;
  studentName?: string; // Optional for submission, but useful for form
  assessmentId: string;
  mark?: number | string | null; // Use string to allow empty input, then coerce
  comments?: string;
}

// Mock current trainer ID
export const CURRENT_TRAINER_ID = "trainerJane";

// Note: In a real application, the mock data below would be replaced by
// data stored in and fetched from a Firestore database.
// The functions in `actions.ts` are now responsible for this fetching.
// This file now primarily serves to define the data structures (types).
