
'use server';

import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';

// In a real app, you would define a proper type/interface for the student profile
// For now, we'll use `any` for flexibility during this migration
export async function getStudentProfile(studentId: string): Promise<any | null> {
    try {
        if (!studentId) {
            console.log("No student ID provided to getStudentProfile.");
            return null;
        }
        const studentDocRef = doc(db, 'students', studentId);
        const docSnap = await getDoc(studentDocRef);

        if (docSnap.exists()) {
            return {
                id: docSnap.id,
                ...docSnap.data()
            };
        } else {
            console.warn(`No student profile found for ID: ${studentId}`);
            return null;
        }
    } catch (error) {
        console.error("Error fetching student profile:", error);
        // Don't throw here to avoid crashing the page, return null instead.
        return null;
    }
}

export async function updateStudentProfile(studentId: string, profileData: any): Promise<{ success: boolean; message: string }> {
    try {
        if (!studentId) {
             throw new Error("No student ID provided for update.");
        }
        const studentDocRef = doc(db, 'students', studentId);
        
        // Remove id from data to avoid writing it back to the document
        const { id, ...dataToUpdate } = profileData;

        await updateDoc(studentDocRef, {
            ...dataToUpdate,
            updatedAt: serverTimestamp()
        });
        
        return { success: true, message: "Profile updated successfully!" };
    } catch (error) {
        console.error("Error updating student profile:", error);
         if (error instanceof Error) {
            return { success: false, message: `Failed to update profile: ${error.message}` };
        }
        return { success: false, message: "An unknown error occurred while updating the profile." };
    }
}
