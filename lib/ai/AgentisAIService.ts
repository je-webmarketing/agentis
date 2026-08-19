import "server-only"
import OpenAI from "openai"

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export const AgentisAIService = {
  async testConnection(): Promise<string> {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error(
        "OPENAI_API_KEY est manquante."
      )
    }

    const response =
      await openai.responses.create({
        model: "gpt-5-mini",
        input: `
Tu es AGENTIS, un assistant RH professionnel.

Réponds uniquement en français.
Réponds en une seule phrase courte.

Message :
La connexion entre AGENTIS et OpenAI fonctionne.
        `.trim(),
      })

    return response.output_text
  },
}

export default AgentisAIService