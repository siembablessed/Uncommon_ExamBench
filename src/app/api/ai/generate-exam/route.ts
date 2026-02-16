import { NextResponse } from 'next/server'
import OpenAI from 'openai'

// Initialize OpenAI lazily or check for key
const getOpenAI = () => {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) throw new Error('OpenAI API Key is missing')
  return new OpenAI({ apiKey })
}

export async function POST(req: Request) {
  try {
    const { text, topic } = await req.json()

    if (!text && !topic) {
      return NextResponse.json({ error: 'Please provide text content or a topic' }, { status: 400 })
    }

    let contextText = text || `Topic: ${topic}`

    // Limit text length
    if (contextText.length > 20000) {
      contextText = contextText.substring(0, 20000)
    }

    const prompt = `
      You are an expert exam creator. based on the following content, generate an exam with 5 multiple choice questions and 2 short answer questions.
      
      Content:
      ${contextText}

      Output ONLY valid JSON in the following format:
      {
        "title": "Exam Title based on content",
        "questions": [
          {
            "type": "multiple_choice",
            "question": "Question text",
            "options": ["A", "B", "C", "D"],
            "answer": "Correct Option"
          },
          {
             "type": "short_answer",
             "question": "Question text"
          }
        ]
      }
    `

    const openai = getOpenAI()
    const completion = await openai.chat.completions.create({
      messages: [{ role: "system", content: "You are a helpful assistant that generates exams in JSON." }, { role: "user", content: prompt }],
      model: "gpt-3.5-turbo",
      response_format: { type: "json_object" },
    })

    const result = JSON.parse(completion.choices[0].message.content || '{}')

    return NextResponse.json(result)

  } catch (error: any) {
    console.error('AI Generation Error:', error)
    return NextResponse.json({ error: error.message || 'Failed to generate exam' }, { status: 500 })
  }
}
