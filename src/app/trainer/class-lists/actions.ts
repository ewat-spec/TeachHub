
'use server';

import { 
    mockTrainerCoursesData, 
    mockStudentsData, 
    mockEnrollmentsData,
    mockAssessmentsForGradingData,
    mockStudentMarksData,
    CURRENT_TRAINER_ID // Ensure this is exported from data.ts
} from './data';
import type { Course, Student, Enrollment, AssessmentGrading, StudentMarkEntry } from './data';

// Simulate API delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export async function getTrainerCourses(): Promise<Course[]> {
  await delay(300);
  // Filter courses for the current trainer
  return mockTrainerCoursesData.filter(course => course.trainerId === CURRENT_TRAINER_ID);
}

export async function getEnrolledStudents(courseId: string): Promise<Student[]> {
  await delay(300);
  const enrollmentsForCourse = mockEnrollmentsData.filter(enrollment => enrollment.courseId === courseId);
  const studentIds = enrollmentsForCourse.map(e => e.studentId);
  return mockStudentsData.filter(student => studentIds.includes(student.id));
}

export async function getAssessmentsForCourse(courseId: string): Promise<AssessmentGrading[]> {
  await delay(300);
  return mockAssessmentsForGradingData.filter(assessment => assessment.courseId === courseId);
}

export async function getStudentMarksForAssessment(assessmentId: string): Promise<StudentMarkEntry[]> {
    await delay(200);
    return mockStudentMarksData.filter(mark => mark.assessmentId === assessmentId);
}

export async function saveStudentMark(entry: StudentMarkEntry): Promise<{ success: boolean; message: string }> {
    await delay(500);
    const existingMarkIndex = mockStudentMarksData.findIndex(
        m => m.studentId === entry.studentId && m.assessmentId === entry.assessmentId
    );

    const markAsNumber = entry.mark === "" || entry.mark === undefined || entry.mark === null ? undefined : Number(entry.mark);

    // Basic validation for mock
    const assessment = mockAssessmentsForGradingData.find(a => a.id === entry.assessmentId);
    if (assessment && markAsNumber !== undefined && (markAsNumber < 0 || markAsNumber > assessment.totalMarks)) {
        const studentName = mockStudentsData.find(s=>s.id === entry.studentId)?.name || 'Student';
        return { success: false, message: `Mark for ${studentName} (${markAsNumber}) is out of range (0-${assessment.totalMarks}).` };
    }


    if (existingMarkIndex > -1) {
        mockStudentMarksData[existingMarkIndex] = { ...mockStudentMarksData[existingMarkIndex], ...entry, mark: markAsNumber };
    } else {
        mockStudentMarksData.push({...entry, mark: markAsNumber});
    }
    // console.log("Updated marks store:", mockStudentMarksData);
    const studentName = mockStudentsData.find(s=>s.id === entry.studentId)?.name || 'Student';
    return { success: true, message: `Mark for ${studentName} saved.` };
}

export async function saveAllStudentMarks(entries: StudentMarkEntry[]): Promise<{ success: boolean; message: string; errors: string[] }> {
    await delay(1000);
    let allSuccessful = true;
    const errorMessages: string[] = [];
    let savedCount = 0;

    for (const entry of entries) {
        const markString = String(entry.mark).trim();
        // Skip saving if mark is undefined or an empty string after trimming
        if (entry.mark === undefined || entry.mark === null || markString === "") {
            const existingMarkIndex = mockStudentMarksData.findIndex(
                m => m.studentId === entry.studentId && m.assessmentId === entry.assessmentId
            );
            if (existingMarkIndex > -1) {
                mockStudentMarksData[existingMarkIndex].mark = undefined; // Clear the mark
                mockStudentMarksData[existingMarkIndex].comments = entry.comments || undefined; // update comments
            }
            continue; 
        }

        const result = await saveStudentMark(entry); 
        if (!result.success) {
            allSuccessful = false;
            errorMessages.push(result.message);
        } else {
            savedCount++;
        }
    }

    if (allSuccessful && savedCount > 0) {
        return { success: true, message: `All ${savedCount} entered marks saved successfully.`, errors: [] };
    } else if (savedCount > 0 && errorMessages.length > 0) {
        return { success: false, message: `${savedCount} marks saved, but some errors occurred.`, errors: errorMessages };
    } else if (errorMessages.length > 0) {
        return { success: false, message: "Failed to save marks.", errors: errorMessages };
    } else {
        return { success: true, message: "No valid marks were entered to save.", errors: [] };
    }
}

export async function updateCourseSharedResources(
  courseId: string, 
  videoUrlsString: string, 
  imageUrlsString: string
): Promise<{ success: boolean; message: string }> {
  await delay(400);
  const courseIndex = mockTrainerCoursesData.findIndex(c => c.id === courseId && c.trainerId === CURRENT_TRAINER_ID);

  if (courseIndex === -1) {
    return { success: false, message: "Course not found or not managed by you." };
  }

  const videoLinks = videoUrlsString.split(',').map(link => link.trim()).filter(link => link.length > 0 && (link.startsWith('http://') || link.startsWith('https://')));
  const imageLinks = imageUrlsString.split(',').map(link => link.trim()).filter(link => link.length > 0 && (link.startsWith('http://') || link.startsWith('https://')));

  mockTrainerCoursesData[courseIndex].sharedVideoLinks = videoLinks;
  mockTrainerCoursesData[courseIndex].sharedImageLinks = imageLinks;

  console.log(`Updated resources for course ${courseId}:`, mockTrainerCoursesData[courseIndex]);
  return { success: true, message: "Shared resources updated successfully." };
}

