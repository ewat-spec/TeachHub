'use server';

import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, doc, getDoc, writeBatch } from 'firebase/firestore';
import type { Course, Student, AssessmentGrading, StudentMarkEntry, Marksheet } from './data';

const CURRENT_TRAINER_ID = "trainerJane";

export async function getTrainerCourses(): Promise<Course[]> {
  try {
    const coursesCol = collection(db, 'courses');
    const q = query(coursesCol, where("trainerId", "==", CURRENT_TRAINER_ID));
    const snapshot = await getDocs(q);
    if (snapshot.empty) return [];
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Course));
  } catch (error) {
    console.error("Error fetching trainer courses:", error);
    throw new Error("Failed to fetch courses.");
  }
}

export async function getMarksheetData(courseId: string): Promise<Marksheet | null> {
    if (!courseId) return null;

    try {
        const courseDoc = await getDoc(doc(db, 'courses', courseId));
        if (!courseDoc.exists()) throw new Error("Course not found");
        const course = { id: courseDoc.id, ...courseDoc.data() } as Course;
        
        // 1. Get Students
        const enrollmentsQuery = query(collection(db, 'enrollments'), where("courseId", "==", courseId));
        const enrollmentsSnapshot = await getDocs(enrollmentsQuery);
        const studentIds = enrollmentsSnapshot.docs.map(d => d.data().studentId);
        let students: Student[] = [];
        if (studentIds.length > 0) {
            // Firestore 'in' queries are limited to 30 items. For larger classes, batching is needed.
            // This implementation assumes class sizes are within this limit.
            const studentsQuery = query(collection(db, 'students'), where("__name__", "in", studentIds));
            const studentsSnapshot = await getDocs(studentsQuery);
            students = studentsSnapshot.docs.map(d => ({ id: d.id, ...d.data() } as Student));
        }

        // 2. Get Assessments for the course
        const assessmentsQuery = query(collection(db, 'assessments'), where("courseId", "==", courseId));
        const assessmentsSnapshot = await getDocs(assessmentsQuery);
        const assessments = assessmentsSnapshot.docs.map(d => ({ id: d.id, ...d.data() } as AssessmentGrading));

        // 3. Get all marks for these assessments efficiently
        let marks: StudentMarkEntry[] = [];
        const assessmentIds = assessments.map(a => a.id);
        if (assessmentIds.length > 0 && studentIds.length > 0) {
            // Firestore 'in' queries are limited to 30 items per query.
            const marksQuery = query(collection(db, 'studentMarks'), where("assessmentId", "in", assessmentIds));
            const marksSnapshot = await getDocs(marksQuery);
            marks = marksSnapshot.docs.map(d => d.data() as StudentMarkEntry);
        }

        return {
            course,
            students: students.sort((a, b) => a.name.localeCompare(b.name)), // Sort students alphabetically
            assessments: assessments.sort((a,b) => a.title.localeCompare(b.title)), // Sort assessments
            marks
        };

    } catch (error) {
        console.error("Error fetching marksheet data:", error);
        if (error instanceof Error) {
            throw new Error(`Failed to fetch marksheet data: ${error.message}`);
        }
        throw new Error("An unknown error occurred while fetching marksheet data.");
    }
}


export async function saveMarks(
  entries: { studentId: string; assessmentId: string; mark: number | null; comments: string }[],
  totalMarksMap: Record<string, number>
): Promise<{ success: boolean; message: string; errors: { studentId: string; assessmentId: string; message: string }[] }> {
    const batch = writeBatch(db);
    const errors: { studentId: string; assessmentId: string; message: string }[] = [];
    let validEntriesCount = 0;

    if (!entries || entries.length === 0) {
        return { success: true, message: "No marks to save.", errors: [] };
    }

    for (const entry of entries) {
        const totalMarks = totalMarksMap[entry.assessmentId];
        if (entry.mark !== null && (isNaN(entry.mark) || entry.mark < 0 || entry.mark > totalMarks)) {
            errors.push({ 
                studentId: entry.studentId, 
                assessmentId: entry.assessmentId, 
                message: `Invalid mark. Must be a number between 0 and ${totalMarks}.`
            });
            continue;
        }

        validEntriesCount++;
        const docId = `${entry.assessmentId}_${entry.studentId}`;
        const markDocRef = doc(db, 'studentMarks', docId);

        const dataToSet = {
            studentId: entry.studentId,
            assessmentId: entry.assessmentId,
            mark: entry.mark,
            comments: entry.comments || "",
        };

        batch.set(markDocRef, dataToSet, { merge: true });
    }

    if (errors.length > 0) {
        return { success: false, message: "Validation errors occurred. No marks were saved.", errors };
    }

    try {
        await batch.commit();
        return { success: true, message: `Successfully saved ${validEntriesCount} mark(s).`, errors: [] };
    } catch (e) {
        console.error("Error saving marks in batch:", e);
        return { success: false, message: "An error occurred while saving to the database.", errors: [] };
    }
}