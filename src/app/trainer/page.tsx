
import { redirect } from 'next/navigation';

export default function TrainerRootPage() {
  // This page just redirects to the login page, providing a clean entry URL
  // for the trainer portal, e.g., your-app.com/trainer
  redirect('/trainer/login');
  
  // Return null because redirect will stop rendering.
  return null;
}
