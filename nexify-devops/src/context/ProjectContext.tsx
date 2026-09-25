import React, { createContext, useContext, useState, useEffect } from 'react';
import { ClientProject, TaskItem, DeploymentRecord, ProjectSecret, ProjectDoc } from '../types/project';

const INITIAL_PROJECTS: ClientProject[] = [
  {
    id: 'proj_pkthenexgenexam',
    name: 'PK The NexGen Exam Monitoring System',
    slug: 'pkthenexgenexam',
    category: 'AI_AUTOMATION',
    clientOrgName: 'PK The NexGen Education & Exam Labs',
    primaryContact: {
      name: 'Pawan Kumar / Exam Operations',
      email: 'admin@pkthenexgenexam.xyz',
      phone: '+91 98765 43210',
    },
    slaTier: 'ENTERPRISE_PLATINUM',
    monthlyFeeINR: 65000,
    environment: 'PRODUCTION',
    health: 'HEALTHY',
    uptimePercent: 99.98,
    latencyMs: 24,
    liveUrl: 'https://www.pkthenexgenexam.xyz/',
    repoUrl: 'https://github.com/nexifyforge/pkthenexgenexam',
    framework: 'Next.js 15 / WebRTC AI Video Stream / Python FastAPI Anti-Cheat',
    databaseEngine: 'PostgreSQL 16 (Neon Exam Isolation DB)',
    paymentGateway: 'Razorpay Live (Student Assessment Fee UPI)',
    domains: ['www.pkthenexgenexam.xyz', 'pkthenexgenexam.xyz'],
    deployProvider: 'VERCEL',
    deployHookUrl: 'https://api.vercel.com/v1/integrations/deploy/prj_pkthenexgenexam/live99',
    tasks: [
      {
        id: 'tsk_exam_01',
        title: 'AI Proctoring WebRTC Face Gaze & Multiple Person Detection',
        description: 'Deploy real-time OpenCV / MediaPipe vision model to flag unauthorized devices and second person in frame.',
        priority: 'P0_CRITICAL',
        status: 'COMPLETED',
        assignee: 'Lead Architect',
        dueDate: '2026-09-20',
        createdAt: '2026-09-18',
      },
      {
        id: 'tsk_exam_02',
        title: 'Secure Fullscreen Browser Lockdown & Tab Switch Prevention Trigger',
        description: 'Automatically revoke student exam tokens if unauthorized windows or copy-paste shortcuts are triggered.',
        priority: 'P1_HIGH',
        status: 'IN_PROGRESS',
        assignee: 'Frontend Dev',
        dueDate: '2026-09-26',
        createdAt: '2026-09-19',
      },
      {
        id: 'tsk_exam_03',
        title: 'Low-latency Video Frame WebSocket Buffering for Live Invigilator Grid',
        description: 'Stream 15 FPS compressed WebRTC video feeds to examiner multi-camera monitoring dashboard.',
        priority: 'P1_HIGH',
        status: 'IN_PROGRESS',
        assignee: 'Backend Engineer',
        dueDate: '2026-10-02',
        createdAt: '2026-09-19',
      },
    ],
    deployments: [
      {
        id: 'dep_exam_01',
        version: 'v3.1.0',
        commitHash: 'e49a1bc',
        commitMessage: 'release: AI face posture anti-cheat detection and real-time audio anomaly warning',
        author: 'Lead Architect',
        status: 'SUCCESS',
        environment: 'PRODUCTION',
        timestamp: '2026-09-20 01:40:00',
        durationSeconds: 45,
      },
      {
        id: 'dep_exam_02',
        version: 'v3.0.4',
        commitHash: '811f20d',
        commitMessage: 'fix: high-concurrency exam question paper batch shuffling algorithm',
        author: 'Backend Dev',
        status: 'SUCCESS',
        environment: 'PRODUCTION',
        timestamp: '2026-09-19 18:30:00',
        durationSeconds: 36,
      },
    ],
    docs: [
      {
        id: 'doc_exam_01',
        title: 'NexGen Exam System Architecture & WebRTC AI Protocol',
        category: 'ARCHITECTURE',
        content: '# PK The NexGen Exam Monitoring Architecture\n\n- **Live Exam Portal**: https://www.pkthenexgenexam.xyz/\n- **Frontend**: Next.js 15 App Router + TailwindCSS + WebRTC MediaStream API.\n- **AI Proctoring Engine**: Python FastAPI + OpenCV + MediaPipe face mesh gaze tracking.\n- **Database**: PostgreSQL 16 Neon Serverless (Dedicated Exam Session Schema).\n- **Invigilation WebSocket**: Socket.IO binary video frame dispatcher running at 60 FPS sub-second latency.',
        lastUpdated: '2026-09-20',
        author: 'Lead Architect',
      },
      {
        id: 'doc_exam_02',
        title: 'High-Concurrency Exam Session Recovery Runbook',
        category: 'RUNBOOK',
        content: '### Exam Session Recovery Runbook\n1. If a student network drops, local encrypted IndexedDB autosaves answers every 5 seconds.\n2. Reconnects seamlessly upon network restoration with cryptographic token validation.\n3. Invigilator dashboard flags any network discontinuity anomaly.',
        lastUpdated: '2026-09-19',
        author: 'DevOps Lead',
      },
    ],
    secrets: [
      {
        id: 'sec_exam_01',
        key: 'DATABASE_URL',
        value: 'postgresql://pk_exam_owner:exam_secure_pass991@ep-exam-pool.ap-south-1.aws.neon.tech/pk_nexgen_exam?sslmode=require',
        masked: true,
        environment: 'PRODUCTION',
        description: 'PostgreSQL 16 Neon Isolated Exam Database',
        updatedAt: '2026-09-20',
      },
      {
        id: 'sec_exam_02',
        key: 'WEBRTC_TURN_SECRET',
        value: 'turn_live_pkthenexgenexam_secret_998811',
        masked: true,
        environment: 'PRODUCTION',
        description: 'WebRTC Coturn STUN/TURN streaming credentials',
        updatedAt: '2026-09-20',
      },
      {
        id: 'sec_exam_03',
        key: 'RAZORPAY_KEY_ID',
        value: 'rzp_live_ExamFees991823',
        masked: false,
        environment: 'PRODUCTION',
        description: 'Razorpay Live Merchant Public Key for Assessment Fees',
        updatedAt: '2026-09-20',
      },
    ],
    team: [
      { id: 'tm_1', name: 'Lead Architect', email: 'dev@nexifyforge.com', role: 'LEAD_ARCHITECT' },
      { id: 'tm_2', name: 'AI Vision Engineer', email: 'ai@nexifyforge.com', role: 'BACKEND_DEV' },
      { id: 'tm_3', name: 'Frontend Engineer', email: 'frontend@nexifyforge.com', role: 'FRONTEND_DEV' },
    ],
    createdAt: '2026-09-01',
    updatedAt: '2026-09-20',
  },
  {
    id: 'proj_orderkare',
    name: 'OrderKare Dining & QR SaaS',
    slug: 'orderkare',
    category: 'SAAS',
    clientOrgName: 'OrderKare Technologies Pvt Ltd',
    primaryContact: {
      name: 'Pawan Kumar',
      email: 'admin@orderkare.com',
      phone: '+91 98765 43210',
    },
    slaTier: 'ENTERPRISE_PLATINUM',
    monthlyFeeINR: 45000,
    environment: 'PRODUCTION',
    health: 'HEALTHY',
    uptimePercent: 99.99,
    latencyMs: 28,
    liveUrl: 'https://orderkare.co.in',
    repoUrl: 'https://github.com/Pawan7562/Orderkare',
    framework: 'React 19 / Node.js Express / Socket.IO',
    databaseEngine: 'PostgreSQL 16 (Neon Serverless)',
    paymentGateway: 'Razorpay Live (India UPI & Cards)',
    domains: ['orderkare.co.in', 'www.orderkare.co.in'],
    deployProvider: 'RENDER',
    deployHookUrl: 'https://api.render.com/deploy/srv-c0rderkare991?key=live_secret_key',
    tasks: [
      {
        id: 'tsk_01',
        title: 'Complete single Razorpay automated payment flow integration',
        description: 'Remove manual UPI and streamline automated Razorpay checkout modal with live signature verification.',
        priority: 'P0_CRITICAL',
        status: 'COMPLETED',
        assignee: 'Lead Architect',
        dueDate: '2026-09-20',
        createdAt: '2026-09-18',
      },
      {
        id: 'tsk_02',
        title: 'Optimize kitchen audio soundbox WebSocket dispatcher',
        description: 'Ensure low-latency socket ringtones on high-concurrency order placements.',
        priority: 'P1_HIGH',
        status: 'IN_PROGRESS',
        assignee: 'Backend Engineer',
        dueDate: '2026-09-25',
        createdAt: '2026-09-19',
      },
    ],
    deployments: [
      {
        id: 'dep_01',
        version: 'v2.4.1',
        commitHash: '7e45e90',
        commitMessage: 'feat: add standalone Razorpay single checkout & super admin metrics sync',
        author: 'Lead Architect',
        status: 'SUCCESS',
        environment: 'PRODUCTION',
        timestamp: '2026-09-20 01:25:00',
        durationSeconds: 42,
      },
    ],
    docs: [
      {
        id: 'doc_01',
        title: 'System Architecture & WebSocket Flow',
        category: 'ARCHITECTURE',
        content: '# OrderKare Architecture\n\n- **Frontend**: Vite + React 19 SPA hosted on Render / Cloudflare.\n- **Backend**: Node.js Express + Socket.IO mounted at `/api/v1`.\n- **Database**: PostgreSQL 16 hosted on Neon Serverless with connection pooling.\n- **Payments**: Razorpay Live SDK with automated HMAC signature verification webhook.',
        lastUpdated: '2026-09-20',
        author: 'Lead Architect',
      },
    ],
    secrets: [
      {
        id: 'sec_01',
        key: 'DATABASE_URL',
        value: 'postgresql://neondb_owner:npg_gN6u1e@ep-dry-bar-a10j191r.ap-southeast-1.aws.neon.tech/neondb?sslmode=require',
        masked: true,
        environment: 'PRODUCTION',
        description: 'Neon Serverless PostgreSQL connection string',
        updatedAt: '2026-09-19',
      },
      {
        id: 'sec_02',
        key: 'RAZORPAY_KEY_ID',
        value: 'rzp_live_TdrBHnxTmMFIVX',
        masked: false,
        environment: 'PRODUCTION',
        description: 'Razorpay Live Merchant Public Key',
        updatedAt: '2026-09-19',
      },
    ],
    team: [
      { id: 'tm_1', name: 'Lead Architect', email: 'dev@nexifyforge.com', role: 'LEAD_ARCHITECT' },
      { id: 'tm_2', name: 'Frontend Engineer', email: 'frontend@nexifyforge.com', role: 'FRONTEND_DEV' },
    ],
    createdAt: '2026-08-01',
    updatedAt: '2026-09-20',
  },
  {
    id: 'proj_nexus_crm',
    name: 'Nexus Enterprise Multi-Tenant CRM',
    slug: 'nexus-crm',
    category: 'CRM',
    clientOrgName: 'Nexus Global Solutions Inc',
    primaryContact: {
      name: 'Sarah Jenkins',
      email: 'ops@nexuscrm.io',
      phone: '+1 (555) 349-2019',
    },
    slaTier: 'GOLD_SLA',
    monthlyFeeINR: 65000,
    environment: 'STAGING',
    health: 'HEALTHY',
    uptimePercent: 99.40,
    latencyMs: 55,
    liveUrl: 'https://crm-staging.nexifyforge.com',
    repoUrl: 'https://github.com/nexifyforge/crm-portal',
    framework: 'Next.js 15 / TypeScript / Prisma',
    databaseEngine: 'PostgreSQL 16 (Nexus Dedicated)',
    paymentGateway: 'Stripe Global (USD/EUR)',
    domains: ['crm-staging.nexifyforge.com'],
    tasks: [],
    deployments: [],
    docs: [],
    secrets: [],
    team: [
      { id: 'tm_1', name: 'Lead Architect', email: 'dev@nexifyforge.com', role: 'LEAD_ARCHITECT' },
    ],
    createdAt: '2026-08-15',
    updatedAt: '2026-09-19',
  },
  {
    id: 'proj_swiftdrop',
    name: 'SwiftDrop Courier & Hyperlocal Logistics',
    slug: 'swiftdrop',
    category: 'MOBILE_APP',
    clientOrgName: 'SwiftDrop Express Logistics India',
    primaryContact: {
      name: 'Rohan Mehra',
      email: 'tech@swiftdrop.in',
      phone: '+91 99887 76655',
    },
    slaTier: 'ENTERPRISE_PLATINUM',
    monthlyFeeINR: 85000,
    environment: 'PRODUCTION',
    health: 'HEALTHY',
    uptimePercent: 99.95,
    latencyMs: 34,
    liveUrl: 'https://swiftdrop.in',
    repoUrl: 'https://github.com/nexifyforge/swiftdrop-mobile',
    framework: 'Flutter (iOS/Android) / Go / Redis Geohash',
    databaseEngine: 'PostgreSQL 16 + Redis 7',
    paymentGateway: 'Razorpay + Cashfree',
    domains: ['swiftdrop.in', 'api.swiftdrop.in'],
    tasks: [],
    deployments: [],
    docs: [],
    secrets: [],
    team: [
      { id: 'tm_1', name: 'Lead Architect', email: 'dev@nexifyforge.com', role: 'LEAD_ARCHITECT' },
    ],
    createdAt: '2026-07-10',
    updatedAt: '2026-09-18',
  },
];

