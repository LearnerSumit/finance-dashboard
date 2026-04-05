import { Router } from 'express';
import { query } from 'express-validator';
import {
  getSummary,
  getCategoryBreakdown,
  getMonthlyTrends,
  getRecentActivity,
  getWeeklyTrends,
} from '../controllers/dashboardController.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = Router();

// All dashboard routes: authenticated + analyst or admin
// (Viewer cannot access analytics)
router.use(authenticate, authorize('analyst', 'admin'));

router.get('/summary', getSummary);

router.get(
  '/category-breakdown',
  [query('type').optional().isIn(['income', 'expense'])],
  validate,
  getCategoryBreakdown
);

router.get(
  '/monthly-trends',
  [query('year').optional().isInt({ min: 2000, max: 2100 }).withMessage('Year must be valid')],
  validate,
  getMonthlyTrends
);

router.get(
  '/recent-activity',
  [query('limit').optional().isInt({ min: 1, max: 50 })],
  validate,
  getRecentActivity
);

router.get('/weekly-trends', getWeeklyTrends);

export default router;
