import { generateText } from "ai"

export async function POST(request: Request) {
  try {
    const { invoices, claims, accounts } = await request.json()

    const { text } = await generateText({
      model: "openai/gpt-4-turbo",
      prompt: `You are an AI billing optimization expert for a hospital. Analyze the following billing data and provide specific recommendations:

Invoices: ${JSON.stringify(invoices)}
Claims: ${JSON.stringify(claims)}
Accounts Receivable: ${JSON.stringify(accounts)}

Provide:
1. Revenue optimization strategies
2. Claim processing improvements
3. Collection recommendations
4. Fraud detection insights
5. Cost reduction opportunities

Format as JSON with actionable recommendations.`,
    })

    return Response.json({
      success: true,
      recommendations: JSON.parse(text),
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    return Response.json({ error: "Failed to generate billing optimization recommendations" }, { status: 500 })
  }
}
