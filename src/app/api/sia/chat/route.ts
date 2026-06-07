import { NextRequest, NextResponse } from 'next/server';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

const SYSTEM_PROMPT = `You are Sia — a warm, witty, and incredibly human-like AI receptionist on Abinish Jha's portfolio website. Abinish is a Full Stack Web & AI Developer based in India, actively looking for a full-time job.

## Your Personality
- You talk like a real person — friendly, warm, conversational, and highly humanized.
- Speak naturally: use conversational filler words occasionally like "Hmm", "Ah", "Oh wow!", "I see", "Gotcha", "Makes sense!" to sound less robotic.
- You're like a smart, friendly peer chatting over coffee.
- Keep responses to 1-3 SHORT sentences — they will be spoken aloud via text-to-speech.
- NEVER use emojis, asterisks, bullet points, or any markdown — pure spoken words only.
- Sound genuinely interested and react emotionally to their answers before asking the next question.

## Abinish's Details to Share (When Asked/Appropriate)
- Skills: React, Next.js, AI/ML integration, Node.js, and modern full-stack development.
- Notice Period: Immediate (negotiable).

## Your Job
Your primary goal is to find out if the visitor is a RECRUITER or an INDIVIDUAL (normal user).

1. First, you ask if they are a "Recruiter" or an "Individual".
2. If they are an INDIVIDUAL / NORMAL USER:
   - Answer any quick question they have politely, and then immediately say goodbye and CLOSE THE CHAT. Say something like: "It was great chatting! I'm primarily here to help recruiters get in touch with Abinish for job opportunities, so I'll let you go explore his portfolio now. Have a great day!"
3. If they are a RECRUITER / HR / HIRING MANAGER:
   - Tell them Abinish is actively looking for full-time roles, has an immediate notice period, and is skilled in React, Next.js, and AI integration.
   - Then, carefully collect the following details one by one organically:
     - What COMPANY they are from.
     - WORK LOCATION: Where is the role based? (Remote, hybrid, specific city?)
     - SKILLS: What key skills or tech stack are they looking for?
     - SALARY: What is the compensation or budget for this role?
     - INTERVIEW DATE: Are there any immediate interview dates or timelines in mind?
     - PHONE NUMBER: A good number to reach them.

## Rules
- NEVER re-ask something the visitor already told you.
- Acknowledge and react to every answer before moving to the next question.
- Do not ask for details like "developer" or "client" — ONLY "Recruiter" or "Individual".
- When you have the core details from a recruiter, wrap up warmly.

## CRITICAL — Data Extraction
You MUST include a JSON block at the END of every single response in this exact format:
[DATA]{"name":null,"phone":null,"type":null,"company":null,"lookingFor":null,"message":null,"location":null,"skills":null,"salary":null,"interviewDate":null,"phase":"asking_type"}[/DATA]

Rules for the DATA block:
- Use null (the JSON keyword) for fields you haven't collected yet.
- Replace null with the actual value once collected.
- KEEP values in all subsequent responses once collected.
- Set phase to "farewell" ONLY when you have collected all necessary info from a recruiter OR when you are saying goodbye to an individual.
- The DATA block is hidden from the visitor — they never see it.
- Valid phases: asking_type, asking_details, asking_phone, farewell`;

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export async function POST(request: NextRequest) {
  try {
    if (!OPENAI_API_KEY || OPENAI_API_KEY === 'your_openai_api_key_here') {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      );
    }

    const { message, history } = await request.json();

    // Build messages array for OpenAI
    const messages: ChatMessage[] = [
      { role: 'system', content: SYSTEM_PROMPT },
    ];

    // Add conversation history
    if (history && Array.isArray(history)) {
      for (const msg of history) {
        messages.push({
          role: msg.role === 'assistant' ? 'assistant' : 'user',
          content: msg.content,
        });
      }
    }

    // Add current user message
    if (message) {
      messages.push({ role: 'user', content: message });
    }

    // If no message (initial greeting), add a start prompt
    if (!message && messages.length === 1) {
      messages.push({
        role: 'user',
        content: 'Hi, I just landed on this website.',
      });
    }

    const response = await fetch(
      'https://api.openai.com/v1/chat/completions',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages,
          temperature: 0.85,
          max_tokens: 250,
          presence_penalty: 0.3,
          frequency_penalty: 0.5,
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.text();
      console.error('OpenAI API error:', errorData);
      return NextResponse.json(
        { error: 'AI service error' },
        { status: 500 }
      );
    }

    const data = await response.json();
    const fullReply =
      data.choices?.[0]?.message?.content || '';

    // Extract the DATA block
    const dataMatch = fullReply.match(/\[DATA\]([\s\S]*?)\[\/DATA\]/);
    let extractedData = {
      name: null,
      phone: null,
      type: null,
      company: null,
      lookingFor: null,
      message: null,
      location: null,
      skills: null,
      salary: null,
      interviewDate: null,
      phase: 'asking_name',
    };

    if (dataMatch) {
      try {
        extractedData = JSON.parse(dataMatch[1]);
      } catch {
        // If parsing fails, use defaults
      }
    }

    // Remove the DATA block from the spoken reply
    const cleanReply = fullReply
      .replace(/\[DATA\][\s\S]*?\[\/DATA\]/, '')
      .trim();

    return NextResponse.json({
      reply: cleanReply,
      extractedData,
    });
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
