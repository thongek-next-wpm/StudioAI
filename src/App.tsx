/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Conversation, Message, Persona, GeneratedImage, DatabaseStats, Language, ModelTier, ImageResolution, AspectRatio } from './types';
import { api } from './api';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { ChatView } from './components/ChatView';
import { ImageLabView } from './components/ImageLabView';
import { DatabaseExplorerView } from './components/DatabaseExplorerView';
import { PersonasView } from './components/PersonasView';
import { ImageModal } from './components/ImageModal';
import { AlertCircle, X } from 'lucide-react';

export default function App() {
  const [language, setLanguage] = useState<Language>('th');
  const [isDarkMode, setIsDarkMode] = useState<boolean>(true);
  const [currentTab, setCurrentTab] = useState<'chat' | 'image' | 'database' | 'personas'>('chat');

  // SQLite data states
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [activePersonaId, setActivePersonaId] = useState<string>('general-assistant');
  const [activeModel, setActiveModel] = useState<ModelTier>('gemini-3.8-flash');
  const [images, setImages] = useState<GeneratedImage[]>([]);
  const [stats, setStats] = useState<DatabaseStats | null>(null);

  // Interaction & UI states
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [isImageLoading, setIsImageLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Fullscreen Image Modal
  const [selectedImage, setSelectedImage] = useState<{
    url: string;
    prompt: string;
    resolution?: string;
    aspectRatio?: string;
  } | null>(null);

  // Sync dark mode class on document
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // Initial data loading from SQLite server
  const loadInitialData = async () => {
    try {
      const [convs, pers, imgs, dbStats] = await Promise.all([
        api.getConversations(),
        api.getPersonas(),
        api.getImages(),
        api.getStats()
      ]);

      setConversations(convs);
      setPersonas(pers);
      setImages(imgs);
      setStats(dbStats);

      if (convs.length > 0 && !activeConversationId) {
        // Select first conversation
        await handleSelectConversation(convs[0].id);
      } else if (convs.length === 0) {
        // Automatically create a starter session
        await handleNewConversation();
      }
    } catch (err: any) {
      console.error('Failed to load initial data:', err);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  // Handle select conversation
  const handleSelectConversation = async (id: string) => {
    try {
      setActiveConversationId(id);
      const data = await api.getConversation(id);
      setActiveConversation(data.conversation);
      setMessages(data.messages);
      if (data.conversation.persona_id) {
        setActivePersonaId(data.conversation.persona_id);
      }
      if (data.conversation.model) {
        setActiveModel(data.conversation.model as ModelTier);
      }
      setCurrentTab('chat');
    } catch (err: any) {
      setErrorMessage(err.message || 'Could not load conversation');
    }
  };

  // Handle new conversation
  const handleNewConversation = async () => {
    try {
      const defaultTitle = language === 'th' ? 'การสนทนาใหม่' : 'New Session';
      const created = await api.createConversation({
        title: defaultTitle,
        persona_id: activePersonaId,
        model: activeModel
      });

      const updatedConvs = await api.getConversations();
      setConversations(updatedConvs);
      setActiveConversationId(created.id);
      setActiveConversation(created);
      setMessages([]);
      setCurrentTab('chat');
      await refreshStats();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to create new session');
    }
  };

  // Handle delete conversation
  const handleDeleteConversation = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const confirmText = language === 'th' ? 'คุณแน่ใจว่าต้องการลบเซสชันนี้?' : 'Delete this session?';
    if (!window.confirm(confirmText)) return;

    try {
      await api.deleteConversation(id);
      const remaining = conversations.filter((c) => c.id !== id);
      setConversations(remaining);

      if (activeConversationId === id) {
        if (remaining.length > 0) {
          await handleSelectConversation(remaining[0].id);
        } else {
          setActiveConversationId(null);
          setActiveConversation(null);
          setMessages([]);
        }
      }
      await refreshStats();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to delete conversation');
    }
  };

  // Refresh DB Stats
  const refreshStats = async () => {
    try {
      const newStats = await api.getStats();
      setStats(newStats);
    } catch (err) {
      console.error(err);
    }
  };

  // Send Chat message
  const handleSendMessage = async (text: string) => {
    setIsChatLoading(true);
    setErrorMessage(null);

    // Optimistic user message insertion
    const tempUserMsg: Message = {
      id: `temp_${Date.now()}`,
      conversation_id: activeConversationId || '',
      role: 'user',
      content: text,
      created_at: Date.now()
    };
    setMessages((prev) => [...prev, tempUserMsg]);

    try {
      const response = await api.sendMessage({
        conversationId: activeConversationId || undefined,
        message: text,
        model: activeModel,
        personaId: activePersonaId
      });

      // Update active conversation ID if newly created
      if (!activeConversationId || activeConversationId !== response.conversationId) {
        setActiveConversationId(response.conversationId);
      }

      // Append assistant message
      setMessages((prev) => {
        const filtered = prev.filter((m) => m.id !== tempUserMsg.id);
        return [
          ...filtered,
          { ...tempUserMsg, id: response.userMessageId },
          response.assistantMessage
        ];
      });

      // Refresh conversations list in sidebar
      const updatedConvs = await api.getConversations();
      setConversations(updatedConvs);
      await refreshStats();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to get AI response');
    } finally {
      setIsChatLoading(false);
    }
  };

  // Generate Image with Gemini 3 Pro (1K, 2K, 4K resolution affordance)
  const handleGenerateImage = async (prompt: string, resolution: ImageResolution, aspectRatio: AspectRatio) => {
    setIsImageLoading(true);
    setErrorMessage(null);

    try {
      const result = await api.generateImage({
        prompt,
        resolution,
        aspectRatio,
        conversationId: activeConversationId || undefined
      });

      if (result.image) {
        setImages((prev) => [result.image, ...prev]);
        setSelectedImage({
          url: result.image.image_url,
          prompt: result.image.prompt,
          resolution: result.image.resolution,
          aspectRatio: result.image.aspect_ratio
        });

        // Also reload conversation if attached to current active chat
        if (activeConversationId) {
          const detail = await api.getConversation(activeConversationId);
          setMessages(detail.messages);
        }
        await refreshStats();
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Image generation failed');
    } finally {
      setIsImageLoading(false);
    }
  };

  // Delete Image from SQLite
  const handleDeleteImage = async (id: string) => {
    try {
      await api.deleteImage(id);
      setImages((prev) => prev.filter((img) => img.id !== id));
      await refreshStats();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to delete image');
    }
  };

  // Persona management
  const handleSelectPersona = async (id: string) => {
    setActivePersonaId(id);
    if (activeConversationId) {
      await api.updateConversation(activeConversationId, { persona_id: id });
      const updatedConvs = await api.getConversations();
      setConversations(updatedConvs);
    }
  };

  const handleSelectModel = async (model: ModelTier) => {
    setActiveModel(model);
    if (activeConversationId) {
      await api.updateConversation(activeConversationId, { model });
      const updatedConvs = await api.getConversations();
      setConversations(updatedConvs);
    }
  };

  const handleCreatePersona = async (personaData: Partial<Persona>) => {
    try {
      const created = await api.createPersona(personaData);
      setPersonas((prev) => [...prev, created]);
      setActivePersonaId(created.id);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to create persona');
    }
  };

  const handleDeletePersona = async (id: string) => {
    try {
      await api.deletePersona(id);
      setPersonas((prev) => prev.filter((p) => p.id !== id));
      if (activePersonaId === id) {
        setActivePersonaId('general-assistant');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to delete persona');
    }
  };

  return (
    <div className="flex flex-col h-screen w-full bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 overflow-hidden font-sans transition-colors">
      {/* Top Bar Header */}
      <Header
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        language={language}
        onToggleLanguage={() => setLanguage((l) => (l === 'th' ? 'en' : 'th'))}
        isDarkMode={isDarkMode}
        onToggleDarkMode={() => setIsDarkMode((d) => !d)}
        onNewSession={handleNewConversation}
        dbStatus={stats?.status || 'Connected'}
      />

      {/* Error Alert Banner */}
      {errorMessage && (
        <div className="bg-red-500/10 dark:bg-red-950/40 border-b border-red-200 dark:border-red-900 px-6 py-2.5 flex items-center justify-between text-xs text-red-600 dark:text-red-400 shrink-0">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button onClick={() => setErrorMessage(null)} className="p-1 hover:opacity-80">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Main Studio Viewport */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar (Rendered on Chat view or collapsible) */}
        {currentTab === 'chat' && (
          <Sidebar
            conversations={conversations}
            activeConversationId={activeConversationId}
            onSelectConversation={handleSelectConversation}
            onNewConversation={handleNewConversation}
            onDeleteConversation={handleDeleteConversation}
            language={language}
          />
        )}

        {/* View Switcher */}
        {currentTab === 'chat' && (
          <ChatView
            conversation={activeConversation}
            messages={messages}
            personas={personas}
            activePersonaId={activePersonaId}
            onSelectPersona={handleSelectPersona}
            activeModel={activeModel}
            onSelectModel={handleSelectModel}
            onSendMessage={handleSendMessage}
            isLoading={isChatLoading}
            language={language}
            onViewImage={(url, prompt) => setSelectedImage({ url, prompt })}
          />
        )}

        {currentTab === 'image' && (
          <ImageLabView
            images={images}
            onGenerate={handleGenerateImage}
            onDeleteImage={handleDeleteImage}
            isLoading={isImageLoading}
            language={language}
            onViewImage={(url, prompt, resolution, aspectRatio) =>
              setSelectedImage({ url, prompt, resolution, aspectRatio })
            }
          />
        )}

        {currentTab === 'database' && (
          <DatabaseExplorerView
            stats={stats}
            onRefreshStats={refreshStats}
            language={language}
          />
        )}

        {currentTab === 'personas' && (
          <PersonasView
            personas={personas}
            activePersonaId={activePersonaId}
            onSelectPersona={(id) => {
              handleSelectPersona(id);
              setCurrentTab('chat');
            }}
            onCreatePersona={handleCreatePersona}
            onDeletePersona={handleDeletePersona}
            language={language}
          />
        )}
      </div>

      {/* High-Resolution Artwork Preview Modal */}
      {selectedImage && (
        <ImageModal
          isOpen={!!selectedImage}
          onClose={() => setSelectedImage(null)}
          imageUrl={selectedImage.url}
          prompt={selectedImage.prompt}
          resolution={selectedImage.resolution}
          aspectRatio={selectedImage.aspectRatio}
        />
      )}
    </div>
  );
}