interface ProjectContextType {
  projects: ClientProject[];
  selectedProjectId: string;
  selectedProject: ClientProject | null;
  setSelectedProjectId: (id: string) => void;
  addProject: (project: Omit<ClientProject, 'id' | 'createdAt' | 'updatedAt' | 'tasks' | 'deployments' | 'docs' | 'secrets' | 'team'>) => ClientProject;
  updateProject: (id: string, updates: Partial<ClientProject>) => void;
  deleteProject: (id: string) => void;
  addTask: (projectId: string, task: Omit<TaskItem, 'id' | 'createdAt'>) => void;
  updateTaskStatus: (projectId: string, taskId: string, status: TaskItem['status']) => void;
  addDeployment: (projectId: string, deploy: Omit<DeploymentRecord, 'id' | 'timestamp'>) => void;
  addSecret: (projectId: string, secret: Omit<ProjectSecret, 'id' | 'updatedAt'>) => void;
  deleteSecret: (projectId: string, secretId: string) => void;
  deleteDeployment: (projectId: string, deploymentId: string) => void;
  addDoc: (projectId: string, doc: Omit<ProjectDoc, 'id' | 'lastUpdated'>) => void;
  addDomain: (projectId: string, domain: string) => void;
  removeDomain: (projectId: string, domain: string) => void;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export const ProjectProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [projects, setProjects] = useState<ClientProject[]>(() => {
    const saved = localStorage.getItem('nexify_devops_projects');
    if (saved) {
      try {
        const parsed: ClientProject[] = JSON.parse(saved);
        // Ensure initial core projects like PK The NexGen Exam are merged in if missing
        const existingIds = new Set(parsed.map((p) => p.id));
        const merged = [...parsed];
        for (const initProj of INITIAL_PROJECTS) {
          if (!existingIds.has(initProj.id)) {
            merged.unshift(initProj);
          }
        }
        return merged;
      } catch (e) {
        console.error('Failed to parse saved projects:', e);
      }
    }
    return INITIAL_PROJECTS;
  });

