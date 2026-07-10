import { useState } from 'react';
import { Loader2, Send, Sparkles } from 'lucide-react';
import { API_BASE_URL } from '../lib/api';

interface LiveChatProps {
  currentUser: {
    name: string;
    role?: string;
    branch?: string;
  };
  roomName: string;
}

interface Message {
  id: number;
  text: string;
  sender: 'user' | 'ai';
}

const LiveChat = ({ currentUser, roomName }: LiveChatProps) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      text: `Hi ${currentUser.name.split(' ')[0]}! I’m your Nexus Copilot in ${roomName}.`,
      sender: 'ai',
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSend = async () => {
    const trimmedInput = input.trim();
    if (!trimmedInput || isLoading) return;

    setMessages(prev => [...prev, { id: Date.now(), text: trimmedInput, sender: 'user' }]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: trimmedInput,
          user: currentUser,
          roomName,
        }),
      });

      const data = await response.json();

      setMessages(prev => [
        ...prev,
        {
          id: Date.now() + 1,
          text: data.reply || 'No reply received.',
          sender: 'ai',
        },
      ]);
    } catch {
      setMessages(prev => [
        ...prev,
        {
          id: Date.now() + 1,
          text: 'Error: could not connect to the chat service.',
          sender: 'ai',
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-40 w-[calc(100vw-2rem)] max-w-md rounded-[1.75rem] border border-slate-200 bg-white/95 shadow-2xl backdrop-blur-xl overflow-hidden">
      <div className="flex items-center justify-between border-b border-slate-100 bg-slate-900 px-5 py-4 text-white">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-white/10 p-2">
            <Sparkles size={18} />
          </div>
          <div>
            <h3 className="text-sm font-semibold">Nexus Copilot</h3>
            <p className="text-[11px] text-slate-300">Room: {roomName}</p>
          </div>
        </div>
        <span className="rounded-full bg-emerald-400/15 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-emerald-300">
          Online
        </span>
      </div>

      <div className="max-h-80 space-y-3 overflow-y-auto px-4 py-4">
        {messages.map(message => (
          <div key={message.id} className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm ${
                message.sender === 'user'
                  ? 'rounded-br-md bg-slate-900 text-white'
                  : 'rounded-bl-md border border-slate-200 bg-white text-slate-700'
              }`}
            >
              {message.text}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="flex items-center gap-2 rounded-2xl rounded-bl-md border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500 shadow-sm">
              <Loader2 size={16} className="animate-spin" />
              Thinking...
            </div>
          </div>
        )}
      </div>

      <div className="border-t border-slate-100 p-4">
        <div className="relative">
          <input
            type="text"
            value={input}
            onChange={event => setInput(event.target.value)}
            onKeyDown={event => event.key === 'Enter' && handleSend()}
            placeholder="Ask about your classes, progress, or deadlines..."
            className="w-full rounded-full border border-slate-200 bg-slate-50 py-3 pl-4 pr-12 text-sm text-slate-800 placeholder-slate-400 outline-none transition focus:border-slate-400 focus:bg-white focus:ring-2 focus:ring-slate-200"
          />
          <button
            type="button"
            onClick={handleSend}
            disabled={isLoading}
            className="absolute right-2 top-2 rounded-full bg-slate-900 p-2 text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default LiveChat;