import { DeployProvider } from '../types/project';

/**
 * Returns the default platform domain for a deployment provider.
 * e.g. Vercel -> [slug].vercel.app, Render -> [slug].onrender.com
 */
export const getProviderDefaultDomain = (
  provider: DeployProvider | string | undefined,
  slug: string,
  owner?: string
): string => {
  const cleanSlug = (slug || 'my-app').toLowerCase().replace(/[^a-z0-9-]/g, '-');
  const cleanOwner = (owner || 'pawan7562').toLowerCase().replace(/[^a-z0-9-]/g, '-');

  switch (provider) {
    case 'VERCEL':
      return `${cleanSlug}.vercel.app`;
    case 'RENDER':
      return `${cleanSlug}.onrender.com`;
    case 'CLOUDFLARE':
      return `${cleanSlug}.pages.dev`;
    case 'AWS':
      return `${cleanSlug}.elasticbeanstalk.com`;
    case 'DIGITALOCEAN':
      return `${cleanSlug}.ondigitalocean.app`;
    case 'GITHUB_ACTIONS':
      return `${cleanOwner}.github.io/${cleanSlug}`;
    default:
      return `${cleanSlug}.vercel.app`;
  }
};

/**
 * Returns the full HTTPS URL of the platform's default domain.
 */
export const getProviderDefaultUrl = (
  provider: DeployProvider | string | undefined,
  slug: string,
  owner?: string
): string => {
  const domain = getProviderDefaultDomain(provider, slug, owner);
  return `https://${domain}`;
};

/**
 * Checks if a given domain string is a custom client domain or a platform default domain.
 */
export const isCustomDomain = (domain: string): boolean => {
  const clean = (domain || '').trim().toLowerCase();
  if (!clean) return false;
  if (
    clean.endsWith('.vercel.app') ||
    clean.endsWith('.onrender.com') ||
    clean.endsWith('.pages.dev') ||
    clean.endsWith('.ondigitalocean.app') ||
    clean.endsWith('.elasticbeanstalk.com') ||
    clean.endsWith('.github.io') ||
    clean.endsWith('.nexifyforge.com')
  ) {
    return false;
  }
  return true;
};

/**
 * Returns DNS instructions and CNAME target for connecting a custom domain to a provider.
 */
export const getProviderDnsInstruction = (
  provider: DeployProvider | string | undefined
): { cnameTarget: string; providerName: string; ipA: string } => {
  switch (provider) {
    case 'VERCEL':
      return {
        providerName: 'Vercel Edge Network',
        cnameTarget: 'cname.vercel-dns.com',
        ipA: '76.76.21.21',
      };
    case 'RENDER':
      return {
        providerName: 'Render Cloud Platform',
        cnameTarget: 'srv-ingress.onrender.com',
        ipA: '216.24.57.1',
      };
    case 'CLOUDFLARE':
      return {
        providerName: 'Cloudflare Pages & Workers',
        cnameTarget: 'cname.cloudflarepages.com',
        ipA: '198.41.0.4',
      };
    case 'AWS':
      return {
        providerName: 'AWS Route 53 / Elastic Beanstalk',
        cnameTarget: 'dualstack.elb.amazonaws.com',
        ipA: '52.95.255.1',
      };
    case 'DIGITALOCEAN':
      return {
        providerName: 'DigitalOcean App Platform',
        cnameTarget: 'app-ingress.ondigitalocean.app',
        ipA: '159.89.0.1',
      };
    default:
      return {
        providerName: 'Vercel Edge Network',
        cnameTarget: 'cname.vercel-dns.com',
        ipA: '76.76.21.21',
      };
  }
};

/**
 * Normalizes any URL with http/https prefix and resolves default provider domain if empty.
 */
export const formatLiveUrl = (
  rawUrl: string | undefined,
  slug?: string,
  provider?: DeployProvider | string,
  owner?: string
): string => {
  let clean = (rawUrl || '').trim();

  // If no URL is provided, fall back to platform's default domain
  if (!clean) {
    if (slug) {
      return getProviderDefaultUrl(provider, slug, owner);
    }
    return 'https://orderkare.vercel.app';
  }

  // Handle localhost
  if (clean.startsWith('localhost:') || clean.startsWith('127.0.0.1:')) {
    return `http://${clean}`;
  }

  // Ensure protocol
  if (!clean.startsWith('http://') && !clean.startsWith('https://')) {
    return `https://${clean}`;
  }

  return clean;
};

/**
 * Resolves the effective active URL:
 * - If user configured localhost or custom domain, uses it.
 * - Otherwise defaults to platform domain (e.g. slug.vercel.app).
 */
export const resolveEffectiveProjectUrl = (project: {
  liveUrl?: string;
  domains?: string[];
  slug: string;
  deployProvider?: DeployProvider | string;
  repoOwner?: string;
}): string => {
  const defaultPlatformUrl = getProviderDefaultUrl(
    project.deployProvider,
    project.slug,
    project.repoOwner
  );

  // If project has custom domains listed, check if the first one is custom
  const customDomains = (project.domains || []).filter(isCustomDomain);
  if (customDomains.length > 0) {
    const primaryCustom = customDomains[0];
    return formatLiveUrl(primaryCustom);
  }

  // If liveUrl was manually customized to a custom domain or localhost, use it
  if (project.liveUrl && (isCustomDomain(project.liveUrl) || project.liveUrl.includes('localhost'))) {
    return formatLiveUrl(project.liveUrl);
  }

  // Default to provider platform domain
  return defaultPlatformUrl;
};
