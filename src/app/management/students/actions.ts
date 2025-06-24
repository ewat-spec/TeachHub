
'use server';

import { db } from '@/lib/firebase';
import { collection, getDocs, addDoc, doc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';

export interface StudentData {
  id?: string;
  fullName: string;
  admissionNumber: string;
  email: string;
  phone?: string;
  course: string;
  yearOfStudy: string;
}

export async function getStudents(): Promise<StudentData[]> {
    try {
        const studentsCol = collection(db, 'students');
        const snapshot = await getDocs(studentsCol);
        if (snapshot.empty) {
            return [];
        }
        const students = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as StudentData));
        return students;
    } catch (error) {
        console.error("Error fetching students from Firestore:", error);
        if (error instanceof Error) {
            throw new Error(`Failed to fetch students: ${error.message}`);
        }
        throw new Error("An unknown error occurred while fetching students.");
    }
}

export async function saveStudent(studentData: StudentData): Promise<{ success: boolean; message: string; id?: string }> {
  console.log("Saving student to Firestore:", studentData);
  try {
    const { id, ...dataToSave } = studentData;

    if (id) {
      // Update existing document
      dataToSave.updatedAt = serverTimestamp();
      const studentDoc = doc(db, 'students', id);
      await updateDoc(studentDoc, dataToSave);
      return { success: true, message: "Student record updated successfully!", id: id };
    } else {
      // Create new document
      dataToSave.createdAt = serverTimestamp();
      const docRef = await addDoc(collection(db, 'students'), dataToSave);
      return { success: true, message: "New student added successfully!", id: docRef.id };
    }
  } catch (error) {
    console.error("Error saving student to Firestore:", error);
    if (error instanceof Error) {
        throw new Error(`Failed to save student record: ${error.message}`);
    }
    throw new Error("An unknown error occurred while saving the student record.");
  }
}

export async function deleteStudent(studentId: string): Promise<{ success: boolean; message: string }> {
  console.log("Deleting student from Firestore:", studentId);
  try {
    if (!studentId) {
        throw new Error("No student ID provided for deletion.");
    }
    await deleteDoc(doc(db, 'students', studentId));
    return { success: true, message: "Student record deleted successfully!" };
  } catch (error) {
    console.error("Error deleting student from Firestore:", error);
    if (error instanceof Error) {
        throw new Error(`Failed to delete student record: ${error.message}`);
    }
    throw new Error("An unknown error occurred while deleting the student record.");
  }
}
