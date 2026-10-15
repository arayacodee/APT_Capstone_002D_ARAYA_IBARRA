import { env } from '../config/env.js';
export const smsConfigured = () => Boolean(env.TWILIO_ACCOUNT_SID && env.TWILIO_AUTH_TOKEN && env.TWILIO_VERIFY_SERVICE_SID);
export class VerificationProviderError extends Error { constructor(public status: number) { super('SMS verification provider failed'); } }
async function verifyRequest(path: string, fields: Record<string, string>) {
  const response = await fetch(`https://verify.twilio.com/v2/Services/${env.TWILIO_VERIFY_SERVICE_SID}/${path}`, {
    method: 'POST', headers: { Authorization: `Basic ${Buffer.from(`${env.TWILIO_ACCOUNT_SID}:${env.TWILIO_AUTH_TOKEN}`).toString('base64')}`, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams(fields), signal: AbortSignal.timeout(10000)
  });
  if (!response.ok) throw new VerificationProviderError(response.status);
  return await response.json() as { sid: string; status: string; to: string };
}
export const startVerification = (phone: string) => verifyRequest('Verifications', { To: phone, Channel: 'sms', Locale: 'es' });
export const checkVerification = (sid: string, code: string) => verifyRequest('VerificationCheck', { VerificationSid: sid, Code: code });
