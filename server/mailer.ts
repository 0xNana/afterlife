/**
 * server/mailer.ts — Resend email templates for Afterlife notifications
 */

import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

const FROM = process.env.EMAIL_FROM ?? 'Afterlife <vault@afterlife.app>'
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://afterlife-gamma.vercel.app'

// ── Email templates ──────────────────────────────────────────────────────────

function vaultUrl(vaultId: string) {
  return `${APP_URL}/vault/${vaultId}`
}

function inheritancesUrl() {
  return `${APP_URL}/dashboard`
}

/** Sent to beneficiaries when a vault is first created naming them */
export async function sendRegistrationEmail(opts: {
  to: string
  beneficiaryAddress: string
  vaultId: string
  vaultName: string
  ownerAddress: string
  sharePercent: string
}) {
  const { to, vaultId, vaultName, ownerAddress, sharePercent } = opts
  return resend.emails.send({
    from: FROM,
    to,
    subject: `You've been added as a beneficiary to "${vaultName}"`,
    html: `
<div style="font-family:'DM Sans',Arial,sans-serif;max-width:560px;margin:0 auto;color:#122d45">
  <div style="background:#122d45;padding:24px 32px;border-radius:16px 16px 0 0">
    <h1 style="margin:0;color:#fff;font-size:22px;font-weight:700;letter-spacing:-0.03em">Afterlife</h1>
    <p style="margin:4px 0 0;color:rgba(255,255,255,0.6);font-size:13px">USDC Inheritance Vault</p>
  </div>
  <div style="background:#fffcf7;padding:32px;border:1px solid rgba(18,45,69,0.1);border-top:none;border-radius:0 0 16px 16px">
    <h2 style="margin:0 0 16px;font-size:18px;font-weight:700">You've been named as a beneficiary</h2>
    <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#334155">
      A vault named <strong>"${vaultName}"</strong> has been created on Afterlife naming you as a beneficiary
      with a <strong>${sharePercent}%</strong> share.
    </p>
    <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#334155">
      You don't need to do anything right now. If the vault owner stops checking in,
      you'll receive another email when you can claim your share.
    </p>
    <div style="background:rgba(18,45,69,0.05);border-radius:12px;padding:16px;margin-bottom:24px">
      <p style="margin:0 0 6px;font-size:12px;font-weight:600;color:#6b6580;text-transform:uppercase;letter-spacing:0.06em">Vault details</p>
      <p style="margin:0;font-size:13px;color:#122d45">Vault ID: #${vaultId}</p>
      <p style="margin:4px 0 0;font-size:13px;color:#122d45;font-family:'JetBrains Mono',monospace">Owner: ${ownerAddress.slice(0, 10)}…${ownerAddress.slice(-8)}</p>
      <p style="margin:4px 0 0;font-size:13px;color:#122d45">Your share: ${sharePercent}%</p>
    </div>
    <a href="${vaultUrl(vaultId)}" style="display:inline-block;background:#122d45;color:#fff;padding:12px 24px;border-radius:12px;text-decoration:none;font-size:14px;font-weight:600">View Vault</a>
    <p style="margin:24px 0 0;font-size:12px;color:#8a849c;line-height:1.6">
      Afterlife is early software that hasn't been independently audited. Only USDC in the vault is covered — this is not a legal will.
    </p>
  </div>
</div>`,
  })
}

