export type Language = 'th' | 'en';

export type ModelTier = 'gemini-3.1-flash-lite' | 'gemini-3.8-flash' | 'gemini-4-argon';

export type ImageResolution = '1K' | '2K' | '4K';

export type AspectRatio = '1:1' | '16:9' | '9:16' | '4:3' | '3:4';

export interface Persona {
  id: string;
  name_en: string;
  name_th: string;
  system_instruction: string;
  description_en: string;
  description_th: string;
  icon: string;
  category: string;
  is_default: number;
}

export interface Conversation {
  id: string;
  title: string;
  persona_id: string;
  model: string;
  created_at: number;
  updated_at: number;
  persona_name_en?: string;
  persona_name_th?: string;
  persona_icon?: string;
  message_count?: number;
  last_message?: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  role: 'user' | 'model';
  content: string;
  model_used?: string;
  image_url?: string;
  created_at: number;
}

export interface GeneratedImage {
  id: string;
  conversation_id?: string | null;
  prompt: string;
  resolution: ImageResolution;
  aspect_ratio: AspectRatio;
  image_url: string;
  created_at: number;
}

export interface KnowledgeItem {
  id: string;
  title: string;
  content: string;
  category: string;
  created_at: number;
}

export interface DatabaseStats {
  conversations: number;
  messages: number;
  images: number;
  knowledge: number;
  dbEngine: string;
  status: string;
}
