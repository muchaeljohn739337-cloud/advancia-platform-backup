// Frontend should NOT use Prisma directly
// All database operations should go through the backend API
// This file is kept for compatibility but doesn't use PrismaClient

// If you need database access, make API calls to the backend instead:
// Example: fetch('/api/users', { method: 'GET' })

export default null;

// Helper function for API calls
export async function apiRequest(endpoint: string, options?: RequestInit) {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
  const response = await fetch(`${baseUrl}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });

  if (!response.ok) {
    throw new Error(`API Error: ${response.statusText}`);
  }

  return response.json();
}
