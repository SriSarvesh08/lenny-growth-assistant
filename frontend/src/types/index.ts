export interface AgentStep {
  step_number: number;
  action: string;
  tool_name?: string | null;
  tool_input?: Record<string, unknown> | null;
  observation?: string | null;
  timestamp: string;
}

export interface Artifact {
  type: string;
  title: string;
  content: string;
  word_count?: number;
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  steps?: AgentStep[];
  artifacts?: Artifact[];
  citations?: SearchCitation[];
  confidence?: number;
  latency_ms?: number;
  follow_up_questions?: string[];
  provider?: string;
  model?: string;
  created_at?: string;
}

export interface ChatSessionSummary {
  session_id: string;
  message_count: number;
}

export interface ChatResponse {
  session_id: string;
  response: string;
  steps: AgentStep[];
  artifacts: Artifact[];
  citations?: SearchCitation[];
  confidence?: number;
  latency_ms?: number;
  follow_up_questions?: string[];
  provider: string;
  model: string;
  created_at: string;
}

export interface SearchCitation {
  chunk_id: number;
  content: string;
  chunk_index: number;
  episode_title: string;
  guest_name?: string | null;
  source_url: string;
  source_name: string;
  similarity: number;
}

export interface SearchResponse {
  query: string;
  results: SearchCitation[];
  formatted_context: string;
  count: number;
}

export interface EssayResponse {
  topic: string;
  framework: string;
  guidelines: string;
  headline: string;
  markdown_content: string;
  word_count: number;
}

export interface SystemHealth {
  status: string;
  app: string;
  version: string;
  llm_provider: {
    active_provider: 'local' | 'cloud';
    cloud_ready: boolean;
    cloud_model: string;
    local_ready: boolean;
    local_primary_model: string;
    local_fallback_model: string;
    ollama_details: {
      status: string;
      available_models?: string[];
      primary_model_available?: boolean;
      fallback_model_available?: boolean;
    };
  };
  embedding: {
    provider: string;
    dimension: number;
    model: string;
  };
}

export interface User {
  id: number;
  email: string;
  full_name: string;
  role: string;
  created_at?: string;
}

export interface AuthResponse {
  status: string;
  user: User;
  access_token: string;
  token_type: string;
}

