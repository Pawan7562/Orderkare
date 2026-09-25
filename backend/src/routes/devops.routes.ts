import { Router } from 'express';
import {
  getDevOpsOverview,
  getDevOpsFleet,
  updateDevOpsProjectStatus,
  getDevOpsWebhooks,
  replayDevOpsWebhook,
  getDevOpsErrors,
  resolveDevOpsError,
  getDevOpsMobileConfigs,
  updateDevOpsMobileConfigs,
  getDevOpsDatabaseStats,
  createDevOpsBackupSnapshot,
  getDevOpsCronJobs,
  getDevOpsAuditLogs,
} from '../controllers/devops.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();

// Allow optional dev token or authenticated super admin
router.get('/overview', getDevOpsOverview);
router.get('/fleet', getDevOpsFleet);
router.put('/fleet/:id', updateDevOpsProjectStatus);
router.get('/webhooks', getDevOpsWebhooks);
router.post('/webhooks/replay', replayDevOpsWebhook);
router.get('/errors', getDevOpsErrors);
router.put('/errors/:id/resolve', resolveDevOpsError);
router.get('/mobile', getDevOpsMobileConfigs);
router.put('/mobile', updateDevOpsMobileConfigs);
router.get('/database', getDevOpsDatabaseStats);
router.post('/database/backup', createDevOpsBackupSnapshot);
router.get('/cron', getDevOpsCronJobs);
router.get('/audit', getDevOpsAuditLogs);

export default router;
