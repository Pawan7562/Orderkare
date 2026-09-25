// Live GitHub API Client for Real Repository Fetching & Commit Telemetry

export interface GitHubRepoItem {
  id: number;
  name: string;
  full_name: string;
  private: boolean;
  html_url: string;
  description: string | null;
  default_branch: string;
  language: string | null;
  stargazers_count: number;
  forks_count: number;
  updated_at: string;
  owner: {
    login: string;
    avatar_url: string;
  };
}

export interface GitHubCommitItem {
  sha: string;
  commit: {
    message: string;
    author: {
      name: string;
      email: string;
      date: string;
    };
  };
  html_url: string;
}

export interface GitHubBranchItem {
  name: string;
  commit: {
    sha: string;
  };
}

export interface DetectedStack {
  framework: string;
  database: string;
  paymentGateway: string;
  recommendedDeploy: 'VERCEL' | 'RENDER' | 'CLOUDFLARE' | 'AWS' | 'DIGITALOCEAN';
  category: 'SAAS' | 'AI_AUTOMATION' | 'MOBILE_APP' | 'CRM' | 'ECOMMERCE' | 'FINTECH';
}

class GitHubService {
  private getHeaders(token?: string) {
    const headers: Record<string, string> = {
      Accept: 'application/vnd.github.v3+json',
    };
    const activeToken = token || localStorage.getItem('nexify_github_token');
    if (activeToken) {
      headers.Authorization = `Bearer ${activeToken.trim()}`;
    }
    return headers;
  }

  /**
   * Fetch repositories for a user or organization
   */
  async fetchUserOrOrgRepos(account: string, token?: string): Promise<{ repos: GitHubRepoItem[]; error?: string }> {
    const cleanAccount = account.trim();
    if (!cleanAccount) return { repos: [], error: 'Please enter a GitHub username or organization name.' };

    try {
      // 1. Try user repos
      const userRes = await fetch(`https://api.github.com/users/${encodeURIComponent(cleanAccount)}/repos?sort=updated&per_page=40`, {
        headers: this.getHeaders(token),
      });

      if (userRes.ok) {
        const data: GitHubRepoItem[] = await userRes.json();
        return { repos: data };
      }

      // 2. If 404, try organization repos
      if (userRes.status === 404) {
        const orgRes = await fetch(`https://api.github.com/orgs/${encodeURIComponent(cleanAccount)}/repos?sort=updated&per_page=40`, {
          headers: this.getHeaders(token),
        });

        if (orgRes.ok) {
          const data: GitHubRepoItem[] = await orgRes.json();
          return { repos: data };
        }
      }

      const errJson = await userRes.json().catch(() => ({}));
      return {
        repos: [],
        error: errJson.message || `GitHub returned HTTP ${userRes.status}: Unable to find user or organization '${cleanAccount}'`,
      };
    } catch (err: any) {
      return {
        repos: [],
        error: err.message || 'Network error connecting to GitHub API. Please check your internet connection.',
      };
    }
  }

