import {
  AuthResponse,
  ChatResponse,
  ChatSessionSummary,
  EssayResponse,
  SearchResponse,
  SystemHealth,
  User,
} from '@/types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

class ApiClient {
  private getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('lenny_auth_token');
  }

  private setToken(token: string): void {
    localStorage.setItem('lenny_auth_token', token);
  }

  private clearToken(): void {
    localStorage.removeItem('lenny_auth_token');
    localStorage.removeItem('lenny_user');
  }

  private async request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE}${path}`;
    const token = this.getToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> || {}),
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(url, { ...options, headers });
      if (!response.ok) {
        let errorMsg = `HTTP ${response.status}: ${response.statusText}`;
        try {
          const errData = await response.json();
          if (errData.detail) errorMsg = errData.detail;
        } catch {
          // ignore json parse failure
        }
        throw new Error(errorMsg);
      }
      return await response.json();
    } catch (err: unknown) {
      if (err instanceof Error) {
        throw err;
      }
      throw new Error(`Network error connecting to ${url}`);
    }
  }

  async getHealth(): Promise<SystemHealth> {
    return this.request<SystemHealth>('/api/health');
  }

  async sendMessage(message: string, sessionId?: string): Promise<ChatResponse> {
    return this.request<ChatResponse>('/api/chat', {
      method: 'POST',
      body: JSON.stringify({ message, session_id: sessionId }),
    });
  }

  async listSessions(): Promise<{ sessions: ChatSessionSummary[] }> {
    return this.request<{ sessions: ChatSessionSummary[] }>('/api/sessions');
  }

  async getSessionDetails(sessionId: string): Promise<{
    session_id: string;
    messages: Array<{ role: 'user' | 'assistant'; content: string }>;
    transcripts: unknown[];
  }> {
    return this.request(`/api/sessions/${sessionId}`);
  }

  async searchTranscripts(query: string, limit = 5): Promise<SearchResponse> {
    return this.request<SearchResponse>('/api/tools/search', {
      method: 'POST',
      body: JSON.stringify({ query, limit }),
    });
  }

  async generateShip30Essay(
    topic: string,
    framework = 'atomic',
    context = ''
  ): Promise<EssayResponse> {
    return this.request<EssayResponse>('/api/tools/essay', {
      method: 'POST',
      body: JSON.stringify({ topic, framework, context }),
    });
  }

  async getKnowledgeSources(): Promise<{
    status: string;
    sources: Array<{ name: string; episodes: number; chunks: number; status: string }>;
    total_episodes: number;
    total_chunks: number;
  }> {
    return this.request('/api/knowledge/sources');
  }

  // ── Auth Methods ────────────────────────────────

  async register(email: string, password: string, fullName: string): Promise<AuthResponse> {
    const res = await this.request<AuthResponse>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, full_name: fullName }),
    });
    this.setToken(res.access_token);
    localStorage.setItem('lenny_user', JSON.stringify(res.user));
    return res;
  }

  async login(email: string, password: string): Promise<AuthResponse> {
    const res = await this.request<AuthResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    this.setToken(res.access_token);
    localStorage.setItem('lenny_user', JSON.stringify(res.user));
    return res;
  }

  async getMe(): Promise<User> {
    return this.request<User>('/api/auth/me');
  }

  logout(): void {
    this.clearToken();
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  getStoredUser(): User | null {
    if (typeof window === 'undefined') return null;
    const raw = localStorage.getItem('lenny_user');
    if (!raw) return null;
    try {
      return JSON.parse(raw) as User;
    } catch {
      return null;
    }
  }
}

export const api = new ApiClient();
