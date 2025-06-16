
'use server';

import { mockStudentQuestions, type StudentQuestion, type StudentQuestionInput } from './data';

// Simulate API delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// This action is called by the student portal to submit a question
// In a real app, this would save to a database.
export async function submitStudentQuestion(
  questionData: StudentQuestionInput
): Promise<{ success: boolean; message?: string }> {
  console.log("Server Action: submitStudentQuestion received", questionData);
  await delay(500);
  const newQuestion: StudentQuestion = {
    id: `sq_${Date.now()}_${Math.random().toString(36).substring(2,7)}`, // More unique ID
    studentId: questionData.studentId,
    studentName: questionData.studentName,
    courseId: questionData.courseId,
    courseTitle: questionData.courseTitle,
    questionText: questionData.questionText,
    dateAsked: new Date().toISOString(),
    isRead: false,
    trainerId: "trainerJane" // Assign to a default/mock trainer for now
  };
  mockStudentQuestions.unshift(newQuestion); // Add to the beginning of the array
  console.log("Mock Question Store (after add):", mockStudentQuestions.slice(0,5)); // Log a few
  return { success: true, message: "Question submitted successfully (mock)." };
}


// This action is called by the trainer portal to get questions
export async function getStudentQuestionsForTrainer(trainerId: string = "trainerJane"): Promise<StudentQuestion[]> {
  console.log("Server Action: getStudentQuestionsForTrainer called for trainer:", trainerId);
  await delay(700);
  // Filter questions for the specific trainer.
  // In a real app, this would be a database query: `WHERE trainerId = ?`
  const questions = mockStudentQuestions.filter(q => q.trainerId === trainerId);
  console.log(`Found ${questions.length} questions for trainer ${trainerId}`);
  return questions;
}

export async function markQuestionAsRead(questionId: string): Promise<{ success: boolean; message?: string }> {
  console.log("Server Action: markQuestionAsRead called for ID:", questionId);
  await delay(300);
  const questionIndex = mockStudentQuestions.findIndex(q => q.id === questionId);
  if (questionIndex > -1) {
    mockStudentQuestions[questionIndex].isRead = true;
    return { success: true, message: "Question marked as read." };
  }
  return { success: false, message: "Question not found." };
}

// Placeholder for sending a reply (mock)
export async function sendReplyToStudent(questionId: string, replyText: string): Promise<{ success: boolean; message?: string }> {
  console.log("Server Action: sendReplyToStudent (mock)", { questionId, replyText });
  await delay(500);
  // In a real app, this would save the reply and potentially notify the student.
  const questionIndex = mockStudentQuestions.findIndex(q => q.id === questionId);
  if (questionIndex > -1) {
    // mockStudentQuestions[questionIndex].reply = replyText; // If we add a reply field
    mockStudentQuestions[questionIndex].isRead = true; // Typically a reply means it's addressed
     return { success: true, message: "Reply sent and question marked as addressed (mock)." };
  }
  return { success: false, message: "Question not found for replying." };
}
