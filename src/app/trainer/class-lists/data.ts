
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
  { id: "courseSAF601", name: "Safety Procedures", level: "CBET Level 6", code: "SAF601", trainerId: CURRENT_TRAINER_ID, sharedVideoLinks: ["https://www.youtube.com/watch?v=exampleSafety1"], sharedImageLinks: ["https://placehold.co/300x200.png?text=SafetyDiagram1"] },
  { id: "courseREACT101", name: "React Fundamentals", level: "Beginner", code: "REACT101", trainerId: CURRENT_TRAINER_ID, sharedVideoLinks: [], sharedImageLinks: [] },
  { id: "courseCSS302", name: "Advanced CSS", level: "Intermediate", code: "CSS302", trainerId: CURRENT_TRAINER_ID, sharedVideoLinks: ["https://www.youtube.com/watch?v=exampleCSSFlex"], sharedImageLinks: [] },
  { id: "courseAUT201", name: "Engine Systems", level: "Year 2", code: "AUT201", trainerId: "trainer1" }, // Another trainer's course

  // New courses for new students
  { id: "courseELEC201", name: "Electrical Circuit Analysis", level: "CBET Level 5", code: "ELEC201", trainerId: CURRENT_TRAINER_ID, sharedVideoLinks: ["https://www.youtube.com/watch?v=exampleOhmLaw"], sharedImageLinks: ["https://placehold.co/300x200.png?text=CircuitDiagram"] },
  { id: "courseFASH101", name: "Intro to Garment Construction", level: "CBET Level 4", code: "FASH101", trainerId: CURRENT_TRAINER_ID, sharedVideoLinks: [], sharedImageLinks: ["https://placehold.co/300x200.png?text=BasicStitchTypes"] },
  { id: "courseAUTO305", name: "Advanced Drivetrain Systems", level: "CBET Level 6", code: "AUTO305", trainerId: CURRENT_TRAINER_ID, sharedVideoLinks: ["https://www.youtube.com/watch?v=exampleDrivetrain"], sharedImageLinks: [] },
  { id: "courseAUTO310", name: "Vehicle Dynamics & Control", level: "CBET Level 6", code: "AUTO310", trainerId: CURRENT_TRAINER_ID, sharedVideoLinks: [], sharedImageLinks: ["https://placehold.co/300x200.png?text=SuspensionGeometry"] },
];

export const mockStudentsData: Student[] = [
  { id: "stud001", name: "Alice Wonderland", admissionNumber: "SCT/001/24" },
  { id: "stud002", name: "Bob The Builder", admissionNumber: "SCT/002/24" },
  { id: "stud003", name: "Charlie Chaplin", admissionNumber: "SCT/003/24" },
  { id: "stud004", name: "Diana Prince", admissionNumber: "SCT/004/24" },
  { id: "stud005", name: "Edward Scissorhands", admissionNumber: "SCT/005/24" },
  { id: "stud006", name: "Alex DemoStudent", admissionNumber: "SCT221-0077/2024" },
  // New students
  { id: "stud007", name: "Eleanor Volt", admissionNumber: "SCT/EE/001/23" },
  { id: "stud008", name: "Fabian Stitch", admissionNumber: "SCT/FD/002/23" },
  { id: "stud009", name: "Axel Gearson", admissionNumber: "SCT/AM/003/22" },
  { id: "stud010", name: "Sparky Pluggs", admissionNumber: "SCT/AM/004/22" },
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

  // Enrollments for new students/courses
  { studentId: "stud007", courseId: "courseELEC201" }, // Eleanor in Electrical
  { studentId: "stud008", courseId: "courseFASH101" }, // Fabian in Fashion
  { studentId: "stud009", courseId: "courseAUTO305" }, // Axel in Automotive (Advanced Drivetrain)
  { studentId: "stud010", courseId: "courseAUTO310" }, // Sparky in Automotive (Vehicle Dynamics)
  { studentId: "stud006", courseId: "courseAUTO305" }, // Alex also in Advanced Drivetrain
];

export const mockAssessmentsForGradingData: AssessmentGrading[] = [
    {id: "asmSAF01", courseId: "courseSAF601", title: "CAT 1: Workplace Safety", totalMarks: 25},
    {id: "asmSAF02", courseId: "courseSAF601", title: "Practical: Fire Drill Eval", totalMarks: 50},
    {id: "asmREACT01", courseId: "courseREACT101", title: "Quiz: React Hooks", totalMarks: 30},
    {id: "asmCSS01", courseId: "courseCSS302", title: "Project: Responsive Layout", totalMarks: 100},

    // Assessments for new courses
    {id: "asmELEC01", courseId: "courseELEC201", title: "Test 1: Ohm's Law", totalMarks: 40},
    {id: "asmFASH01", courseId: "courseFASH101", title: "Practical: Basic Seams", totalMarks: 60},
    {id: "asmAUTO305_01", courseId: "courseAUTO305", title: "Quiz: Transmission Types", totalMarks: 20},
    {id: "asmAUTO310_01", courseId: "courseAUTO310", title: "Assignment: Suspension Analysis", totalMarks: 75},
];

// This will store the entered marks. In a real app, this would be a database.
export let mockStudentMarksData: StudentMarkEntry[] = [
    { studentId: "stud001", assessmentId: "asmSAF01", mark: 20, comments: "Good understanding." },
    { studentId: "stud002", assessmentId: "asmSAF01", mark: 15 },
    { studentId: "stud007", assessmentId: "asmELEC01", mark: 32, comments: "Excellent work on circuit diagrams." },
    { studentId: "stud008", assessmentId: "asmFASH01", mark: 45, comments: "Neat stitching, pay attention to tension." },
    { studentId: "stud009", assessmentId: "asmAUTO305_01", mark: 18 },
    { studentId: "stud006", assessmentId: "asmAUTO305_01", mark: 19, comments: "Solid effort." },
    { studentId: "stud010", assessmentId: "asmAUTO310_01", mark: 65, comments: "Very thorough analysis." },
];

