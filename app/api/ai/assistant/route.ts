import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const { prompt, image, task } = await request.json()
  const apiKey = process.env.GOOGLE_AI_API_KEY

  if (!apiKey) {
    return NextResponse.json({ error: 'AI API key not configured' }, { status: 500 })
  }

  try {
    let contents = []

    if (task === 'analyze-image' && image) {
      // image is expected to be a base64 string (without prefix)
      contents = [
        {
          parts: [
            { text: prompt || 'Analyze this image for a photo album. Describe its mood, subjects, and suggest a caption.' },
            {
              inline_data: {
                mime_type: 'image/jpeg',
                data: image,
              },
            },
          ],
        },
      ]
    } else {
      contents = [
        {
          parts: [{ text: prompt }],
        },
      ]
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ contents }),
      }
    )

    const data = await response.json()
    
    if (!response.ok) {
      return NextResponse.json({ error: data.error?.message || 'Gemini API error' }, { status: response.status })
    }

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || ''
    return NextResponse.json({ result: text })
  } catch (error) {
    console.error('AI Assistant error:', error)
    return NextResponse.json({ error: 'Failed to process AI request' }, { status: 500 })
  }
}
