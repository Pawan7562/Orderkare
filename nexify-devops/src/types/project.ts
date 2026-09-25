export type ProjectCategory = 'SAAS' | 'MOBILE_APP' | 'CRM' | 'AI_AUTOMATION' | 'ECOMMERCE' | 'FINTECH';
export type ProjectEnvironment = 'PRODUCTION' | 'STAGING' | 'DEVELOPMENT';
export type ProjectHealth = 'HEALTHY' | 'WARNING' | 'CRITICAL' | 'MAINTENANCE';
export type TaskPriority = 'P0_CRITICAL' | 'P1_HIGH' | 'P2_MEDIUM' | 'P3_LOW';
export type TaskStatus = 'BACKLOG' | 'IN_PROGRESS' | 'IN_REVIEW' | 'COMPLETED';
export type GitProvider = 'GITHUB' | 'GITLAB' | 'BITBUCKET' | 'CUSTOM_GIT';
export type DeployProvider = 'VERCEL' | 'RENDER' | 'CLOUDFLARE' | 'AWS' | 'DIGITALOCEAN' | 'GITHUB_ACTIONS' | 'CUSTOM';

export interface TaskItem {
  id: string;
  title: string;
  description: string;
  priority: TaskPriority;
  status: TaskStatus;
  assignee: string;
  assigneeAvatar?: string;
  dueDate: string;
  createdAt: string;
}

export interface DeploymentRecord {
  id: string;
  version: string;
  commitHash: string;
  commitMessage: string;
  author: string;
  status: 'SUCCESS' | 'FAILED' | 'BUILDING' | 'ROLLED_BACK';
  environment: ProjectEnvironment;
  deployProvider?: DeployProvider;
  branch?: string;
  deployHookUrl?: string;
  timestamp: string;
  durationSeconds: number;
}

export interface ProjectDoc {
  id: string;
  title: string;
  category: 'ARCHITECTURE' | 'API_SPEC' | 'RUNBOOK' | 'ONBOARDING' | 'INCIDENT';
  content: string;
  lastUpdated: string;
  author: string;
}

export interface ProjectSecret {
  id: string;
  key: string;
  value: string;
  masked: boolean;
  environment: ProjectEnvironment;
  description: string;
  updatedAt: string;
}

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: 'LEAD_ARCHITECT' | 'FRONTEND_DEV' | 'BACKEND_DEV' | 'DEVOPS_ENGINEER' | 'CLIENT_PM';
  avatar?: string;
}

export interface ClientProject {
  id: string;
  name: string;
  slug: string;
  category: ProjectCategory;
  clientOrgName: string;
  primaryContact: {
    name: string;
    email: string;
    phone: string;
  };
  slaTier: 'ENTERPRISE_PLATINUM' | 'GOLD_SLA' | 'STANDARD_SLA';
  monthlyFeeINR: number;
  environment: ProjectEnvironment;
  health: ProjectHealth;
  uptimePercent: number;
  latencyMs: number;
  liveUrl: string;
  repoUrl: string;
  gitProvider?: GitProvider;
  repoOwner?: string;
  repoName?: string;
  rootDirectory?: string;
  autoDeployOnPush?: boolean;
  framework: string;
  databaseEngine: string;
  paymentGateway: string;
  domains: string[];
  deployHookUrl?: string;
  deployProvider?: DeployProvider;
  defaultBranch?: string;
  tasks: TaskItem[];
  deployments: DeploymentRecord[];
  docs: ProjectDoc[];
  secrets: ProjectSecret[];
  team: TeamMember[];
  createdAt: string;
  updatedAt: string;
}