/** Sent to beneficiaries when a vault is released (owner stopped checking in) */
export async function sendReleaseEmail(opts: {
  to: string
  vaultId: string
  vaultName: string
  sharePercent: string
  payoutUsdc: string
}) {
  const { to, vaultId, vaultName, sharePercent, payoutUsdc } = opts
  return resend.emails.send({
    from: FROM,
    to,
    subject: `Action required: "${vaultName}" vault has been released`,
    html: `
<div style="font-family:'DM Sans',Arial,sans-serif;max-width:560px;margin:0 auto;color:#122d45">
  <div style="background:#122d45;padding:24px 32px;border-radius:16px 16px 0 0">
    <h1 style="margin:0;color:#fff;font-size:22px;font-weight:700;letter-spacing:-0.03em">Afterlife</h1>
    <p style="margin:4px 0 0;color:rgba(255,255,255,0.6);font-size:13px">USDC Inheritance Vault</p>
  </div>
  <div style="background:#fffcf7;padding:32px;border:1px solid rgba(18,45,69,0.1);border-top:none;border-radius:0 0 16px 16px">
    <div style="background:rgba(26,128,71,0.08);border:1px solid rgba(26,128,71,0.2);border-radius:12px;padding:16px;margin-bottom:24px">
      <p style="margin:0;font-size:14px;font-weight:600;color:#1a8047">A vault has been released and your share is ready to claim.</p>
    </div>
    <h2 style="margin:0 0 16px;font-size:18px;font-weight:700">Your inheritance is available</h2>
    <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#334155">
      The vault <strong>"${vaultName}"</strong> (#{vaultId}) was released because the owner
      stopped checking in. Your <strong>${sharePercent}%</strong> share — approximately
      <strong>${payoutUsdc} USDC</strong> — is ready to claim.
    </p>
    <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#334155">
      Anyone can also press <strong>"Pay Everyone"</strong> to send all beneficiaries their share
      in one transaction — you don't need to do anything yourself.
    </p>
    <a href="${vaultUrl(vaultId)}" style="display:inline-block;background:#1a8047;color:#fff;padding:12px 24px;border-radius:12px;text-decoration:none;font-size:14px;font-weight:600">Claim Your Share →</a>
    <p style="margin:16px 0 0">
      <a href="${inheritancesUrl()}" style="font-size:13px;color:#6b6580">View all your inheritances</a>
    </p>
    <p style="margin:24px 0 0;font-size:12px;color:#8a849c;line-height:1.6">
      On Arc, network fees are paid in USDC — you don't need any other token to claim.
    </p>
  </div>
</div>`,
  })
}

/** Sent to owner ~24 h before their deadline (warning) */
export async function sendDeadlineWarningEmail(opts: {
  to: string
  vaultId: string
  vaultName: string
  hoursLeft: number
  appUrl?: string
}) {
  const { to, vaultId, vaultName, hoursLeft } = opts
  return resend.emails.send({
    from: FROM,
    to,
    subject: `Reminder: "${vaultName}" check-in due in ${hoursLeft}h`,
    html: `
<div style="font-family:'DM Sans',Arial,sans-serif;max-width:560px;margin:0 auto;color:#122d45">
  <div style="background:#122d45;padding:24px 32px;border-radius:16px 16px 0 0">
    <h1 style="margin:0;color:#fff;font-size:22px;font-weight:700;letter-spacing:-0.03em">Afterlife</h1>
    <p style="margin:4px 0 0;color:rgba(255,255,255,0.6);font-size:13px">USDC Inheritance Vault</p>
  </div>
  <div style="background:#fffcf7;padding:32px;border:1px solid rgba(18,45,69,0.1);border-top:none;border-radius:0 0 16px 16px">
    <div style="background:rgba(186,43,76,0.07);border:1px solid rgba(186,43,76,0.18);border-radius:12px;padding:16px;margin-bottom:24px">
      <p style="margin:0;font-size:14px;font-weight:600;color:#ba2b4c">Your vault expires in approximately ${hoursLeft} hours.</p>
    </div>
    <h2 style="margin:0 0 16px;font-size:18px;font-weight:700">Time to check in</h2>
    <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#334155">
      Your vault <strong>"${vaultName}"</strong> (#{vaultId}) will become eligible for release
      in about <strong>${hoursLeft} hours</strong> unless you check in.
      Press "I'm Alive" in the app to reset the clock.
    </p>
    <a href="${vaultUrl(vaultId)}" style="display:inline-block;background:#122d45;color:#fff;padding:12px 24px;border-radius:12px;text-decoration:none;font-size:14px;font-weight:600">Check In Now →</a>
  </div>
</div>`,
  })
}
