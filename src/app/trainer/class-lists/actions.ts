'use server';

import { 
    mockTrainerCoursesData, 
    mockStudentsData, 
    mockEnrollmentsData,
    mockAssessmentsForGradingData,
    mockStudentMarksData,
    CURRENT_TRAINER_ID
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

    const markAsNumber = entry.mark === "" || entry.mark === undefined ? undefined : Number(entry.mark);

    // Basic validation for mock
    const assessment = mockAssessmentsForGradingData.find(a => a.id === entry.assessmentId);
    if (assessment && markAsNumber !== undefined && (markAsNumber < 0 || markAsNumber > assessment.totalMarks)) {
        return { success: false, message: `Mark for ${mockStudentsData.find(s=>s.id === entry.studentId)?.name} (${markAsNumber}) is out of range (0-${assessment.totalMarks}).` };
    }


    if (existingMarkIndex > -1) {
        mockStudentMarksData[existingMarkIndex] = { ...mockStudentMarksData[existingMarkIndex], ...entry, mark: markAsNumber };
    } else {
        mockStudentMarksData.push({...entry, mark: markAsNumber});
    }
    console.log("Updated marks store:", mockStudentMarksData);
    return { success: true, message: `Mark for ${mockStudentsData.find(s=>s.id === entry.studentId)?.name} saved.` };
}

export async function saveAllStudentMarks(entries: StudentMarkEntry[]): Promise<{ success: boolean; message: string; errors: string[] }> {
    await delay(1000);
    let allSuccessful = true;
    const errorMessages: string[] = [];
    let savedCount = 0;

    for (const entry of entries) {
        // Skip saving if mark is undefined (meaning not entered or cleared)
        if (entry.mark === undefined || entry.mark === "") {
            // If there's an existing entry, we might want to remove it or update its mark to undefined
            const existingMarkIndex = mockStudentMarksData.findIndex(
                m => m.studentId === entry.studentId && m.assessmentId === entry.assessmentId
            );
            if (existingMarkIndex > -1) {
                mockStudentMarksData[existingMarkIndex].mark = undefined;
                mockStudentMarksData[existingMarkIndex].comments = entry.comments || undefined; // update comments
            }
            // If no mark was entered and no previous record, do nothing for this student for this assessment
            continue;
        }

        const result = await saveStudentMark(entry); // saveStudentMark handles validation
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
        return { success: true, message: "No marks were entered to save.", errors: [] };
    }
}
