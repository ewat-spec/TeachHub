
export interface AssessmentResult {
  assessmentId: string;
  assessmentTitle: string;
  mark: number | null;
  totalMarks: number;
  comments?: string;
}

export interface CourseRecord {
  courseId: string;
  courseCode: string;
  courseName: string;
  assessments: AssessmentResult[];
  courseAverage?: number | null;
}

export interface AcademicRecord {
  studentId: string;
  studentName: string;
  admissionNumber: string;
  records: CourseRecord[];
  overallAverage?: number | null;
}

    