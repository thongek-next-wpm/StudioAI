import dotenv from 'dotenv';
dotenv.config();

import express, { Request, Response } from 'express';
import path from 'path';
import { GoogleGenAI, ThinkingLevel } from '@google/genai';
import { db } from './server/db.js';

const app = express();
const PORT = 3000;

// Middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Server-side Gemini AI client initialization
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// ==========================================
// API ROUTES
// ==========================================

// 1. Get database statistics & summary
app.get('/api/db/stats', (req: Request, res: Response) => {
  try {
    const convCount = db.prepare('SELECT COUNT(*) as count FROM conversations').get() as { count: number };
    const msgCount = db.prepare('SELECT COUNT(*) as count FROM messages').get() as { count: number };
    const imgCount = db.prepare('SELECT COUNT(*) as count FROM generated_images').get() as { count: number };
    const docCount = db.prepare('SELECT COUNT(*) as count FROM knowledge_items').get() as { count: number };

    res.json({
      conversations: convCount.count,
      messages: msgCount.count,
      images: imgCount.count,
      knowledge: docCount.count,
      dbEngine: 'SQLite 3 (WAL mode)',
      status: 'Connected'
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 2. Export SQLite database
app.get('/api/db/export', (req: Request, res: Response) => {
  try {
    const conversations = db.prepare('SELECT * FROM conversations ORDER BY updated_at DESC').all();
    const messages = db.prepare('SELECT * FROM messages ORDER BY created_at ASC').all();
    const personas = db.prepare('SELECT * FROM personas').all();
    const images = db.prepare('SELECT id, conversation_id, prompt, resolution, aspect_ratio, created_at FROM generated_images ORDER BY created_at DESC').all();
    const knowledge = db.prepare('SELECT * FROM knowledge_items ORDER BY created_at DESC').all();

    res.json({
      exportedAt: new Date().toISOString(),
      conversations,
      messages,
      personas,
      images,
      knowledge
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 3. Conversations endpoints
app.get('/api/conversations', (req: Request, res: Response) => {
  try {
    const conversations = db.prepare(`
      SELECT 
        c.*,
        p.name_en as persona_name_en,
        p.name_th as persona_name_th,
        p.icon as persona_icon,
        (SELECT COUNT(*) FROM messages m WHERE m.conversation_id = c.id) as message_count,
        (SELECT content FROM messages m WHERE m.conversation_id = c.id ORDER BY created_at DESC LIMIT 1) as last_message
      FROM conversations c
      LEFT JOIN personas p ON c.persona_id = p.id
      ORDER BY c.updated_at DESC
    `).all();

    res.json(conversations);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/conversations', (req: Request, res: Response) => {
  try {
    const { id, title, persona_id, model } = req.body;
    const convId = id || `conv_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const convTitle = title || 'การสนทนาใหม่ (New Session)';
    const personaId = persona_id || 'general-assistant';
    const convModel = model || 'gemini-3.8-flash';
    const now = Date.now();

    db.prepare(`
      INSERT INTO conversations (id, title, persona_id, model, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(convId, convTitle, personaId, convModel, now, now);

    const created = db.prepare('SELECT * FROM conversations WHERE id = ?').get(convId);
    res.status(201).json(created);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/conversations/:id', (req: Request, res: Response) => {
  try {
    const conv = db.prepare('SELECT * FROM conversations WHERE id = ?').get(req.params.id);
    if (!conv) {
      return res.status(404).json({ error: 'Conversation not found' });
    }
    const messages = db.prepare('SELECT * FROM messages WHERE conversation_id = ? ORDER BY created_at ASC').all(req.params.id);
    res.json({ conversation: conv, messages });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.patch('/api/conversations/:id', (req: Request, res: Response) => {
  try {
    const { title, persona_id, model } = req.body;
    const updates: string[] = [];
    const params: any[] = [];

    if (title !== undefined) {
      updates.push('title = ?');
      params.push(title);
    }
    if (persona_id !== undefined) {
      updates.push('persona_id = ?');
      params.push(persona_id);
    }
    if (model !== undefined) {
      updates.push('model = ?');
      params.push(model);
    }

    if (updates.length > 0) {
      updates.push('updated_at = ?');
      params.push(Date.now());
      params.push(req.params.id);

      db.prepare(`UPDATE conversations SET ${updates.join(', ')} WHERE id = ?`).run(...params);
    }

    const updated = db.prepare('SELECT * FROM conversations WHERE id = ?').get(req.params.id);
    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/conversations/:id', (req: Request, res: Response) => {
  try {
    db.prepare('DELETE FROM messages WHERE conversation_id = ?').run(req.params.id);
    db.prepare('DELETE FROM conversations WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 4. Personas endpoints
app.get('/api/personas', (req: Request, res: Response) => {
  try {
    const personas = db.prepare('SELECT * FROM personas ORDER BY is_default DESC, name_en ASC').all();
    res.json(personas);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/personas', (req: Request, res: Response) => {
  try {
    const { id, name_en, name_th, system_instruction, description_en, description_th, icon, category } = req.body;
    const personaId = id || `persona_${Date.now()}`;

    db.prepare(`
      INSERT OR REPLACE INTO personas (id, name_en, name_th, system_instruction, description_en, description_th, icon, category, is_default)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0)
    `).run(personaId, name_en, name_th, system_instruction, description_en || '', description_th || '', icon || 'bot', category || 'custom');

    const created = db.prepare('SELECT * FROM personas WHERE id = ?').get(personaId);
    res.status(201).json(created);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/personas/:id', (req: Request, res: Response) => {
  try {
    const target = db.prepare('SELECT is_default FROM personas WHERE id = ?').get(req.params.id) as { is_default: number } | undefined;
    if (target?.is_default) {
      return res.status(400).json({ error: 'Cannot delete default system persona' });
    }
    db.prepare('DELETE FROM personas WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 5. Knowledge items endpoints
app.get('/api/knowledge', (req: Request, res: Response) => {
  try {
    const items = db.prepare('SELECT * FROM knowledge_items ORDER BY created_at DESC').all();
    res.json(items);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/knowledge', (req: Request, res: Response) => {
  try {
    const { title, content, category } = req.body;
    const id = `doc_${Date.now()}`;
    const now = Date.now();

    db.prepare(`
      INSERT INTO knowledge_items (id, title, content, category, created_at)
      VALUES (?, ?, ?, ?, ?)
    `).run(id, title, content, category || 'general', now);

    const created = db.prepare('SELECT * FROM knowledge_items WHERE id = ?').get(id);
    res.status(201).json(created);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/knowledge/:id', (req: Request, res: Response) => {
  try {
    db.prepare('DELETE FROM knowledge_items WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 6. Generated Images endpoints
app.get('/api/images', (req: Request, res: Response) => {
  try {
    const images = db.prepare('SELECT * FROM generated_images ORDER BY created_at DESC').all();
    res.json(images);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/images/:id', (req: Request, res: Response) => {
  try {
    db.prepare('DELETE FROM generated_images WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// GEMINI AI INTEGRATIONS
// ==========================================

// Chat endpoint supporting multi-turn, low-latency, and complex reasoning models
app.post('/api/chat', async (req: Request, res: Response) => {
  try {
    const {
      conversationId,
      message,
      model = 'gemini-3.8-flash',
      personaId = 'general-assistant',
      systemInstructionOverride
    } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ error: 'Message content is required' });
    }

    let activeConvId = conversationId;
    const now = Date.now();

    // Create conversation if doesn't exist
    if (!activeConvId) {
      activeConvId = `conv_${now}_${Math.random().toString(36).substring(2, 7)}`;
      // Generate short title from first prompt (max 40 chars)
      const cleanTitle = message.trim().slice(0, 40) + (message.length > 40 ? '...' : '');
      db.prepare(`
        INSERT INTO conversations (id, title, persona_id, model, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(activeConvId, cleanTitle, personaId, model, now, now);
    }

    // Insert user message into SQLite
    const userMsgId = `msg_${now}_user`;
    db.prepare(`
      INSERT INTO messages (id, conversation_id, role, content, model_used, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(userMsgId, activeConvId, 'user', message, model, now);

    // Fetch conversation history for multi-turn context
    const previousMessages = db.prepare(`
      SELECT role, content FROM messages 
      WHERE conversation_id = ? 
      ORDER BY created_at ASC
    `).all(activeConvId) as { role: string; content: string }[];

    // Fetch persona system instruction
    let systemInstruction = systemInstructionOverride;
    if (!systemInstruction) {
      const persona = db.prepare('SELECT system_instruction FROM personas WHERE id = ?').get(personaId) as { system_instruction: string } | undefined;
      systemInstruction = persona ? persona.system_instruction : 'You are a helpful, creative assistant in Thai and English.';
    }

    // Format Gemini contents payload
    const contents = previousMessages.map((msg) => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }],
    }));

    // Configure model reasoning depth and parameters
    const config: any = {
      systemInstruction,
    };

    // Model specific tuning
    let selectedModel = model;
    if (model === 'gemini-3.1-flash-lite') {
      // Fast, ultra low-latency responses
      config.thinkingConfig = { thinkingLevel: ThinkingLevel.MINIMAL };
    } else if (model === 'gemini-4-argon') {
      // Complex tasks & deep STEM / architectural reasoning
      config.thinkingConfig = { thinkingLevel: ThinkingLevel.HIGH };
    } else {
      // General tasks (gemini-3.8-flash)
      selectedModel = 'gemini-3.8-flash';
      config.thinkingConfig = { thinkingLevel: ThinkingLevel.MEDIUM };
    }

    const aiResponse = await ai.models.generateContent({
      model: selectedModel,
      contents,
      config,
    });

    const replyText = aiResponse.text || 'ขออภัย ไม่สามารถสร้างคำตอบได้ในขณะนี้';

    // Insert assistant response into SQLite
    const assistantMsgId = `msg_${Date.now()}_model`;
    db.prepare(`
      INSERT INTO messages (id, conversation_id, role, content, model_used, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(assistantMsgId, activeConvId, 'model', replyText, selectedModel, Date.now());

    // Update conversation updated_at and model
    db.prepare(`
      UPDATE conversations 
      SET updated_at = ?, model = ? 
      WHERE id = ?
    `).run(Date.now(), selectedModel, activeConvId);

    res.json({
      conversationId: activeConvId,
      userMessageId: userMsgId,
      assistantMessage: {
        id: assistantMsgId,
        conversation_id: activeConvId,
        role: 'model',
        content: replyText,
        model_used: selectedModel,
        created_at: Date.now(),
      },
    });
  } catch (error: any) {
    console.error('Chat error:', error);
    res.status(500).json({ error: error.message || 'Failed to process chat response' });
  }
});

// Image generation endpoint using gemini-3-pro-image-preview with 1K, 2K, 4K resolution affordance
app.post('/api/generate-image', async (req: Request, res: Response) => {
  try {
    const {
      prompt,
      resolution = '1K', // '1K' | '2K' | '4K'
      aspectRatio = '1:1',
      conversationId
    } = req.body;

    if (!prompt || !prompt.trim()) {
      return res.status(400).json({ error: 'Image prompt is required' });
    }

    const validResolutions = ['1K', '2K', '4K'];
    const chosenResolution = validResolutions.includes(resolution) ? resolution : '1K';

    const validAspectRatios = ['1:1', '16:9', '9:16', '4:3', '3:4', '1:4', '1:8', '4:1', '8:1'];
    const chosenAspectRatio = validAspectRatios.includes(aspectRatio) ? aspectRatio : '1:1';

    let imageUrl = '';
    let responseText = '';

    // Primary model as requested: gemini-3-pro-image-preview
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-image-preview',
        contents: {
          parts: [{ text: prompt.trim() }],
        },
        config: {
          imageConfig: {
            aspectRatio: chosenAspectRatio as any,
            imageSize: chosenResolution as any,
          },
        },
      });

      for (const part of response.candidates?.[0]?.content?.parts ?? []) {
        if (part.inlineData?.data) {
          const mime = part.inlineData.mimeType || 'image/png';
          imageUrl = `data:${mime};base64,${part.inlineData.data}`;
        } else if (part.text) {
          responseText = part.text;
        }
      }
    } catch (primaryError: any) {
      console.warn('Primary image generation error:', primaryError.message);
      // Fallback attempt with gemini-nano-banana-2.1 or gemini-3.1-flash-lite-image if needed
      try {
        const fallbackResp = await ai.models.generateContent({
          model: 'gemini-nano-banana-2.1',
          contents: {
            parts: [{ text: prompt.trim() }],
          },
          config: {
            imageConfig: {
              aspectRatio: chosenAspectRatio as any,
              imageSize: chosenResolution as any,
            },
          },
        });
        for (const part of fallbackResp.candidates?.[0]?.content?.parts ?? []) {
          if (part.inlineData?.data) {
            const mime = part.inlineData.mimeType || 'image/png';
            imageUrl = `data:${mime};base64,${part.inlineData.data}`;
          }
        }
      } catch (fallbackError: any) {
        throw new Error(primaryError.message || fallbackError.message);
      }
    }

    if (!imageUrl) {
      return res.status(500).json({
        error: 'Model did not return image data. Note from model: ' + (responseText || 'Please try refining the prompt.')
      });
    }

    // Save image to SQLite database
    const imgId = `img_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const now = Date.now();

    db.prepare(`
      INSERT INTO generated_images (id, conversation_id, prompt, resolution, aspect_ratio, image_url, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(imgId, conversationId || null, prompt.trim(), chosenResolution, chosenAspectRatio, imageUrl, now);

    // If linked to a conversation, insert as message with image attachment
    if (conversationId) {
      const userMsgId = `msg_${now}_user_img`;
      db.prepare(`
        INSERT INTO messages (id, conversation_id, role, content, model_used, created_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(userMsgId, conversationId, 'user', `[สร้างภาพ / Generate Image ${chosenResolution} ${chosenAspectRatio}]: ${prompt}`, 'gemini-3-pro-image-preview', now);

      const modelMsgId = `msg_${now + 1}_model_img`;
      db.prepare(`
        INSERT INTO messages (id, conversation_id, role, content, model_used, image_url, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(modelMsgId, conversationId, 'model', `สร้างภาพความละเอียด ${chosenResolution} สำเร็จแล้ว`, 'gemini-3-pro-image-preview', imageUrl, now + 1);

      db.prepare('UPDATE conversations SET updated_at = ? WHERE id = ?').run(Date.now(), conversationId);
    }

    res.json({
      success: true,
      image: {
        id: imgId,
        conversation_id: conversationId || null,
        prompt: prompt.trim(),
        resolution: chosenResolution,
        aspect_ratio: chosenAspectRatio,
        image_url: imageUrl,
        created_at: now
      }
    });
  } catch (error: any) {
    console.error('Image generation error:', error);
    res.status(500).json({ error: error.message || 'Image generation failed' });
  }
});

// ==========================================
// VITE CLIENT MIDDLEWARE OR STATIC SERVE
// ==========================================
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(process.cwd(), 'dist')));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.resolve(process.cwd(), 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`AI Studio Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
