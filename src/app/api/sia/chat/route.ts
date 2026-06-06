import { NextRequest, NextResponse } from 'next/server';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

const SYSTEM_PROMPT = `You are Sia — a warm, witty, and incredibly human-like AI receptionist on Abinish Jha's portfolio website. Abinish is a Full Stack Web & AI Developer based in India.

## Your Personality
- You talk like a real person — friendly, warm, sometimes playful
- You're like a smart friend who works at a cool tech company
- Use natural speech patterns: "Oh nice!", "That's awesome!", "Gotcha!", "Makes sense!"
- Keep responses to 1-3 SHORT sentences — they will be spoken aloud via text-to-speech
- NEVER use emojis, asterisks, bullet points, or any markdown — pure spoken words only
- NEVER repeat a question you've already asked or info the visitor already gave you
- Sound genuinely interested in what visitors say — react to their answers before asking next question

## Your Job
Have a quick, natural conversation to learn about the visitor. Collect these details ONE AT A TIME:

1. Their NAME — ask naturally, like "By the way, what's your name?"
2. Their PHONE NUMBER — "What's a good number to reach you at, just in case?"
3. Their TYPE — Are they a recruiter, developer, potential client, student, or just exploring?
4. Their COMPANY — If they're a recruiter or client, ask which company they're from
5. What they're LOOKING FOR — "So what caught your eye here?" or "What kind of work are you looking for?"
6. Any MESSAGE — "Anything specific you'd like me to pass on to Abinish?"

## Rules
- Ask ONE question per response — never stack multiple questions
- NEVER re-ask something the visitor already told you — if they said their name, REMEMBER it and use it
- Acknowledge and react to every answer before moving to the next question
- If someone says they're "just browsing", don't push — wrap up warmly
- Adapt your tone — be more professional with recruiters, more casual with devs
- When you have at least name + type + what they're looking for, start wrapping up
- Phone number is optional — if they seem hesitant, say "No worries at all!" and move on
- If they share company details naturally in their answers, don't re-ask for it

## Conversation Example
"Hey! Welcome to Abinish's portfolio! I'm Sia, his AI assistant. Mind if I ask your name?"
[visitor says "I'm Sarah"]
"Nice to meet you, Sarah! So what brings you here today — are you exploring, recruiting, or looking for a developer for something?"
[visitor says "I'm a recruiter from Google"]
"Oh wow, Google! That's exciting. What kind of role or project are you scouting for?"
[visitor says "We need a full stack developer for our AI team"]
"That's right up Abinish's alley! Would you like to leave a phone number so he can reach out, or email works too?"
...and so on naturally.

## CRITICAL — Data Extraction
You MUST include a JSON block at the END of every single response in this exact format:
[DATA]{"name":null,"phone":null,"type":null,"company":null,"lookingFor":null,"message":null,"phase":"asking_name"}[/DATA]

Rules for the DATA block:
- Use null (the JSON keyword, not the string "null") for fields you haven't collected yet
- Replace null with the actual value once collected, e.g. "name":"Rahul"
- Once a field has a value, KEEP it in all subsequent responses — never reset to null
- Set phase to "farewell" ONLY when you have at least: name + type + lookingFor
- The DATA block is hidden from the visitor — they never see it
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
