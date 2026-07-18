/**
 * Emails the donor a magic link to open the Stripe Billing Portal, where
 * they can update their card, cancel their subscription, or view past
 * invoices. Fire-and-forget from POST /api/donations/manage-request.
 *
 * Required env vars:
 *   - RESEND_API_KEY
 *   - NOTIFICATION_FROM_EMAIL
 *   - EMAIL_LOGO_URL           (optional)
 *   - DONATION_MANAGE_SECRET   (or NEXTAUTH_SECRET) — for token signing
 */

import { Resend } from 'resend'

interface SendManageLinkArgs {
  to: string
  managePortalUrl: string
  /** ISO expiry so the email can say "expires in 1 hour". */
  expiresAt: Date
}

function getResend(): Resend {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) throw new Error('RESEND_API_KEY is not set')
  return new Resend(apiKey)
}

function getFromAddress(): string {
  return (
    process.env.NOTIFICATION_FROM_EMAIL ??
    'RCCG Glory Tabernacle, Barnstaple <onboarding@resend.dev>'
  )
}

function getLogoUrl(): string {
  return (
    process.env.EMAIL_LOGO_URL ??
    'https://res.cloudinary.com/deckwmsth/image/upload/v1778753747/yu.jpg_u3yacx.jpg'
  )
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

export async function sendManageLink(
  args: SendManageLinkArgs
): Promise<{ ok: boolean; detail: string }> {
  try {
    const resend = getResend()
    const url = escapeHtml(args.managePortalUrl)
    const logoUrl = escapeHtml(getLogoUrl())
    const expiryMinutes = Math.round(
      (args.expiresAt.getTime() - Date.now()) / 60000
    )

    const html = `<!DOCTYPE html>
<html>
  <head><meta charset="utf-8" /><title>Manage your monthly gift</title></head>
  <body style="margin:0;padding:0;background:#f6f6f6;font-family:Arial,sans-serif;color:#1a1a1a;">
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="padding:24px 0;">
      <tr><td align="center">
        <table role="presentation" cellpadding="0" cellspacing="0" width="600" style="max-width:600px;background:#ffffff;border-radius:12px;overflow:hidden;">
          <tr>
            <td align="center" style="padding:32px 32px 16px 32px;background:rgba(0,6,102,1);">
              <img src="${logoUrl}" alt="" width="64" height="64" style="display:block;border-radius:12px;border:0;" />
              <p style="margin:14px 0 4px 0;font-size:11px;font-weight:bold;letter-spacing:0.22em;color:rgba(163,246,156,1);text-transform:uppercase;">Manage your monthly gift</p>
            </td>
          </tr>
          <tr>
            <td style="padding:32px 32px 8px 32px;">
              <p style="margin:0 0 16px 0;font-size:14px;line-height:1.7;color:#555;">Hi,</p>
              <p style="margin:0 0 24px 0;font-size:14px;line-height:1.7;color:#555;">
                Tap the button below to open your secure billing portal. From there you can update your card, view past receipts, or cancel your monthly gift at any time.
              </p>
              <p style="margin:0 0 24px 0;">
                <a href="${url}" style="display:inline-block;padding:14px 26px;background:rgba(0,6,102,1);color:#ffffff;text-decoration:none;border-radius:8px;font-weight:bold;font-size:14px;">Open my billing portal</a>
              </p>
              <p style="margin:0 0 24px 0;font-size:12px;line-height:1.6;color:#999;">
                For your security this link expires in ${expiryMinutes} minute${expiryMinutes === 1 ? '' : 's'}. If you didn&rsquo;t request this email, you can safely ignore it.
              </p>
              <p style="margin:0 0 8px 0;font-size:14px;line-height:1.5;color:#555;">In Christ,</p>
              <p style="margin:0 0 2px 0;font-size:14px;line-height:1.4;color:rgba(27,34,119,1);font-weight:bold;">Seye and Tolu Adebayo</p>
              <p style="margin:0 0 24px 0;font-size:14px;line-height:1.4;color:rgba(27,34,119,1);font-weight:bold;">Lead Pastors, RCCG Glory Tabernacle, Barnstaple</p>
              <p style="margin:0;font-size:12px;line-height:1.6;color:#999;border-top:1px solid #eee;padding-top:16px;">
                You&rsquo;re receiving this because someone requested a manage-gift link for this email address. If it wasn&rsquo;t you, no action is needed.
              </p>
            </td>
          </tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>`

    const text = [
      'Hi,',
      '',
      'Tap the link below to open your secure billing portal:',
      args.managePortalUrl,
      '',
      `For your security this link expires in ${expiryMinutes} minute${
        expiryMinutes === 1 ? '' : 's'
      }.`,
      '',
      'If you didn’t request this email, you can safely ignore it.',
      '',
      'In Christ,',
      'Seye and Tolu Adebayo',
      'Lead Pastors, RCCG Glory Tabernacle, Barnstaple',
    ].join('\n')

    const { data, error } = await resend.emails.send({
      from: getFromAddress(),
      to: args.to,
      subject: 'Manage your monthly gift — RCCG Glory Tabernacle',
      html,
      text,
    })
    if (error) {
      return { ok: false, detail: error.message ?? 'Unknown Resend error' }
    }
    return { ok: true, detail: data?.id ?? '(no id)' }
  } catch (err) {
    return {
      ok: false,
      detail: err instanceof Error ? err.message : 'Unknown error',
    }
  }
}
