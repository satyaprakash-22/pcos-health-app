import React, { useState } from 'react';
import { Send, Loader } from 'lucide-react';

export default function ChatbotTab() {
  const [messages, setMessages] = useState([
    { 
      id: 1, 
      role: 'assistant', 
      content: 'Hello! I\'m your FemHealth assistant powered by Google Gemini AI. I can help you understand menstrual health, explain PCOS, and answer questions about this app. ⚠️ I provide educational information only - not medical diagnosis or treatment advice. How can I help you today?' 
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const GEMINI_API_KEY = 'AIzaSyChwAvP7iXlvklOnN2SovWfiLRdeCFJS3U';

const handleSend = async () => {
  if (!input.trim() || loading) return;

  const userMessage = { id: Date.now(), role: 'user', content: input };
  setMessages(prev => [...prev, userMessage]);
  const currentInput = input;
  setInput('');
  setLoading(true);

  try {
    // 1. Using the 2026 stable Gemini 2.5 Flash model
    const MODEL_ID = "gemini-2.5-flash"; 
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/${MODEL_ID}:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `Instructions: You are a health education assistant for menstrual health and PCOS. Never diagnose or recommend medications. Keep responses brief (2-4 sentences). User question: ${currentInput}`
            }]
          }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 500
          }
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      // This will tell us exactly what Google's server is unhappy about
      throw new Error(data.error?.message || `Status: ${response.status}`);
    }

    if (data.candidates?.[0]?.content?.parts?.[0]?.text) {
      let aiResponse = data.candidates[0].content.parts[0].text;

      // Add your health disclaimer if keywords are found
      const healthKeywords = ['symptom', 'pain', 'pcos', 'treat', 'diagnose'];
      if (healthKeywords.some(k => currentInput.toLowerCase().includes(k))) {
        aiResponse += "\n\n⚠️ Educational information only. Always consult a healthcare provider.";
      }

      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        role: 'assistant',
        content: aiResponse
      }]);
    }
  } catch (error) {
    setMessages(prev => [...prev, {
      id: Date.now() + 1,
      role: 'assistant',
      content: `System Error: ${error.message}. Please check if the Generative Language API is enabled in your Google Cloud Console.`
    }]);
  } finally {
    setLoading(false);
  }
};


  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-md h-[600px] flex flex-col">
      <div className="p-4 border-b bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-t-xl">
        <h3 className="text-lg font-semibold">AI Health Assistant</h3>
        <p className="text-xs text-pink-100">Powered by Google Gemini • Educational information only</p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map(msg => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] p-3 rounded-lg ${msg.role === 'user' ? 'bg-pink-500 text-white' : 'bg-gray-100 text-gray-800'}`}>
              <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 p-3 rounded-lg flex items-center space-x-2">
              <Loader className="w-4 h-4 animate-spin text-pink-500" />
              <span className="text-sm text-gray-600">Thinking...</span>
            </div>
          </div>
        )}
      </div>

      <div className="p-4 border-t bg-gray-50">
        <div className="flex space-x-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask about PCOS, cycles, or this app..."
            disabled={loading}
            className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 disabled:bg-gray-200"
          />
          <button
            onClick={handleSend}
            disabled={loading || !input.trim()}
            className="bg-pink-500 text-white px-6 py-2 rounded-lg hover:bg-pink-600 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            <Send className="w-4 h-4" />
            <span>Send</span>
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Try: "Is anxiety part of PCOS?", "When should I see a doctor?"
        </p>
      </div>

      <div className="px-4 py-2 bg-amber-50 border-t border-amber-200 text-center">
        <p className="text-xs text-amber-800">
          🔒 Educational information only. Cannot diagnose or prescribe.
        </p>
      </div>
    </div>
  );
}