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
}

export interface Enrollment {
  studentId: string;
  courseId: string;
}

export interface AssessmentGrading {
  id: string;
  courseId: string;
  title: string;
  totalMarks: number;
}

export interface StudentMarkEntry {
  studentId: string;
  assessmentId: string;
  mark?: number | string; // Use string to allow empty input, then coerce
  comments?: string;
}

// Mock current trainer ID
export const CURRENT_TRAINER_ID = "trainerJane"; // Matches profile page

export const mockTrainerCoursesData: Course[] = [
  { id: "courseSAF601", name: "Safety Procedures", level: "CBET Level 6", code: "SAF601", trainerId: CURRENT_TRAINER_ID },
  { id: "courseREACT101", name: "React Fundamentals", level: "Beginner", code: "REACT101", trainerId: CURRENT_TRAINER_ID },
  { id: "courseCSS302", name: "Advanced CSS", level: "Intermediate", code: "CSS302", trainerId: CURRENT_TRAINER_ID },
  { id: "courseAUT201", name: "Engine Systems", level: "Year 2", code: "AUT201", trainerId: "trainer1" }, // Another trainer's course
];

export const mockStudentsData: Student[] = [
  { id: "stud001", name: "Alice Wonderland", admissionNumber: "SCT/001/24" },
  { id: "stud002", name: "Bob The Builder", admissionNumber: "SCT/002/24" },
  { id: "stud003", name: "Charlie Chaplin", admissionNumber: "SCT/003/24" },
  { id: "stud004", name: "Diana Prince", admissionNumber: "SCT/004/24" },
  { id: "stud005", name: "Edward Scissorhands", admissionNumber: "SCT/005/24" },
  { id: "stud006", name: "Alex DemoStudent", admissionNumber: "SCT221-0077/2024" },
];

export const mockEnrollmentsData: Enrollment[] = [
  // Safety Procedures, CBET Level 6 (courseSAF601) - Jane Doe's class
  { studentId: "stud001", courseId: "courseSAF601" },
  { studentId: "stud002", courseId: "courseSAF601" },
  { studentId: "stud006", courseId: "courseSAF601" },

  // React Fundamentals, Beginner (courseREACT101) - Jane Doe's class
  { studentId: "stud003", courseId: "courseREACT101" },
  { studentId: "stud004", courseId: "courseREACT101" },
  { studentId: "stud001", courseId: "courseREACT101" },

  // Advanced CSS, Intermediate (courseCSS302) - Jane Doe's class
  { studentId: "stud005", courseId: "courseCSS302" },
  { studentId: "stud006", courseId: "courseCSS302" },

  // Engine Systems (courseAUT201) - Another trainer's class
  { studentId: "stud001", courseId: "courseAUT201" },
  { studentId: "stud004", courseId: "courseAUT201" },
];

export const mockAssessmentsForGradingData: AssessmentGrading[] = [
    {id: "asmSAF01", courseId: "courseSAF601", title: "CAT 1: Workplace Safety", totalMarks: 25},
    {id: "asmSAF02", courseId: "courseSAF601", title: "Practical: Fire Drill Eval", totalMarks: 50},
    {id: "asmREACT01", courseId: "courseREACT101", title: "Quiz: React Hooks", totalMarks: 30},
    {id: "asmCSS01", courseId: "courseCSS302", title: "Project: Responsive Layout", totalMarks: 100},
];

// This will store the entered marks. In a real app, this would be a database.
export let mockStudentMarksData: StudentMarkEntry[] = [
    { studentId: "stud001", assessmentId: "asmSAF01", mark: 20, comments: "Good understanding." },
    { studentId: "stud002", assessmentId: "asmSAF01", mark: 15 },
];
