import { NextResponse } from 'next/server';
import { GoogleAuth } from "google-auth-library";
import axios from "axios";

/**
 * Notebook Sync API Route
 *
 * Adapts the user's provided Firebase Function logic to a Next.js Route Handler.
 * This function is intended to be triggered by a GitHub Webhook or manually by a trainer
 * to sync curriculum content from GitHub to NotebookLM (Vertex AI Search).
 */
export async function POST(req: Request) {
  try {
    // 1. Security: Verify requester (e.g., GitHub Webhook Secret or Trainer Session)
    const authHeader = req.headers.get('authorization');
    const webhookSecret = process.env.GITHUB_WEBHOOK_SECRET;

    // For manual syncs from the UI, we could check session, but since we're using
    // a simple approach for this demo, we'll allow it if no secret is set,
    // or if the secret matches.
    if (webhookSecret && authHeader !== `Bearer ${webhookSecret}`) {
        return NextResponse.json({
            success: false,
            error: "Unauthorized",
            message: "Invalid or missing webhook secret."
        }, { status: 401 });
    }

    // 2. Configuration
    const notebookId = process.env.NEXT_PUBLIC_NOTEBOOK_ID || "YOUR_NOTEBOOK_ID";
    const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "your-google-cloud-project-id";

    // In a production scenario, you might want to get the file URL from the request body (GitHub webhook payload)
    const githubFileUrl = "https://raw.githubusercontent.com/user/TeachHub/main/curriculum/lesson1.md";

    console.log(`Starting sync for Notebook: ${notebookId} in Project: ${projectId}`);

    // 2. Fetch the latest curriculum content from GitHub
    let content;
    try {
        const githubResponse = await axios.get(githubFileUrl);
        content = githubResponse.data;
    } catch (githubError: any) {
        console.error("Failed to fetch from GitHub:", githubError.message);
        return NextResponse.json({
            success: false,
            error: "GitHub Fetch Failed",
            message: `Could not retrieve curriculum from ${githubFileUrl}`
        }, { status: 400 });
    }

    // 3. Authenticate with Google Cloud
    // google-auth-library will automatically use Application Default Credentials (ADC)
    // or the GOOGLE_APPLICATION_CREDENTIALS environment variable.
    const auth = new GoogleAuth({
      scopes: 'https://www.googleapis.com/auth/cloud-platform',
    });
    const client = await auth.getClient();
    const token = await client.getAccessToken();

    if (!token.token) {
        throw new Error("Failed to retrieve Google Cloud access token.");
    }

    // 4. Push to NotebookLM API (Vertex AI Search / Discovery Engine)
    const notebookApiUrl = `https://us-discoveryengine.googleapis.com/v1alpha/projects/${projectId}/locations/global/collections/default_collection/dataStores/${notebookId}/branches/0/documents`;

    await axios.post(notebookApiUrl, {
      content: {
        rawBytes: Buffer.from(typeof content === 'string' ? content : JSON.stringify(content)).toString('base64'),
        mimeType: 'text/markdown'
      },
      display_name: "Lesson 1: Engineering Fundamentals"
    }, {
      headers: {
        Authorization: `Bearer ${token.token}`,
        'Content-Type': 'application/json'
      }
    });

    return NextResponse.json({
      success: true,
      message: "TeachHub Notebook Updated Successfully!",
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error("Notebook sync failed:", error.response?.data || error.message);

    return NextResponse.json({
      success: false,
      error: "Internal Server Error",
      details: error.response?.data || error.message
    }, { status: 500 });
  }
}

/**
 * GET handler for simple health check
 */
export async function GET() {
    return NextResponse.json({
        message: "Notebook Sync API is active.",
        usage: "Send a POST request to trigger the curriculum sync."
    });
}
