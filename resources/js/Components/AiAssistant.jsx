import React, { useState, useRef, useEffect } from 'react';

/**
 * AiAssistant - Premium glowing AI chat widget with draggable chat window
 */
export default function AiAssistant() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [showTooltip, setShowTooltip] = useState(false);
    const chatEndRef = useRef(null);

    // Draggable position state
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const dragRef = useRef({ startX: 0, startY: 0, posX: 0, posY: 0 });

    const getAppUrl = (path) => {
        const base = window.BASE_URL || '/';
        const cleanPath = path.startsWith('/') ? path.substring(1) : path;
        return base + cleanPath;
    };

    useEffect(() => {
        if (chatEndRef.current) chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Show tooltip hint after 3 seconds
    useEffect(() => {
        if (!isOpen) {
            const t = setTimeout(() => setShowTooltip(true), 3000);
            return () => clearTimeout(t);
        } else {
            setShowTooltip(false);
        }
    }, [isOpen]);

    // Show welcome on first open
    useEffect(() => {
        if (isOpen && messages.length === 0) {
            setMessages([{
                role: 'bot',
                text: '👋 Halo! Saya asisten AI CuanGO. **Informasi yang saya miliki saat ini masih terbatas, dan jawaban saya akan diberikan berdasarkan template panduan sistem.** Silakan tanyakan hal seputar cara memesan, cek antrean, kelola menu, atau kelola karyawan!'
            }]);
        }
    }, [isOpen]);

    // Drag event handlers
    const handleMouseDown = (e) => {
        if (e.target.closest('.drag-handle')) {
            setIsDragging(true);
            dragRef.current = {
                startX: e.clientX,
                startY: e.clientY,
                posX: position.x,
                posY: position.y
            };
            e.preventDefault();
        }
    };

    const handleTouchStart = (e) => {
        if (e.target.closest('.drag-handle')) {
            setIsDragging(true);
            const touch = e.touches[0];
            dragRef.current = {
                startX: touch.clientX,
                startY: touch.clientY,
                posX: position.x,
                posY: position.y
            };
        }
    };

    useEffect(() => {
        const handleMouseMove = (e) => {
            if (!isDragging) return;
            const dx = e.clientX - dragRef.current.startX;
            const dy = e.clientY - dragRef.current.startY;
            setPosition({
                x: dragRef.current.posX + dx,
                y: dragRef.current.posY + dy
            });
        };

        const handleMouseUp = () => {
            setIsDragging(false);
        };

        if (isDragging) {
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
        }

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging]);

    useEffect(() => {
        const handleTouchMove = (e) => {
            if (!isDragging) return;
            const touch = e.touches[0];
            const dx = touch.clientX - dragRef.current.startX;
            const dy = touch.clientY - dragRef.current.startY;
            setPosition({
                x: dragRef.current.posX + dx,
                y: dragRef.current.posY + dy
            });
        };

        const handleTouchEnd = () => {
            setIsDragging(false);
        };

        if (isDragging) {
            document.addEventListener('touchmove', handleTouchMove);
            document.addEventListener('touchend', handleTouchEnd);
        }

        return () => {
            document.removeEventListener('touchmove', handleTouchMove);
            document.removeEventListener('touchend', handleTouchEnd);
        };
    }, [isDragging]);

    const sendMessage = async (e) => {
        if (e) e.preventDefault();
        if (!input.trim() || loading) return;

        const userMsg = input.trim();
        setInput('');
        setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
        setLoading(true);

        try {
            const res = await fetch(getAppUrl('/api/assistant/chat'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || ''
                },
                body: JSON.stringify({ message: userMsg })
            });
            const data = await res.json();
            if (data.success) {
                setMessages(prev => [...prev, { role: 'bot', text: data.reply }]);
            } else {
                setMessages(prev => [...prev, { role: 'bot', text: 'Maaf, terjadi kesalahan. Coba lagi nanti.' }]);
            }
        } catch (err) {
            setMessages(prev => [...prev, { role: 'bot', text: 'Tidak dapat terhubung ke server. Periksa koneksi Anda.' }]);
        } finally {
            setLoading(false);
        }
    };

    const quickQuestions = [
        'Bagaimana cara memesan?',
        'Cara cek status antrean?',
        'Cara mengatur profil toko?',
        'Cara melihat laporan keuangan?',
        'Bagaimana prediksi stok bekerja?',
    ];

    const handleQuickClick = (q) => {
        setInput(q);
        setTimeout(() => {
            const form = document.getElementById('ai-chat-form');
            if (form) form.dispatchEvent(new Event('submit', { bubbles: true }));
        }, 50);
    };

    return (
        <>
            {/* Tooltip hint */}
            {showTooltip && !isOpen && (
                <div
                    className="fixed bottom-[88px] right-6 z-[9998] bg-white text-slate-800 px-4 py-2.5 rounded-2xl rounded-br-md shadow-xl text-[11px] font-bold print:hidden animate-bounce cursor-pointer"
                    onClick={() => { setIsOpen(true); setShowTooltip(false); }}
                    style={{ maxWidth: 220, fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                >
                    Tanya panduan CuanGO? 🤖
                    <div className="absolute -bottom-1 right-4 w-3 h-3 bg-white rotate-45 shadow-sm"></div>
                </div>
            )}

            {/* Floating Glowing AI Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="fixed bottom-6 right-6 z-[9999] w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300 print:hidden group"
                title="Asisten AI CuanGO"
                style={{
                    background: isOpen
                        ? 'linear-gradient(135deg, #ef4444, #dc2626)'
                        : 'linear-gradient(135deg, #4361EE, #7C3AED)',
                    boxShadow: isOpen
                        ? '0 0 20px rgba(239,68,68,0.4)'
                        : '0 0 25px rgba(67,97,238,0.5), 0 0 50px rgba(124,58,237,0.2)',
                }}
            >
                {isOpen ? (
                    <span className="material-symbols-outlined text-white text-2xl">close</span>
                ) : (
                    <>
                        <span className="absolute inset-0 rounded-full border-2 border-blue-400/40 animate-ping"></span>
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" className="relative z-10">
                            <path d="M12 2C6.48 2 2 5.58 2 10c0 2.24 1.12 4.26 2.92 5.69L4 20l4.5-2.25C9.61 17.91 10.79 18 12 18c5.52 0 10-3.58 10-8S17.52 2 12 2z" fill="white" fillOpacity="0.95"/>
                            <path d="M10 8.5l.7 1.4 1.5.2-1.1 1.1.3 1.5-1.4-.7-1.4.7.3-1.5-1.1-1.1 1.5-.2L10 8.5z" fill="#4361EE"/>
                            <path d="M15 7l.5 1 1.1.15-.8.78.2 1.07-1-.52-1 .52.2-1.07-.8-.78 1.1-.15L15 7z" fill="#7C3AED"/>
                            <path d="M13 12.5l.35.7.77.1-.56.55.13.77-.69-.36-.69.36.13-.77-.56-.55.77-.1.35-.7z" fill="#4361EE" fillOpacity="0.7"/>
                        </svg>
                    </>
                )}
            </button>

            {/* Chat Window - draggable */}
            {isOpen && (
                <div 
                    className="fixed bottom-24 right-6 z-[9998] w-[340px] sm:w-[380px] max-h-[500px] bg-white rounded-3xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden print:hidden"
                    style={{ 
                        animation: 'slideUp 0.2s ease-out',
                        transform: `translate(${position.x}px, ${position.y}px)`,
                        cursor: isDragging ? 'grabbing' : 'auto',
                        fontFamily: "'Plus Jakarta Sans', sans-serif"
                    }}
                >
                    {/* Header with Drag Handle */}
                    <div 
                        onMouseDown={handleMouseDown}
                        onTouchStart={handleTouchStart}
                        className="drag-handle bg-gradient-to-r from-[#4361EE] to-[#7C3AED] px-5 py-3.5 flex items-center gap-3 shrink-0 cursor-grab active:cursor-grabbing select-none"
                    >
                        <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center pointer-events-none">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                                <path d="M12 2C6.48 2 2 5.58 2 10c0 2.24 1.12 4.26 2.92 5.69L4 20l4.5-2.25C9.61 17.91 10.79 18 12 18c5.52 0 10-3.58 10-8S17.52 2 12 2z" fill="white" fillOpacity="0.9"/>
                                <circle cx="8" cy="10" r="1" fill="#4361EE"/><circle cx="12" cy="10" r="1" fill="#7C3AED"/><circle cx="16" cy="10" r="1" fill="#4361EE"/>
                            </svg>
                        </div>
                        <div className="flex-1 min-w-0 pointer-events-none">
                            <h3 className="text-white font-bold text-[13px] flex items-center gap-1.5">
                                Asisten AI Panduan
                                <span className="text-[9px] bg-white/20 px-1.5 py-0.5 rounded text-white/95">Gunakan Drag</span>
                            </h3>
                            <p className="text-white/60 text-[9px] font-medium">Informasi Terbatas • Template Jawaban</p>
                        </div>
                        <button onClick={() => setIsOpen(false)} className="text-white/50 hover:text-white transition">
                            <span className="material-symbols-outlined text-lg">close</span>
                        </button>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2.5 max-h-[300px] min-h-[180px] bg-slate-50/50">
                        {messages.map((msg, i) => (
                            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[85%] px-3.5 py-2.5 rounded-2xl text-[11px] leading-relaxed ${msg.role === 'user'
                                    ? 'bg-[#4361EE] text-white rounded-br-md font-semibold'
                                    : 'bg-white border border-slate-100 text-slate-700 rounded-bl-md shadow-sm font-semibold'
                                }`}>
                                    {msg.text.split('\n').map((line, j) => (
                                        <span key={j}>
                                            {line}
                                            {j < msg.text.split('\n').length - 1 && <br />}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        ))}

                        {loading && (
                            <div className="flex justify-start">
                                <div className="bg-white border border-slate-100 px-4 py-3 rounded-2xl rounded-bl-md shadow-sm flex items-center gap-1.5">
                                    <span className="w-1.5 h-1.5 bg-[#4361EE] rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                                    <span className="w-1.5 h-1.5 bg-[#4361EE] rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                                    <span className="w-1.5 h-1.5 bg-[#4361EE] rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                                </div>
                            </div>
                        )}

                        {messages.length <= 1 && !loading && (
                            <div className="flex flex-wrap gap-1.5 mt-2">
                                {quickQuestions.map((q, i) => (
                                    <button
                                        key={i}
                                        onClick={() => handleQuickClick(q)}
                                        className="px-3 py-1.5 bg-white border border-[#4361EE]/15 text-[#4361EE] rounded-full text-[9px] font-bold hover:bg-[#4361EE]/5 transition"
                                    >
                                        {q}
                                    </button>
                                ))}
                            </div>
                        )}
                        <div ref={chatEndRef}></div>
                    </div>

                    {/* Input */}
                    <form id="ai-chat-form" onSubmit={sendMessage} className="px-4 py-3 border-t border-slate-100 flex items-center gap-2 bg-white shrink-0">
                        <input
                            type="text"
                            value={input}
                            onChange={e => setInput(e.target.value)}
                            placeholder="Tanya apa saja..."
                            className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-[11px] font-semibold focus:outline-none focus:border-[#4361EE] transition"
                            disabled={loading}
                        />
                        <button
                            type="submit"
                            disabled={loading || !input.trim()}
                            className="w-9 h-9 rounded-xl bg-[#4361EE] text-white flex items-center justify-center hover:bg-[#3A56D4] transition disabled:opacity-40"
                        >
                            <span className="material-symbols-outlined text-sm">send</span>
                        </button>
                    </form>
                </div>
            )}

            {/* Inline animation styles */}
            <style>{`
                @keyframes slideUp {
                    from { opacity: 0; transform: translateY(20px) scale(0.95); }
                    to { opacity: 1; transform: translateY(0) scale(1); }
                }
            `}</style>
        </>
    );
}
