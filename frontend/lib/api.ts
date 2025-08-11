const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface Application {
  id: string;
  title: string;
  description: string;
  problemStatement: string;
  solution: string;
  techStack: string[];
  teamSize: number;
  teamMembers: string[];
  githubRepo?: string;
  demoUrl?: string;
  status: string;
  submittedAt?: string;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    name: string;
    email: string;
  } | null;
}

interface ApplicationsResponse {
  applications: Application[];
  total: number;
  totalPages: number;
  currentPage: number;
}

export class ApiClient {
  private static getAuthToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('auth_token');
  }

  private static async fetchWithAuth(url: string, options: RequestInit = {}): Promise<Response> {
    const token = this.getAuthToken();
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}${url}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      if (response.status === 401) {
        // Token expired or invalid, redirect to login
        if (typeof window !== 'undefined') {
          localStorage.removeItem('auth_token');
          window.location.href = '/auth/signin';
        }
        throw new Error('Unauthorized - Please sign in again');
      }
      if (response.status === 404) {
        throw new Error('Resource not found');
      }
      if (response.status === 403) {
        throw new Error('Access forbidden');
      }
      
      // Try to get error message from response
      try {
        const errorData = await response.json();
        throw new Error(errorData.message || `API Error: ${response.status} ${response.statusText}`);
      } catch {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }
    }

    return response;
  }

  static async getUserApplications(page: number = 1, limit: number = 10): Promise<ApplicationsResponse> {
    const response = await this.fetchWithAuth(`/api/applications/my-applications?page=${page}&limit=${limit}`);
    return response.json();
  }

  static async getApplication(id: string): Promise<Application> {
    const response = await this.fetchWithAuth(`/api/applications/${id}`);
    return response.json();
  }

  static async createApplication(data: Partial<Application>): Promise<Application> {
    const response = await this.fetchWithAuth('/api/applications', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response.json();
  }

  static async updateApplication(id: string, data: Partial<Application>): Promise<Application> {
    const response = await this.fetchWithAuth(`/api/applications/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
    return response.json();
  }

  static async deleteApplication(id: string): Promise<void> {
    await this.fetchWithAuth(`/api/applications/${id}`, {
      method: 'DELETE',
    });
  }
}

export type { Application, ApplicationsResponse };