  /**
   * Fetch single repository details by full name (owner/repo)
   */
  async fetchRepoDetails(owner: string, repo: string, token?: string): Promise<{ repo?: GitHubRepoItem; error?: string }> {
    try {
      const res = await fetch(`https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`, {
        headers: this.getHeaders(token),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        return { error: errJson.message || `Failed to fetch repo ${owner}/${repo}` };
      }

      const data: GitHubRepoItem = await res.json();
      return { repo: data };
    } catch (err: any) {
      return { error: err.message };
    }
  }

  /**
   * Fetch branches for a repository
   */
  async fetchBranches(owner: string, repo: string, token?: string): Promise<string[]> {
    try {
      const res = await fetch(`https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/branches?per_page=20`, {
        headers: this.getHeaders(token),
      });
      if (res.ok) {
        const data: GitHubBranchItem[] = await res.json();
        return data.map((b) => b.name);
      }
    } catch (e) {
      console.warn('Failed to fetch branches:', e);
    }
    return ['main', 'master'];
  }

  /**
   * Fetch latest commits for a repository
   */
  async fetchLatestCommits(owner: string, repo: string, branch?: string, token?: string): Promise<GitHubCommitItem[]> {
    try {
      const branchParam = branch ? `&sha=${encodeURIComponent(branch)}` : '';
      const res = await fetch(
        `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/commits?per_page=10${branchParam}`,
        {
          headers: this.getHeaders(token),
        }
      );
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      console.warn('Failed to fetch commits:', e);
    }
    return [];
  }

  /**
   * Inspect package.json or repository contents to auto-detect tech stack
   */
  async detectRepositoryStack(owner: string, repo: string, branch = 'main', token?: string): Promise<DetectedStack> {
    const defaultStack: DetectedStack = {
      framework: 'React / Node.js Express',
      database: 'PostgreSQL 16 (Neon / RDS)',
      paymentGateway: 'Razorpay Live (India UPI & Cards)',
      recommendedDeploy: 'RENDER',
      category: 'SAAS',
    };

    try {
      const res = await fetch(
        `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/contents/package.json?ref=${encodeURIComponent(branch)}`,
        {
          headers: this.getHeaders(token),
        }
      );

      if (res.ok) {
        const data = await res.json();
        if (data.content) {
          const rawJson = atob(data.content.replace(/\s/g, ''));
          const pkg = JSON.parse(rawJson);
          const allDeps = {
            ...(pkg.dependencies || {}),
            ...(pkg.devDependencies || {}),
          };

          const hasNext = 'next' in allDeps;
          const hasReact = 'react' in allDeps;
          const hasExpress = 'express' in allDeps;
          const hasSocketIo = 'socket.io' in allDeps || 'socket.io-client' in allDeps;
          const hasPrisma = 'prisma' in allDeps || '@prisma/client' in allDeps;
          const hasPg = 'pg' in allDeps || 'postgres' in allDeps || '@neondatabase/serverless' in allDeps;
          const hasFastApi = 'fastapi' in allDeps;

          if (hasNext) {
            return {
              framework: `Next.js ${pkg.dependencies?.next?.replace('^', '') || '15'} (App Router)`,
              database: hasPrisma || hasPg ? 'PostgreSQL 16 (Neon Serverless)' : 'PostgreSQL 16',
              paymentGateway: 'Razorpay Live / Stripe Global',
              recommendedDeploy: 'VERCEL',
              category: repo.toLowerCase().includes('exam') || repo.toLowerCase().includes('ai') ? 'AI_AUTOMATION' : 'SAAS',
            };
          }

          if (hasReact && (hasExpress || hasSocketIo)) {
            return {
              framework: `React ${pkg.dependencies?.react?.replace('^', '') || '19'} + Node.js Express + Socket.IO`,
              database: 'PostgreSQL 16 (Neon Serverless)',
              paymentGateway: 'Razorpay Live (India UPI & Cards)',
              recommendedDeploy: 'RENDER',
              category: repo.toLowerCase().includes('order') || repo.toLowerCase().includes('food') ? 'SAAS' : 'SAAS',
            };
          }

          if (hasReact) {
            return {
              framework: `React ${pkg.dependencies?.react?.replace('^', '') || '19'} (Vite SPA)`,
              database: 'PostgreSQL 16 (Serverless)',
              paymentGateway: 'Razorpay Live',
              recommendedDeploy: 'CLOUDFLARE',
              category: 'SAAS',
            };
          }
        }
      }
    } catch (e) {
      console.warn('Package.json inspection skipped:', e);
    }

    // Heuristics based on repo name
    const lower = repo.toLowerCase();
    if (lower.includes('exam') || lower.includes('proctor')) {
      return {
        framework: 'Next.js 15 / WebRTC AI Video Stream / Python FastAPI',
        database: 'PostgreSQL 16 (Neon Exam Isolation DB)',
        paymentGateway: 'Razorpay Live (Assessment UPI)',
        recommendedDeploy: 'VERCEL',
        category: 'AI_AUTOMATION',
      };
    }

    if (lower.includes('order') || lower.includes('kare')) {
      return {
        framework: 'React 19 / Node.js Express / Socket.IO',
        database: 'PostgreSQL 16 (Neon Serverless)',
        paymentGateway: 'Razorpay Live (India UPI & Cards)',
        recommendedDeploy: 'RENDER',
        category: 'SAAS',
      };
    }

    return defaultStack;
  }
}

export const githubService = new GitHubService();
