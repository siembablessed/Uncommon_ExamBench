import { NextResponse } from 'next/server'

// Use require to avoid default import issues with pdf-parse
// @ts-ignore
const pdf = require('pdf-parse')

export async function POST(req: Request) {
    try {
        const formData = await req.formData()
        const file = formData.get('file') as File
        const answersFile = formData.get('answersFile') as File | null

        if (!file) {
            return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })
        }

        // 1. Parse Question File
        let text = ''
        try {
            const arrayBuffer = await file.arrayBuffer()
            const buffer = Buffer.from(arrayBuffer)
            const data = await pdf(buffer)
            text = data.text
        } catch (pdfError: any) {
            console.error('PDF Parse Error:', pdfError)
            return NextResponse.json(
                { error: 'Failed to parse PDF file content: ' + pdfError.message },
                { status: 400 }
            )
        }

        // 2. Parse Answers File (if provided)
        let answersText = ''
        if (answersFile) {
            try {
                const arrayBuffer = await answersFile.arrayBuffer()
                const buffer = Buffer.from(arrayBuffer)
                const data = await pdf(buffer)
                answersText = data.text
            } catch (pdfError: any) {
                console.error('Answers PDF Parse Error:', pdfError)
                // Proceed without converting failure to error, just warn
            }
        }

        // --- Question Parsing Logic (Regex) ---

        const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0)

        const questions: any[] = []
        let currentQuestion: any = null

        // Patterns we support:
        const questionPattern = /^(\d+)[\.)]\s*(.+)/
        const optionPattern = /^[\(]?([a-zA-Z])[\.\)]\s*(.+)/
        const answerPattern = /^(?:Answer|Ans|Correct)\s*:\s*([a-zA-Z])/i

        for (const line of lines) {
            // Check for Question start
            const qMatch = line.match(questionPattern)
            if (qMatch) {
                // Save previous question if exists
                if (currentQuestion) {
                    questions.push(currentQuestion)
                }
                // Start new question
                currentQuestion = {
                    id: Date.now().toString() + Math.random().toString(),
                    text: qMatch[2],
                    options: [],
                    correctAnswer: '',
                    points: 5,
                    originalIndex: parseInt(qMatch[1]) // Store for mapping
                }
                continue
            }

            // Check for Option
            const oMatch = line.match(optionPattern)
            if (oMatch && currentQuestion) {
                currentQuestion.options.push(oMatch[2])
                continue
            }

            // Check for Answer Key (Inline)
            const aMatch = line.match(answerPattern)
            if (aMatch && currentQuestion) {
                const answerLetter = aMatch[1].toUpperCase()
                const index = answerLetter.charCodeAt(0) - 65
                if (index >= 0 && index < currentQuestion.options.length) {
                    currentQuestion.correctAnswer = currentQuestion.options[index]
                }
            }

            // Continuation text
            if (currentQuestion && !oMatch && !aMatch && currentQuestion.options.length === 0) {
                currentQuestion.text += ' ' + line
            }
        }

        // Push last question
        if (currentQuestion) {
            questions.push(currentQuestion)
        }

        // --- 3. Process Answer File (External Marking Scheme) ---
        if (answersText) {
            const answerLines = answersText.split(/\r?\n|;|,/).map(l => l.trim())

            // Patterns: "1. A", "1 A", "1-A", "1: A"
            const explicitAnswerPattern = /^(\d+)[\.\-\:\s]+([a-zA-Z])$/i

            answerLines.forEach(line => {
                const match = line.match(explicitAnswerPattern)
                if (match) {
                    const qNum = parseInt(match[1])
                    const ansChar = match[2].toUpperCase()
                    const ansIndex = ansChar.charCodeAt(0) - 65

                    // Find corresponding question by originalIndex
                    // (Assuming 1-based indexing in PDF matches parsed order roughly, 
                    // but safer to use the captured number)
                    const targetQ = questions.find(q => q.originalIndex === qNum)
                    if (targetQ && ansIndex >= 0 && ansIndex < targetQ.options.length) {
                        targetQ.correctAnswer = targetQ.options[ansIndex]
                    }
                }
            })
        }

        // Post-processing cleanup
        questions.forEach(q => {
            // Remove meta fields
            delete q.originalIndex
        })

        if (questions.length === 0) {
            return NextResponse.json({
                error: 'Could not detect any questions. Ensure format is: "1. Question... A) Option..."'
            }, { status: 400 })
        }

        return NextResponse.json({ questions })

    } catch (error: any) {
        console.error('Import Error:', error)
        return NextResponse.json(
            { error: error.message || 'Internal Server Error' },
            { status: 500 }
        )
    }
}
