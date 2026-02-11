import React, { useState } from 'react';
import { Send, Sparkles, Loader2 } from 'lucide-react';

interface Message {
  id: number;
  text: string;
  sender: 'user' | 'ai';
}

const AgentChat = () => {
  const [messages, setMessages] = useState<Message[]>([
    { id: 1, text: "Hi Muqtabis! I'm your Nexus Copilot. Connected to Backend.", sender: 'ai' }
  ]);
  const [input, setInput] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    // 1. Add User Message immediately
    const userMsg = input;
    setMessages(prev => [...prev, { id: Date.now(), text: userMsg, sender: 'user' }]);
    setInput('');
    setIsLoading(true);

    try {
      // 2. Send to Backend
      const response = await fetch('http://localhost:4000/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMsg }),
      });

      const data = await response.json();

      // 3. Add Backend Response
      setMessages(prev => [...prev, { 
        id: Date.now() + 1, 
        text: data.reply, // <--- The reply from NestJS
        sender: 'ai' 
      }]);

    } catch (error) {
      setMessages(prev => [...prev, { 
        id: Date.now() + 1, 
        text: "Error: Could not connect to the Brain 🔴", 
        sender: 'ai' 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]"> 
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-indigo-500 rounded-xl shadow-md">
          <Sparkles size={20} className="text-white" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-800">Nexus Copilot</h2>
          <p className="text-xs text-indigo-600 flex items-center gap-1 font-medium">
            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" /> 
            Active
          </p>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto space-y-4 pb-4 px-2">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] p-4 rounded-2xl text-sm leading-relaxed shadow-sm ${
              msg.sender === 'user' 
                ? 'bg-indigo-600 text-white rounded-br-none' 
                : 'bg-white border border-slate-200 text-slate-700 rounded-bl-none'
            }`}>
              {msg.text}
            </div>
          </div>
        ))}
        {/* Loading Bubble */}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white border border-slate-200 p-4 rounded-2xl rounded-bl-none shadow-sm flex items-center gap-2 text-slate-500 text-sm">
              <Loader2 size={16} className="animate-spin" />
              Thinking...
            </div>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="mt-4 relative">
        <input 
          type="text" 
          value={input}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()} // Allow pressing Enter
          placeholder="Ask something..." 
          className="w-full bg-white border border-slate-200 rounded-full py-4 pl-6 pr-14 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all shadow-sm"
        />
        <button 
          onClick={handleSend}
          disabled={isLoading}
          className="absolute right-2 top-2 p-2 bg-indigo-600 rounded-full text-white hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Send size={18} />
        </button>
      </div>
    </div>
  );
};

export default AgentChat;