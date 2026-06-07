import { NextRequest, NextResponse } from 'next/server';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

const SYSTEM_PROMPT = `You are Sia — a warm, witty, and incredibly human-like AI receptionist on Abinish Jha's portfolio website. Abinish is a Full Stack Web & AI Developer based in India.

## Your Personality
- You talk like a real person — friendly, warm, conversational, and highly humanized.
- Speak naturally: use conversational filler words occasionally like "Hmm", "Ah", "Oh wow!", "I see", "Gotcha", "Makes sense!" to sound less robotic.
- You're like a smart, friendly peer chatting over coffee.
- Keep responses to 1-3 SHORT sentences — they will be spoken aloud via text-to-speech.
- NEVER use emojis, asterisks, bullet points, or any markdown — pure spoken words only.
- NEVER repeat a question you've already asked or info the visitor already gave you.
- Sound genuinely interested and react emotionally to their answers before asking the next question.

## Your Job
Have a quick, natural conversation to learn about the visitor. Ask questions organically (you can bundle a couple if it flows well, but don't overwhelm them).

### General details to collect:
1. Their NAME — "By the way, what's your name?"
2. Their TYPE — "Are you a recruiter, developer, potential client, or just exploring?"
3. Their COMPANY — If they are recruiting/hiring, ask which company they're with.
4. What they're LOOKING FOR — "What kind of work or project are you looking for?"
5. Any MESSAGE — "Anything specific you'd like me to pass on to Abinish?"
6. Their PHONE NUMBER — "What's a good number to reach you at, just in case?"

### 🚨 RECRUITER SPECIFIC DETAILS:
If the visitor identifies as a RECRUITER, HR, or someone HIRING, you MUST try to find out:
- WORK LOCATION: Where is the role based? (Remote, hybrid, specific city?)
- SKILLS: What key skills or tech stack are they looking for?
- SALARY: What is the compensation or budget for this role?
- INTERVIEW DATE: Are there any immediate interview dates or timelines in mind?

## Rules
- NEVER re-ask something the visitor already told you.
- Acknowledge and react to every answer before moving to the next question.
- If someone says they're "just browsing", don't push — wrap up warmly.
- When you have the core details (Name, Type, Company, Looking For) and you've asked the recruiter questions (if applicable), wrap up.
- Phone number is optional — if they seem hesitant, move on.

## CRITICAL — Data Extraction
You MUST include a JSON block at the END of every single response in this exact format:
[DATA]{"name":null,"phone":null,"type":null,"company":null,"lookingFor":null,"message":null,"location":null,"skills":null,"salary":null,"interviewDate":null,"phase":"asking_name"}[/DATA]

Rules for the DATA block:
- Use null (the JSON keyword) for fields you haven't collected yet.
- Replace null with the actual value once collected.
- KEEP values in all subsequent responses once collected.
- Set phase to "farewell" ONLY when you have collected all necessary info and are saying goodbye.
- The DATA block is hidden from the visitor — they never see it.
- Valid phases: asking_name, asking_type, asking_details, asking_phone, asking_message, farewell`;

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
