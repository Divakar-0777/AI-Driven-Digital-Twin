import React, { useState, useEffect, useRef } from 'react';
import Sidebar from '../components/Sidebar';
import api from '../services/api';
import { Send, Bot, User, Loader2, MessageSquare, Trash2, Plus } from 'lucide-react';

interface Message {
  id?: string;
  role: 'user' | 'assistant';
  content: string;
  mode?: string;
  timestamp?: string;
}

interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  updatedAt: string;
}

export const AIAssistant: React.FC = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingConvs, setLoadingConvs] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchConversations = async () => {
    try {
      const res = await api.get('/chat/conversations');
      setConversations(Array.isArray(res.data) ? res.data : []);
    } catch (err) { console.error(err); }
    finally { setLoadingConvs(false); }
  };

  const fetchConversation = async (id: string) => {
    try {
      const res = await api.get(`/chat/conversations/${id}`);
      setMessages(res.data.messages || []);
      setActiveConvId(id);
    } catch (err) { console.error(err); }
  };

  useEffect(() => { fetchConversations(); }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMsg: Message = { role: 'user', content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await api.post('/chat', { query: input, conversationId: activeConvId });
      const assistantMsg: Message = {
        role: 'assistant',
        content: res.data.reply || res.data.message || 'No response received.',
        mode: res.data.mode,
      };
      setMessages(prev => [...prev, assistantMsg]);

      if (res.data.conversationId && !activeConvId) {
        setActiveConvId(res.data.conversationId);
        fetchConversations();
      }
    } catch (err: any) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry, I encountered an error processing your request. Please try again.',
      }]);
    } finally { setLoading(false); }
  };

  const handleNewChat = () => {
    setActiveConvId(null);
    setMessages([]);
  };

  const handleDeleteConv = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Delete this conversation?')) return;
    try {
      await api.delete(`/chat/conversations/${id}`);
      if (activeConvId === id) { setActiveConvId(null); setMessages([]); }
      fetchConversations();
    } catch (err) { console.error(err); }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar />
      <main style={{ flex: 1, marginLeft: 260, display: 'flex', height: '100vh' }}>
        {/* Conversations Sidebar */}
        <div style={{
          width: 280, borderRight: '1px solid var(--card-border)', background: 'var(--card-bg)',
          display: 'flex', flexDirection: 'column', padding: 16,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-highlight)' }}>Conversations</h3>
            <button onClick={handleNewChat} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--primary)' }}>
              <Plus size={18} />
            </button>
          </div>
          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 4 }}>
            {conversations.map(conv => (
              <div
                key={conv.id}
                onClick={() => fetchConversation(conv.id)}
                style={{
                  padding: '10px 12px', borderRadius: 8, cursor: 'pointer',
                  background: activeConvId === conv.id ? 'var(--primary-glow)' : 'transparent',
                  border: activeConvId === conv.id ? '1px solid var(--primary)' : '1px solid transparent',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  transition: 'all 0.2s',
                }}
              >
                <div style={{ overflow: 'hidden', flex: 1 }}>
                  <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-highlight)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {conv.title}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                    {new Date(conv.updatedAt).toLocaleDateString()}
                  </div>
                </div>
                <button onClick={(e) => handleDeleteConv(conv.id, e)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 2 }}>
                  <Trash2 size={12} />
                </button>
              </div>
            ))}
            {conversations.length === 0 && !loadingConvs && (
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center', padding: 20 }}>
                No conversations yet
              </p>
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          {/* Header */}
          <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--card-border)', background: 'var(--card-bg)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 36, height: 36, borderRadius: '50%', background: 'var(--primary-glow)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Bot size={20} style={{ color: 'var(--primary)' }} />
              </div>
              <div>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-highlight)' }}>AI Digital Twin Assistant</h3>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Ask me about your finances, study habits, goals, or any decisions</p>
              </div>
            </div>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: 'auto', padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
            {messages.length === 0 && (
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16 }}>
                <div style={{ fontSize: '3rem' }}>🧠</div>
                <h3 style={{ color: 'var(--text-highlight)', fontWeight: 700 }}>What can I help you with?</h3>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center', maxWidth: 600 }}>
                  {[
                    'Can I afford a new laptop?',
                    'How much can I save in one year?',
                    'Why is my productivity dropping?',
                    'How can I improve my study schedule?',
                    'Which goal should I prioritize?',
                  ].map((q, i) => (
                    <button key={i} onClick={() => setInput(q)} style={{
                      padding: '8px 14px', borderRadius: 20, fontSize: '0.8rem',
                      background: 'var(--primary-glow)', border: '1px solid var(--primary)',
                      color: 'var(--primary)', cursor: 'pointer', fontWeight: 500,
                    }}>
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((msg, i) => (
              <div key={i} style={{
                display: 'flex', gap: 10,
                justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
              }}>
                {msg.role === 'assistant' && (
                  <div style={{
                    width: 32, height: 32, borderRadius: '50%', background: 'var(--primary-glow)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 4,
                  }}>
                    <Bot size={16} style={{ color: 'var(--primary)' }} />
                  </div>
                )}
                <div style={{
                  maxWidth: '70%', padding: '12px 16px', borderRadius: 12,
                  background: msg.role === 'user' ? 'var(--primary)' : 'var(--card-bg)',
                  color: msg.role === 'user' ? 'white' : 'var(--text-highlight)',
                  border: msg.role === 'assistant' ? '1px solid var(--card-border)' : 'none',
                  fontSize: '0.9rem', lineHeight: 1.6,
                }}>
                  <div style={{ whiteSpace: 'pre-wrap' }}>{msg.content}</div>
                  {msg.mode && (
                    <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: 6, fontStyle: 'italic' }}>
                      Mode: {msg.mode}
                    </div>
                  )}
                </div>
                {msg.role === 'user' && (
                  <div style={{
                    width: 32, height: 32, borderRadius: '50%', background: 'rgba(0,0,0,0.05)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 4,
                  }}>
                    <User size={16} style={{ color: 'var(--text-muted)' }} />
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <div style={{
                  width: 32, height: 32, borderRadius: '50%', background: 'var(--primary-glow)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Bot size={16} style={{ color: 'var(--primary)' }} />
                </div>
                <div style={{ padding: '12px 16px', borderRadius: 12, background: 'var(--card-bg)', border: '1px solid var(--card-border)' }}>
                  <Loader2 size={18} className="spinning" style={{ color: 'var(--primary)' }} />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div style={{ padding: '16px 24px', borderTop: '1px solid var(--card-border)', background: 'var(--card-bg)' }}>
            <form onSubmit={handleSend} style={{ display: 'flex', gap: 10 }}>
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="Ask your AI twin anything..."
                style={{ flex: 1 }}
                disabled={loading}
              />
              <button type="submit" className="btn-primary" disabled={loading || !input.trim()} style={{ padding: '10px 20px' }}>
                <Send size={16} />
              </button>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AIAssistant;
