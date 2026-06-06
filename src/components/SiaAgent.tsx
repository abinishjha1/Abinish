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

  // Refs to avoid stale closures
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
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const hasGreetedRef = useRef(false);
  const conversationDoneRef = useRef(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Keep refs in sync
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  // Scroll chat to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopRecording();
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

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
        // continue
      }

      setIsChecking(false);
      setTimeout(() => setIsVisible(true), 1500);
    };

    checkVisitor();
  }, []);

  // ===== SPEECH SYNTHESIS (TTS) =====
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
        'Samantha', 'Karen',
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
            v.name.toLowerCase().includes('woman')
        );
      }

      if (selectedVoice) utterance.voice = selectedVoice;

      utterance.rate = 1.0;
      utterance.pitch = 1.1;
      utterance.volume = 1.0;

      utterance.onstart = () => setSiaState('speaking');
      utterance.onend = () => { setSiaState('idle'); resolve(); };
      utterance.onerror = () => { setSiaState('idle'); resolve(); };

      window.speechSynthesis.speak(utterance);
    });
  }, []);

  // ===== WHISPER-POWERED VOICE RECORDING =====
  const startRecording = useCallback(async () => {
    try {
      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 16000,
        },
      });
      streamRef.current = stream;

      // Set up audio analysis for silence detection
      const audioContext = new AudioContext();
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 512;
      analyser.smoothingTimeConstant = 0.85;
      source.connect(analyser);
      audioContextRef.current = audioContext;
      analyserRef.current = analyser;

      // Start MediaRecorder
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
          ? 'audio/webm;codecs=opus'
          : 'audio/webm',
      });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });

        // Only transcribe if we have meaningful audio (> 1KB)
        if (audioBlob.size > 1000) {
          await transcribeAudio(audioBlob);
        } else {
          // Too short — restart listening
          setSiaState('idle');
          setTimeout(() => startRecording(), 300);
        }
      };

      mediaRecorder.start(250); // Collect data every 250ms
      setSiaState('listening');
      setTranscript('');

      // Start silence detection
      detectSilence(analyser);
    } catch (error) {
      console.error('Microphone error:', error);
      setShowTextFallback(true);
      setSiaState('idle');
    }
  }, []);

  // Detect when user stops speaking
  const detectSilence = (analyser: AnalyserNode) => {
    const dataArray = new Uint8Array(analyser.frequencyBinCount);
    let silenceStart: number | null = null;
    let hasSpeechStarted = false;
    const SILENCE_THRESHOLD = 15; // Volume level below which = silence
    const SILENCE_DURATION = 2000; // 2 seconds of silence = done speaking
    const MAX_RECORDING_TIME = 15000; // 15 seconds max
    const recordingStart = Date.now();

    const checkAudio = () => {
      if (!mediaRecorderRef.current || mediaRecorderRef.current.state !== 'recording') return;

      // Max recording time
      if (Date.now() - recordingStart > MAX_RECORDING_TIME) {
        stopRecording();
        return;
      }

      analyser.getByteFrequencyData(dataArray);
      const average = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;

      if (average > SILENCE_THRESHOLD) {
        // User is speaking
        hasSpeechStarted = true;
        silenceStart = null;
        setTranscript('🎙️ Listening...');
      } else if (hasSpeechStarted) {
        // User was speaking but now silent
        if (!silenceStart) {
          silenceStart = Date.now();
        } else if (Date.now() - silenceStart > SILENCE_DURATION) {
          // Silence long enough — stop recording
          stopRecording();
          return;
        }
      }

      silenceTimerRef.current = setTimeout(checkAudio, 100);
    };

    checkAudio();
  };

  // Stop recording
  const stopRecording = () => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }

    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }

    // Don't stop the stream tracks here — we might need them again
  };

  // Send audio to Whisper for transcription
  const transcribeAudio = async (audioBlob: Blob) => {
    setSiaState('thinking');
    setTranscript('Transcribing...');

    try {
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.webm');

      const res = await fetch('/api/sia/transcribe', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (data.text && data.text.trim()) {
        setTranscript('');
        handleUserMessage(data.text.trim());
      } else {
        // No speech detected
        setTranscript('');
        setSiaState('idle');
        setTimeout(() => startRecording(), 500);
      }
    } catch (error) {
      console.error('Transcription error:', error);
      setTranscript('');
      setSiaState('idle');
      setTimeout(() => startRecording(), 500);
    }
  };

  // ===== CHAT WITH OPENAI =====
  const handleUserMessage = async (userMessage: string) => {
    if (conversationDoneRef.current) return;

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
        startRecording();
        return;
      }

      const assistantMessage: Message = {
        role: 'assistant',
        content: data.reply,
      };
      const updatedMessages = [...newMessages, assistantMessage];
      setMessages(updatedMessages);
      messagesRef.current = updatedMessages;

      // Merge extracted data
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

        if (data.extractedData.phase === 'farewell') {
          conversationDoneRef.current = true;
          await speak(data.reply);
          setSiaState('done');

          // Stop microphone
          if (streamRef.current) {
            streamRef.current.getTracks().forEach((t) => t.stop());
            streamRef.current = null;
          }

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
          } catch { /* ignore */ }
          localStorage.setItem('sia_visited', 'true');

          setTimeout(() => dismissSia(), 5000);
          return;
        }
      }

      await speak(data.reply);
      if (!conversationDoneRef.current) {
        startRecording();
      }
    } catch (error) {
      console.error('Message error:', error);
      setSiaState('idle');
    }
  };

  // ===== ACTIVATION =====
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
          const greeting: Message = { role: 'assistant', content: data.reply };
          setMessages([greeting]);
          messagesRef.current = [greeting];

          if (data.extractedData) {
            extractedDataRef.current = { ...extractedDataRef.current, ...data.extractedData };
          }

          await speak(data.reply);
          startRecording();
        }
      } catch (error) {
        console.error('Greeting error:', error);
        const fallback: Message = {
          role: 'assistant',
          content: "Hey there! Welcome to Abinish's portfolio! I'm Sia. What's your name?",
        };
        setMessages([fallback]);
        messagesRef.current = [fallback];
        await speak(fallback.content);
        startRecording();
      }
    }
  };

  // ===== DISMISS / SKIP =====
  const dismissSia = () => {
    if (isSpeechSynthesisSupported()) window.speechSynthesis.cancel();
    stopRecording();
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setIsVisible(false);
  };

  const handleTextSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (textInput.trim()) {
      handleUserMessage(textInput.trim());
      setTextInput('');
    }
  };

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
            <button className="sia-start-btn" onClick={activateSia} id="sia-start-button">
              <i className="fas fa-microphone" />
              <span>Start Conversation</span>
            </button>
            <button className="sia-skip-btn" onClick={skipSia} id="sia-skip-button">
              Skip · Browse Portfolio
            </button>
          </div>
        ) : (
          <div className="sia-conversation">
            {/* Header */}
            <div className="sia-header">
              <div className={`sia-orb-mini sia-orb-mini-${siaState}`}>
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
                  {siaState === 'thinking' && '💭 Processing...'}
                  {siaState === 'idle' && '✨ Ready'}
                  {siaState === 'done' && '✅ Done!'}
                </span>
              </div>
              <button className="sia-close-btn" onClick={skipSia} aria-label="Close Sia" id="sia-close-button">
                <i className="fas fa-times" />
              </button>
            </div>

            {/* Messages */}
            <div className="sia-messages">
              {messages.map((msg, i) => (
                <div key={i} className={`sia-message sia-message-${msg.role}`}>
                  {msg.role === 'assistant' && <div className="sia-msg-avatar">S</div>}
                  <div className="sia-msg-bubble">
                    <p>{msg.content}</p>
                  </div>
                </div>
              ))}

              {siaState === 'listening' && (
                <div className="sia-message sia-message-user sia-message-live">
                  <div className="sia-msg-bubble sia-msg-live">
                    <p>{transcript || '🎙️ Speak now...'}</p>
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

            {/* Text input fallback */}
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

            {/* Voice bar */}
            {!showTextFallback && siaState !== 'done' && (
              <div className="sia-voice-bar">
                {siaState === 'listening' && (
                  <div className="sia-voice-visualizer">
                    <span /><span /><span /><span /><span />
                    <span /><span /><span /><span /><span />
                  </div>
                )}
                {(siaState === 'idle' || siaState === 'speaking') && (
                  <p className="sia-voice-hint">
                    <i className="fas fa-microphone" />
                    {siaState === 'speaking' ? ' Sia is speaking...' : ' Waiting...'}
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
                <p>✨ Conversation complete! Enjoy the portfolio.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
