import dns from 'dns';

const DISPOSABLE_DOMAINS = new Set([
  'mailinator.com', 'guerrillamail.com', 'guerrillamail.net', 'guerrillamail.org',
  '10minutemail.com', 'tempmail.com', 'temp-mail.org', 'tempmail.net',
  'throwawaymail.com', 'yopmail.com', 'yopmail.fr', 'yopmail.net',
  'trashmail.com', 'trashmail.net', 'sharklasers.com', 'dispostable.com',
  'getnada.com', 'mohmal.com', 'inboxkitten.com', 'generator.email',
  'emailondeck.com', 'burnermail.io', 'mytemp.email', 'crazymailing.com',
  'maildrop.cc', 'dropmail.me', 'fakemailgenerator.com', 'fakeinbox.com',
  'nada.ltd', 'tempail.com', 'armyspy.com', 'cuvox.de', 'dayrep.com',
  'einrot.com', 'fleckens.hu', 'gustr.com', 'jourrapide.com', 'rhyta.com',
  'superrito.com', 'teleworm.us', 'crazymailing.com'
]);

const TRUSTED_DOMAINS = new Set([
  'gmail.com', 'yahoo.com', 'yahoo.co.in', 'outlook.com', 'hotmail.com',
  'icloud.com', 'live.com', 'proton.me', 'protonmail.com', 'zoho.com',
  'rediffmail.com', 'aol.com', 'gmx.com', 'yandex.com', 'msn.com'
]);

export async function validateRealEmail(email: string): Promise<{ valid: boolean; reason?: string }> {
  const cleanEmail = email.trim().toLowerCase();
  
  // 1. Basic format
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(cleanEmail)) {
    return { valid: false, reason: 'Invalid email format. Please provide a standard email address.' };
  }

  const parts = cleanEmail.split('@');
  if (parts.length !== 2) {
    return { valid: false, reason: 'Invalid email address structure.' };
  }

  const [localPart, domain] = parts;

  // 2. Reject obvious dummy test emails
  if (
    domain === 'test.com' ||
    domain === 'example.com' ||
    domain === 'fake.com' ||
    domain === 'asdf.com' ||
    localPart === 'test' ||
    localPart === 'fake' ||
    localPart === 'asdf'
  ) {
    return { valid: false, reason: 'Generic test/dummy emails are not allowed. Please enter your real email address.' };
  }

  // 3. Reject known disposable / burner domains
  if (DISPOSABLE_DOMAINS.has(domain)) {
    return { valid: false, reason: 'Disposable and temporary email addresses are not permitted. Please use your genuine business or personal email.' };
  }

  // 4. Fast-track trusted global providers
  if (TRUSTED_DOMAINS.has(domain)) {
    return { valid: true };
  }

  // 5. Check MX records for custom domain
  try {
    const mxRecords = await Promise.race([
      dns.promises.resolveMx(domain),
      new Promise<dns.MxRecord[]>((_, reject) => setTimeout(() => reject(new Error('DNS_TIMEOUT')), 2500))
    ]);

    if (!mxRecords || mxRecords.length === 0) {
      return { valid: false, reason: `The domain "${domain}" has no active mail server (MX records). Please provide an active, working email address.` };
    }

    return { valid: true };
  } catch (err: any) {
    if (err?.code === 'ENOTFOUND' || err?.code === 'NODATA' || err?.code === 'ENODATA') {
      return { valid: false, reason: `The email domain "${domain}" does not exist. Please check for spelling mistakes and provide a real email address.` };
    }
    // If DNS times out or temporary network glitch, allow standard domains but log warning
    return { valid: true };
  }
}
