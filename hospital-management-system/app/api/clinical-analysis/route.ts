import { generateText } from "ai"

export async function POST(request: Request) {
  try {
    const { patientData, labResults, vitals, imaging } = await request.json()

    const { text } = await generateText({
      model: "openai/gpt-4-turbo",
      system: `You are an expert clinical decision support AI system for hospitals. Analyze patient data and provide evidence-based recommendations for critical conditions including sepsis, acute kidney injury, and cardiac deterioration. 
      
      Your analysis should:
      1. Calculate risk scores (0-100) based on clinical parameters
      2. Identify primary concerns with confidence levels
      3. Provide specific, actionable recommendations
      4. Reference clinical evidence and guidelines
      5. Flag critical findings requiring immediate intervention
      
      Format responses as structured JSON with risk assessment, recommendations, and confidence metrics.`,
      prompt: `Analyze this patient data and provide clinical decision support:
      
      Patient Data: ${JSON.stringify(patientData)}
      Lab Results: ${JSON.stringify(labResults)}
      Vital Signs: ${JSON.stringify(vitals)}
      Imaging: ${JSON.stringify(imaging)}
      
      Provide comprehensive risk assessment and clinical recommendations.`,
    })

    return Response.json({
      analysis: JSON.parse(text),
      timestamp: new Date().toISOString(),
      modelVersion: "v2.1",
    })
  } catch (error) {
    console.error("[v0] Clinical analysis error:", error)
    return Response.json({ error: "Analysis failed" }, { status: 500 })
  }
}
