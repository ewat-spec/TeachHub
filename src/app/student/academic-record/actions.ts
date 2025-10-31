
'use server';

import { db } from '@/lib/firebase';
import { collection, doc, getDoc, getDocs, query, where } from 'firebase/firestore';
import type { AcademicRecord, CourseRecord, AssessmentResult } from './data';
import type { Student } from '@/app/trainer/class-lists/data';
import type { Invoice } from '../finance/data';

// Helper to calculate a weighted average, returns null if no valid marks
function calculateAverage(items: { mark: number | null, totalMarks: number }[]): number | null {
    const validItems = items.filter(item => typeof item.mark === 'number' && typeof item.totalMarks === 'number' && item.totalMarks > 0);
    if (validItems.length === 0) return null;

    const totalMark = validItems.reduce((sum, item) => sum + item.mark!, 0);
    const totalMaxMarks = validItems.reduce((sum, item) => sum + item.totalMarks, 0);

    if (totalMaxMarks === 0) return null;

    return Math.round((totalMark / totalMaxMarks) * 100);
}


export async function getStudentAcademicRecord(studentId: string): Promise<AcademicRecord | null> {
    if (!studentId) return null;

    try {
        const studentDoc = await getDoc(doc(db, 'students', studentId));
        if (!studentDoc.exists()) {
            console.warn(`No student found with ID: ${studentId}`);
            return null;
        }
        const studentData = { id: studentDoc.id, ...studentDoc.data() } as Student;

        const enrollmentsQuery = query(collection(db, 'enrollments'), where("studentId", "==", studentId));
        const enrollmentsSnapshot = await getDocs(enrollmentsQuery);
        if (enrollmentsSnapshot.empty) {
            return { studentId, studentName: studentData.name, admissionNumber: studentData.admissionNumber, records: [] };
        }
        const courseIds = enrollmentsSnapshot.docs.map(d => d.data().courseId);

        const coursesQuery = query(collection(db, 'courses'), where('__name__', 'in', courseIds));
        const coursesSnapshot = await getDocs(coursesQuery);
        const courses = coursesSnapshot.docs.map(d => ({ id: d.id, ...d.data() }));

        const courseRecords: CourseRecord[] = [];
        const allAssessmentsForAverage: { mark: number | null, totalMarks: number }[] = [];

        for (const course of courses) {
            const assessmentsQuery = query(collection(db, 'assessments'), where("courseId", "==", course.id));
            const assessmentsSnapshot = await getDocs(assessmentsQuery);
            const assessments = assessmentsSnapshot.docs.map(d => ({ id: d.id, ...d.data() }));
            
            const assessmentResults: AssessmentResult[] = [];

            for (const assessment of assessments) {
                const markDocId = `${assessment.id}_${studentId}`;
                const markDoc = await getDoc(doc(db, 'studentMarks', markDocId));
                
                const markData = markDoc.exists() ? markDoc.data() : { mark: null, comments: ''};

                assessmentResults.push({
                    assessmentId: assessment.id,
                    assessmentTitle: assessment.title,
                    mark: typeof markData.mark === 'number' ? markData.mark : null,
                    totalMarks: assessment.totalMarks,
                    comments: markData.comments,
                });
            }
            
            const courseAverage = calculateAverage(assessmentResults);
            if (courseAverage !== null) {
                // Add all valid marks from this course to the overall average calculation pool
                assessmentResults.forEach(ar => {
                    if (typeof ar.mark === 'number' && typeof ar.totalMarks === 'number' && ar.totalMarks > 0) {
                        allAssessmentsForAverage.push(ar);
                    }
                });
            }

            courseRecords.push({
                courseId: course.id,
                courseCode: course.code,
                courseName: course.name,
                assessments: assessmentResults,
                courseAverage: courseAverage
            });
        }
        
        const overallAverage = calculateAverage(allAssessmentsForAverage);

        return {
            studentId,
            studentName: studentData.name,
            admissionNumber: studentData.admissionNumber,
            records: courseRecords,
            overallAverage,
        };

    } catch (error) {
        console.error("Error fetching academic record for student:", studentId, error);
        if (error instanceof Error) {
            throw new Error(`Failed to fetch academic record: ${error.message}`);
        }
        throw new Error("An unknown error occurred while fetching the academic record.");
    }
}

    