
'use server';

import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, doc, setDoc, updateDoc, writeBatch } from 'firebase/firestore';
import type { Course, Student, Enrollment, AssessmentGrading, StudentMarkEntry } from './data';

// Assume a logged-in trainer's ID is available.
// In a real app, this would come from an authentication context.
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

export async function getEnrolledStudents(courseId: string): Promise<Student[]> {
  try {
    const enrollmentsCol = collection(db, 'enrollments');
    const q = query(enrollmentsCol, where("courseId", "==", courseId));
    const enrollmentsSnapshot = await getDocs(q);
    if (enrollmentsSnapshot.empty) return [];

    const studentIds = enrollmentsSnapshot.docs.map(doc => doc.data().studentId);
    if (studentIds.length === 0) return [];
    
    // Firestore 'in' queries are limited to 30 items. For larger classes, you'd need to batch this.
    // For this app, a class size under 30 is a reasonable assumption.
    const studentsCol = collection(db, 'students');
    const studentsQuery = query(studentsCol, where("__name__", "in", studentIds));
    const studentsSnapshot = await getDocs(studentsQuery);
    
    return studentsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Student));
  } catch (error) {
    console.error("Error fetching enrolled students:", error);
    throw new Error("Failed to fetch enrolled students.");
  }
}

export async function getAssessmentsForCourse(courseId: string): Promise<AssessmentGrading[]> {
  try {
    const assessmentsCol = collection(db, 'assessments');
    const q = query(assessmentsCol, where("courseId", "==", courseId)); // Assuming assessments have courseId
    const snapshot = await getDocs(q);
    if (snapshot.empty) return [];
    // Note: This assumes `assessments` collection has `courseId` field.
    // The current assessments page doesn't save one, so this might return empty.
    // For the demo, let's also fetch by topic.
    const courseSnap = await getDoc(doc(db, 'courses', courseId));
    if (!courseSnap.exists()) return [];
    const courseTopic = courseSnap.data().name; // Or a dedicated topic field
    const qByTopic = query(assessmentsCol, where("topic", "==", courseTopic));
    const snapshotByTopic = await getDocs(qByTopic);

    if (snapshotByTopic.empty) return [];
    return snapshotByTopic.docs.map(doc => ({ id: doc.id, ...doc.data(), courseId: courseId } as AssessmentGrading));
  } catch (error) {
     console.error("Error fetching assessments for course:", error);
     throw new Error("Failed to fetch assessments.");
  }
}

export async function getStudentMarksForAssessment(assessmentId: string): Promise<StudentMarkEntry[]> {
    try {
        const marksCol = collection(db, 'studentMarks');
        const q = query(marksCol, where("assessmentId", "==", assessmentId));
        const snapshot = await getDocs(q);
        if (snapshot.empty) return [];
        return snapshot.docs.map(doc => doc.data() as StudentMarkEntry);
    } catch (error) {
        console.error("Error fetching student marks:", error);
        throw new Error("Failed to fetch student marks.");
    }
}


export async function saveAllStudentMarks(entries: StudentMarkEntry[]): Promise<{ success: boolean; message: string; errors: string[] }> {
    const batch = writeBatch(db);
    const errors: string[] = [];
    let validEntriesCount = 0;

    const assessmentId = entries[0]?.assessmentId;
    if (!assessmentId) {
        return { success: false, message: "No assessment ID provided.", errors: ["Assessment ID is missing."]};
    }

    try {
        const assessmentDoc = await getDoc(doc(db, 'assessments', assessmentId));
        if (!assessmentDoc.exists()) {
             return { success: false, message: "Assessment not found.", errors: ["The selected assessment does not exist."]};
        }
        const totalMarks = assessmentDoc.data().totalMarks;

        for (const entry of entries) {
            const markAsNumber = (entry.mark === "" || entry.mark === undefined || entry.mark === null) 
                ? null 
                : Number(entry.mark);

            if (markAsNumber !== null) {
                if (isNaN(markAsNumber) || markAsNumber < 0 || markAsNumber > totalMarks) {
                    errors.push(`Invalid mark for ${entry.studentName}. Must be a number between 0 and ${totalMarks}.`);
                    continue;
                }
            }
            
            validEntriesCount++;
            const docId = `${entry.assessmentId}_${entry.studentId}`;
            const markDocRef = doc(db, 'studentMarks', docId);

            const dataToSet = {
                studentId: entry.studentId,
                assessmentId: entry.assessmentId,
                mark: markAsNumber,
                comments: entry.comments || "",
            };

            batch.set(markDocRef, dataToSet, { merge: true });
        }

        if (errors.length > 0) {
            return { success: false, message: "Validation errors occurred.", errors };
        }

        if (validEntriesCount === 0) {
            return { success: true, message: "No marks were entered to save.", errors: [] };
        }

        await batch.commit();
        return { success: true, message: `Successfully saved ${validEntriesCount} mark(s).`, errors: [] };

    } catch(e) {
        console.error("Error saving marks in batch:", e);
        if (e instanceof Error) {
            return { success: false, message: `Server error: ${e.message}`, errors: [e.message] };
        }
        return { success: false, message: "An unknown server error occurred.", errors: [] };
    }
}

export async function updateCourseSharedResources(
  courseId: string, 
  videoUrlsString: string, 
  imageUrlsString: string
): Promise<{ success: boolean; message: string }> {
    try {
        const courseRef = doc(db, 'courses', courseId);
        const courseDoc = await getDoc(courseRef);
        if (!courseDoc.exists() || courseDoc.data().trainerId !== CURRENT_TRAINER_ID) {
            return { success: false, message: "Course not found or you don't have permission to edit it." };
        }

        const videoLinks = videoUrlsString.split(',').map(link => link.trim()).filter(link => link.length > 0 && (link.startsWith('http://') || link.startsWith('https://')));
        const imageLinks = imageUrlsString.split(',').map(link => link.trim()).filter(link => link.length > 0 && (link.startsWith('http://') || link.startsWith('https://')));

        await updateDoc(courseRef, {
            sharedVideoLinks: videoLinks,
            sharedImageLinks: imageLinks,
        });

        return { success: true, message: "Shared resources updated successfully." };
    } catch(e) {
        console.error("Error updating shared resources:", e);
        if (e instanceof Error) {
            return { success: false, message: `Server error: ${e.message}`};
        }
        return { success: false, message: "An unknown server error occurred."};
    }
}
