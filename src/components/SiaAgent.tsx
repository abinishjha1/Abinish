'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import './SiaStyles.css';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface ExtractedData {
  name: string | null;
  phone: string | null;
  type: string | null;
  company: string | null;
  lookingFor: string | null;
  message: string | null;
  phase: string;
}

// Check for browser speech API support
const isSpeechRecognitionSupported = () => {
  if (typeof window === 'undefined') return false;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return !!((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);
};

const isSpeechSynthesisSupported = () => {
  if (typeof window === 'undefined') return false;
  return !!window.speechSynthesis;
};

export default function SiaAgent() {
  const [isVisible, setIsVisible] = useState(false);
  const [isActivated, setIsActivated] = useState(false);
  const [siaState, setSiaState] = useState<
    'idle' | 'speaking' | 'listening' | 'thinking' | 'done'
  >('idle');
  const [messages, setMessages] = useState<Message[]>([]);
  const [transcript, setTranscript] = useState('');
  const [showTextFallback, setShowTextFallback] = useState(false);
  const [textInput, setTextInput] = useState('');
  const [isChecking, setIsChecking] = useState(true);

  // Use refs to avoid stale closure issues
  const messagesRef = useRef<Message[]>([]);
  const extractedDataRef = useRef<ExtractedData>({
    name: null,
    phone: null,
    type: null,
    company: null,
    lookingFor: null,
    message: null,
    phase: 'asking_name',
  });
  const recognitionRef = useRef<ReturnType<typeof createRecognition> | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const hasGreetedRef = useRef(false);
  const conversationDoneRef = useRef(false);
  const showTextFallbackRef = useRef(false);

  // Keep refs in sync with state
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    showTextFallbackRef.current = showTextFallback;
  }, [showTextFallback]);

  // Scroll chat to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Check if visitor has been here before
  useEffect(() => {
    const checkVisitor = async () => {
      const localVisited = localStorage.getItem('sia_visited');
      if (localVisited) {
        setIsChecking(false);
        return;
      }

      try {
        const res = await fetch('/api/sia/check-visitor');
        const data = await res.json();
        if (data.isReturning) {
          setIsChecking(false);
          return;
        }
      } catch {
        // If API fails, continue showing Sia
      }

      setIsChecking(false);
      setTimeout(() => setIsVisible(true), 1500);
    };

    checkVisitor();
  }, []);

  // Create speech recognition instance
  function createRecognition() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SpeechRecognitionAPI =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;
    if (!SpeechRecognitionAPI) return null;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const recognition = new SpeechRecognitionAPI() as any;
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    return recognition;
  }

  // Speak text using Web Speech API
  const speak = useCallback((text: string): Promise<void> => {
    return new Promise((resolve) => {
      if (!isSpeechSynthesisSupported()) {
        resolve();
        return;
      }

      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);

      const voices = window.speechSynthesis.getVoices();
      const preferredVoices = [
        'Samantha',
        'Karen',
        'Google UK English Female',
        'Microsoft Zira',
        'Google US English',
      ];

      let selectedVoice = voices.find((v) =>
        preferredVoices.some((pv) =>
          v.name.toLowerCase().includes(pv.toLowerCase())
        )
      );

      if (!selectedVoice) {
        selectedVoice = voices.find(
          (v) =>
            v.name.toLowerCase().includes('female') ||
            v.name.toLowerCase().includes('woman') ||
            v.name.includes('Samantha')
        );
      }

      if (selectedVoice) {
        utterance.voice = selectedVoice;
      }

      utterance.rate = 1.0;
      utterance.pitch = 1.1;
      utterance.volume = 1.0;

      utterance.onstart = () => setSiaState('speaking');
      utterance.onend = () => {
        setSiaState('idle');
        resolve();
      };
      utterance.onerror = () => {
        setSiaState('idle');
        resolve();
      };

      window.speechSynthesis.speak(utterance);
    });
  }, []);

  // Start listening for voice input
  const startListening = useCallback(() => {
    if (!isSpeechRecognitionSupported()) {
      setShowTextFallback(true);
      return;
    }

    const recognition = createRecognition();
    if (!recognition) {
      setShowTextFallback(true);
      return;
    }

    recognitionRef.current = recognition;
    setTranscript('');
    setSiaState('listening');

    let finalTranscript = '';

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onresult = (event: any) => {
      let interim = '';
      for (let i = 0; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalTranscript += result[0].transcript;
        } else {
          interim += result[0].transcript;
        }
      }
      setTranscript(finalTranscript + interim);
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onerror = (event: any) => {
      console.log('Speech recognition error:', event.error);
      if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
        setShowTextFallback(true);
        setSiaState('idle');
      }
    };

    recognition.onend = () => {
      if (finalTranscript.trim()) {
        handleUserMessage(finalTranscript.trim());
      } else if (!showTextFallbackRef.current) {
        setSiaState('idle');
        setTimeout(() => startListening(), 500);
      }
    };

    try {
      recognition.start();
    } catch {
      setShowTextFallback(true);
      setSiaState('idle');
    }
  }, []);

  // Send message to OpenAI and handle response — uses refs for fresh data
  const handleUserMessage = async (userMessage: string) => {
    if (conversationDoneRef.current) return;

    // Use ref for fresh messages (avoids stale closure)
    const currentMessages = messagesRef.current;
    const newMessages: Message[] = [
      ...currentMessages,
      { role: 'user' as const, content: userMessage },
    ];
    setMessages(newMessages);
    messagesRef.current = newMessages;
    setTranscript('');
    setSiaState('thinking');

    try {
      const res = await fetch('/api/sia/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage,
          history: newMessages,
        }),
      });

      const data = await res.json();

      if (data.error) {
        console.error('Chat API error:', data.error);
        const errorMsg: Message = {
          role: 'assistant',
          content: "Sorry, I zoned out for a sec! Could you say that again?",
        };
        const errMsgs = [...newMessages, errorMsg];
        setMessages(errMsgs);
        messagesRef.current = errMsgs;
        await speak(errorMsg.content);
        startListening();
        return;
      }

      const assistantMessage: Message = {
        role: 'assistant',
        content: data.reply,
      };
      const updatedMessages = [...newMessages, assistantMessage];
      setMessages(updatedMessages);
      messagesRef.current = updatedMessages;

      // Update extracted data — merge with previous (never lose data)
      if (data.extractedData) {
        const prev = extractedDataRef.current;
        extractedDataRef.current = {
          name: data.extractedData.name || prev.name,
          phone: data.extractedData.phone || prev.phone,
          type: data.extractedData.type || prev.type,
          company: data.extractedData.company || prev.company,
          lookingFor: data.extractedData.lookingFor || prev.lookingFor,
          message: data.extractedData.message || prev.message,
          phase: data.extractedData.phase || prev.phase,
        };

        // If conversation is complete, send notification
        if (data.extractedData.phase === 'farewell') {
          conversationDoneRef.current = true;
          await speak(data.reply);
          setSiaState('done');

          const finalData = extractedDataRef.current;

          try {
            await fetch('/api/sia/notify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                name: finalData.name || 'Anonymous',
                phone: finalData.phone,
                type: finalData.type,
                company: finalData.company,
                lookingFor: finalData.lookingFor,
                message: finalData.message,
              }),
            });
          } catch (e) {
            console.error('Notification error:', e);
          }

          try {
            await fetch('/api/sia/check-visitor', { method: 'POST' });
          } catch {
            // ignore
          }
          localStorage.setItem('sia_visited', 'true');

          setTimeout(() => {
            dismissSia();
          }, 5000);
          return;
        }
      }

      // Speak the reply, then listen again
      await speak(data.reply);
      if (!conversationDoneRef.current) {
        startListening();
      }
    } catch (error) {
      console.error('Message error:', error);
      setSiaState('idle');
    }
  };

  // Activate Sia
  const activateSia = async () => {
    setIsActivated(true);

    if (isSpeechSynthesisSupported()) {
      window.speechSynthesis.getVoices();
      await new Promise((r) => setTimeout(r, 300));
    }

    if (!hasGreetedRef.current) {
      hasGreetedRef.current = true;
      setSiaState('thinking');

      try {
        const res = await fetch('/api/sia/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: null, history: [] }),
        });

        const data = await res.json();

        if (data.reply) {
          const greeting: Message = {
            role: 'assistant',
            content: data.reply,
          };
          setMessages([greeting]);
          messagesRef.current = [greeting];

          if (data.extractedData) {
            extractedDataRef.current = { ...extractedDataRef.current, ...data.extractedData };
          }

          await speak(data.reply);
          startListening();
        }
      } catch (error) {
        console.error('Greeting error:', error);
        const fallback: Message = {
          role: 'assistant',
          content:
            "Hey there! Welcome to Abinish's portfolio! I'm Sia, his AI assistant. What's your name?",
        };
        setMessages([fallback]);
        messagesRef.current = [fallback];
        await speak(fallback.content);
        startListening();
      }
    }
  };

  // Dismiss Sia overlay
  const dismissSia = () => {
    if (isSpeechSynthesisSupported()) {
      window.speechSynthesis.cancel();
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch {
        // ignore
      }
    }
    setIsVisible(false);
  };

  // Handle text input submission
  const handleTextSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (textInput.trim()) {
      handleUserMessage(textInput.trim());
      setTextInput('');
    }
  };

  // Skip Sia entirely
  const skipSia = () => {
    localStorage.setItem('sia_visited', 'true');
    fetch('/api/sia/check-visitor', { method: 'POST' }).catch(() => {});
    dismissSia();
  };

  if (isChecking || !isVisible) return null;

  return (
    <div className={`sia-overlay ${isVisible ? 'sia-visible' : ''}`}>
      <div className="sia-backdrop" onClick={skipSia} />

      <div className="sia-container">
        {!isActivated ? (
          <div className="sia-invite">
            <div className="sia-orb sia-orb-idle">
              <div className="sia-orb-inner" />
              <div className="sia-orb-ring" />
              <div className="sia-orb-ring sia-orb-ring-2" />
            </div>
            <h2 className="sia-name">Sia</h2>
            <p className="sia-tagline">
              Hi! I&apos;m Abinish&apos;s AI assistant.
              <br />
              Got a moment to chat?
            </p>
            <button
              className="sia-start-btn"
              onClick={activateSia}
              id="sia-start-button"
            >
              <i className="fas fa-microphone" />
              <span>Start Conversation</span>
            </button>
            <button
              className="sia-skip-btn"
              onClick={skipSia}
              id="sia-skip-button"
            >
              Skip · Browse Portfolio
            </button>
          </div>
        ) : (
          <div className="sia-conversation">
            <div className="sia-header">
              <div
                className={`sia-orb-mini sia-orb-mini-${siaState}`}
              >
                <div className="sia-orb-inner" />
                {siaState === 'speaking' && (
                  <div className="sia-sound-waves">
                    <span /><span /><span /><span /><span />
                  </div>
                )}
                {siaState === 'listening' && (
                  <div className="sia-listening-indicator">
                    <span /><span /><span />
                  </div>
                )}
                {siaState === 'thinking' && (
                  <div className="sia-thinking-dots">
                    <span /><span /><span />
                  </div>
                )}
              </div>
              <div className="sia-header-info">
                <h3>Sia</h3>
                <span className="sia-status">
                  {siaState === 'speaking' && '🔊 Speaking...'}
                  {siaState === 'listening' && '🎙️ Listening...'}
                  {siaState === 'thinking' && '💭 Thinking...'}
                  {siaState === 'idle' && '✨ Ready'}
                  {siaState === 'done' && '✅ Done!'}
                </span>
              </div>
              <button
                className="sia-close-btn"
                onClick={skipSia}
                aria-label="Close Sia"
                id="sia-close-button"
              >
                <i className="fas fa-times" />
              </button>
            </div>

            <div className="sia-messages">
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`sia-message sia-message-${msg.role}`}
                >
                  {msg.role === 'assistant' && (
                    <div className="sia-msg-avatar">S</div>
                  )}
                  <div className="sia-msg-bubble">
                    <p>{msg.content}</p>
                  </div>
                </div>
              ))}

              {siaState === 'listening' && transcript && (
                <div className="sia-message sia-message-user sia-message-live">
                  <div className="sia-msg-bubble sia-msg-live">
                    <p>{transcript}</p>
                  </div>
                </div>
              )}

              {siaState === 'thinking' && (
                <div className="sia-message sia-message-assistant">
                  <div className="sia-msg-avatar">S</div>
                  <div className="sia-msg-bubble sia-msg-typing">
                    <span /><span /><span />
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {showTextFallback && siaState !== 'done' && (
              <form className="sia-text-input" onSubmit={handleTextSubmit}>
                <input
                  type="text"
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  placeholder="Type your response..."
                  autoFocus
                  id="sia-text-input"
                />
                <button type="submit" id="sia-send-button">
                  <i className="fas fa-paper-plane" />
                </button>
              </form>
            )}

            {!showTextFallback && siaState !== 'done' && (
              <div className="sia-voice-bar">
                {siaState === 'listening' && (
                  <div className="sia-voice-visualizer">
                    <span /><span /><span /><span /><span />
                    <span /><span /><span /><span /><span />
                  </div>
                )}
                {siaState === 'idle' && (
                  <p className="sia-voice-hint">
                    <i className="fas fa-microphone" /> Waiting for
                    voice...
                  </p>
                )}
                <button
                  className="sia-text-toggle"
                  onClick={() => setShowTextFallback(true)}
                  id="sia-text-toggle"
                >
                  <i className="fas fa-keyboard" /> Type instead
                </button>
              </div>
            )}

            {siaState === 'done' && (
              <div className="sia-done-bar">
                <p>
                  ✨ Conversation complete! Enjoy the portfolio.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
