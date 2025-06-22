
'use server';

import { db } from '@/lib/firebase';
import { collection, getDocs, addDoc, doc, updateDoc, deleteDoc, serverTimestamp, Timestamp } from 'firebase/firestore';

// In a real app, trainerId would come from session/auth context.
// For now, we'll assume a hardcoded ID for all assessments.
const MOCK_TRAINER_ID = "trainerJane";

export async function getAssessments() {
    try {
        const assessmentsCol = collection(db, 'assessments');
        // In a real app, you'd query by trainer ID: const q = query(assessmentsCol, where("trainerId", "==", MOCK_TRAINER_ID));
        const snapshot = await getDocs(assessmentsCol);
        if (snapshot.empty) {
            return [];
        }
        const assessments = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                // Convert Firestore Timestamp to JS Date for the form
                testDate: data.testDate instanceof Timestamp ? data.testDate.toDate() : new Date(),
            };
        });
        return assessments;
    } catch (error) {
        console.error("Error fetching assessments from Firestore:", error);
        if (error instanceof Error) {
            throw new Error(`Failed to fetch assessments: ${error.message}`);
        }
        throw new Error("An unknown error occurred while fetching assessments.");
    }
}

export async function saveAssessment(assessmentData: any) {
  console.log("Saving assessment to Firestore:", assessmentData);
  try {
    const { id, ...dataToSave } = assessmentData;
    
    dataToSave.trainerId = MOCK_TRAINER_ID; // Assign trainer ID

    if (id) {
      // Update existing document
      dataToSave.updatedAt = serverTimestamp();
      const assessmentDoc = doc(db, 'assessments', id);
      await updateDoc(assessmentDoc, dataToSave);
      return { success: true, message: "Assessment updated successfully!", id: id };
    } else {
      // Create new document
      dataToSave.createdAt = serverTimestamp();
      const docRef = await addDoc(collection(db, 'assessments'), dataToSave);
      return { success: true, message: "Assessment saved successfully!", id: docRef.id };
    }
  } catch (error) {
    console.error("Error saving assessment to Firestore:", error);
     if (error instanceof Error) {
        throw new Error(`Failed to save assessment: ${error.message}`);
    }
    throw new Error("An unknown error occurred while saving the assessment.");
  }
}

export async function deleteAssessment(assessmentId: string) {
  console.log("Deleting assessment from Firestore:", assessmentId);
  try {
    if (!assessmentId) {
        throw new Error("No assessment ID provided for deletion.");
    }
    await deleteDoc(doc(db, 'assessments', assessmentId));
    return { success: true, message: "Assessment deleted successfully!" };
  } catch (error) {
    console.error("Error deleting assessment from Firestore:", error);
    if (error instanceof Error) {
        throw new Error(`Failed to delete assessment: ${error.message}`);
    }
    throw new Error("An unknown error occurred while deleting the assessment.");
  }
}
