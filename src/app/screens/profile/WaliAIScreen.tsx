import { useState } from 'react';
import { useNavigate } from 'react-router';
import { ArrowLeft, Send, Sparkles } from 'lucide-react';

export function WaliAIScreen() {
  const navigate = useNavigate();
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Hey! I have looked at your goals and I have got some thoughts on where to start. What does your current week of training look like?' }
  ]);

  const sendMessage = () => {
    if (!message.trim()) return;
    setMessages([...messages, { role: 'user', content: message }]);
    setMessage('');
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="sticky top-0 bg-card border-b border-border z-10">
        <div className="px-6 py-4 flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-full bg-secondary hover:bg-secondary/80 flex items-center justify-center transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-vitality flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-bold">Wali AI</h1>
              <p className="text-xs text-muted-foreground">Your fitness coach</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[80%] px-4 py-3 rounded-2xl ${
                msg.role === 'user'
                  ? 'bg-primary text-white'
                  : 'bg-card border border-border'
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}
      </div>

      <div className="sticky bottom-0 bg-card border-t border-border p-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
            placeholder="Ask Wali AI anything..."
            className="flex-1 px-4 py-3 bg-secondary rounded-xl border border-border focus:border-primary focus:outline-none transition-colors"
          />
          <button
            onClick={sendMessage}
            className="w-12 h-12 bg-primary text-white rounded-xl flex items-center justify-center"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
