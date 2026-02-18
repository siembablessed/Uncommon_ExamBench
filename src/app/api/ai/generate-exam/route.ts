import { NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

// Use require to avoid default import issues with pdf-parse in some environments
const pdf = require('pdf-parse')

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')

export async function POST(req: Request) {
  try {
    const contentType = req.headers.get('content-type') || ''

    let topic = ''
    let text = ''
    let count = 5
    let difficulty = 'medium'

    // Handle Multipart Form Data (File Upload)
    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData()
      topic = formData.get('topic') as string || ''
      count = parseInt(formData.get('count') as string) || 5
      difficulty = formData.get('difficulty') as string || 'medium'

      const file = formData.get('file') as File

      if (file) {
        try {
          const arrayBuffer = await file.arrayBuffer()
          const buffer = Buffer.from(arrayBuffer)
          const data = await pdf(buffer)
          text = data.text
        } catch (pdfError: any) {
          console.error('PDF Parse Error:', pdfError)
          return NextResponse.json(
            { error: 'Failed to parse PDF file on server: ' + pdfError.message },
            { status: 400 }
          )
        }
      }
    } else {
      // Handle JSON (Text/Topic only)
      const body = await req.json()
      topic = body.topic
      text = body.text
      count = body.count || 5
      difficulty = body.difficulty || 'medium'
    }

    if (!topic && !text) {
      return NextResponse.json(
        { error: 'Topic or PDF file is required' },
        { status: 400 }
      )
    }

    // Truncate text if too long (Gemini has high limits but good to be safe)
    const truncatedText = text ? text.substring(0, 30000) : ''

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })

    const prompt = `
        Generate ${count} multiple-choice questions for a ${difficulty} level exam about: "${topic || 'the provided document'}".
        ${truncatedText ? `\nContext from document:\n"${truncatedText}..."\n` : ''}

        Return ONLY a raw JSON array (no markdown formatting like \`\`\`json, no code blocks) with this specific structure:
        [
            {
                "id": "1",
                "text": "Question text here?",
                "options": ["Option A", "Option B", "Option C", "Option D"],
                "correctAnswer": "Option A",
                "points": 5
            }
        ]
        
        Ensure the JSON is valid and strict.
        `

    const result = await model.generateContent(prompt)
    const response = await result.response
    const content = response.text()

    let questions = []
    try {
      // Clean up if the model returned markdown
      let cleanContent = content.trim()

      // Remove markdown code blocks if present
      if (cleanContent.startsWith('```json')) {
        cleanContent = cleanContent.replace(/^```json\s*/, '').replace(/\s*```$/, '')
      } else if (cleanContent.startsWith('```')) {
        cleanContent = cleanContent.replace(/^```\s*/, '').replace(/\s*```$/, '')
      }

      questions = JSON.parse(cleanContent)
    } catch (e) {
      console.error('JSON Parse Error:', e)
      console.error('Raw Content:', content)
      return NextResponse.json(
        { error: 'Failed to parse AI response. The model might be overloaded.' },
        { status: 500 }
      )
    }

    return NextResponse.json({ questions })

  } catch (error: any) {
    console.error('AI Generation Error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500 }
    )
  }
}
