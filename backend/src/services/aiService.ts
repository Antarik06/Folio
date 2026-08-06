import dotenv from 'dotenv'

dotenv.config()

const GEMINI_API_KEY = process.env.GOOGLE_AI_API_KEY
const PIXABAY_API_KEY = process.env.PIXABAY_API_KEY
const PEXELS_API_KEY = process.env.PEXELS_API_KEY

export const aiService = {
  /**
   * Prompts Gemini 1.5 Flash model with text and optional base64 image data
   */
  async askGemini(prompt: string, base64Image?: string, task?: string): Promise<string> {
    if (!GEMINI_API_KEY) {
      throw new Error('Gemini API key is not configured.')
    }

    let contents = []
    if (task === 'analyze-image' && base64Image) {
      contents = [
        {
          parts: [
            { text: prompt || 'Analyze this image for a photo album. Describe its mood, subjects, and suggest a caption.' },
            {
              inline_data: {
                mime_type: 'image/jpeg',
                data: base64Image,
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
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ contents }),
      }
    )

    const data = (await response.json()) as any
    if (!response.ok) {
      throw new Error(data.error?.message || 'Gemini API execution error')
    }

    return data.candidates?.[0]?.content?.parts?.[0]?.text || ''
  },

  /**
   * Searches Pixabay or Pexels for graphic elements
   */
  async searchGraphics(q: string, source: 'pixabay' | 'pexels', page = 1, perPage = 24, type = 'all'): Promise<any> {
    if (source === 'pixabay') {
      if (!PIXABAY_API_KEY) {
        throw new Error('Pixabay API key not configured.')
      }

      let imageType = 'all'
      if (type === 'vectors') imageType = 'vector'
      if (type === 'illustrations') imageType = 'illustration'
      if (type === 'photos') imageType = 'photo'

      const response = await fetch(
        `https://pixabay.com/api/?key=${PIXABAY_API_KEY}&q=${encodeURIComponent(q)}&image_type=${imageType}&page=${page}&per_page=${perPage}&safesearch=true&order=popular`
      )
      
      if (!response.ok) {
        throw new Error('Failed to fetch from Pixabay')
      }

      const data = (await response.json()) as any
      const hits = (data.hits || []).map((hit: any) => ({
        id: hit.id,
        source: 'pixabay',
        previewURL: hit.previewURL,
        largeURL: hit.webformatURL || hit.largeImageURL,
        width: hit.imageWidth,
        height: hit.imageHeight,
        tags: hit.tags,
        type: hit.type,
      }))

      return { hits, totalHits: data.totalHits || 0 }
    }

    if (source === 'pexels') {
      if (!PEXELS_API_KEY) {
        throw new Error('Pexels API key not configured.')
      }

      const response = await fetch(
        `https://api.pexels.com/v1/search?query=${encodeURIComponent(q)}&page=${page}&per_page=${perPage}`,
        {
          headers: {
            Authorization: PEXELS_API_KEY,
          },
        }
      )

      if (!response.ok) {
        throw new Error('Failed to fetch from Pexels')
      }

      const data = (await response.json()) as any
      const hits = (data.photos || []).map((photo: any) => ({
        id: photo.id,
        source: 'pexels',
        previewURL: photo.src.medium,
        largeURL: photo.src.large2x || photo.src.large,
        width: photo.width,
        height: photo.height,
        tags: photo.alt || 'Pexels Photo',
        type: 'photo',
      }))

      return { hits, totalHits: data.total_results || 0 }
    }

    throw new Error('Unsupported elements source.')
  }
}
