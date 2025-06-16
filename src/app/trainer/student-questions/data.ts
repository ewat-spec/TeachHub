
export interface StudentQuestionInput {
  studentId: string;
  studentName: string;
  courseId: string;
  courseTitle: string;
  questionText: string;
  // trainerId will be assigned or derived server-side based on course or context
}

export interface StudentQuestion extends StudentQuestionInput {
  id: string;
  dateAsked: string; // ISO string
  isRead: boolean;
  trainerId: string; // ID of the trainer this question is directed to
  reply?: string; // Optional field for trainer's reply
}

// Mock database/store for student questions.
// In a real app, this would be a database.
// Let's make it exportable so actions can modify it (for mock purposes only)
export let mockStudentQuestions: StudentQuestion[] = [
  {
    id: "sq1",
    studentId: "studentAlexDemo",
    studentName: "Alex DemoStudent",
    courseId: "unit1",
    courseTitle: "Engine Systems",
    questionText: "Hi Trainer, I'm having trouble understanding the Otto cycle diagram on page 23 of the notes. Can you explain the compression stroke in more detail?",
    dateAsked: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
    isRead: false,
    trainerId: "trainerJane",
  },
  {
    id: "sq2",
    studentId: "student001", // Alice Wonderland from class-lists/data.ts
    studentName: "Alice Wonderland",
    courseId: "courseREACT101", // React Fundamentals from class-lists/data.ts
    courseTitle: "React Fundamentals",
    questionText: "What's the best way to manage global state in a small React application without using Redux? Is Context API sufficient?",
    dateAsked: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
    isRead: true,
    trainerId: "trainerJane",
    reply: "For small apps, Context API is often a great choice! Consider its performance implications if the state updates very frequently or is very complex."
  },
   {
    id: "sq3",
    studentId: "student003", 
    studentName: "Charlie Chaplin",
    courseId: "courseREACT101", 
    courseTitle: "React Fundamentals",
    questionText: "I missed the last class on React Router. Is there a recording or summary available? I need to catch up before the next assignment.",
    dateAsked: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(), // 5 hours ago
    isRead: false,
    trainerId: "trainerJane",
  },
];
