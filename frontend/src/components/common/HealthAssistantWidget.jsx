import React, { useState, useRef, useEffect } from 'react';
import { X, Send, Bot, User, AlertTriangle, Heart, Thermometer, Stethoscope, Brain, Loader2, ShieldAlert, ArrowDown } from 'lucide-react';
import { checkSymptoms } from '../../services/healthAssistantService';

const QUICK_SYMPTOMS = [
  { label: 'Fever', icon: Thermometer, color: '#ef4444' },
  { label: 'Headache', icon: Brain, color: '#8b5cf6' },
  { label: 'Cough & Cold', icon: Stethoscope, color: '#3b82f6' },
  { label: 'Stomach Pain', icon: Heart, color: '#f59e0b' },
];

const SEVERITY_CONFIG = {
  LOW: { color: '#22c55e', bg: 'rgba(34,197,94,0.12)', label: 'Low Severity', icon: '🟢' },
  MEDIUM: { color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', label: 'Medium Severity', icon: '🟡' },
  HIGH: { color: '#ef4444', bg: 'rgba(239,68,68,0.12)', label: 'High Severity', icon: '🔴' },
};

const HealthAssistantWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [conversationHistory, setConversationHistory] = useState([]);
  const [showScrollDown, setShowScrollDown] = useState(false);
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('');
  const [showInfoFields, setShowInfoFields] = useState(false);
  const [pulseAnimation, setPulseAnimation] = useState(true);
  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll to bottom
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Stop pulse animation after first open
  useEffect(() => {
    if (isOpen) setPulseAnimation(false);
  }, [isOpen]);

  // Scroll tracking
  const handleScroll = () => {
    if (!chatContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
    setShowScrollDown(scrollHeight - scrollTop - clientHeight > 100);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSend = async (text = null) => {
    const messageText = text || input.trim();
    if (!messageText || loading) return;

    const userMessage = { role: 'user', content: messageText };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await checkSymptoms(
        messageText,
        conversationHistory,
        age ? parseInt(age) : null,
        gender || null
      );

      const assistantMessage = {
        role: 'assistant',
        content: response.aiResponse,
        conditions: response.possibleConditions,
        severity: response.severity,
        seekDoctor: response.seekDoctorAdvice,
        disclaimer: response.disclaimer,
      };

      setMessages(prev => [...prev, assistantMessage]);
      setConversationHistory(prev => [
        ...prev,
        { role: 'user', content: messageText },
        { role: 'assistant', content: response.aiResponse },
      ]);
    } catch (err) {
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: 'Sorry, I\'m having trouble connecting right now. Please check your internet connection or try again in a moment.',
          conditions: [],
          severity: null,
          seekDoctor: false,
        },
      ]);
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleReset = () => {
    setMessages([]);
    setConversationHistory([]);
    setAge('');
    setGender('');
    setShowInfoFields(false);
  };

  return (
    <>
      {/* Floating Action Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 group"
          style={{
            width: 64,
            height: 64,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a78bfa 100%)',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 8px 32px rgba(99,102,241,0.4), 0 2px 8px rgba(0,0,0,0.1)',
            transition: 'transform 0.3s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.3s ease',
            animation: pulseAnimation ? 'fabPulse 2s ease-in-out infinite' : 'none',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.transform = 'scale(1.1)';
            e.currentTarget.style.boxShadow = '0 12px 40px rgba(99,102,241,0.5), 0 4px 12px rgba(0,0,0,0.15)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.transform = 'scale(1)';
            e.currentTarget.style.boxShadow = '0 8px 32px rgba(99,102,241,0.4), 0 2px 8px rgba(0,0,0,0.1)';
          }}
          aria-label="Open AI Health Assistant"
        >
          <Stethoscope size={28} color="white" />
          {/* Notification dot */}
          <span style={{
            position: 'absolute',
            top: 2,
            right: 2,
            width: 14,
            height: 14,
            borderRadius: '50%',
            background: '#22c55e',
            border: '2px solid white',
            animation: 'dotPulse 2s ease-in-out infinite',
          }} />
        </button>
      )}

      {/* Tooltip label next to FAB */}
      {!isOpen && (
        <div
          className="fixed bottom-8 right-20 z-50 pointer-events-none"
          style={{
            background: 'rgba(15,23,42,0.9)',
            backdropFilter: 'blur(8px)',
            color: 'white',
            padding: '8px 14px',
            borderRadius: 10,
            fontSize: 13,
            fontWeight: 500,
            whiteSpace: 'nowrap',
            boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
            animation: 'fadeSlideIn 0.5s ease-out 1s both',
          }}
        >
          🤖 AI Health Assistant
        </div>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div
          className="fixed bottom-6 right-6 z-50"
          style={{
            width: Math.min(420, window.innerWidth - 32),
            height: Math.min(620, window.innerHeight - 48),
            borderRadius: 20,
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 24px 80px rgba(0,0,0,0.25), 0 8px 32px rgba(99,102,241,0.15)',
            animation: 'chatSlideUp 0.4s cubic-bezier(0.34,1.56,0.64,1)',
            border: '1px solid rgba(255,255,255,0.1)',
          }}
        >
          {/* Header */}
          <div style={{
            background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
            padding: '16px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexShrink: 0,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{
                width: 40,
                height: 40,
                borderRadius: 12,
                background: 'rgba(255,255,255,0.2)',
                backdropFilter: 'blur(10px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <Stethoscope size={22} color="white" />
              </div>
              <div>
                <div style={{ color: 'white', fontWeight: 700, fontSize: 15, lineHeight: 1.2 }}>
                  AI Health Assistant
                </div>
                <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 11, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    background: '#4ade80',
                    display: 'inline-block',
                  }} />
                  Online • Not a replacement for a doctor
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              {messages.length > 0 && (
                <button
                  onClick={handleReset}
                  style={{
                    background: 'rgba(255,255,255,0.15)',
                    border: 'none',
                    borderRadius: 8,
                    padding: '6px 12px',
                    color: 'white',
                    fontSize: 12,
                    cursor: 'pointer',
                    fontWeight: 500,
                    transition: 'background 0.2s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.25)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'}
                >
                  New Chat
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                style={{
                  background: 'rgba(255,255,255,0.15)',
                  border: 'none',
                  borderRadius: 8,
                  width: 32,
                  height: 32,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'background 0.2s',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.25)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'}
                aria-label="Close chat"
              >
                <X size={18} color="white" />
              </button>
            </div>
          </div>

          {/* Messages Area */}
          <div
            ref={chatContainerRef}
            onScroll={handleScroll}
            style={{
              flex: 1,
              overflowY: 'auto',
              background: '#f8fafc',
              padding: '16px 16px 8px',
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
            }}
          >
            {/* Welcome message when empty */}
            {messages.length === 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16, paddingTop: 8 }}>
                {/* Bot avatar + welcome */}
                <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  <div style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    <Bot size={20} color="white" />
                  </div>
                  <div style={{
                    background: 'white',
                    borderRadius: '4px 16px 16px 16px',
                    padding: '14px 16px',
                    boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                    fontSize: 14,
                    lineHeight: 1.6,
                    color: '#334155',
                    maxWidth: '85%',
                  }}>
                    <div style={{ fontWeight: 600, marginBottom: 4, color: '#1e293b' }}>
                      👋 Hello! I'm your AI Health Assistant
                    </div>
                    <p style={{ margin: 0 }}>
                      Describe your symptoms and I'll suggest possible conditions. 
                      You can also tap a quick option below to get started.
                    </p>
                  </div>
                </div>

                {/* Disclaimer */}
                <div style={{
                  background: 'rgba(245,158,11,0.08)',
                  border: '1px solid rgba(245,158,11,0.2)',
                  borderRadius: 12,
                  padding: '10px 14px',
                  display: 'flex',
                  gap: 8,
                  alignItems: 'flex-start',
                  fontSize: 12,
                  color: '#92400e',
                  lineHeight: 1.5,
                }}>
                  <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: 1 }} />
                  <span>This is <strong>not</strong> a medical diagnosis. Always consult a qualified healthcare professional.</span>
                </div>

                {/* Optional info toggle */}
                <button
                  onClick={() => setShowInfoFields(!showInfoFields)}
                  style={{
                    background: 'white',
                    border: '1px solid #e2e8f0',
                    borderRadius: 10,
                    padding: '8px 14px',
                    fontSize: 12,
                    color: '#6366f1',
                    fontWeight: 500,
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.2s',
                  }}
                >
                  {showInfoFields ? '▾' : '▸'} Add age & gender for better accuracy (optional)
                </button>

                {showInfoFields && (
                  <div style={{
                    display: 'flex',
                    gap: 10,
                    animation: 'fadeSlideIn 0.3s ease-out',
                  }}>
                    <input
                      type="number"
                      placeholder="Age"
                      value={age}
                      onChange={e => setAge(e.target.value)}
                      style={{
                        flex: 1,
                        padding: '10px 12px',
                        borderRadius: 10,
                        border: '1px solid #e2e8f0',
                        fontSize: 13,
                        outline: 'none',
                        background: 'white',
                        transition: 'border-color 0.2s',
                      }}
                      onFocus={e => e.currentTarget.style.borderColor = '#6366f1'}
                      onBlur={e => e.currentTarget.style.borderColor = '#e2e8f0'}
                      min="1"
                      max="120"
                    />
                    <select
                      value={gender}
                      onChange={e => setGender(e.target.value)}
                      style={{
                        flex: 1,
                        padding: '10px 12px',
                        borderRadius: 10,
                        border: '1px solid #e2e8f0',
                        fontSize: 13,
                        outline: 'none',
                        background: 'white',
                        cursor: 'pointer',
                        transition: 'border-color 0.2s',
                      }}
                      onFocus={e => e.currentTarget.style.borderColor = '#6366f1'}
                      onBlur={e => e.currentTarget.style.borderColor = '#e2e8f0'}
                    >
                      <option value="">Gender</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                )}

                {/* Quick symptom chips */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: 8,
                }}>
                  {QUICK_SYMPTOMS.map(symptom => (
                    <button
                      key={symptom.label}
                      onClick={() => handleSend(`I'm experiencing ${symptom.label.toLowerCase()}`)}
                      disabled={loading}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        padding: '12px 14px',
                        borderRadius: 12,
                        border: '1px solid #e2e8f0',
                        background: 'white',
                        cursor: loading ? 'not-allowed' : 'pointer',
                        fontSize: 13,
                        fontWeight: 500,
                        color: '#334155',
                        transition: 'all 0.2s',
                        opacity: loading ? 0.5 : 1,
                      }}
                      onMouseEnter={e => {
                        if (!loading) {
                          e.currentTarget.style.borderColor = symptom.color;
                          e.currentTarget.style.background = `${symptom.color}08`;
                          e.currentTarget.style.transform = 'translateY(-1px)';
                        }
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.borderColor = '#e2e8f0';
                        e.currentTarget.style.background = 'white';
                        e.currentTarget.style.transform = 'translateY(0)';
                      }}
                    >
                      <symptom.icon size={18} color={symptom.color} />
                      {symptom.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Chat messages */}
            {messages.map((msg, i) => (
              <div key={i} style={{
                display: 'flex',
                gap: 10,
                alignItems: 'flex-start',
                flexDirection: msg.role === 'user' ? 'row-reverse' : 'row',
                animation: 'messageSlide 0.3s ease-out',
              }}>
                {/* Avatar */}
                <div style={{
                  width: 32,
                  height: 32,
                  borderRadius: 9,
                  background: msg.role === 'user'
                    ? 'linear-gradient(135deg, #3b82f6, #1d4ed8)'
                    : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  {msg.role === 'user'
                    ? <User size={16} color="white" />
                    : <Bot size={16} color="white" />
                  }
                </div>

                {/* Message bubble */}
                <div style={{
                  maxWidth: '80%',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8,
                }}>
                  <div style={{
                    background: msg.role === 'user' ? 'linear-gradient(135deg, #3b82f6, #2563eb)' : 'white',
                    color: msg.role === 'user' ? 'white' : '#334155',
                    borderRadius: msg.role === 'user' ? '16px 4px 16px 16px' : '4px 16px 16px 16px',
                    padding: '12px 16px',
                    fontSize: 14,
                    lineHeight: 1.6,
                    boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                  }}>
                    {msg.content}
                  </div>

                  {/* Conditions cards */}
                  {msg.role === 'assistant' && msg.conditions && msg.conditions.length > 0 && (
                    <div style={{
                      background: 'white',
                      borderRadius: 14,
                      padding: 14,
                      boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 8,
                    }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                        Possible Conditions
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                        {msg.conditions.map((cond, j) => (
                          <span key={j} style={{
                            background: 'linear-gradient(135deg, #ede9fe, #e0e7ff)',
                            color: '#4338ca',
                            padding: '5px 12px',
                            borderRadius: 20,
                            fontSize: 12,
                            fontWeight: 500,
                          }}>
                            {cond}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Severity badge */}
                  {msg.role === 'assistant' && msg.severity && (
                    <div style={{
                      display: 'flex',
                      gap: 8,
                      flexWrap: 'wrap',
                    }}>
                      {(() => {
                        const sev = SEVERITY_CONFIG[msg.severity] || SEVERITY_CONFIG.MEDIUM;
                        return (
                          <span style={{
                            background: sev.bg,
                            color: sev.color,
                            padding: '5px 12px',
                            borderRadius: 20,
                            fontSize: 12,
                            fontWeight: 600,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4,
                          }}>
                            {sev.icon} {sev.label}
                          </span>
                        );
                      })()}

                      {msg.seekDoctor && (
                        <span style={{
                          background: 'rgba(239,68,68,0.1)',
                          color: '#dc2626',
                          padding: '5px 12px',
                          borderRadius: 20,
                          fontSize: 12,
                          fontWeight: 600,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 4,
                        }}>
                          <ShieldAlert size={14} /> Consult a Doctor
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* Typing indicator */}
            {loading && (
              <div style={{
                display: 'flex',
                gap: 10,
                alignItems: 'flex-start',
                animation: 'messageSlide 0.3s ease-out',
              }}>
                <div style={{
                  width: 32,
                  height: 32,
                  borderRadius: 9,
                  background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  <Bot size={16} color="white" />
                </div>
                <div style={{
                  background: 'white',
                  borderRadius: '4px 16px 16px 16px',
                  padding: '14px 20px',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}>
                  <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                    {[0, 1, 2].map(i => (
                      <span
                        key={i}
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          background: '#a5b4fc',
                          animation: `typingDot 1.4s ease-in-out ${i * 0.2}s infinite`,
                        }}
                      />
                    ))}
                  </div>
                  <span style={{ fontSize: 12, color: '#94a3b8', marginLeft: 4 }}>Analyzing...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Scroll-to-bottom button */}
          {showScrollDown && (
            <button
              onClick={scrollToBottom}
              style={{
                position: 'absolute',
                bottom: 80,
                left: '50%',
                transform: 'translateX(-50%)',
                background: 'white',
                border: '1px solid #e2e8f0',
                borderRadius: '50%',
                width: 36,
                height: 36,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                zIndex: 10,
              }}
            >
              <ArrowDown size={16} color="#64748b" />
            </button>
          )}

          {/* Input area */}
          <div style={{
            borderTop: '1px solid #e2e8f0',
            background: 'white',
            padding: '12px 16px',
            display: 'flex',
            gap: 10,
            alignItems: 'flex-end',
            flexShrink: 0,
          }}>
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Describe your symptoms..."
              disabled={loading}
              rows={1}
              style={{
                flex: 1,
                resize: 'none',
                border: '1px solid #e2e8f0',
                borderRadius: 14,
                padding: '10px 14px',
                fontSize: 14,
                outline: 'none',
                lineHeight: 1.5,
                maxHeight: 100,
                background: '#f8fafc',
                transition: 'border-color 0.2s, box-shadow 0.2s',
                fontFamily: 'inherit',
              }}
              onFocus={e => {
                e.currentTarget.style.borderColor = '#6366f1';
                e.currentTarget.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.1)';
              }}
              onBlur={e => {
                e.currentTarget.style.borderColor = '#e2e8f0';
                e.currentTarget.style.boxShadow = 'none';
              }}
              onInput={e => {
                e.currentTarget.style.height = 'auto';
                e.currentTarget.style.height = Math.min(e.currentTarget.scrollHeight, 100) + 'px';
              }}
            />
            <button
              onClick={() => handleSend()}
              disabled={!input.trim() || loading}
              style={{
                width: 42,
                height: 42,
                borderRadius: 12,
                border: 'none',
                background: input.trim() && !loading
                  ? 'linear-gradient(135deg, #6366f1, #8b5cf6)'
                  : '#e2e8f0',
                cursor: input.trim() && !loading ? 'pointer' : 'not-allowed',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                transition: 'all 0.2s',
              }}
              onMouseEnter={e => {
                if (input.trim() && !loading) {
                  e.currentTarget.style.transform = 'scale(1.05)';
                }
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = 'scale(1)';
              }}
              aria-label="Send message"
            >
              {loading
                ? <Loader2 size={18} color="#94a3b8" style={{ animation: 'spin 1s linear infinite' }} />
                : <Send size={18} color={input.trim() ? 'white' : '#94a3b8'} />
              }
            </button>
          </div>
        </div>
      )}

      {/* CSS Animations */}
      <style>{`
        @keyframes fabPulse {
          0%, 100% { box-shadow: 0 8px 32px rgba(99,102,241,0.4), 0 2px 8px rgba(0,0,0,0.1); }
          50% { box-shadow: 0 8px 48px rgba(99,102,241,0.6), 0 2px 16px rgba(0,0,0,0.15); }
        }
        @keyframes dotPulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        @keyframes chatSlideUp {
          from { opacity: 0; transform: translateY(20px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateX(8px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes messageSlide {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes typingDot {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
          30% { transform: translateY(-6px); opacity: 1; }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </>
  );
};

export default HealthAssistantWidget;
