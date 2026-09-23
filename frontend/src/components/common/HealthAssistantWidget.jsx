import React, { useState, useRef, useEffect } from 'react';
import { 
  X, Send, Bot, User, AlertTriangle, Heart, Thermometer, Stethoscope, 
  Brain, Loader2, ShieldAlert, ArrowDown, Phone, MapPin, Calendar, 
  ExternalLink, CheckCircle2 
} from 'lucide-react';
import { checkSymptoms } from '../../services/healthAssistantService';
import { bookDoctorAppointment } from '../../services/doctorAppointmentService';

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
  
  // Responsiveness state
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth < 640 : false);

  // Doctor Consultation Modal state
  const [showConsultModal, setShowConsultModal] = useState(false);
  const [consultForm, setConsultForm] = useState({
    patientName: '',
    phone: '',
    specialty: 'General Physician',
    consultType: 'Tele-Consultation (Video/Call)',
    notes: '',
  });
  const [consultSubmitted, setConsultSubmitted] = useState(false);
  const [consultError, setConsultError] = useState('');
  const [consultLoading, setConsultLoading] = useState(false);

  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null);
  const inputRef = useRef(null);

  // Screen resize listener for mobile responsiveness
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 640);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Auto-scroll to bottom on new message
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, loading]);

  // Stop pulse animation after first open
  useEffect(() => {
    if (isOpen) setPulseAnimation(false);
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && !loading) {
      const timer = setTimeout(() => inputRef.current?.focus(), 150);
      return () => clearTimeout(timer);
    }
  }, [isOpen, loading]);

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

  const handleConsultSubmit = async (e) => {
    e.preventDefault();
    if (!consultForm.patientName.trim() || !consultForm.phone.trim()) {
      setConsultError('Patient name and phone number are required.');
      return;
    }
    setConsultError('');
    setConsultLoading(true);
    try {
      await bookDoctorAppointment({
        patientName: consultForm.patientName,
        phone: consultForm.phone,
        specialty: consultForm.specialty,
        consultationType: consultForm.consultType,
        notes: consultForm.notes,
      });
      setConsultSubmitted(true);
    } catch (err) {
      setConsultError(err.response?.data?.message || 'Please sign in before booking a doctor consultation.');
    } finally {
      setConsultLoading(false);
    }
  };

  return (
    <>
      {/* Floating Action Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed z-50 group transition-all duration-300"
          style={{
            bottom: isMobile ? 88 : 96,
            right: isMobile ? 16 : 24,
            width: isMobile ? 56 : 64,
            height: isMobile ? 56 : 64,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #2563eb 0%, #3b82f6 50%, #60a5fa 100%)',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 8px 32px rgba(37,99,235,0.4), 0 2px 8px rgba(0,0,0,0.1)',
            animation: pulseAnimation ? 'fabPulse 2s ease-in-out infinite' : 'none',
          }}
          onMouseEnter={e => {
            if (!isMobile) {
              e.currentTarget.style.transform = 'scale(1.08)';
              e.currentTarget.style.boxShadow = '0 12px 40px rgba(37,99,235,0.5), 0 4px 12px rgba(0,0,0,0.15)';;
            }
          }}
          onMouseLeave={e => {
            if (!isMobile) {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.boxShadow = '0 8px 32px rgba(37,99,235,0.4), 0 2px 8px rgba(0,0,0,0.1)';;
            }
          }}
          aria-label="Open AI Health Assistant"
        >
          <Stethoscope size={isMobile ? 24 : 28} color="white" />
          <span style={{
            position: 'absolute',
            top: 2,
            right: 2,
            width: 12,
            height: 12,
            borderRadius: '50%',
            background: '#22c55e',
            border: '2px solid white',
            animation: 'dotPulse 2s ease-in-out infinite',
          }} />
        </button>
      )}

      {/* Tooltip label next to FAB (Desktop only) */}
      {!isOpen && !isMobile && (
        <div
          className="fixed bottom-12 right-20 z-50 pointer-events-none hidden sm:block"
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
          className="fixed z-50 flex flex-col transition-all duration-300"
          style={{
            bottom: isMobile ? 0 : 24,
            right: isMobile ? 0 : 24,
            left: isMobile ? 0 : 'auto',
            top: isMobile ? 0 : 'auto',
            width: isMobile ? '100%' : '420px',
            height: isMobile ? '100dvh' : 'min(640px, calc(100vh - 48px))',
            maxHeight: '100dvh',
            borderRadius: isMobile ? 0 : 20,
            overflow: 'hidden',
            boxShadow: isMobile ? 'none' : '0 24px 80px rgba(0,0,0,0.25), 0 8px 32px rgba(99,102,241,0.15)',
            animation: 'chatSlideUp 0.35s cubic-bezier(0.34,1.56,0.64,1)',
            border: isMobile ? 'none' : '1px solid rgba(255,255,255,0.1)',
            background: '#f8fafc',
          }}
        >
          {/* Header */}
          <div style={{
            background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
            padding: isMobile ? '12px 16px' : '16px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexShrink: 0,
            boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: isMobile ? 36 : 40,
                height: isMobile ? 36 : 40,
                borderRadius: 12,
                background: 'rgba(255,255,255,0.2)',
                backdropFilter: 'blur(10px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}>
                <Stethoscope size={isMobile ? 20 : 22} color="white" />
              </div>
              <div>
                <div style={{ color: 'white', fontWeight: 700, fontSize: isMobile ? 14 : 15, lineHeight: 1.2 }}>
                  AI Health Assistant
                </div>
                <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: 11, display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                  <span style={{
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    background: '#4ade80',
                    display: 'inline-block',
                  }} />
                  Online • Verified Symptom Checker
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              {messages.length > 0 && (
                <button
                  onClick={handleReset}
                  style={{
                    background: 'rgba(255,255,255,0.15)',
                    border: 'none',
                    borderRadius: 8,
                    padding: '6px 10px',
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
                  width: 34,
                  height: 34,
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
                <X size={20} color="white" />
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
              WebkitOverflowScrolling: 'touch',
              background: '#f8fafc',
              padding: isMobile ? '12px 12px 8px' : '16px 16px 8px',
              display: 'flex',
              flexDirection: 'column',
              gap: 14,
            }}
          >
            {/* Welcome message when empty */}
            {messages.length === 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14, paddingTop: 4 }}>
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
                    maxWidth: isMobile ? '92%' : '85%',
                  }}>
                    <div style={{ fontWeight: 700, marginBottom: 4, color: '#1e293b' }}>
                      👋 Hello! I'm your AI Health Assistant
                    </div>
                    <p style={{ margin: 0, fontSize: 13, color: '#475569' }}>
                      Describe your symptoms and I will help evaluate possible conditions. Every response includes direct access to consult a doctor.
                    </p>
                  </div>
                </div>

                {/* Disclaimer */}
                <div style={{
                  background: 'rgba(245,158,11,0.08)',
                  border: '1px solid rgba(245,158,11,0.25)',
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
                  <span>This assistant provides health information and is <strong>not a replacement for medical diagnosis</strong>. Always consult a qualified doctor for care.</span>
                </div>

                {/* Optional info toggle */}
                <button
                  onClick={() => setShowInfoFields(!showInfoFields)}
                  style={{
                    background: 'white',
                    border: '1px solid #e2e8f0',
                    borderRadius: 10,
                    padding: '10px 14px',
                    fontSize: 12,
                    color: '#6366f1',
                    fontWeight: 600,
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.2s',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <span>{showInfoFields ? '▾ Hide patient details' : '▸ Add age & gender for better accuracy (optional)'}</span>
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
                        border: '1px solid #cbd5e1',
                        fontSize: 13,
                        outline: 'none',
                        background: 'white',
                      }}
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
                        border: '1px solid #cbd5e1',
                        fontSize: 13,
                        outline: 'none',
                        background: 'white',
                        cursor: 'pointer',
                      }}
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
                  gridTemplateColumns: isMobile ? '1fr 1fr' : '1fr 1fr',
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
                        minHeight: 44,
                      }}
                      onMouseEnter={e => {
                        if (!loading) {
                          e.currentTarget.style.borderColor = symptom.color;
                          e.currentTarget.style.background = `${symptom.color}08`;
                        }
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.borderColor = '#e2e8f0';
                        e.currentTarget.style.background = 'white';
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
                width: '100%',
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
                  marginTop: 2,
                }}>
                  {msg.role === 'user'
                    ? <User size={16} color="white" />
                    : <Bot size={16} color="white" />
                  }
                </div>

                {/* Message Content Container */}
                <div style={{
                  maxWidth: msg.role === 'user' ? '82%' : isMobile ? '88%' : '86%',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8,
                  width: '100%',
                }}>
                  {/* Main Bubble */}
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
                      padding: '12px 14px',
                      boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 8,
                    }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                        POSSIBLE CONDITIONS
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
                      alignItems: 'center',
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
                          <ShieldAlert size={14} /> Consult Doctor Urgently
                        </span>
                      )}
                    </div>
                  )}

                  {/* ==================================================== */}
                  {/* Dedicated "CONSULT DOCTOR" Section (After EVERY chat) */}
                  {/* ==================================================== */}
                  {msg.role === 'assistant' && (
                    <div style={{
                      background: msg.severity === 'HIGH'
                        ? 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)'
                        : msg.severity === 'MEDIUM'
                        ? 'linear-gradient(135deg, #fffbe6 0%, #fef3c7 100%)'
                        : 'linear-gradient(135deg, #f0fdf4 0%, #e0e7ff 100%)',
                      border: msg.severity === 'HIGH'
                        ? '1px solid #fca5a5'
                        : msg.severity === 'MEDIUM'
                        ? '1px solid #fde68a'
                        : '1px solid #c7d2fe',
                      borderRadius: 16,
                      padding: '14px',
                      marginTop: 4,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 10,
                      boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
                    }}>
                      {/* Section Header */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 6 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{
                            width: 32,
                            height: 32,
                            borderRadius: 10,
                            background: msg.severity === 'HIGH' ? '#ef4444' : msg.severity === 'MEDIUM' ? '#f59e0b' : '#6366f1',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                            flexShrink: 0,
                          }}>
                            <Stethoscope size={18} />
                          </div>
                          <div>
                            <div style={{ fontWeight: 700, fontSize: 13, color: '#1e293b', display: 'flex', alignItems: 'center', gap: 6 }}>
                              Consult a Doctor
                              {msg.severity === 'HIGH' && (
                                <span style={{ fontSize: 10, background: '#dc2626', color: 'white', padding: '2px 6px', borderRadius: 8, fontWeight: 700 }}>
                                  URGENT
                                </span>
                              )}
                            </div>
                            <div style={{ fontSize: 11, color: '#64748b' }}>
                              Professional Medical Care & Advice
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Brief text note */}
                      <p style={{ margin: 0, fontSize: 12, color: '#334155', lineHeight: 1.5 }}>
                        {msg.severity === 'HIGH'
                          ? "⚠️ Your symptoms suggest urgent medical attention. Please consult a licensed doctor or visit emergency care immediately."
                          : "For official diagnosis, medical prescription, or if symptoms persist, connect directly with healthcare professionals."}
                      </p>

                      {/* Responsive Action Buttons Container */}
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(115px, 1fr))',
                        gap: 8,
                        marginTop: 2,
                      }}>
                        {/* Action 1: Book Consultation Modal */}
                        <button
                          onClick={() => setShowConsultModal(true)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 6,
                            padding: '9px 12px',
                            borderRadius: 10,
                            background: 'linear-gradient(135deg, #4f46e5, #6366f1)',
                            color: 'white',
                            border: 'none',
                            fontSize: 12,
                            fontWeight: 600,
                            cursor: 'pointer',
                            boxShadow: '0 2px 6px rgba(79,70,229,0.25)',
                            transition: 'transform 0.2s',
                            minHeight: 38,
                          }}
                          onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.02)'}
                          onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                        >
                          <Calendar size={14} />
                          <span>Book Doctor</span>
                        </button>

                        {/* Action 2: Find Nearby Hospitals */}
                        <a
                          href="https://www.google.com/maps/search/doctors+or+hospitals+near+me"
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 6,
                            padding: '9px 12px',
                            borderRadius: 10,
                            background: 'white',
                            color: '#1e293b',
                            border: '1px solid #cbd5e1',
                            fontSize: 12,
                            fontWeight: 600,
                            cursor: 'pointer',
                            textDecoration: 'none',
                            minHeight: 38,
                          }}
                        >
                          <MapPin size={14} color="#ef4444" />
                          <span>Find Nearby</span>
                          <ExternalLink size={11} color="#94a3b8" />
                        </a>

                        {/* Action 3: Emergency Helpline */}
                        <a
                          href="tel:108"
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 6,
                            padding: '9px 12px',
                            borderRadius: 10,
                            background: msg.severity === 'HIGH' ? '#dc2626' : 'white',
                            color: msg.severity === 'HIGH' ? 'white' : '#15803d',
                            border: msg.severity === 'HIGH' ? 'none' : '1px solid #bbf7d0',
                            fontSize: 12,
                            fontWeight: 600,
                            cursor: 'pointer',
                            textDecoration: 'none',
                            minHeight: 38,
                          }}
                        >
                          <Phone size={14} />
                          <span>{msg.severity === 'HIGH' ? 'Call 108' : 'Helpline'}</span>
                        </a>
                      </div>
                    </div>
                  )}

                  {/* Medical Disclaimer */}
                  {msg.role === 'assistant' && msg.disclaimer && (
                    <div style={{
                      background: 'rgba(245,158,11,0.06)',
                      border: '1px solid rgba(245,158,11,0.2)',
                      borderRadius: 12,
                      padding: '8px 12px',
                      fontSize: 11.5,
                      color: '#92400e',
                      lineHeight: 1.4,
                      display: 'flex',
                      gap: 6,
                      alignItems: 'flex-start',
                    }}>
                      <AlertTriangle size={14} style={{ flexShrink: 0, marginTop: 1 }} />
                      <span>{msg.disclaimer}</span>
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
                  <span style={{ fontSize: 12, color: '#94a3b8', marginLeft: 4 }}>Analyzing symptoms...</span>
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
                bottom: 74,
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
                boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
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
            padding: isMobile ? '10px 12px' : '12px 16px',
            display: 'flex',
            gap: 8,
            alignItems: 'flex-end',
            flexShrink: 0,
          }}>
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Describe your symptoms..."
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
                color: '#0f172a',
                caretColor: '#4f46e5',
                cursor: 'text',
                pointerEvents: 'auto',
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
              type="button"
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

      {/* ========================================================= */}
      {/* DOCTOR CONSULTATION BOOKING MODAL                          */}
      {/* ========================================================= */}
      {showConsultModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          zIndex: 60,
          background: 'rgba(15,23,42,0.65)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: isMobile ? 8 : 16,
          animation: 'fadeSlideIn 0.2s ease-out',
          pointerEvents: 'auto',
        }} onMouseDown={e => e.stopPropagation()}>
          <div style={{
            background: 'white',
            borderRadius: 20,
            width: '100%',
            maxWidth: 'min(420px, 100%)',
            maxHeight: 'calc(100dvh - 16px)',
            overflowY: 'auto',
            overflow: 'hidden',
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
            animation: 'chatSlideUp 0.3s ease-out',
            pointerEvents: 'auto',
          }}>
            {/* Modal Header */}
            <div style={{
              background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
              padding: '16px 20px',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Stethoscope size={22} color="white" />
                <div>
                  <div style={{ fontWeight: 700, fontSize: 16 }}>Book Doctor Consultation</div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.8)' }}>MediCycle Healthcare Network</div>
                </div>
              </div>
              <button
                onClick={() => setShowConsultModal(false)}
                style={{
                  background: 'rgba(255,255,255,0.2)',
                  border: 'none',
                  borderRadius: 8,
                  width: 30,
                  height: 30,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                }}
              >
                <X size={18} color="white" />
              </button>
            </div>

            {/* Modal Content */}
            <div style={{ padding: 20 }}>
              {consultSubmitted ? (
                <div style={{
                  padding: '30px 20px',
                  textAlign: 'center',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 12,
                }}>
                  <div style={{
                    width: 56,
                    height: 56,
                    borderRadius: '50%',
                    background: '#dcfce7',
                    color: '#16a34a',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    <CheckCircle2 size={32} />
                  </div>
                  <div style={{ fontWeight: 700, fontSize: 18, color: '#1e293b' }}>
                    Consultation Requested!
                  </div>
                  <p style={{ margin: 0, fontSize: 13, color: '#64748b', lineHeight: 1.5 }}>
                    Our medical partner team will call you back on <strong>{consultForm.phone}</strong> within 15 minutes.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleConsultSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {consultError && <div style={{ color: '#b91c1c', fontSize: 12, background: '#fef2f2', padding: 10, borderRadius: 8 }}>{consultError}</div>}
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 }}>
                      Patient Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Adithya Kumar"
                      value={consultForm.patientName}
                      onChange={e => setConsultForm({ ...consultForm, patientName: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        borderRadius: 10,
                        border: '1px solid #cbd5e1',
                        fontSize: 14,
                        outline: 'none',
                        color: '#0f172a',
                        background: '#ffffff',
                        pointerEvents: 'auto',
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 }}>
                      Phone / Mobile Number *
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="+91 98765 43210"
                      value={consultForm.phone}
                      onChange={e => setConsultForm({ ...consultForm, phone: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        borderRadius: 10,
                        border: '1px solid #cbd5e1',
                        fontSize: 14,
                        outline: 'none',
                        color: '#0f172a',
                        background: '#ffffff',
                        pointerEvents: 'auto',
                      }}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 10 }}>
                    <div>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 }}>
                        Specialty
                      </label>
                      <select
                        value={consultForm.specialty}
                        onChange={e => setConsultForm({ ...consultForm, specialty: e.target.value })}
                        style={{
                          width: '100%',
                          padding: '10px 10px',
                          borderRadius: 10,
                          border: '1px solid #cbd5e1',
                          fontSize: 13,
                          outline: 'none',
                          background: 'white',
                          color: '#0f172a',
                          pointerEvents: 'auto',
                        }}
                      >
                        <option value="General Physician">General Physician</option>
                        <option value="Cardiologist">Cardiologist</option>
                        <option value="Pediatrician">Pediatrician</option>
                        <option value="Pulmonologist">Pulmonologist</option>
                        <option value="ENT Specialist">ENT Specialist</option>
                      </select>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 }}>
                        Type
                      </label>
                      <select
                        value={consultForm.consultType}
                        onChange={e => setConsultForm({ ...consultForm, consultType: e.target.value })}
                        style={{
                          width: '100%',
                          padding: '10px 10px',
                          borderRadius: 10,
                          border: '1px solid #cbd5e1',
                          fontSize: 13,
                          outline: 'none',
                          background: 'white',
                          color: '#0f172a',
                          pointerEvents: 'auto',
                        }}
                      >
                        <option value="Tele-Consultation">Tele-Consultation</option>
                        <option value="In-Person Visit">In-Person Visit</option>
                      </select>
                    </div>
                  </div>

                  <button
                    type="submit"
                    style={{
                      marginTop: 6,
                      width: '100%',
                      padding: '12px',
                      borderRadius: 12,
                      background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
                      color: 'white',
                      border: 'none',
                      fontWeight: 700,
                      fontSize: 14,
                      cursor: consultLoading ? 'wait' : 'pointer',
                      boxShadow: '0 4px 12px rgba(79,70,229,0.3)',
                    }}
                    disabled={consultLoading}
                  >
                    {consultLoading ? 'Submitting...' : 'Request Consultation'}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* CSS Animations & Responsive Styles */}
      <style>{`
        @keyframes fabPulse {
          0%, 100% { box-shadow: 0 8px 32px rgba(37,99,235,0.4), 0 2px 8px rgba(0,0,0,0.1); }
          50% { box-shadow: 0 8px 48px rgba(37,99,235,0.6), 0 2px 16px rgba(0,0,0,0.15); }
        }
        @keyframes dotPulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        @keyframes chatSlideUp {
          from { opacity: 0; transform: translateY(20px) scale(0.96); }
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

        @media (max-width: 640px) {
          .consult-doctor-section {
            padding: 10px !important;
          }
        }
      `}</style>
    </>
  );
};

export default HealthAssistantWidget;
