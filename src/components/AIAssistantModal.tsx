import React, { useState, useRef, useEffect } from 'react';
import {
  Bot,
  Send,
  X,
  Sparkles,
  Volume2,
  VolumeX,
  Loader2,
  HelpCircle,
  ShieldCheck,
  User,
  Lightbulb,
} from 'lucide-react';
import { ChildProfile, CheckIn, ProductTrial } from '../types';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

interface AIAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  child: ChildProfile;
  latestScore: number;
  recentCheckIns: CheckIn[];
  trials: ProductTrial[];
  flareRisk: string;
}

export const AIAssistantModal: React.FC<AIAssistantModalProps> = ({
  isOpen,
  onClose,
  child,
  latestScore,
  recentCheckIns,
  trials,
  flareRisk,
}) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: `Hello! I'm your Flarecast Care Assistant. I'm here to answer your questions about ${child.name}'s eczema patterns, weather changes, skincare routines, or soothing tips. What's on your mind?`,
      timestamp: 'Just now',
    },
  ]);
  const [input, setInput] = useState<string>('');
  const [isSending, setIsSending] = useState<boolean>(false);
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        inputRef.current?.focus();
      }, 100);
    } else {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      setSpeakingMessageId(null);
    }
  }, [isOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (!isOpen) return null;

  const quickQuestions = [
    `💧 How to protect ${child.name} during dry weather?`,
    `🧴 Best time to apply moisturizer?`,
    `🌙 Tips to stop scratching at bedtime`,
    `🔍 What patterns are showing in skin logs?`,
    `🛁 How long should baths be for eczema?`,
  ];

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || input).trim();
    if (!text || isSending) return;

    const userMessage: Message = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsSending(true);

    try {
      const activeTrial = trials.find((t) => t.status === 'active');
      const res = await fetch('/api/care-agent-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          history: messages.map((m) => ({
            role: m.role === 'assistant' ? 'model' : 'user',
            content: m.content,
          })),
          childContext: {
            name: child.name,
            age: child.age,
            skinScore: latestScore,
            flareRisk,
            weatherSummary: `Risk level is currently ${flareRisk}`,
            calmPlan: child.calmPlan,
            activeTrial,
          },
        }),
      });

      const data = await res.json();
      const replyContent =
        data.reply ||
        `For ${child.name}, staying consistent with the ${child.calmPlan.moisturizerRoutine} and lukewarm bath routine is the best defense right now. Remember to always consult your doctor for prescription adjustments.`;

      const botMessage: Message = {
        id: `bot-${Date.now()}`,
        role: 'assistant',
        content: replyContent,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (err) {
      console.error('Failed to chat with AI agent:', err);
      const errorMessage: Message = {
        id: `bot-err-${Date.now()}`,
        role: 'assistant',
        content: `I'm having a brief connection hiccup, but for ${child.name}, keeping the bedroom cool and applying moisturizer within 3 minutes of bathing remains our top recommendation!`,
        timestamp: 'Just now',
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsSending(false);
    }
  };

  // Text-to-speech for accessibility (reads message aloud)
  const handleSpeak = (msg: Message) => {
    if (!('speechSynthesis' in window)) return;

    if (speakingMessageId === msg.id) {
      window.speechSynthesis.cancel();
      setSpeakingMessageId(null);
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(msg.content);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    const voices = window.speechSynthesis.getVoices();
    const friendlyVoice = voices.find(
      (v) => (v.name.includes('Natural') || v.name.includes('Google') || v.lang.startsWith('en'))
    );
    if (friendlyVoice) utterance.voice = friendlyVoice;

    utterance.onstart = () => setSpeakingMessageId(msg.id);
    utterance.onend = () => setSpeakingMessageId(null);
    utterance.onerror = () => setSpeakingMessageId(null);

    window.speechSynthesis.speak(utterance);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="ai-agent-title"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4 animate-fade-in"
    >
      <div className="relative w-full max-w-lg bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col h-[90vh] sm:h-[650px] border border-[#6FA79A]/20">
        {/* Header Bar */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between shrink-0 bg-gradient-to-r from-[#FAF6EF] to-[#E8F2F0]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#6FA79A] text-white flex items-center justify-center shadow-sm">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h2 id="ai-agent-title" className="text-sm font-bold text-[#2C3E38]">
                  Flarecast AI Care Assistant
                </h2>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              </div>
              <p className="text-[11px] text-[#5C736C]">
                Context: {child.name} · Score {latestScore} · Risk {flareRisk}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Close Assistant"
            className="w-9 h-9 rounded-full bg-white/80 flex items-center justify-center text-slate-500 hover:text-slate-800 shadow-sm transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Clinical Disclaimer Banner */}
        <div className="bg-[#FAF6EF] px-4 py-2 border-b border-[#EBE4D8] flex items-center justify-between text-[11px] text-[#5C736C]">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-[#6FA79A]" />
            <span>Supportive care assistant · Non-diagnostic</span>
          </span>
          <span className="font-semibold text-[#578C80]">Audio speech enabled</span>
        </div>

        {/* Chat Messages Feed */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
          {messages.map((m) => {
            const isBot = m.role === 'assistant';
            const isSpeaking = speakingMessageId === m.id;

            return (
              <div
                key={m.id}
                className={`flex gap-2.5 ${isBot ? 'justify-start' : 'justify-end'} animate-fade-in`}
              >
                {isBot && (
                  <div className="w-7 h-7 rounded-full bg-[#E8F2F0] text-[#6FA79A] flex items-center justify-center shrink-0 mt-1 shadow-2xs">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div className={`max-w-[85%] space-y-1 ${isBot ? 'items-start' : 'items-end'}`}>
                  <div
                    className={`rounded-2xl px-4 py-3 text-xs leading-relaxed shadow-xs ${
                      isBot
                        ? 'bg-white text-[#2C3E38] border border-slate-200/80 rounded-tl-xs'
                        : 'bg-[#6FA79A] text-white rounded-tr-xs'
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{m.content}</p>
                  </div>

                  <div className="flex items-center gap-2 px-1 text-[10px] text-slate-400">
                    <span>{m.timestamp}</span>
                    {isBot && (
                      <button
                        type="button"
                        onClick={() => handleSpeak(m)}
                        aria-label={isSpeaking ? 'Stop speaking' : 'Listen to message'}
                        className={`inline-flex items-center gap-1 font-semibold transition-colors ${
                          isSpeaking ? 'text-[#D9644F] font-bold' : 'text-[#578C80] hover:underline'
                        }`}
                      >
                        {isSpeaking ? (
                          <>
                            <VolumeX className="w-3 h-3" />
                            <span>Stop voice</span>
                          </>
                        ) : (
                          <>
                            <Volume2 className="w-3 h-3" />
                            <span>Listen aloud</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>

                {!isBot && (
                  <div className="w-7 h-7 rounded-full bg-[#FAF6EF] text-[#578C80] flex items-center justify-center shrink-0 mt-1 border border-[#EBE4D8]">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            );
          })}

          {isSending && (
            <div className="flex gap-2.5 items-center text-xs text-[#5C736C]">
              <div className="w-7 h-7 rounded-full bg-[#E8F2F0] text-[#6FA79A] flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4 animate-spin" />
              </div>
              <div className="bg-white rounded-2xl px-4 py-2.5 border border-slate-200/80 flex items-center gap-1.5 shadow-xs">
                <span className="w-1.5 h-1.5 rounded-full bg-[#6FA79A] animate-bounce" style={{ animationDelay: '0s' }} />
                <span className="w-1.5 h-1.5 rounded-full bg-[#6FA79A] animate-bounce" style={{ animationDelay: '0.2s' }} />
                <span className="w-1.5 h-1.5 rounded-full bg-[#6FA79A] animate-bounce" style={{ animationDelay: '0.4s' }} />
                <span className="text-[11px] text-slate-400 ml-1">Assistant is thinking...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Suggestion Pills */}
        <div className="px-4 py-2 border-t border-slate-100 bg-[#FAF6EF]/60 overflow-x-auto whitespace-nowrap flex gap-1.5 no-scrollbar">
          {quickQuestions.map((q, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSendMessage(q)}
              className="px-3 py-1.5 rounded-full bg-white border border-[#6FA79A]/20 text-[11px] font-medium text-[#426C63] hover:bg-[#F2F7F6] shrink-0 transition-colors shadow-2xs"
            >
              {q}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div className="p-3 bg-white border-t border-slate-100 flex items-center gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            placeholder={`Ask about ${child.name}'s skin, triggers, or routines...`}
            className="flex-1 h-11 px-4 rounded-xl bg-[#FAF6EF] border border-[#EBE4D8] text-xs text-[#2C3E38] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#6FA79A]"
          />
          <button
            type="button"
            onClick={() => handleSendMessage()}
            disabled={!input.trim() || isSending}
            aria-label="Send message"
            className="w-11 h-11 rounded-xl bg-[#6FA79A] text-white flex items-center justify-center shadow-sm hover:bg-[#578C80] transition-colors disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
