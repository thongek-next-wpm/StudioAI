import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';

const dataDir = path.resolve(process.cwd(), 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'studio.db');
export const db = new Database(dbPath);

// Enable WAL mode for high performance concurrent reads and writes
db.pragma('journal_mode = WAL');

// Initialize tables
db.exec(`
  CREATE TABLE IF NOT EXISTS conversations (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    persona_id TEXT NOT NULL DEFAULT 'general',
    model TEXT NOT NULL DEFAULT 'gemini-3.8-flash',
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS messages (
    id TEXT PRIMARY KEY,
    conversation_id TEXT NOT NULL,
    role TEXT NOT NULL,
    content TEXT NOT NULL,
    model_used TEXT,
    image_url TEXT,
    created_at INTEGER NOT NULL,
    FOREIGN KEY(conversation_id) REFERENCES conversations(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS personas (
    id TEXT PRIMARY KEY,
    name_en TEXT NOT NULL,
    name_th TEXT NOT NULL,
    system_instruction TEXT NOT NULL,
    description_en TEXT NOT NULL,
    description_th TEXT NOT NULL,
    icon TEXT NOT NULL DEFAULT 'bot',
    category TEXT NOT NULL DEFAULT 'assistant',
    is_default INTEGER NOT NULL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS generated_images (
    id TEXT PRIMARY KEY,
    conversation_id TEXT,
    prompt TEXT NOT NULL,
    resolution TEXT NOT NULL DEFAULT '1K',
    aspect_ratio TEXT NOT NULL DEFAULT '1:1',
    image_url TEXT NOT NULL,
    created_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS knowledge_items (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'general',
    created_at INTEGER NOT NULL
  );
`);

