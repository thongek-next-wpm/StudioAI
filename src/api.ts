import { Conversation, Message, Persona, GeneratedImage, KnowledgeItem, DatabaseStats, ModelTier, ImageResolution, AspectRatio } from './types';

export const api = {
  async getStats(): Promise<DatabaseStats> {
    const res = await fetch('/api/db/stats');
    if (!res.ok) throw new Error('Failed to fetch DB stats');
    return res.json();
  },

  async exportDatabase(): Promise<any> {
    const res = await fetch('/api/db/export');
    if (!res.ok) throw new Error('Failed to export DB');
    return res.json();
  },

  async getConversations(): Promise<Conversation[]> {
    const res = await fetch('/api/conversations');
    if (!res.ok) throw new Error('Failed to fetch conversations');
    return res.json();
  },

  async getConversation(id: string): Promise<{ conversation: Conversation; messages: Message[] }> {
    const res = await fetch(`/api/conversations/${id}`);
    if (!res.ok) throw new Error('Failed to fetch conversation');
    return res.json();
  },

  async createConversation(data?: { title?: string; persona_id?: string; model?: string }): Promise<Conversation> {
    const res = await fetch('/api/conversations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data || {})
    });
    if (!res.ok) throw new Error('Failed to create conversation');
    return res.json();
  },

  async updateConversation(id: string, data: { title?: string; persona_id?: string; model?: string }): Promise<Conversation> {
    const res = await fetch(`/api/conversations/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Failed to update conversation');
    return res.json();
  },

  async deleteConversation(id: string): Promise<{ success: boolean }> {
    const res = await fetch(`/api/conversations/${id}`, {
      method: 'DELETE'
    });
    if (!res.ok) throw new Error('Failed to delete conversation');
    return res.json();
  },

  async sendMessage(params: {
    conversationId?: string;
    message: string;
    model: ModelTier;
    personaId: string;
    systemInstructionOverride?: string;
  }): Promise<{
    conversationId: string;
    userMessageId: string;
    assistantMessage: Message;
  }> {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Chat request failed');
    }
    return res.json();
  },

  async generateImage(params: {
    prompt: string;
    resolution: ImageResolution;
    aspectRatio: AspectRatio;
    conversationId?: string;
  }): Promise<{ success: boolean; image: GeneratedImage }> {
    const res = await fetch('/api/generate-image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Image generation failed');
    }
    return res.json();
  },

  async getImages(): Promise<GeneratedImage[]> {
    const res = await fetch('/api/images');
    if (!res.ok) throw new Error('Failed to fetch images');
    return res.json();
  },

  async deleteImage(id: string): Promise<{ success: boolean }> {
    const res = await fetch(`/api/images/${id}`, {
      method: 'DELETE'
    });
    if (!res.ok) throw new Error('Failed to delete image');
    return res.json();
  },

  async getPersonas(): Promise<Persona[]> {
    const res = await fetch('/api/personas');
    if (!res.ok) throw new Error('Failed to fetch personas');
    return res.json();
  },

  async createPersona(data: Partial<Persona>): Promise<Persona> {
    const res = await fetch('/api/personas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Failed to create persona');
    return res.json();
  },

  async deletePersona(id: string): Promise<{ success: boolean }> {
    const res = await fetch(`/api/personas/${id}`, {
      method: 'DELETE'
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to delete persona');
    }
    return res.json();
  },

  async getKnowledge(): Promise<KnowledgeItem[]> {
    const res = await fetch('/api/knowledge');
    if (!res.ok) throw new Error('Failed to fetch knowledge');
    return res.json();
  },

  async createKnowledge(data: { title: string; content: string; category?: string }): Promise<KnowledgeItem> {
    const res = await fetch('/api/knowledge', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Failed to create knowledge item');
    return res.json();
  },

  async deleteKnowledge(id: string): Promise<{ success: boolean }> {
    const res = await fetch(`/api/knowledge/${id}`, {
      method: 'DELETE'
    });
    if (!res.ok) throw new Error('Failed to delete knowledge item');
    return res.json();
  }
};
