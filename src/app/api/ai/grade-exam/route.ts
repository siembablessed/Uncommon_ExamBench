import { NextResponse } from 'next/server'
import OpenAI from 'openai'

const getOpenAI = () => {
    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) throw new Error('OpenAI API Key is missing')
    return new OpenAI({ apiKey })
}

export async function POST(req: Request) {
    try {
        const { question, studentAnswer, rubric } = await req.json()

        if (!question || !studentAnswer) {
            return NextResponse.json({ error: 'Missing question or answer' }, { status: 400 })
        }

        const prompt = `
      You are an expert teacher grading a student's answer.
      
      Question: "${question}"
      Rubric/Correct Answer Context: "${rubric || 'Grade based on accuracy and completeness.'}"
      Student Answer: "${studentAnswer}"

      Please provide:
      1. A grade from 0 to 100.
      2. Constructive feedback explaining the grade.

      Output JSON format:
      {
        "grade": 85,
        "feedback": "Good understanding of X, but missed Y."
      }
    `

        const openai = getOpenAI()
        const completion = await openai.chat.completions.create({
            messages: [{ role: "system", content: "You are a fair and constructive grader." }, { role: "user", content: prompt }],
            model: "gpt-3.5-turbo",
            response_format: { type: "json_object" },
        })

        const result = JSON.parse(completion.choices[0].message.content || '{}')

        return NextResponse.json(result)

    } catch (error: any) {
        console.error('AI Grading Error:', error)
        return NextResponse.json({ error: error.message || 'Failed to grade' }, { status: 500 })
    }
}
