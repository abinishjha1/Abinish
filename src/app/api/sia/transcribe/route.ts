import { NextRequest, NextResponse } from 'next/server';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

export async function POST(request: NextRequest) {
  try {
    if (!OPENAI_API_KEY || OPENAI_API_KEY === 'your_openai_api_key_here') {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      );
    }

    const formData = await request.formData();
    const audioFile = formData.get('audio') as File;

    if (!audioFile) {
      return NextResponse.json(
        { error: 'No audio file provided' },
        { status: 400 }
      );
    }

    // Send to OpenAI Whisper API
    const whisperFormData = new FormData();
    whisperFormData.append('file', audioFile, 'audio.webm');
    whisperFormData.append('model', 'whisper-1');
    whisperFormData.append('language', 'en');
    // Vocabulary hint — helps Whisper understand context-specific words
    whisperFormData.append(
      'prompt',
      'This is a conversation on a portfolio website. Common words: recruiter, developer, client, student, freelance, hiring, project, company, portfolio, Abinish, full stack, AI, React, Next.js, web developer, frontend, backend, engineer, internship, collaboration, opportunity'
    );

    const response = await fetch(
      'https://api.openai.com/v1/audio/transcriptions',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${OPENAI_API_KEY}`,
        },
        body: whisperFormData,
      }
    );

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Whisper API error:', errorData);
      return NextResponse.json(
        { error: 'Transcription failed' },
        { status: 500 }
      );
    }

    const data = await response.json();

    return NextResponse.json({
      text: data.text || '',
    });
  } catch (error) {
    console.error('Transcribe API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
