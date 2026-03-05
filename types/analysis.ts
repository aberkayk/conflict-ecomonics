export interface AnalysisRequest {
  conflictId: string;
  conflictName: string;
  countries: string[];
  region: string;
  economicContext?: string;
  focusAreas?: string[];
}

export interface AnalysisResponse {
  id: string;
  conflictId: string;
  content: string;
  createdAt: string;
  model: string;
}

export interface StreamingAnalysisState {
  content: string;
  isStreaming: boolean;
  error: string | null;
  startedAt: string | null;
}
