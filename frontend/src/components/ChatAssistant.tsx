import React, { useState, useEffect, useRef } from 'react';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { MessageSquare, X, Send, Brain } from 'lucide-react';

interface ChatMessage {
  id: string;
  sender: 'user' | 'twin';
  text: string;
  timestamp: Date;
}

export const ChatAssistant: React.FC = () => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize with welcome message if empty
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([
        {
          id: 'welcome',
          sender: 'twin',
          text: "Hi! I am your AI Digital Twin. I analyze your financial budgets, saving goals, study hours, and habit checks.\n\nAsk me anything! For example:\n- *'Can I afford a $800 laptop?'*\n- *'Show me my savings goals status.'*\n- *'Why did my financial health score decrease?'*",
          timestamp: new Date()
        }
      ]);
    }
  }, [messages]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // Early return if not logged in (placed after all hooks)
  if (!user) return null;

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    const userMsg: ChatMessage = {
      id: Math.random().toString(),
      sender: 'user',
      text: query,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    const userQuery = query;
    setQuery('');
    setLoading(true);

    try {
      const res = await api.post('/chat', { query: userQuery });
      const twinMsg: ChatMessage = {
        id: Math.random().toString(),
        sender: 'twin',
        text: res.data.reply || "Sorry, I couldn't process that.",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, twinMsg]);
    } catch (err: any) {
      console.error(err);
      const errMsg: ChatMessage = {
        id: Math.random().toString(),
        sender: 'twin',
        text: "Error communicating with Digital Twin. Please ensure the backend is running.",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errMsg]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ position: 'fixed', bottom: '24px', right: '24px', zIndex: 1000 }}>
      {/* Floating Action Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          style={{
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
            color: 'white',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 8px 24px rgba(99, 102, 241, 0.4)',
            transition: 'transform 0.2s',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.08)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
        >
          <MessageSquare size={24} />
        </button>
      )}

      {/* Chat Window Panel */}
      {isOpen && (
        <div style={{
          width: '380px',
          height: '520px',
          background: 'rgba(15, 23, 42, 0.95)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '16px',
          boxShadow: '0 12px 40px rgba(0, 0, 0, 0.5)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          animation: 'slideUp 0.3s ease-out'
        }}>
          {/* Header */}
          <div style={{
            padding: '16px 20px',
            background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(168, 85, 247, 0.1) 100%)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Brain size={16} color="white" />
              </div>
              <div>
                <h4 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 700, color: 'white' }}>Digital Twin Chat</h4>
                <span style={{ fontSize: '0.65rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981', display: 'inline-block' }} />
                  Advisor Active
                </span>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '4px' }}>
              <X size={18} />
            </button>
          </div>

          {/* Messages List */}
          <div style={{
            flex: 1,
            padding: '20px',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px'
          }}>
            {messages.map((msg) => {
              const isTwin = msg.sender === 'twin';
              return (
                <div key={msg.id} style={{
                  alignSelf: isTwin ? 'flex-start' : 'flex-end',
                  maxWidth: '80%',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px'
                }}>
                  <div style={{
                    padding: '12px 16px',
                    borderRadius: '12px',
                    borderTopLeftRadius: isTwin ? '4px' : '12px',
                    borderTopRightRadius: isTwin ? '12px' : '4px',
                    background: isTwin ? 'rgba(255, 255, 255, 0.05)' : 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
                    border: isTwin ? '1px solid rgba(255, 255, 255, 0.05)' : 'none',
                    color: 'white',
                    fontSize: '0.85rem',
                    lineHeight: '1.4',
                    whiteSpace: 'pre-wrap'
                  }}>
                    {msg.text}
                  </div>
                  <span style={{
                    fontSize: '0.65rem',
                    color: '#64748b',
                    alignSelf: isTwin ? 'flex-start' : 'flex-end',
                    padding: '0 4px'
                  }}>
                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              );
            })}

            {loading && (
              <div style={{ alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 16px', borderRadius: '12px', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                <span className="pulse" style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Twin advisor is thinking...</span>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Input Footer */}
          <form onSubmit={handleSend} style={{
            padding: '16px 20px',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            gap: '10px',
            alignItems: 'center',
            background: 'rgba(0,0,0,0.1)'
          }}>
            <input
              type="text"
              placeholder="Ask your twin a question..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              style={{
                flex: 1,
                padding: '10px 14px',
                borderRadius: '8px',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                background: 'rgba(0, 0, 0, 0.3)',
                color: 'white',
                fontSize: '0.85rem',
                outline: 'none'
              }}
            />
            <button
              type="submit"
              disabled={!query.trim()}
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                background: query.trim() ? 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)' : 'rgba(255,255,255,0.05)',
                border: 'none',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: query.trim() ? 'pointer' : 'default',
                transition: 'background 0.2s'
              }}
            >
              <Send size={16} />
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default ChatAssistant;
