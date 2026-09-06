import { Resend } from "resend"

type SendInvitationInput = {
  to: string
  inviteUrl: string
  recipientName?: string | null
}

function getResendClient() {
  const apiKey =
    process.env.RESEND_API_KEY

  if (!apiKey) {
    throw new Error(
      "RESEND_API_KEY est manquant."
    )
  }

  return new Resend(apiKey)
}

export const EmailService = {
  async sendInvitation({
    to,
    inviteUrl,
    recipientName,
  }: SendInvitationInput) {
    const from =
      process.env.RESEND_FROM_EMAIL

    if (!from) {
      throw new Error(
        "RESEND_FROM_EMAIL est manquant."
      )
    }

    const resend =
      getResendClient()

    const name =
      recipientName?.trim() ||
      "utilisateur"

    const {
      data,
      error,
    } = await resend.emails.send({
      from,
      to,
      subject:
        "Votre invitation AGENTIS",

      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#0f172a;">
          <h2>Bienvenue sur AGENTIS</h2>

          <p>Bonjour ${name},</p>

          <p>
            Votre compte AGENTIS a été créé.
            Utilisez le bouton ci-dessous pour définir votre mot de passe et activer votre accès.
          </p>

          <p style="margin:32px 0;">
            <a
              href="${inviteUrl}"
              style="background:#f59e0b;color:#0f172a;padding:12px 20px;text-decoration:none;border-radius:8px;font-weight:bold;"
            >
              Activer mon compte
            </a>
          </p>

          <p>
            Si vous n’êtes pas à l’origine de cette demande,
            vous pouvez ignorer ce message.
          </p>
        </div>
      `,
    })

    if (error) {
      throw new Error(
        error.message ||
        "Impossible d’envoyer l’invitation."
      )
    }

    return data
  },
}

export default EmailService