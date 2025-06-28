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
  courseId: string;
  topic: string; 
  title: string;
  totalMarks: number;
}

export interface StudentMarkEntry {
  studentId: string;
  studentName?: string; 
  assessmentId: string;
  mark?: number | string | null; 
  comments?: string;
}

export interface Marksheet {
  course: Course;
  students: Student[];
  assessments: AssessmentGrading[];
  marks: StudentMarkEntry[];
}


// Mock current trainer ID
export const CURRENT_TRAINER_ID = "trainerJane";

// Note: In a real application, the mock data below would be replaced by
// data stored in and fetched from a Firestore database.
// The functions in `actions.ts` are now responsible for this fetching.
// This file now primarily serves to define the data structures (types).