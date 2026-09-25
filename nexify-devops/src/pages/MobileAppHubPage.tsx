import React, { useState, useMemo } from 'react';
import {
  Smartphone,
  Check,
  Save,
  RotateCcw,
  AlertCircle,
  Shield,
  CheckCircle2,
  Radio,
  Activity,
  Layers,
  Sparkles,
  Zap,
  Download,
  Printer,
  ChevronRight,
  ExternalLink,
  SlidersHorizontal,
  RefreshCw,
  Plus,
  Trash2,
  Play,
  Eye,
  X,
  Code,
  Lock,
  Globe,
  Boxes,
  Send,
  AlertTriangle,
  Award,
  Terminal,
  Key,
  QrCode,
  Share2,
  Cpu,
  Wifi,
  Battery,
  Flame,
  FileCheck,
  Copy,
  Clock,
  Fingerprint
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export interface MobileAppDefinition {
  id: string;
  name: string;
  bundleId: string;
  platform: 'UNIVERSAL' | 'ANDROID' | 'IOS';
  category: string;
  framework: 'REACT_NATIVE_HERMES' | 'FLUTTER_AOT' | 'NATIVE_KOTLIN_SWIFT' | 'EXPO_EAS';
  activeInstalls: number;
  crashFreeRate: string;
  anrRate: string;
  dailyActiveSessions: number;
  android: {
    latestVersion: string;
    latestBuildNumber: number;
    minSupportedVersion: string;
    targetSdk: number;
    minSdk: number;
    forceUpdate: boolean;
    stagedRolloutPercent: number;
    updateUrl: string;
    updateTitle: string;
    updateMessage: string;
    packageName: string;
    sha256Fingerprint: string;
  };
  ios: {
    latestVersion: string;
    latestBuildNumber: number;
    minSupportedVersion: string;
    targetIosVersion: string;
    forceUpdate: boolean;
    stagedRolloutPercent: number;
    updateUrl: string;
    updateTitle: string;
    updateMessage: string;
    appStoreId: string;
    teamId: string;
  };
  flags: {
    key: string;
    name: string;
    description: string;
    type: 'BOOLEAN' | 'PERCENTAGE' | 'STRING' | 'JSON';
    value: boolean | number | string;
    rolloutPercent: number;
    category: 'PERFORMANCE' | 'BILLING' | 'HARDWARE' | 'SECURITY' | 'AI_ENGINE';
    targetRule: string;
  }[];
  otaReleases: {
    id: string;
    bundleVersion: string;
    targetBinaryVersion: string;
    channel: 'PRODUCTION' | 'STAGING' | 'NIGHTLY_CANARY';
    releaseDate: string;
    sizeKb: number;
    rollout: number;
    status: 'ACTIVE' | 'SUPERSEDED' | 'ROLLBACK';
    isMandatory: boolean;
    hash: string;
    author: string;
    changelog: string;
  }[];
  certificates: {
    type: 'ANDROID_JKS' | 'APPLE_DISTRIBUTION' | 'APPLE_APNS_P8' | 'FIREBASE_FCM_V1';
    name: string;
    fingerprintOrKeyId: string;
    expiresAt: string;
    status: 'VALID' | 'WARNING_EXPIRING' | 'REVOKED';
  }[];
  deepLinks: {
    scheme: string;
    host: string;
    sampleRoute: string;
    purpose: string;
  }[];
}

const INITIAL_APPS: MobileAppDefinition[] = [
  {
    id: 'app_orderkare_staff',
    name: 'OrderKare Waiter & Staff POS',
    bundleId: 'com.orderkare.staff.pos',
    platform: 'UNIVERSAL',
    category: 'RESTAURANT_POS',
    framework: 'REACT_NATIVE_HERMES',
    activeInstalls: 12450,
    crashFreeRate: '99.96%',
    anrRate: '0.01%',
    dailyActiveSessions: 84300,
    android: {
      latestVersion: '1.4.2',
      latestBuildNumber: 842,
      minSupportedVersion: '1.2.0',
      targetSdk: 34,
      minSdk: 26,
      forceUpdate: false,
      stagedRolloutPercent: 100,
      updateUrl: 'https://play.google.com/store/apps/details?id=com.orderkare.staff.pos',
      updateTitle: 'Kitchen Soundbox & Table Billing Upgrade',
      updateMessage: 'Added high-speed Bluetooth ESC/POS thermal receipt printing, instant acoustic soundbox UPI sync, and ultra-fast offline menu caching.',
      packageName: 'com.orderkare.staff.pos',
      sha256Fingerprint: '94:E1:8B:2A:43:F6:19:D2:7C:AA:05:81:49:EE:10:98:71:3B:55:0C:6D:FE:84:12:00:81:2F:5D:89:14:BC:7E'
    },
    ios: {
      latestVersion: '1.4.2',
      latestBuildNumber: 842,
      minSupportedVersion: '1.2.0',
      targetIosVersion: '15.0+',
      forceUpdate: false,
      stagedRolloutPercent: 100,
      updateUrl: 'https://apps.apple.com/app/orderkare-staff-pos/id1982837465',
      updateTitle: 'OrderKare Staff POS 1.4.2 Released',
      updateMessage: 'Native iPad split-screen kitchen display mode and biometric TouchID / FaceID waiter authentication for bill voids and settlements.',
      appStoreId: '1982837465',
      teamId: 'NXF882910P'
    },
    flags: [
      {
        key: 'enableSoundboxSync',
        name: 'Acoustic Soundbox Instant Audio Sync',
        description: 'Emits instant Hindi & English acoustic voice confirmations on successful dynamic UPI dining settlements.',
        type: 'BOOLEAN',
        value: true,
        rolloutPercent: 100,
        category: 'BILLING',
        targetRule: 'All Restaurant Captains'
      },
      {
        key: 'enableDirectUpiIntent',
        name: 'Direct UPI App Intent Deep-Link',
        description: 'Launches Google Pay, PhonePe, Paytm, and CRED directly on Android and iOS terminals without external gateway redirect hops.',
        type: 'BOOLEAN',
        value: true,
        rolloutPercent: 100,
        category: 'BILLING',
        targetRule: 'All Mobile Terminals'
      },
      {
        key: 'enableOfflineMenuCache',
        name: 'IndexedDB Offline Order Staging',
        description: 'Zero-latency offline KDS ticket creation and kitchen syncing when restaurant Wi-Fi experiences intermittent packet drops.',
        type: 'BOOLEAN',
        value: true,
        rolloutPercent: 100,
        category: 'PERFORMANCE',
        targetRule: 'Offline / Mesh Mode'
      },
      {
        key: 'enableThermalEscPosPrinter',
        name: '58mm / 80mm Bluetooth Thermal Printer Driver',
        description: 'Direct low-level ESC/POS raw hex byte stream over Bluetooth Low Energy (BLE) to mobile receipt printers.',
        type: 'BOOLEAN',
        value: true,
        rolloutPercent: 100,
        category: 'HARDWARE',
        targetRule: 'Paired BLE Printers'
      },
      {
        key: 'enableBiometricShiftLock',
        name: 'Biometric Staff Authentication',
        description: 'Enforces biometric fingerprint or FaceID step-up authentication before granting cash refunds or discount overrides.',
        type: 'BOOLEAN',
        value: true,
        rolloutPercent: 100,
        category: 'SECURITY',
        targetRule: 'Shift Managers'
      },
      {
        key: 'enableCanaryAiMenuRecommendations',
        name: 'AI Dynamic Upsell Recommendations',
        description: 'Deep learning model generating real-time food and beverage pairing suggestions tailored to current guest table cart items.',
        type: 'PERCENTAGE',
        value: 75,
        rolloutPercent: 75,
        category: 'AI_ENGINE',
        targetRule: '75% Active Waiters'
      }
    ],
    otaReleases: [
      {
        id: 'ota_108',
        bundleVersion: 'v1.4.2-patch.4',
        targetBinaryVersion: '^1.4.0',
        channel: 'PRODUCTION',
        releaseDate: '2026-09-20 03:15 UTC',
        sizeKb: 482,
        rollout: 100,
        status: 'ACTIVE',
        isMandatory: false,
        hash: 'sha256:7f9a2b0c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e',
        author: 'Lead DevOps & Mobile SRE',
        changelog: 'Optimized BLE thermal printer packet fragmentation and upgraded Hermes JS bytecode engine.'
      },
      {
        id: 'ota_107',
        bundleVersion: 'v1.4.2-patch.3',
        targetBinaryVersion: '^1.4.0',
        channel: 'PRODUCTION',
        releaseDate: '2026-09-18 14:30 UTC',
        sizeKb: 476,
        rollout: 100,
        status: 'SUPERSEDED',
        isMandatory: false,
        hash: 'sha256:88a4f109bc53e20019a84b01e389d419fc229aa701e3b8a6',
        author: 'Staff SRE Engineer',
        changelog: 'Fixed edge case where offline dining cart items duplicated during rapid double-tap.'
      },
      {
        id: 'ota_106',
        bundleVersion: 'v1.4.2-canary.1',
        targetBinaryVersion: '1.4.2',
        channel: 'NIGHTLY_CANARY',
        releaseDate: '2026-09-15 19:10 UTC',
        sizeKb: 490,
        rollout: 20,
        status: 'SUPERSEDED',
        isMandatory: false,
        hash: 'sha256:1a82fbc8910e4a7788c0012e4589abbb88301ecf4590aa12',
        author: 'AI Engineering Team',
        changelog: 'Experimental real-time voice ordering DSP audio pipeline.'
      }
    ],
    certificates: [
      {
        type: 'ANDROID_JKS',
        name: 'OrderKare Google Play Release Keystore',
        fingerprintOrKeyId: 'SHA-256: 94:E1:8B:2A:43:F6:19:D2:7C:AA:05:81:49:EE:10:98',
        expiresAt: '2038-04-12 (12 Years Remaining)',
        status: 'VALID'
      },
      {
        type: 'APPLE_DISTRIBUTION',
        name: 'Apple App Store Distribution Certificate',
        fingerprintOrKeyId: 'Cert ID: 77G8H99K10 • Team: NXF882910P',
        expiresAt: '2027-08-20 (11 Months Remaining)',
        status: 'VALID'
      },
      {
        type: 'APPLE_APNS_P8',
        name: 'Apple Push Notification Auth Key (.p8)',
        fingerprintOrKeyId: 'Key ID: APNS_NXF_POS_2026',
        expiresAt: 'No Expiration (Token-Based Authentication)',
        status: 'VALID'
      },
      {
        type: 'FIREBASE_FCM_V1',
        name: 'Firebase Cloud Messaging FCM HTTP v1 Service Account',
        fingerprintOrKeyId: 'nexify-orderkare-fcm@appspot.gserviceaccount.com',
        expiresAt: 'Continuous IAM Rotation Active',
        status: 'VALID'
      }
    ],
    deepLinks: [
      {
        scheme: 'orderkare://',
        host: 'pos.orderkare.com',
        sampleRoute: 'orderkare://table/4/settle?mode=upi',
        purpose: 'Directly opens Table #4 settlement modal with dynamic UPI QR code generator.'
      },
      {
        scheme: 'orderkare://',
        host: 'pos.orderkare.com',
        sampleRoute: 'orderkare://kds/kitchen-ticket/8429',
        purpose: 'Highlights newly dispatched kitchen order ticket on chef kitchen display terminal.'
      }
    ]
  },
  {
    id: 'app_swiftdrop_driver',
    name: 'SwiftDrop Courier Driver App',
    bundleId: 'com.swiftdrop.driver.logistics',
    platform: 'UNIVERSAL',
    category: 'LOGISTICS_GPS',
    framework: 'FLUTTER_AOT',
    activeInstalls: 6320,
    crashFreeRate: '99.92%',
    anrRate: '0.03%',
    dailyActiveSessions: 42100,
    android: {
      latestVersion: '2.1.0',
      latestBuildNumber: 210,
      minSupportedVersion: '1.9.0',
      targetSdk: 34,
      minSdk: 26,
      forceUpdate: false,
      stagedRolloutPercent: 100,
      updateUrl: 'https://play.google.com/store/apps/details?id=com.swiftdrop.driver',
      updateTitle: 'High-Precision Turn-by-Turn GPS Navigation',
      updateMessage: 'Optimized battery usage during active transit and enhanced background WebSocket location sync.',
      packageName: 'com.swiftdrop.driver.logistics',
      sha256Fingerprint: 'A1:C3:5E:7G:9I:2K:4M:6O:8Q:0S:2U:4W:6Y:8A:0C:2E:4G:6I:8K:0M:2O:4Q:6S:8U:0W:2Y:4A:6C:8E:0G:2I:4K'
    },
    ios: {
      latestVersion: '2.1.0',
      latestBuildNumber: 210,
      minSupportedVersion: '1.9.0',
      targetIosVersion: '16.0+',
      forceUpdate: false,
      stagedRolloutPercent: 100,
      updateUrl: 'https://apps.apple.com/app/swiftdrop-courier-driver/id987654321',
      updateTitle: 'SwiftDrop Driver 2.1.0 Released',
      updateMessage: 'Dynamic island live activity order tracking and turn-by-turn routing audio cues.',
      appStoreId: '987654321',
      teamId: 'SWD772810L'
    },
    flags: [
      {
        key: 'enableGeohashCompression',
        name: 'Geohash-7 Spatial GPS Compression',
        description: 'Compresses continuous raw GPS latitude/longitude floats into 7-character geohashes to reduce cellular telemetry payload by 74%.',
        type: 'BOOLEAN',
        value: true,
        rolloutPercent: 100,
        category: 'PERFORMANCE',
        targetRule: 'All Active Fleets'
      },
      {
        key: 'enableBackgroundBatterySaver',
        name: 'Adaptive GPS Polling Duty Cycle',
        description: 'Automatically shifts GPS sampling rate from 1 Hz to 0.2 Hz when vehicle accelerometers detect stationary traffic waiting.',
        type: 'BOOLEAN',
        value: true,
        rolloutPercent: 100,
        category: 'HARDWARE',
        targetRule: 'Motorbike Couriers'
      }
    ],
    otaReleases: [
      {
        id: 'ota_sw_01',
        bundleVersion: 'v2.1.0-patch.1',
        targetBinaryVersion: '^2.1.0',
        channel: 'PRODUCTION',
        releaseDate: '2026-09-19 11:20 UTC',
        sizeKb: 512,
        rollout: 100,
        status: 'ACTIVE',
        isMandatory: false,
        hash: 'sha256:4f828731b9e0781290a184c637a912ef00527810bbf49a02',
        author: 'Lead Fleet Engineer',
        changelog: 'Enhanced Google Maps SDK vector tile caching and Bluetooth helmet headset audio cues.'
      }
    ],
    certificates: [
      {
        type: 'ANDROID_JKS',
        name: 'SwiftDrop Play Console Production Keystore',
        fingerprintOrKeyId: 'SHA-256: A1:C3:5E:7G:9I:2K:4M:6O:8Q:0S:2U:4W',
        expiresAt: '2042-01-01 (16 Years Remaining)',
        status: 'VALID'
      }
    ],
    deepLinks: [
      {
        scheme: 'swiftdrop://',
        host: 'driver.swiftdrop.io',
        sampleRoute: 'swiftdrop://trip/delivery-8841/navigate',
        purpose: 'Launches native driver routing view for ongoing assigned parcel delivery.'
      }
    ]
  },
  {
    id: 'app_nexgen_exam_student',
    name: 'PK The NexGen Exam Mobile Proctor',
    bundleId: 'com.nexgen.exam.student',
    platform: 'UNIVERSAL',
    category: 'EXAM_PROCTORING',
    framework: 'REACT_NATIVE_HERMES',
    activeInstalls: 28400,
    crashFreeRate: '99.99%',
    anrRate: '0.00%',
    dailyActiveSessions: 195000,
    android: {
      latestVersion: '3.1.0',
      latestBuildNumber: 310,
      minSupportedVersion: '3.0.0',
      targetSdk: 34,
      minSdk: 28,
      forceUpdate: true,
      stagedRolloutPercent: 100,
      updateUrl: 'https://play.google.com/store/apps/details?id=com.nexgen.exam.student',
      updateTitle: 'Mandatory Exam Integrity & MediaPipe v3.1.0 Update',
      updateMessage: 'Critical security update: Upgraded on-device 468-point facial mesh gaze tracking and root/jailbreak detection. Older builds cannot enter examination halls.',
      packageName: 'com.nexgen.exam.student',
      sha256Fingerprint: 'B2:D4:F6:8H:0J:2L:4N:6P:8R:0T:2V:4X:6Z:8B:0D:2F:4H:6J:8L:0N:2P:4R:6T:8V:0X:2Z:4B:6D:8F:0H:2J:4L'
    },
    ios: {
      latestVersion: '3.1.0',
      latestBuildNumber: 310,
      minSupportedVersion: '3.0.0',
      targetIosVersion: '16.0+',
      forceUpdate: true,
      stagedRolloutPercent: 100,
      updateUrl: 'https://apps.apple.com/app/nexgen-exam-student/id1122334455',
      updateTitle: 'Mandatory Exam Integrity Update',
      updateMessage: 'Mandatory update required for iOS Guided Access lockdown mode and anti-screen recording hardware traps.',
      appStoreId: '1122334455',
      teamId: 'NXG993108E'
    },
    flags: [
      {
        key: 'enableFaceMeshGazeTracking',
        name: 'MediaPipe Face Mesh 468-Point Gaze Tracker',
        description: 'Runs real-time WebAssembly MediaPipe neural net on-device to flag candidate gaze deviation away from examination monitors.',
        type: 'BOOLEAN',
        value: true,
        rolloutPercent: 100,
        category: 'AI_ENGINE',
        targetRule: 'All Proctoring Sessions'
      },
      {
        key: 'enableKioskScreenPinning',
        name: 'Android Kiosk LockTask / iOS Guided Access',
        description: 'Hard-locks device screen to prevent students from toggling split-screen, notification drawers, or background browsers.',
        type: 'BOOLEAN',
        value: true,
        rolloutPercent: 100,
        category: 'SECURITY',
        targetRule: 'Live Proctored Exams'
      },
      {
        key: 'enableAcousticWhistleDetector',
        name: 'Acoustic Whisper & Secondary Voice Detector',
        description: 'Fourier transform audio spectrum analyzer detecting whispers or secondary speaking frequencies inside examination rooms.',
        type: 'BOOLEAN',
        value: true,
        rolloutPercent: 100,
        category: 'SECURITY',
        targetRule: 'High-Stakes Exams'
      }
    ],
    otaReleases: [
      {
        id: 'ota_ex_01',
        bundleVersion: 'v3.1.0-patch.2',
        targetBinaryVersion: '^3.1.0',
        channel: 'PRODUCTION',
        releaseDate: '2026-09-20 01:40 UTC',
        sizeKb: 614,
        rollout: 100,
        status: 'ACTIVE',
        isMandatory: true,
        hash: 'sha256:1a9e4d770281bce9810a47f02816934c7190bb427a81005a',
        author: 'Chief Proctor Security Lead',
        changelog: 'Patched Android 15 floating window bypass and refreshed on-device Wasm neural weights.'
      }
    ],
    certificates: [
      {
        type: 'ANDROID_JKS',
        name: 'PK NexGen Exam Master Play Keystore',
        fingerprintOrKeyId: 'SHA-256: B2:D4:F6:8H:0J:2L:4N:6P:8R:0T:2V:4X',
        expiresAt: '2045-12-31 (19 Years Remaining)',
        status: 'VALID'
      }
    ],
    deepLinks: [
      {
        scheme: 'nexgenexam://',
        host: 'exam.nexgen.pk',
        sampleRoute: 'nexgenexam://hall/hall_ug_2026_room_4?auth_token=jwt_sample',
        purpose: 'Directly enters secured candidate into allotted virtual exam proctoring chamber.'
      }
    ]
  }
];

export const MobileAppHubPage: React.FC = () => {
  const [apps, setApps] = useState<MobileAppDefinition[]>(INITIAL_APPS);
  const [selectedAppId, setSelectedAppId] = useState<string>('app_orderkare_staff');
  const [activeTab, setActiveTab] = useState<
    'GATEKEEPER' | 'FEATURE_FLAGS' | 'OTA_BUNDLES' | 'KEYS_CERTS' | 'DEEP_LINKS' | 'SIMULATOR'
  >('GATEKEEPER');
  
  // Simulator State
  const [simulatedPlatform, setSimulatedPlatform] = useState<'ANDROID' | 'IOS'>('ANDROID');
  const [simulatedScreen, setSimulatedScreen] = useState<'LIVE_APP' | 'FORCE_UPDATE' | 'SOFT_UPDATE' | 'DEEP_LINK' | 'CRASH_TRACE'>('LIVE_APP');
  const [simulatedDeepLinkInput, setSimulatedDeepLinkInput] = useState<string>('orderkare://table/4/settle?mode=upi');

  // Interactive UI modals and notifications
  const [toast, setToast] = useState<string | null>(null);
  const [isDeployingOta, setIsDeployingOta] = useState(false);
  const [otaProgress, setOtaProgress] = useState(0);
  const [isAddFlagModalOpen, setIsAddFlagModalOpen] = useState(false);
  const [newFlagKey, setNewFlagKey] = useState('');
  const [newFlagName, setNewFlagName] = useState('');
  const [newFlagDesc, setNewFlagDesc] = useState('');
  const [newFlagCategory, setNewFlagCategory] = useState<'PERFORMANCE' | 'BILLING' | 'HARDWARE' | 'SECURITY' | 'AI_ENGINE'>('BILLING');
  const [newFlagRollout, setNewFlagRollout] = useState(100);

  // Soundbox & BLE interactive simulation states in Live App preview
  const [simSoundboxPlaying, setSimSoundboxPlaying] = useState(false);
  const [simBlePrinterPrinting, setSimBlePrinterPrinting] = useState(false);
  const [simBiometricUnlocked, setSimBiometricUnlocked] = useState(false);

  const activeApp = useMemo(() => {
    return apps.find((a) => a.id === selectedAppId) || apps[0];
  }, [apps, selectedAppId]);

  // Update handler for current app
  const updateActiveApp = (updater: (prev: MobileAppDefinition) => MobileAppDefinition) => {
    setApps((prevApps) =>
      prevApps.map((a) => (a.id === selectedAppId ? updater(a) : a))
    );
  };

  // Flag toggle
  const handleToggleFlag = (key: string) => {
    updateActiveApp((prev) => ({
      ...prev,
      flags: prev.flags.map((f) =>
        f.key === key ? { ...f, value: !f.value } : f
      )
    }));
    setToast(`Updated feature flag "${key}" in edge runtime memory`);
    setTimeout(() => setToast(null), 2500);
  };

  // Flag rollout slider change
  const handleFlagRolloutChange = (key: string, percent: number) => {
    updateActiveApp((prev) => ({
      ...prev,
      flags: prev.flags.map((f) =>
        f.key === key ? { ...f, rolloutPercent: percent } : f
      )
    }));
  };

  // Add new flag
  const handleCreateFlag = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFlagKey.trim() || !newFlagName.trim()) return;

    const newFlag = {
      key: newFlagKey.trim(),
      name: newFlagName.trim(),
      description: newFlagDesc.trim() || 'Custom runtime mobile feature toggle.',
      type: 'BOOLEAN' as const,
      value: true,
      rolloutPercent: newFlagRollout,
      category: newFlagCategory,
      targetRule: `${newFlagRollout}% of device fleet`
    };

    updateActiveApp((prev) => ({
      ...prev,
      flags: [newFlag, ...prev.flags]
    }));

    setIsAddFlagModalOpen(false);
    setNewFlagKey('');
    setNewFlagName('');
    setNewFlagDesc('');
    setToast(`Created new feature flag: ${newFlag.key}`);
    setTimeout(() => setToast(null), 3000);
  };

  // Delete flag
  const handleDeleteFlag = (key: string) => {
    updateActiveApp((prev) => ({
      ...prev,
      flags: prev.flags.filter((f) => f.key !== key)
    }));
    setToast(`Removed feature flag: ${key}`);
    setTimeout(() => setToast(null), 2500);
  };

  // Save rules to CDN
  const handleSaveToCdn = (e: React.FormEvent) => {
    e.preventDefault();
    setToast('Gatekeeper boundaries & Remote Config successfully broadcasted to Cloudflare Edge & AWS CloudFront!');
    setTimeout(() => setToast(null), 4000);
  };

  // Deploy OTA Update
  const handleDeployOta = async () => {
    setIsDeployingOta(true);
    setOtaProgress(0);

    for (let i = 0; i <= 100; i += 20) {
      setOtaProgress(i);
      await new Promise((r) => setTimeout(r, 180));
    }

    const nextPatchNum = activeApp.otaReleases.length + 1;
    const newOta = {
      id: `ota_${Date.now().toString().slice(-4)}`,
      bundleVersion: `${activeApp.android.latestVersion}-patch.${nextPatchNum}`,
      targetBinaryVersion: `^${activeApp.android.latestVersion.slice(0, 3)}.0`,
      channel: 'PRODUCTION' as const,
      releaseDate: new Date().toISOString().replace('T', ' ').slice(0, 16) + ' UTC',
      sizeKb: Math.floor(Math.random() * 80) + 420,
      rollout: 100,
      status: 'ACTIVE' as const,
      isMandatory: false,
      hash: `sha256:${Array.from({ length: 32 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`,
      author: 'Live DevOps Engineer (Current Session)',
      changelog: 'Automated Hermes JS byte-bundle compilation, assets delta deduplication, and Edge CDN deployment.'
    };

    updateActiveApp((prev) => ({
      ...prev,
      otaReleases: [
        newOta,
        ...prev.otaReleases.map((r) => ({ ...r, status: 'SUPERSEDED' as const }))
      ]
    }));

    setIsDeployingOta(false);
    setToast(`Instant OTA Bundle ${newOta.bundleVersion} deployed to ${activeApp.name} active devices!`);
    setTimeout(() => setToast(null), 3500);
  };

  // 1-Click Rollback OTA
  const handleRollbackOta = (otaId: string) => {
    updateActiveApp((prev) => {
      return {
        ...prev,
        otaReleases: prev.otaReleases.map((ota) => {
          if (ota.id === otaId) return { ...ota, status: 'ACTIVE' };
          if (ota.status === 'ACTIVE') return { ...ota, status: 'ROLLBACK' };
          return ota;
        })
      };
    });
    setToast('Emergency rollback executed: Previous stable OTA bundle restored to active!');
    setTimeout(() => setToast(null), 3500);
  };

  // Soundbox sound simulator
  const handleTriggerSoundbox = () => {
    setSimSoundboxPlaying(true);
    setToast('🔊 Soundbox voice broadcast: "OrderKare: ₹ 480.00 Received on Dining Table #4 via UPI"');
    setTimeout(() => {
      setSimSoundboxPlaying(false);
      setToast(null);
    }, 4000);
  };

  // BLE Thermal receipt printer simulator
  const handleTriggerBlePrint = () => {
    setSimBlePrinterPrinting(true);
    setToast('🖨️ Transmitting ESC/POS raw byte stream to Bluetooth 58mm Thermal Printer...');
    setTimeout(() => {
      setSimBlePrinterPrinting(false);
      setToast('✅ Receipt Printed: Table #4 Final Settled Bill.');
      setTimeout(() => setToast(null), 3000);
    }, 2000);
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-5 right-5 z-50 px-4 py-3 rounded-2xl bg-slate-900 text-white border border-slate-700 text-xs font-semibold shadow-2xl flex items-center gap-3"
          >
            <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{toast}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Executive Header ── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-200 pb-5 no-print">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2.5">
              <span className="p-2 rounded-xl bg-purple-500/10 text-purple-600 border border-purple-200/60 shadow-sm">
                <Smartphone className="w-6 h-6 text-purple-600" />
              </span>
              Mobile App Hub, OTA Gatekeeper & Remote Config
            </h1>
            <span className="text-[11px] font-mono px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold flex items-center gap-1.5 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Live Edge OTA Mesh Active
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1.5 max-w-3xl">
            Control Android APK/AAB & iOS IPA version boundaries, trigger instant force update screens, dispatch CodePush OTA JavaScript bundles, manage push credentials, test deep links, and toggle runtime mobile flags across all device fleets.
          </p>
        </div>

        {/* Global Executive Header Actions */}
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <div className="relative">
            <select
              value={selectedAppId}
              onChange={(e) => {
                setSelectedAppId(e.target.value);
                const app = apps.find((a) => a.id === e.target.value);
                if (app && app.deepLinks.length > 0) {
                  setSimulatedDeepLinkInput(app.deepLinks[0].sampleRoute);
                }
              }}
              className="px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 outline-none focus:border-purple-500 shadow-sm cursor-pointer pr-8"
            >
              {apps.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name} ({a.framework.replace(/_/g, ' ')})
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleDeployOta}
            disabled={isDeployingOta}
            className="theme-btn-primary px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-50"
          >
            <Zap className={`w-3.5 h-3.5 ${isDeployingOta ? 'animate-spin text-amber-300' : 'text-amber-400'}`} />
            <span>{isDeployingOta ? `Compiling Hermes OTA (${otaProgress}%)...` : 'Dispatch Hot-Patch OTA'}</span>
          </button>

          <button
            onClick={() => window.print()}
            className="px-3.5 py-2 rounded-xl bg-white border border-slate-300 text-slate-800 text-xs font-semibold hover:bg-slate-50 flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
            title="Print Mobile Release Notes & Governance Report"
          >
            <Printer className="w-3.5 h-3.5 text-slate-600" />
            <span>Print Specification</span>
          </button>
        </div>
      </div>

      {/* ── KPI Ribbon ── */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-4 no-print">
        <div className="enterprise-card rounded-2xl p-4 space-y-1.5 shadow-sm border border-slate-200/80">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-mono uppercase text-slate-500 font-bold">Active Fleet Terminals</p>
            <Smartphone className="w-4 h-4 text-purple-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900 font-mono">
              {activeApp.activeInstalls.toLocaleString()}
            </span>
            <span className="text-[10px] font-mono text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
              HEALTHY
            </span>
          </div>
          <p className="text-[11px] text-slate-500 font-mono truncate">
            DAU Sessions: {activeApp.dailyActiveSessions.toLocaleString()} / day
          </p>
        </div>

        <div className="enterprise-card rounded-2xl p-4 space-y-1.5 shadow-sm border border-slate-200/80">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-mono uppercase text-slate-500 font-bold">Crash-Free Rate</p>
            <Shield className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-emerald-700 font-mono">
              {activeApp.crashFreeRate}
            </span>
            <span className="text-[10px] font-mono text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">
              ANR: {activeApp.anrRate}
            </span>
          </div>
          <p className="text-[11px] text-slate-500 font-mono flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Sentry 2026 Baseline Met
          </p>
        </div>

        <div className="enterprise-card rounded-2xl p-4 space-y-1.5 shadow-sm border border-slate-200/80">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-mono uppercase text-slate-500 font-bold">Production Binary</p>
            <Boxes className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900 font-mono">
              v{activeApp.android.latestVersion}
            </span>
            <span className="text-[10px] font-mono text-purple-700 bg-purple-50 border border-purple-200 px-1.5 py-0.5 rounded font-bold">
              Build #{activeApp.android.latestBuildNumber}
            </span>
          </div>
          <p className="text-[11px] text-slate-500 font-mono truncate">
            Target SDK 34 • iOS 16.0+
          </p>
        </div>

        <div className="enterprise-card rounded-2xl p-4 space-y-1.5 shadow-sm border border-slate-200/80">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-mono uppercase text-slate-500 font-bold">Active OTA Patch</p>
            <Zap className="w-4 h-4 text-amber-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-sm font-bold font-mono text-slate-900 truncate">
              {activeApp.otaReleases[0]?.bundleVersion || 'None'}
            </span>
            <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded font-bold">
              100%
            </span>
          </div>
          <p className="text-[11px] text-slate-500 font-mono">
            {activeApp.otaReleases[0]?.sizeKb || 482} KB • Hermes Bytecode
          </p>
        </div>

        <div className="enterprise-card rounded-2xl p-4 space-y-1.5 shadow-sm border border-slate-200/80 col-span-2 sm:col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-mono uppercase text-slate-500 font-bold">Remote Feature Flags</p>
            <SlidersHorizontal className="w-4 h-4 text-purple-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900 font-mono">
              {activeApp.flags.length} Flags
            </span>
            <span className="text-[10px] font-mono text-purple-700 bg-purple-50 border border-purple-200 px-1.5 py-0.5 rounded font-bold">
              LIVE
            </span>
          </div>
          <p className="text-[11px] text-slate-500 font-mono">
            Zero App Store Review Delay
          </p>
        </div>
      </div>

      {/* ── Sub-Navigation Tabs ── */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto text-xs font-semibold no-print">
        <button
          onClick={() => setActiveTab('GATEKEEPER')}
          className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
            activeTab === 'GATEKEEPER'
              ? 'bg-slate-900 text-white font-bold shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Shield className="w-4 h-4" />
          <span>Version Gatekeeper & Store URLs</span>
        </button>

        <button
          onClick={() => setActiveTab('FEATURE_FLAGS')}
          className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
            activeTab === 'FEATURE_FLAGS'
              ? 'bg-slate-900 text-white font-bold shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <SlidersHorizontal className="w-4 h-4" />
          <span>Remote Feature Flags ({activeApp.flags.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('OTA_BUNDLES')}
          className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
            activeTab === 'OTA_BUNDLES'
              ? 'bg-slate-900 text-white font-bold shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Zap className="w-4 h-4" />
          <span>CodePush OTA Hot-Patches ({activeApp.otaReleases.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('KEYS_CERTS')}
          className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
            activeTab === 'KEYS_CERTS'
              ? 'bg-slate-900 text-white font-bold shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Key className="w-4 h-4" />
          <span>Signing Keystores & Push Credentials</span>
        </button>

        <button
          onClick={() => setActiveTab('DEEP_LINKS')}
          className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
            activeTab === 'DEEP_LINKS'
              ? 'bg-slate-900 text-white font-bold shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <QrCode className="w-4 h-4" />
          <span>App Links & QR Lab</span>
        </button>

        <button
          onClick={() => setActiveTab('SIMULATOR')}
          className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
            activeTab === 'SIMULATOR'
              ? 'bg-slate-900 text-white font-bold shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Eye className="w-4 h-4" />
          <span>Live Device Preview Simulator</span>
        </button>
      </div>

      {/* ── TAB 1: GATEKEEPER (ANDROID & IOS) ── */}
      {activeTab === 'GATEKEEPER' && (
        <form onSubmit={handleSaveToCdn} className="space-y-6 no-print">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Android Gatekeeper Card */}
            <div className="enterprise-card rounded-2xl p-6 space-y-4 shadow-sm border border-slate-200">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xl">🤖</span>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">Android Google Play Gatekeeper</h3>
                    <p className="text-[11px] text-slate-500 font-mono">Package: {activeApp.android.packageName}</p>
                  </div>
                </div>
                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200">
                  <input
                    type="checkbox"
                    checked={activeApp.android.forceUpdate}
                    onChange={(e) =>
                      updateActiveApp((prev) => ({
                        ...prev,
                        android: { ...prev.android, forceUpdate: e.target.checked }
                      }))
                    }
                    className="rounded accent-emerald-600 cursor-pointer"
                  />
                  <span className={`font-bold ${activeApp.android.forceUpdate ? 'text-rose-700' : 'text-slate-600'}`}>
                    {activeApp.android.forceUpdate ? 'Hard Lockout Active' : 'Soft Update'}
                  </span>
                </label>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <label className="text-[10px] font-mono text-slate-500 font-bold uppercase">Latest Version</label>
                  <input
                    type="text"
                    value={activeApp.android.latestVersion}
                    onChange={(e) =>
                      updateActiveApp((prev) => ({
                        ...prev,
                        android: { ...prev.android, latestVersion: e.target.value }
                      }))
                    }
                    className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-mono text-xs outline-none focus:border-emerald-500 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-mono text-slate-500 font-bold uppercase">Min Version</label>
                  <input
                    type="text"
                    value={activeApp.android.minSupportedVersion}
                    onChange={(e) =>
                      updateActiveApp((prev) => ({
                        ...prev,
                        android: { ...prev.android, minSupportedVersion: e.target.value }
                      }))
                    }
                    className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-mono text-xs outline-none focus:border-emerald-500 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-mono text-slate-500 font-bold uppercase">Build Code</label>
                  <input
                    type="number"
                    value={activeApp.android.latestBuildNumber}
                    onChange={(e) =>
                      updateActiveApp((prev) => ({
                        ...prev,
                        android: { ...prev.android, latestBuildNumber: Number(e.target.value) }
                      }))
                    }
                    className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-mono text-xs outline-none focus:border-emerald-500 focus:bg-white"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[10px] font-mono text-slate-500 font-bold uppercase">Staged Rollout Phased Release</span>
                  <span className="font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    {activeApp.android.stagedRolloutPercent}% of Play Store users
                  </span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="100"
                  step="5"
                  value={activeApp.android.stagedRolloutPercent}
                  onChange={(e) =>
                    updateActiveApp((prev) => ({
                      ...prev,
                      android: { ...prev.android, stagedRolloutPercent: Number(e.target.value) }
                    }))
                  }
                  className="w-full accent-emerald-600 cursor-pointer"
                />
              </div>

              <div className="text-xs space-y-1">
                <label className="text-[10px] font-mono text-slate-500 font-bold uppercase">Google Play Store URL</label>
                <input
                  type="text"
                  value={activeApp.android.updateUrl}
                  onChange={(e) =>
                    updateActiveApp((prev) => ({
                      ...prev,
                      android: { ...prev.android, updateUrl: e.target.value }
                    }))
                  }
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-mono text-xs outline-none focus:border-emerald-500 focus:bg-white"
                />
              </div>

              <div className="text-xs space-y-1">
                <label className="text-[10px] font-mono text-slate-500 font-bold uppercase">In-App Modal Title</label>
                <input
                  type="text"
                  value={activeApp.android.updateTitle}
                  onChange={(e) =>
                    updateActiveApp((prev) => ({
                      ...prev,
                      android: { ...prev.android, updateTitle: e.target.value }
                    }))
                  }
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-xs outline-none focus:border-emerald-500 focus:bg-white"
                />
              </div>

              <div className="text-xs space-y-1">
                <label className="text-[10px] font-mono text-slate-500 font-bold uppercase">Release Notes & Upgrade Instructions</label>
                <textarea
                  rows={3}
                  value={activeApp.android.updateMessage}
                  onChange={(e) =>
                    updateActiveApp((prev) => ({
                      ...prev,
                      android: { ...prev.android, updateMessage: e.target.value }
                    }))
                  }
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-xs outline-none focus:border-emerald-500 focus:bg-white"
                />
              </div>
            </div>

            {/* iOS Gatekeeper Card */}
            <div className="enterprise-card rounded-2xl p-6 space-y-4 shadow-sm border border-slate-200">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xl">🍎</span>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">Apple iOS App Store Gatekeeper</h3>
                    <p className="text-[11px] text-slate-500 font-mono">App Store ID: {activeApp.ios.appStoreId}</p>
                  </div>
                </div>
                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200">
                  <input
                    type="checkbox"
                    checked={activeApp.ios.forceUpdate}
                    onChange={(e) =>
                      updateActiveApp((prev) => ({
                        ...prev,
                        ios: { ...prev.ios, forceUpdate: e.target.checked }
                      }))
                    }
                    className="rounded accent-emerald-600 cursor-pointer"
                  />
                  <span className={`font-bold ${activeApp.ios.forceUpdate ? 'text-rose-700' : 'text-slate-600'}`}>
                    {activeApp.ios.forceUpdate ? 'Hard Lockout Active' : 'Soft Update'}
                  </span>
                </label>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <label className="text-[10px] font-mono text-slate-500 font-bold uppercase">Latest Version</label>
                  <input
                    type="text"
                    value={activeApp.ios.latestVersion}
                    onChange={(e) =>
                      updateActiveApp((prev) => ({
                        ...prev,
                        ios: { ...prev.ios, latestVersion: e.target.value }
                      }))
                    }
                    className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-mono text-xs outline-none focus:border-emerald-500 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-mono text-slate-500 font-bold uppercase">Min Version</label>
                  <input
                    type="text"
                    value={activeApp.ios.minSupportedVersion}
                    onChange={(e) =>
                      updateActiveApp((prev) => ({
                        ...prev,
                        ios: { ...prev.ios, minSupportedVersion: e.target.value }
                      }))
                    }
                    className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-mono text-xs outline-none focus:border-emerald-500 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-mono text-slate-500 font-bold uppercase">Build Number</label>
                  <input
                    type="number"
                    value={activeApp.ios.latestBuildNumber}
                    onChange={(e) =>
                      updateActiveApp((prev) => ({
                        ...prev,
                        ios: { ...prev.ios, latestBuildNumber: Number(e.target.value) }
                      }))
                    }
                    className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-mono text-xs outline-none focus:border-emerald-500 focus:bg-white"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[10px] font-mono text-slate-500 font-bold uppercase">Phased Release Rollout</span>
                  <span className="font-mono font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                    {activeApp.ios.stagedRolloutPercent}% of iOS users
                  </span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="100"
                  step="5"
                  value={activeApp.ios.stagedRolloutPercent}
                  onChange={(e) =>
                    updateActiveApp((prev) => ({
                      ...prev,
                      ios: { ...prev.ios, stagedRolloutPercent: Number(e.target.value) }
                    }))
                  }
                  className="w-full accent-purple-600 cursor-pointer"
                />
              </div>

              <div className="text-xs space-y-1">
                <label className="text-[10px] font-mono text-slate-500 font-bold uppercase">Apple App Store URL</label>
                <input
                  type="text"
                  value={activeApp.ios.updateUrl}
                  onChange={(e) =>
                    updateActiveApp((prev) => ({
                      ...prev,
                      ios: { ...prev.ios, updateUrl: e.target.value }
                    }))
                  }
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-mono text-xs outline-none focus:border-emerald-500 focus:bg-white"
                />
              </div>

              <div className="text-xs space-y-1">
                <label className="text-[10px] font-mono text-slate-500 font-bold uppercase">In-App Modal Title</label>
                <input
                  type="text"
                  value={activeApp.ios.updateTitle}
                  onChange={(e) =>
                    updateActiveApp((prev) => ({
                      ...prev,
                      ios: { ...prev.ios, updateTitle: e.target.value }
                    }))
                  }
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-xs outline-none focus:border-emerald-500 focus:bg-white"
                />
              </div>

              <div className="text-xs space-y-1">
                <label className="text-[10px] font-mono text-slate-500 font-bold uppercase">Release Notes & Upgrade Instructions</label>
                <textarea
                  rows={3}
                  value={activeApp.ios.updateMessage}
                  onChange={(e) =>
                    updateActiveApp((prev) => ({
                      ...prev,
                      ios: { ...prev.ios, updateMessage: e.target.value }
                    }))
                  }
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-xs outline-none focus:border-emerald-500 focus:bg-white"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              className="theme-btn-primary px-6 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Broadcast Version Rules to Global Edge CDN</span>
            </button>
          </div>
        </form>
      )}

      {/* ── TAB 2: REMOTE FEATURE FLAGS ── */}
      {activeTab === 'FEATURE_FLAGS' && (
        <div className="space-y-4 no-print">
          <div className="enterprise-card rounded-2xl p-6 space-y-4 shadow-sm border border-slate-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <SlidersHorizontal className="w-4 h-4 text-purple-600" />
                  <span>Remote Runtime Feature Flags for {activeApp.name}</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Toggles and percentage rollouts are propagated instantly to live mobile apps via WebSocket & Edge CDN caching without needing App Store reviews.
                </p>
              </div>

              <button
                onClick={() => setIsAddFlagModalOpen(true)}
                className="theme-btn-primary px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-sm cursor-pointer self-start sm:self-auto"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New Feature Flag</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {activeApp.flags.map((flag) => (
                <div
                  key={flag.key}
                  className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-slate-50 flex flex-col justify-between gap-3 text-xs transition-all shadow-xs"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-slate-900 font-sans text-sm">{flag.name}</span>
                        <span
                          className={`text-[9px] font-mono px-2 py-0.5 rounded font-bold uppercase ${
                            flag.category === 'BILLING'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : flag.category === 'SECURITY'
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : flag.category === 'HARDWARE'
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : flag.category === 'AI_ENGINE'
                              ? 'bg-purple-50 text-purple-700 border border-purple-200'
                              : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                          }`}
                        >
                          {flag.category}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={Boolean(flag.value)}
                            onChange={() => handleToggleFlag(flag.key)}
                            className="sr-only peer"
                          />
                          <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600" />
                        </label>
                        <button
                          onClick={() => handleDeleteFlag(flag.key)}
                          className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                          title="Delete flag"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <p className="text-slate-600 text-xs leading-relaxed">{flag.description}</p>
                    <div className="text-[10px] font-mono text-slate-500 flex flex-wrap items-center gap-x-3 gap-y-1">
                      <span>Key: <strong className="text-slate-800">{flag.key}</strong></span>
                      <span>Target: <strong className="text-slate-700">{flag.targetRule}</strong></span>
                    </div>
                  </div>

                  {/* Dynamic Rollout Percentage Slider */}
                  <div className="pt-2 border-t border-slate-200/60 space-y-1">
                    <div className="flex items-center justify-between text-[11px] font-mono">
                      <span className="text-slate-500 font-semibold">Active Fleet Rollout</span>
                      <span className="font-bold text-slate-900">{flag.rolloutPercent}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      step="5"
                      value={flag.rolloutPercent}
                      onChange={(e) => handleFlagRolloutChange(flag.key, Number(e.target.value))}
                      className="w-full accent-purple-600 cursor-pointer"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 3: OTA BUNDLES REGISTRY ── */}
      {activeTab === 'OTA_BUNDLES' && (
        <div className="space-y-4 no-print">
          <div className="enterprise-card rounded-2xl p-6 space-y-4 shadow-sm border border-slate-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-emerald-600" />
                  <span>CodePush / React Native Hermes Over-The-Air Hot-Patch Registry</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Direct hot-patching for React Native, Flutter, and hybrid mobile client code. Ships urgent fixes instantly to active users in the background.
                </p>
              </div>

              <button
                onClick={handleDeployOta}
                disabled={isDeployingOta}
                className="theme-btn-primary px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-50 self-start sm:self-auto"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{isDeployingOta ? `Compiling (${otaProgress}%)...` : 'Dispatch New Hot-Patch'}</span>
              </button>
            </div>

            <div className="space-y-3">
              {activeApp.otaReleases.map((ota) => (
                <div
                  key={ota.id}
                  className="p-4 rounded-xl border border-slate-200 bg-slate-50/80 hover:bg-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs transition-all shadow-xs"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-slate-900 text-sm font-sans">{ota.bundleVersion}</span>
                      <span
                        className={`text-[9px] font-mono px-2 py-0.5 rounded font-bold ${
                          ota.status === 'ACTIVE'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            : ota.status === 'ROLLBACK'
                            ? 'bg-rose-100 text-rose-800 border border-rose-200'
                            : 'bg-slate-200 text-slate-600'
                        }`}
                      >
                        {ota.status}
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200 font-bold">
                        {ota.channel}
                      </span>
                      <span className="text-[11px] text-slate-500 font-mono">
                        (Target: {ota.targetBinaryVersion} • {ota.sizeKb} KB)
                      </span>
                    </div>

                    <p className="text-slate-700 font-medium text-xs">{ota.changelog}</p>

                    <div className="text-[10px] text-slate-500 font-mono flex flex-wrap items-center gap-x-4 gap-y-1">
                      <span>Hash: <code className="text-slate-700">{ota.hash.slice(0, 24)}...</code></span>
                      <span>Author: <strong className="text-slate-700">{ota.author}</strong></span>
                      <span>Date: <strong className="text-slate-700">{ota.releaseDate}</strong></span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 shrink-0">
                    <span className="text-emerald-700 font-bold font-mono bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                      Rollout: {ota.rollout}%
                    </span>

                    {ota.status !== 'ACTIVE' && (
                      <button
                        onClick={() => handleRollbackOta(ota.id)}
                        className="px-3 py-1 rounded-lg bg-amber-50 text-amber-800 border border-amber-300 font-semibold hover:bg-amber-100 flex items-center gap-1 cursor-pointer transition-all"
                        title="Rollback live fleet to this stable OTA bundle"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>Rollback to this</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 4: KEYS & CERTIFICATES VAULT ── */}
      {activeTab === 'KEYS_CERTS' && (
        <div className="space-y-4 no-print">
          <div className="enterprise-card rounded-2xl p-6 space-y-4 shadow-sm border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Key className="w-4 h-4 text-purple-600" />
                  <span>Signing Keystores, Apple Certificates & Push Credentials</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Secure cryptographic credentials used for APK/AAB build signing, Apple App Store notary, and APNs/FCM real-time push notifications.
                </p>
              </div>

              <button
                onClick={() => {
                  setToast('All mobile keystores & APNs push tokens validated against Apple & Google APIs!');
                  setTimeout(() => setToast(null), 3000);
                }}
                className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Verify All Credentials</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {activeApp.certificates.map((cert, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-2 text-xs"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded font-bold bg-slate-200 text-slate-800">
                        {cert.type.replace(/_/g, ' ')}
                      </span>
                      <h4 className="font-bold text-slate-900 text-sm mt-1.5">{cert.name}</h4>
                    </div>
                    <span className="text-[10px] font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 flex items-center gap-1">
                      <Check className="w-3 h-3 text-emerald-600" /> {cert.status}
                    </span>
                  </div>

                  <p className="text-slate-600 font-mono text-[11px] bg-white p-2 rounded-lg border border-slate-200 break-all">
                    {cert.fingerprintOrKeyId}
                  </p>

                  <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 pt-1">
                    <span>Validity / Schedule:</span>
                    <strong className="text-slate-800">{cert.expiresAt}</strong>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 5: DEEP LINKS & QR TESTING LAB ── */}
      {activeTab === 'DEEP_LINKS' && (
        <div className="space-y-4 no-print">
          <div className="enterprise-card rounded-2xl p-6 space-y-4 shadow-sm border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <QrCode className="w-4 h-4 text-purple-600" />
                  <span>Universal Links, Android App Links & QR Code Dispatcher</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Test URL schemes and App Links with instant mobile QR code scanning and dynamic payload simulator.
                </p>
              </div>

              <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                assetlinks.json Verified
              </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left: Deep link presets */}
              <div className="lg:col-span-2 space-y-3">
                <label className="text-[10px] font-mono text-slate-500 font-bold uppercase">Select Sample Deep Link Schema</label>
                <div className="space-y-2">
                  {activeApp.deepLinks.map((link, idx) => (
                    <div
                      key={idx}
                      onClick={() => setSimulatedDeepLinkInput(link.sampleRoute)}
                      className={`p-3 rounded-xl border cursor-pointer transition-all text-xs ${
                        simulatedDeepLinkInput === link.sampleRoute
                          ? 'border-purple-500 bg-purple-50/50 shadow-xs'
                          : 'border-slate-200 bg-slate-50 hover:bg-slate-100'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-purple-900">{link.sampleRoute}</span>
                        <span className="text-[10px] font-mono text-slate-400">Host: {link.host}</span>
                      </div>
                      <p className="text-slate-600 text-[11px] mt-1">{link.purpose}</p>
                    </div>
                  ))}
                </div>

                <div className="pt-2">
                  <label className="text-[10px] font-mono text-slate-500 font-bold uppercase">Custom Deep Link Route URI</label>
                  <div className="flex items-center gap-2 mt-1">
                    <input
                      type="text"
                      value={simulatedDeepLinkInput}
                      onChange={(e) => setSimulatedDeepLinkInput(e.target.value)}
                      className="flex-1 px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-mono text-xs outline-none focus:border-purple-500 focus:bg-white"
                      placeholder="e.g. orderkare://table/4/settle"
                    />
                    <button
                      onClick={() => {
                        setActiveTab('SIMULATOR');
                        setSimulatedScreen('DEEP_LINK');
                      }}
                      className="theme-btn-primary px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer shrink-0"
                    >
                      <Play className="w-3.5 h-3.5" />
                      <span>Test in Simulator</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Right: Visual QR Code simulator */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex flex-col items-center justify-center text-center space-y-3">
                <div className="p-3 bg-white rounded-2xl border border-slate-200 shadow-sm">
                  {/* Generated clean SVG QR Representation */}
                  <svg className="w-36 h-36" viewBox="0 0 100 100" fill="currentColor">
                    {/* QR Code corners */}
                    <rect x="10" y="10" width="25" height="25" rx="3" className="text-slate-900" />
                    <rect x="15" y="15" width="15" height="15" fill="white" />
                    <rect x="18" y="18" width="9" height="9" className="text-slate-900" />

                    <rect x="65" y="10" width="25" height="25" rx="3" className="text-slate-900" />
                    <rect x="70" y="15" width="15" height="15" fill="white" />
                    <rect x="73" y="18" width="9" height="9" className="text-slate-900" />

                    <rect x="10" y="65" width="25" height="25" rx="3" className="text-slate-900" />
                    <rect x="15" y="70" width="15" height="15" fill="white" />
                    <rect x="18" y="73" width="9" height="9" className="text-slate-900" />

                    {/* QR Code dots pattern */}
                    <rect x="42" y="12" width="6" height="6" className="text-slate-900" />
                    <rect x="52" y="12" width="6" height="6" className="text-slate-900" />
                    <rect x="42" y="24" width="6" height="6" className="text-slate-900" />
                    <rect x="52" y="30" width="6" height="6" className="text-slate-900" />
                    <rect x="12" y="45" width="6" height="6" className="text-slate-900" />
                    <rect x="24" y="45" width="6" height="6" className="text-slate-900" />
                    <rect x="36" y="45" width="6" height="6" className="text-slate-900" />
                    <rect x="48" y="45" width="6" height="6" className="text-slate-900" />
                    <rect x="60" y="45" width="6" height="6" className="text-slate-900" />
                    <rect x="72" y="45" width="6" height="6" className="text-slate-900" />
                    <rect x="84" y="45" width="6" height="6" className="text-slate-900" />
                    <rect x="45" y="60" width="6" height="6" className="text-slate-900" />
                    <rect x="58" y="65" width="6" height="6" className="text-slate-900" />
                    <rect x="72" y="75" width="6" height="6" className="text-slate-900" />
                    <rect x="84" y="65" width="6" height="6" className="text-slate-900" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900">Scan on Camera / Device</p>
                  <p className="text-[10px] text-slate-500 font-mono mt-0.5 truncate max-w-[220px]">
                    {simulatedDeepLinkInput}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 6: LIVE INTERACTIVE DEVICE SIMULATOR ── */}
      {activeTab === 'SIMULATOR' && (
        <div className="enterprise-card rounded-2xl p-6 space-y-6 shadow-sm border border-slate-200 no-print">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Eye className="w-4 h-4 text-purple-600" />
                <span>Live Interactive Mobile Sandbox Simulator</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Experience real-time force update triggers, Soundbox audio triggers, Bluetooth thermal printing, and runtime feature flags exactly as your client staff and end-users see them.
              </p>
            </div>

            {/* Platform & Screen Viewport Switchers */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex rounded-xl bg-slate-100 p-1 text-xs font-semibold">
                <button
                  onClick={() => setSimulatedPlatform('ANDROID')}
                  className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                    simulatedPlatform === 'ANDROID' ? 'bg-white text-slate-900 shadow-xs font-bold' : 'text-slate-600'
                  }`}
                >
                  🤖 Google Pixel 9
                </button>
                <button
                  onClick={() => setSimulatedPlatform('IOS')}
                  className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                    simulatedPlatform === 'IOS' ? 'bg-white text-slate-900 shadow-xs font-bold' : 'text-slate-600'
                  }`}
                >
                  🍎 iPhone 16 Pro
                </button>
              </div>

              <div className="flex rounded-xl bg-slate-100 p-1 text-xs font-semibold overflow-x-auto">
                <button
                  onClick={() => setSimulatedScreen('LIVE_APP')}
                  className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                    simulatedScreen === 'LIVE_APP' ? 'bg-white text-slate-900 shadow-xs font-bold' : 'text-slate-600'
                  }`}
                >
                  Live App UI
                </button>
                <button
                  onClick={() => setSimulatedScreen('FORCE_UPDATE')}
                  className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                    simulatedScreen === 'FORCE_UPDATE' ? 'bg-white text-slate-900 shadow-xs font-bold' : 'text-slate-600'
                  }`}
                >
                  Force Update
                </button>
                <button
                  onClick={() => setSimulatedScreen('DEEP_LINK')}
                  className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                    simulatedScreen === 'DEEP_LINK' ? 'bg-white text-slate-900 shadow-xs font-bold' : 'text-slate-600'
                  }`}
                >
                  Deep Link Route
                </button>
                <button
                  onClick={() => setSimulatedScreen('CRASH_TRACE')}
                  className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                    simulatedScreen === 'CRASH_TRACE' ? 'bg-white text-slate-900 shadow-xs font-bold' : 'text-slate-600'
                  }`}
                >
                  Sentry Telemetry
                </button>
              </div>
            </div>
          </div>

          {/* Smartphone Hardware Casing */}
          <div className="flex justify-center py-4">
            <div
              className={`w-[340px] h-[640px] rounded-[48px] p-3 shadow-2xl border-4 relative flex flex-col transition-all ${
                simulatedPlatform === 'IOS'
                  ? 'bg-gradient-to-b from-slate-900 via-slate-800 to-slate-950 border-slate-700 shadow-slate-900/40'
                  : 'bg-gradient-to-b from-slate-950 via-zinc-900 to-black border-zinc-800 shadow-zinc-900/40'
              }`}
            >
              {/* Dynamic Island / Punch Hole Notch */}
              <div className="flex items-center justify-between px-6 pt-1 pb-2 shrink-0">
                <span className="text-[10px] font-mono font-bold text-white/80">09:41</span>
                {simulatedPlatform === 'IOS' ? (
                  <div className="w-24 h-4 bg-black rounded-full flex items-center justify-center gap-1.5 px-2">
                    <div className="w-2 h-2 rounded-full bg-slate-800" />
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  </div>
                ) : (
                  <div className="w-3.5 h-3.5 rounded-full bg-black border border-slate-800 mx-auto" />
                )}
                <div className="flex items-center gap-1 text-white/80">
                  <Wifi className="w-3 h-3" />
                  <Battery className="w-3.5 h-3.5" />
                </div>
              </div>

              {/* Mobile Screen Content */}
              <div className="flex-1 bg-white rounded-[36px] p-4 flex flex-col justify-between overflow-hidden text-slate-900 relative shadow-inner">
                {/* 1. FORCE UPDATE VIEW */}
                {simulatedScreen === 'FORCE_UPDATE' && (
                  <div className="flex flex-col items-center justify-center text-center h-full space-y-4 px-2">
                    <div className="w-16 h-16 rounded-2xl bg-purple-50 text-purple-600 border border-purple-200 flex items-center justify-center text-3xl shadow-sm">
                      🚀
                    </div>
                    <div className="space-y-1">
                      <h4 className="font-bold text-slate-900 text-sm leading-snug">
                        {simulatedPlatform === 'ANDROID' ? activeApp.android.updateTitle : activeApp.ios.updateTitle}
                      </h4>
                      <p className="text-[10px] text-purple-700 font-mono font-bold">
                        Version {activeApp.android.latestVersion} Ready for Installation
                      </p>
                    </div>
                    <p className="text-[11px] text-slate-600 leading-relaxed max-h-24 overflow-y-auto">
                      {simulatedPlatform === 'ANDROID' ? activeApp.android.updateMessage : activeApp.ios.updateMessage}
                    </p>
                    <a
                      href={simulatedPlatform === 'ANDROID' ? activeApp.android.updateUrl : activeApp.ios.updateUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="w-full py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl text-xs font-bold shadow-md hover:from-purple-700 hover:to-indigo-700 flex items-center justify-center gap-1.5 cursor-pointer no-underline"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Update on {simulatedPlatform === 'ANDROID' ? 'Google Play' : 'App Store'}</span>
                    </a>
                  </div>
                )}

                {/* 2. LIVE IN-APP INTERACTIVE DASHBOARD */}
                {simulatedScreen === 'LIVE_APP' && (
                  <div className="space-y-3 h-full overflow-y-auto pr-1 text-xs">
                    {/* App Header */}
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                      <div>
                        <span className="font-bold text-slate-900 text-xs block truncate max-w-[170px]">{activeApp.name}</span>
                        <span className="text-[9px] font-mono text-slate-400">Terminal #POS-882</span>
                      </div>
                      <span className="text-[9px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-bold border border-emerald-200">
                        v{activeApp.android.latestVersion}
                      </span>
                    </div>

                    {/* Interactive Hardware & SRE Controls within Simulator */}
                    <div className="space-y-2">
                      <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                        <p className="text-[10px] font-mono text-slate-500 font-bold uppercase flex items-center gap-1">
                          <Zap className="w-3 h-3 text-amber-500" /> Interactive Hardware Triggers
                        </p>

                        <button
                          onClick={handleTriggerSoundbox}
                          disabled={simSoundboxPlaying}
                          className="w-full py-2 px-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] flex items-center justify-center gap-1.5 shadow-xs cursor-pointer transition-all disabled:opacity-50"
                        >
                          <Radio className={`w-3 h-3 ${simSoundboxPlaying ? 'animate-ping' : ''}`} />
                          <span>{simSoundboxPlaying ? 'Playing Audio...' : 'Simulate Soundbox Settlement'}</span>
                        </button>

                        <button
                          onClick={handleTriggerBlePrint}
                          disabled={simBlePrinterPrinting}
                          className="w-full py-2 px-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-bold text-[10px] flex items-center justify-center gap-1.5 shadow-xs cursor-pointer transition-all disabled:opacity-50"
                        >
                          <Printer className={`w-3 h-3 ${simBlePrinterPrinting ? 'animate-bounce' : ''}`} />
                          <span>{simBlePrinterPrinting ? 'Printing ESC/POS...' : 'Simulate Thermal BLE Print'}</span>
                        </button>
                      </div>

                      {/* Active Feature Flags list inside phone */}
                      <div className="space-y-1.5">
                        <p className="text-[10px] font-mono text-slate-500 font-bold uppercase">Remote Flags Ingested</p>
                        {activeApp.flags.map((f) => (
                          <div
                            key={f.key}
                            className="p-2 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between text-[10px]"
                          >
                            <span className="font-mono text-slate-700 truncate max-w-[170px]">{f.key}</span>
                            <span
                              className={`font-bold font-mono px-1.5 py-0.5 rounded text-[9px] ${
                                f.value
                                  ? 'text-emerald-700 bg-emerald-50 border border-emerald-200'
                                  : 'text-slate-400 bg-slate-100'
                              }`}
                            >
                              {f.value ? 'ON' : 'OFF'}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* 3. DEEP LINK ROUTING VIEW */}
                {simulatedScreen === 'DEEP_LINK' && (
                  <div className="flex flex-col justify-between h-full space-y-3">
                    <div className="space-y-2">
                      <div className="p-3 bg-purple-50 border border-purple-200 rounded-xl space-y-1">
                        <p className="text-[10px] font-mono text-purple-700 font-bold uppercase">Incoming Intent Handled</p>
                        <p className="text-xs font-mono font-bold text-slate-900 break-all">{simulatedDeepLinkInput}</p>
                      </div>

                      <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs">
                        <h5 className="font-bold text-slate-900 text-xs">Decoded Routing Parameters:</h5>
                        <div className="font-mono text-[10px] space-y-1 text-slate-600">
                          <div>• <strong>Protocol:</strong> Custom URL Scheme / Universal Link</div>
                          <div>• <strong>Host:</strong> {activeApp.deepLinks[0]?.host || 'pos.orderkare.com'}</div>
                          <div>• <strong>Context State:</strong> Ready for instant action</div>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => setSimulatedScreen('LIVE_APP')}
                      className="w-full py-2 bg-slate-900 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer"
                    >
                      Return to In-App View
                    </button>
                  </div>
                )}

                {/* 4. SENTRY TELEMETRY & CRASH DIAGNOSTIC VIEW */}
                {simulatedScreen === 'CRASH_TRACE' && (
                  <div className="space-y-2 h-full overflow-y-auto text-xs">
                    <div className="flex items-center justify-between border-b pb-2">
                      <span className="font-bold text-slate-900 text-xs flex items-center gap-1 text-emerald-700">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Sentry 2026 Telemetry
                      </span>
                      <span className="text-[9px] font-mono text-slate-500">Hermes JS Engine</span>
                    </div>

                    <div className="space-y-1 font-mono text-[9px] text-slate-700 bg-slate-900 text-emerald-400 p-3 rounded-xl overflow-x-auto">
                      <p className="text-slate-400">// Device State Breadcrumbs</p>
                      <p>09:41:02 [ui.press] Button: Settle Bill</p>
                      <p>09:41:03 [ble.write] ESC/POS Chunk 128B OK</p>
                      <p>09:41:04 [ws.send] Soundbox Intent OK</p>
                      <p className="text-emerald-300">09:41:05 [sentry] 0 Unhandled Exceptions</p>
                      <p className="text-slate-400">Crash-Free Users: {activeApp.crashFreeRate}</p>
                    </div>
                  </div>
                )}

                {/* Home Indicator Bar */}
                <div className="w-28 h-1 bg-slate-400 rounded-full mx-auto mt-2 shrink-0" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── CREATE FEATURE FLAG MODAL ── */}
      <AnimatePresence>
        {isAddFlagModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs no-print">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <SlidersHorizontal className="w-4 h-4 text-purple-600" />
                  <span>Create Remote Feature Flag</span>
                </h3>
                <button
                  onClick={() => setIsAddFlagModalOpen(false)}
                  className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleCreateFlag} className="space-y-3 text-xs">
                <div>
                  <label className="text-[10px] font-mono text-slate-500 font-bold uppercase">Flag Key (CamelCase or SnakeCase)</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. enableVoiceAiKiosk"
                    value={newFlagKey}
                    onChange={(e) => setNewFlagKey(e.target.value)}
                    className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-mono text-xs outline-none focus:border-purple-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-mono text-slate-500 font-bold uppercase">Display Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Voice AI Self-Ordering Kiosk"
                    value={newFlagName}
                    onChange={(e) => setNewFlagName(e.target.value)}
                    className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-xs outline-none focus:border-purple-500 focus:bg-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-mono text-slate-500 font-bold uppercase">Category</label>
                    <select
                      value={newFlagCategory}
                      onChange={(e) => setNewFlagCategory(e.target.value as any)}
                      className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-sans text-xs outline-none focus:border-purple-500"
                    >
                      <option value="BILLING">BILLING</option>
                      <option value="PERFORMANCE">PERFORMANCE</option>
                      <option value="HARDWARE">HARDWARE</option>
                      <option value="SECURITY">SECURITY</option>
                      <option value="AI_ENGINE">AI_ENGINE</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-mono text-slate-500 font-bold uppercase">Rollout Percentage</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={newFlagRollout}
                      onChange={(e) => setNewFlagRollout(Number(e.target.value))}
                      className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-mono text-xs outline-none focus:border-purple-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-mono text-slate-500 font-bold uppercase">Description</label>
                  <textarea
                    rows={2}
                    placeholder="Describe what this remote toggle activates on client devices..."
                    value={newFlagDesc}
                    onChange={(e) => setNewFlagDesc(e.target.value)}
                    className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-xs outline-none focus:border-purple-500 focus:bg-white"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsAddFlagModalOpen(false)}
                    className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="theme-btn-primary px-4 py-2 rounded-xl text-xs font-bold"
                  >
                    Deploy Flag to Runtime
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── PRINT-ONLY A4 FORMAL MOBILE SPECIFICATION & GOVERNANCE REPORT ── */}
      <div className="printable-mobile-sheet hidden print:block bg-white text-black p-8 max-w-[210mm] mx-auto">
        {/* Letterhead */}
        <div className="border-b-2 border-slate-900 pb-6 mb-6">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2">
                <Smartphone className="w-8 h-8 text-purple-700 inline" />
                <h1 className="text-2xl font-black uppercase tracking-tight text-slate-900">
                  Nexify DevOps Mobile App & OTA Hub
                </h1>
              </div>
              <p className="text-xs font-semibold text-slate-600 uppercase tracking-widest mt-1">
                Official Mobile Application Release & Gatekeeper Governance Report
              </p>
              <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                Android APK/AAB • iOS IPA • Hermes OTA CodePush Hot-Patching • Remote Feature Flags
              </p>
            </div>
            <div className="text-right text-xs font-mono">
              <p className="font-bold text-slate-900">GOVERNANCE SPEC #</p>
              <p className="text-sm font-black text-purple-800">NXF-MOB-2026-0920</p>
              <p className="text-[10px] text-slate-500 mt-1">Date: {new Date().toUTCString()}</p>
            </div>
          </div>
        </div>

        {/* Selected App Overview */}
        <div className="border border-slate-300 rounded-lg p-4 mb-6 text-xs bg-slate-50/50">
          <p className="text-[10px] font-mono uppercase text-slate-500 font-bold">Application Identity & Build Target</p>
          <p className="font-mono text-sm font-bold text-slate-900 mt-1">
            {activeApp.name} ({activeApp.bundleId})
          </p>
          <div className="grid grid-cols-4 gap-2 mt-2 font-mono text-[9pt] text-slate-700">
            <div>Active Units: <strong>{activeApp.activeInstalls.toLocaleString()}</strong></div>
            <div>Android Version: <strong>v{activeApp.android.latestVersion}</strong></div>
            <div>iOS Version: <strong>v{activeApp.ios.latestVersion}</strong></div>
            <div>Crash-Free: <strong>{activeApp.crashFreeRate}</strong></div>
          </div>
        </div>

        {/* Remote Feature Flags Table */}
        <div className="mb-6">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-2 border-b border-slate-200 pb-1">
            Active Remote Feature Flags & Rollout Policies
          </h3>
          <table className="w-full text-left text-[9pt] border-collapse">
            <thead>
              <tr className="border-b-2 border-slate-900 bg-slate-100 text-slate-800 font-mono text-[8pt]">
                <th className="py-1.5 px-2">Flag Key</th>
                <th className="py-1.5 px-2">Feature Name & Description</th>
                <th className="py-1.5 px-2">Category</th>
                <th className="py-1.5 px-2">State</th>
                <th className="py-1.5 px-2">Rollout %</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {activeApp.flags.map((f) => (
                <tr key={f.key} className="font-mono">
                  <td className="py-2 px-2 font-bold text-slate-900">{f.key}</td>
                  <td className="py-2 px-2 font-sans text-[8pt]">
                    <div className="font-bold text-slate-900">{f.name}</div>
                    <div className="text-slate-600 text-[7pt]">{f.description}</div>
                  </td>
                  <td className="py-2 px-2 text-[7pt] text-purple-800">{f.category}</td>
                  <td className="py-2 px-2 font-bold text-[8pt]">
                    {f.value ? 'ENABLED' : 'DISABLED'}
                  </td>
                  <td className="py-2 px-2 font-bold text-emerald-800 text-[8pt]">{f.rolloutPercent}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* OTA Releases Table */}
        <div className="mb-6">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-2 border-b border-slate-200 pb-1">
            Over-The-Air (OTA) Hot-Patch Releases
          </h3>
          <table className="w-full text-left text-[9pt] border-collapse">
            <thead>
              <tr className="border-b-2 border-slate-900 bg-slate-100 text-slate-800 font-mono text-[8pt]">
                <th className="py-1.5 px-2">Bundle Version</th>
                <th className="py-1.5 px-2">Channel</th>
                <th className="py-1.5 px-2">Size</th>
                <th className="py-1.5 px-2">SHA-256 Digest</th>
                <th className="py-1.5 px-2">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {activeApp.otaReleases.map((ota) => (
                <tr key={ota.id} className="font-mono text-[8pt]">
                  <td className="py-1.5 px-2 font-bold text-slate-900">{ota.bundleVersion}</td>
                  <td className="py-1.5 px-2 text-purple-800">{ota.channel}</td>
                  <td className="py-1.5 px-2">{ota.sizeKb} KB</td>
                  <td className="py-1.5 px-2 text-[7pt] text-slate-600">{ota.hash.slice(0, 24)}...</td>
                  <td className="py-1.5 px-2 font-bold text-emerald-800">{ota.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Sign-off declaration */}
        <div className="border-t-2 border-slate-900 pt-6 mt-8">
          <div className="grid grid-cols-2 gap-8 text-xs">
            <div>
              <p className="font-bold text-slate-900 mb-1">Release Certification Guarantee:</p>
              <p className="text-[9pt] text-slate-600 leading-relaxed">
                All listed application versions conform to Google Play Developer Policy and Apple App Store Review Guidelines. OTA updates contain only verified JavaScript/asset hot-patches.
              </p>
            </div>
            <div className="flex flex-col justify-end items-end text-right">
              <div className="border-b border-slate-400 w-48 pb-1 mb-1 font-mono text-[9pt] font-bold text-slate-800">
                [Digitally Signed Mobile Lead]
              </div>
              <p className="font-bold text-slate-900 text-[9pt]">Principal Mobile SRE Engineer</p>
              <p className="text-[8pt] text-slate-500 font-mono">Nexify DevOps Control Plane</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
