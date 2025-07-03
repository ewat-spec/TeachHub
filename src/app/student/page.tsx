
import { redirect } from 'next/navigation';

export default function StudentRootPage() {
  // This page just redirects to the login page, providing a clean entry URL
  // for the student portal, e.g., your-app.com/student
  redirect('/student/login');
  
  // Return null because redirect will stop rendering.
  return null;
}