// Seed default personas if empty
const countPersonas = db.prepare('SELECT COUNT(*) as count FROM personas').get() as { count: number };
if (countPersonas.count === 0) {
  const insertPersona = db.prepare(`
    INSERT INTO personas (id, name_en, name_th, system_instruction, description_en, description_th, icon, category, is_default)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const defaultPersonas = [
    {
      id: 'creative-director',
      name_en: 'Creative Director',
      name_th: 'ผู้กำกับฝ่ายสร้างสรรค์',
      system_instruction: 'You are an inspiring, visionary Creative Director and Art Director. Help the user develop cinematic narratives, artistic concepts, visual composition ideas, and compelling design briefs in both Thai and English with flair, elegance, and deep aesthetic sensitivity.',
      description_en: 'Specializes in creative direction, brand aesthetics, visual storytelling, and cinematic concepts.',
      description_th: 'เชี่ยวชาญการกำกับศิลป์ วิสัยทัศน์งานออกแบบ การเล่าเรื่องด้วยภาพ และคอนเซปต์ระดับสตูดิโอ',
      icon: 'sparkles',
      category: 'creative',
      is_default: 1
    },
    {
      id: 'prompt-engineer',
      name_en: 'AI Prompt Engineer',
      name_th: 'วิศวกรออกแบบพรอมต์ AI',
      system_instruction: 'You are an elite AI Prompt Engineer. Your role is to craft, dissect, optimize, and refine textual prompts for state-of-the-art LLMs and image generation models like Gemini 3 Pro Image (1K, 2K, 4K). You provide prompt breakdowns, camera angles, lighting cues, artistic mediums, and negative prompts in both Thai and English.',
      description_en: 'Crafts optimal, high-detail prompts for AI image generation and language models.',
      description_th: 'สร้างและปรับแต่งคำสั่งพรอมต์ระดับสูงสำหรับโมเดลภาพและข้อความให้ได้ผลลัพธ์คมชัดที่สุด',
      icon: 'wand',
      category: 'technical',
      is_default: 1
    },
    {
      id: 'fullstack-dev',
      name_en: 'Full-Stack Software Architect',
      name_th: 'สถาปัตยกรรมระบบและวิศวกรซอฟต์แวร์',
      system_instruction: 'You are a Senior Principal Software Architect and Full-Stack Engineer. You write clean, robust, modern TypeScript, React, Node.js, and SQL code. Provide deep architectural reasoning, optimization advice, clean code patterns, and step-by-step troubleshooting in Thai and English.',
      description_en: 'Deep technical reasoning, robust code implementation, architecture patterns, and SQL queries.',
      description_th: 'วิเคราะห์โค้ดเชิงลึก วางโครงสร้างสถาปัตยกรรมระบบ เขียน SQL และแก้ปัญหาอย่างมีหลักการ',
      icon: 'code',
      category: 'technical',
      is_default: 1
    },
    {
      id: 'content-copywriter',
      name_en: 'Creative Copywriter',
      name_th: 'นักเขียนคอนเทนต์และการตลาด',
      system_instruction: 'You are an award-winning bilingual Copywriter and Brand Strategist. Craft high-converting headlines, engaging social media hooks, blog posts, video scripts, and marketing copy with strong emotional resonance in both Thai and English.',
      description_en: 'Compelling headlines, persuasive copywriting, storytelling hooks, and marketing campaigns.',
      description_th: 'เขียนข้อความโฆษณา แคปชันสะกดใจ สตอรีเทลลิง และบทความการตลาดภาษาไทยและอังกฤษ',
      icon: 'feather',
      category: 'marketing',
      is_default: 1
    },
    {
      id: 'general-assistant',
      name_en: 'General AI Partner',
      name_th: 'ผู้ช่วยอัจฉริยะทั่วไป',
      system_instruction: 'You are a smart, polite, highly versatile AI assistant. You answer questions accurately, synthesize knowledge, brainstorm ideas, and adapt flexibly to any task in Thai and English.',
      description_en: 'Fast, versatile, and balanced assistant for brainstorming, analysis, and general tasks.',
      description_th: 'ผู้ช่วยรอบรู้ที่ตอบคำถามได้รวดเร็ว แม่นยำ และครอบคลุมทุกการทำงาน',
      icon: 'bot',
      category: 'assistant',
      is_default: 1
    }
  ];

  for (const p of defaultPersonas) {
    insertPersona.run(
      p.id,
      p.name_en,
      p.name_th,
      p.system_instruction,
      p.description_en,
      p.description_th,
      p.icon,
      p.category,
      p.is_default
    );
  }
}

// Seed sample knowledge items if empty
const countKnowledge = db.prepare('SELECT COUNT(*) as count FROM knowledge_items').get() as { count: number };
if (countKnowledge.count === 0) {
  const insertKnowledge = db.prepare(`
    INSERT INTO knowledge_items (id, title, content, category, created_at)
    VALUES (?, ?, ?, ?, ?)
  `);

  const initialDocs = [
    {
      id: 'doc-1',
      title: 'คู่มือการสร้างภาพความละเอียด 4K ด้วย Gemini 3 Pro Image',
      content: 'การสร้างภาพความละเอียด 4K (3840x2160 หรือเทียบเท่า) ช่วยให้ได้รายละเอียดของพื้นผิว ผิวสัมผัส แสงเงาที่สมจริง เหมาะสำหรับงานโปสเตอร์ บิลบอร์ด และงานจัดแสดงระดับสตูดิโอ สามารถจับคู่กับ aspect ratio ต่างๆ เช่น 16:9, 1:1, 9:16 ได้อย่างราบรื่น',
      category: 'image_guide',
      created_at: Date.now()
    },
    {
      id: 'doc-2',
      title: 'เทคนิคการเลือกโมเดล Gemini สำหรับงานแต่ละประเภท',
      content: '1. gemini-3.1-flash-lite: สำหรับการโต้ตอบที่ต้องการความรวดเร็วสูง (Low-Latency) หรือการสรุปข้อความสั้นๆ\n2. gemini-3.8-flash: สำหรับการสนทนาทั่วไป การสร้างสรรค์เนื้อหา และการตอบโต้หลายรอบ (Multi-turn)\n3. gemini-4-argon: สำหรับโจทย์ที่ซับซ้อน การเขียนโปรแกรม วิเคราะห์เชิงตรรกะ และการคิดวิเคราะห์ขั้นสูง',
      category: 'model_guide',
      created_at: Date.now()
    }
  ];

  for (const doc of initialDocs) {
    insertKnowledge.run(doc.id, doc.title, doc.content, doc.category, doc.created_at);
  }
}
