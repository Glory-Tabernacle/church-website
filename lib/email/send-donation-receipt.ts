/**
 * Donation receipt email — sent to the donor after Stripe confirms a
 * successful payment. Fire-and-forget from the webhook handler.
 *
 * Required env vars:
 *   - RESEND_API_KEY
 *   - NOTIFICATION_FROM_EMAIL
 *   - EMAIL_LOGO_URL              (optional)
 */

import { Resend } from 'resend'
import type { Donation } from '@prisma/client'
import {
  DONATION_TYPE_META,
  formatPence,
  formatReceiptNumber,
} from '@/lib/types/donation'

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

function formatDate(d: Date): string {
  return d.toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export async function sendDonationReceipt(
  donation: Donation
): Promise<{ ok: boolean; detail: string }> {
  try {
    const resend = getResend()
    const receiptId = formatReceiptNumber(donation.receiptNumber)
    const amountLabel = formatPence(
      donation.amountPence,
      donation.currency.toUpperCase()
    )
    const meta = DONATION_TYPE_META[donation.giftType]
    const paidOn = formatDate(donation.paidAt ?? new Date())
    const safeFirstName = escapeHtml(donation.firstName)
    const fullName = escapeHtml(`${donation.firstName} ${donation.lastName}`)
    const safeAmount = escapeHtml(amountLabel)
    const safeReceiptId = escapeHtml(receiptId)
    const safeGiftType = escapeHtml(meta.label)
    const safeNote = donation.note ? escapeHtml(donation.note) : null

    const giftAidLine = donation.giftAidClaimed
      ? `<p style="margin:16px 0 0 0;font-size:13px;line-height:1.6;color:#555;">
           You confirmed that you are a UK taxpayer and would like Gift Aid to be added to this gift. Every £1 you give becomes £1.25 to the church at no extra cost to you.
         </p>`
      : ''

    // For monthly recurring gifts, add a "Manage your gift" link so
    // donors can update card / cancel without emailing the church.
    const siteUrl = (
      process.env.SITE_URL ??
      process.env.NEXT_PUBLIC_SITE_URL ??
      process.env.NEXTAUTH_URL ??
      'https://www.glorytabernacle.co.uk'
    )
      .replace(/\/+$/, '')
      .replace(/^https:\/\/glorytabernacle\.co\.uk/, 'https://www.glorytabernacle.co.uk')
    const manageUrl = `${siteUrl}/giving/manage`
    const manageBlock = donation.giftType === 'MONTHLY'
      ? `<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin:16px 0 0 0;background:#eef7ee;border:1px solid #cce4cc;border-radius:8px;">
           <tr><td style="padding:14px 18px;font-size:13px;line-height:1.6;color:#333;">
             Your monthly gift is now active. You can update your card, view past receipts, or cancel any time from your <a href="${escapeHtml(manageUrl)}" style="color:rgb(27,109,36);font-weight:bold;text-decoration:underline;">secure billing portal</a>.
           </td></tr>
         </table>`
      : ''

    const html = `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>Thank you for your gift — receipt ${safeReceiptId}</title>
  </head>
  <body style="margin:0;padding:0;background:#f6f6f6;font-family:Arial,sans-serif;color:#1a1a1a;">
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="padding:24px 0;">
      <tr><td align="center">
        <table role="presentation" cellpadding="0" cellspacing="0" width="600" style="max-width:600px;background:#ffffff;border-radius:12px;overflow:hidden;">
          <tr>
            <td align="center" style="padding:32px 32px 16px 32px;background:rgba(0,6,102,1);">
              <img src="${escapeHtml(getLogoUrl())}" alt="RCCG Glory Tabernacle" width="64" height="64" style="display:block;border-radius:12px;border:0;" />
              <p style="margin:14px 0 4px 0;font-size:11px;font-weight:bold;letter-spacing:0.22em;color:rgba(163,246,156,1);text-transform:uppercase;">Gift received</p>
              <p style="margin:0;font-size:22px;font-weight:bold;color:#ffffff;font-family:Georgia,serif;">Thank you, ${safeFirstName}</p>
            </td>
          </tr>
          <tr>
            <td style="padding:32px 32px 8px 32px;">
              <p style="margin:0 0 8px 0;font-size:12px;font-weight:bold;letter-spacing:0.15em;text-transform:uppercase;color:rgb(27,109,36);">Receipt</p>
              <h1 style="margin:0 0 16px 0;font-size:26px;line-height:1.25;color:rgba(27,34,119,1);">${safeAmount}</h1>
              <p style="margin:0 0 16px 0;font-size:14px;line-height:1.7;color:#555;">Hi ${fullName},</p>
              <p style="margin:0 0 24px 0;font-size:14px;line-height:1.7;color:#555;">
                We&rsquo;ve received your ${safeGiftType.toLowerCase()} of <strong>${safeAmount}</strong>. Thank you for your generosity — you&rsquo;re helping build the Tabernacle in Barnstaple.
              </p>

              <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin:0 0 24px 0;background:#f4f7ff;border:1px solid #dde3f2;border-radius:8px;">
                <tr>
                  <td style="padding:16px 20px;font-size:13px;line-height:1.7;color:#333;">
                    <p style="margin:0 0 4px 0;font-size:11px;font-weight:bold;letter-spacing:0.15em;text-transform:uppercase;color:rgba(27,34,119,1);">Receipt number</p>
                    <p style="margin:0 0 12px 0;font-family:'Courier New',monospace;font-size:16px;font-weight:bold;color:rgba(27,34,119,1);">${safeReceiptId}</p>
                    <p style="margin:0;font-size:12px;color:#666;">Gift type: <strong>${safeGiftType}</strong> &middot; Received: <strong>${escapeHtml(paidOn)}</strong></p>
                  </td>
                </tr>
              </table>

              ${safeNote ? `<blockquote style="margin:0 0 24px 0;padding:14px 18px;border-left:3px solid rgb(27,109,36);background:#f9fdf6;font-size:13px;color:#333;">Your note: &ldquo;${safeNote}&rdquo;</blockquote>` : ''}

              ${giftAidLine}
              ${manageBlock}

              <p style="margin:32px 0 8px 0;font-size:14px;line-height:1.5;color:#555;">In Christ,</p>
              <p style="margin:0 0 2px 0;font-size:14px;line-height:1.4;color:rgba(27,34,119,1);font-weight:bold;">Seye and Tolu Adebayo</p>
              <p style="margin:0 0 24px 0;font-size:14px;line-height:1.4;color:rgba(27,34,119,1);font-weight:bold;">Lead Pastors, RCCG Glory Tabernacle, Barnstaple</p>

              <p style="margin:0;font-size:12px;line-height:1.6;color:#999;border-top:1px solid #eee;padding-top:16px;">
                This receipt confirms your gift for your records. If you have any questions, reply to this email.
              </p>
            </td>
          </tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>`

    const text = [
      `Thank you, ${donation.firstName}!`,
      '',
      `Gift received: ${amountLabel}`,
      `Receipt: ${receiptId}`,
      `Type: ${meta.label}`,
      `Received on: ${paidOn}`,
      donation.note ? `Your note: "${donation.note}"` : '',
      donation.giftAidClaimed
        ? 'Gift Aid: You confirmed you are a UK taxpayer and Gift Aid can be added to this gift.'
        : '',
      donation.giftType === 'MONTHLY'
        ? `Manage or cancel your monthly gift any time: ${manageUrl}`
        : '',
      '',
      'Thank you for your generosity.',
      '',
      'In Christ,',
      'Seye and Tolu Adebayo',
      'Lead Pastors, RCCG Glory Tabernacle, Barnstaple',
    ]
      .filter(Boolean)
      .join('\n')

    const { data, error } = await resend.emails.send({
      from: getFromAddress(),
      to: donation.email,
      subject: `Thank you for your gift — ${amountLabel} (${receiptId})`,
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
