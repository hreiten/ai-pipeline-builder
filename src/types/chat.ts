
export interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export interface LocationState {
  modelName: string;
  description: string;
  data: string;
  projectId: string;
}