  const [selectedProjectId, setSelectedProjectId] = useState<string>('all');

  useEffect(() => {
    localStorage.setItem('nexify_devops_projects', JSON.stringify(projects));
  }, [projects]);

  const selectedProject = projects.find((p) => p.id === selectedProjectId) || null;

  const addProject = (projectData: Omit<ClientProject, 'id' | 'createdAt' | 'updatedAt' | 'tasks' | 'deployments' | 'docs' | 'secrets' | 'team'>): ClientProject => {
    const newProject: ClientProject = {
      ...projectData,
      id: `proj_${projectData.slug || Date.now()}`,
      tasks: [],
      deployments: [
        {
          id: `dep_${Date.now()}`,
          version: 'v1.0.0',
          commitHash: 'init001',
          commitMessage: 'Initial project registration into Nexify DevOps',
          author: 'Lead Architect',
          status: 'SUCCESS',
          environment: projectData.environment,
          timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
          durationSeconds: 30,
        }
      ],
      docs: [
        {
          id: `doc_${Date.now()}`,
          title: 'Project Architecture & Setup Runbook',
          category: 'ARCHITECTURE',
          content: `# ${projectData.name}\n\nClient Organization: ${projectData.clientOrgName}\nFramework: ${projectData.framework}\nDatabase: ${projectData.databaseEngine}`,
          lastUpdated: new Date().toISOString().slice(0, 10),
          author: 'Lead Architect',
        }
      ],
      secrets: [],
      team: [
        { id: 'tm_1', name: 'Lead Architect', email: 'dev@nexifyforge.com', role: 'LEAD_ARCHITECT' }
      ],
      createdAt: new Date().toISOString().slice(0, 10),
      updatedAt: new Date().toISOString().slice(0, 10),
    };

    setProjects((prev) => [newProject, ...prev]);
    return newProject;
  };

  const updateProject = (id: string, updates: Partial<ClientProject>) => {
    setProjects((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...updates, updatedAt: new Date().toISOString().slice(0, 10) } : p))
    );
  };

  const deleteProject = (id: string) => {
    setProjects((prev) => prev.filter((p) => p.id !== id));
    if (selectedProjectId === id) {
      setSelectedProjectId('all');
    }
  };

  const addTask = (projectId: string, task: Omit<TaskItem, 'id' | 'createdAt'>) => {
    const newTask: TaskItem = {
      ...task,
      id: `tsk_${Date.now()}`,
      createdAt: new Date().toISOString().slice(0, 10),
    };
    setProjects((prev) =>
      prev.map((p) => (p.id === projectId ? { ...p, tasks: [newTask, ...p.tasks] } : p))
    );
  };

  const updateTaskStatus = (projectId: string, taskId: string, status: TaskItem['status']) => {
    setProjects((prev) =>
      prev.map((p) =>
        p.id === projectId
          ? {
              ...p,
              tasks: p.tasks.map((t) => (t.id === taskId ? { ...t, status } : t)),
            }
          : p
      )
    );
  };

  const addDeployment = (projectId: string, deploy: Omit<DeploymentRecord, 'id' | 'timestamp'>) => {
    const newDeploy: DeploymentRecord = {
      ...deploy,
      id: `dep_${Date.now()}`,
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
    };
    setProjects((prev) =>
      prev.map((p) =>
        p.id === projectId
          ? {
              ...p,
              health: 'HEALTHY',
              updatedAt: new Date().toISOString().slice(0, 10),
              deployments: [newDeploy, ...p.deployments],
            }
          : p
      )
    );
  };

  const deleteDeployment = (projectId: string, deploymentId: string) => {
    setProjects((prev) =>
      prev.map((p) =>
        p.id === projectId
          ? { ...p, deployments: p.deployments.filter((d) => d.id !== deploymentId) }
          : p
      )
    );
  };

  const addSecret = (projectId: string, secret: Omit<ProjectSecret, 'id' | 'updatedAt'>) => {
    const newSecret: ProjectSecret = {
      ...secret,
      id: `sec_${Date.now()}`,
      updatedAt: new Date().toISOString().slice(0, 10),
    };
    setProjects((prev) =>
      prev.map((p) => (p.id === projectId ? { ...p, secrets: [...p.secrets, newSecret] } : p))
    );
  };

  const deleteSecret = (projectId: string, secretId: string) => {
    setProjects((prev) =>
      prev.map((p) =>
        p.id === projectId ? { ...p, secrets: p.secrets.filter((s) => s.id !== secretId) } : p
      )
    );
  };

  const addDoc = (projectId: string, doc: Omit<ProjectDoc, 'id' | 'lastUpdated'>) => {
    const newDoc: ProjectDoc = {
      ...doc,
      id: `doc_${Date.now()}`,
      lastUpdated: new Date().toISOString().slice(0, 10),
    };
    setProjects((prev) =>
      prev.map((p) => (p.id === projectId ? { ...p, docs: [...p.docs, newDoc] } : p))
    );
  };

  const addDomain = (projectId: string, domain: string) => {
    const cleanDomain = domain.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/$/, '');
    if (!cleanDomain) return;
    setProjects((prev) =>
      prev.map((p) =>
        p.id === projectId
          ? {
              ...p,
              domains: p.domains.includes(cleanDomain) ? p.domains : [...p.domains, cleanDomain],
              liveUrl: p.liveUrl.includes('localhost') ? p.liveUrl : `https://${cleanDomain}`,
            }
          : p
      )
    );
  };

  const removeDomain = (projectId: string, domain: string) => {
    setProjects((prev) =>
      prev.map((p) => {
        if (p.id !== projectId) return p;
        const newDomains = p.domains.filter((d) => d !== domain);
        return {
          ...p,
          domains: newDomains,
        };
      })
    );
  };

  return (
    <ProjectContext.Provider
      value={{
        projects,
        selectedProjectId,
        selectedProject,
        setSelectedProjectId,
        addProject,
        updateProject,
        deleteProject,
        addTask,
        updateTaskStatus,
        addDeployment,
        deleteDeployment,
        addSecret,
        deleteSecret,
        addDoc,
        addDomain,
        removeDomain,
      }}
    >
      {children}
    </ProjectContext.Provider>
  );
};

export const useProjects = () => {
  const context = useContext(ProjectContext);
  if (!context) {
    throw new Error('useProjects must be used within a ProjectProvider');
  }
  return context;
};
