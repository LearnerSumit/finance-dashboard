import { Router } from 'express';
import { body, param } from 'express-validator';
import {
  getAllUsers,
  getUserById,
  updateUserRole,
  updateUserStatus,
  deleteUser,
} from '../controllers/userController.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = Router();

// All user routes require authentication + admin role
router.use(authenticate, authorize('admin'));

router.get('/', getAllUsers);

router.get(
  '/:id',
  [param('id').isMongoId().withMessage('Invalid user ID')],
  validate,
  getUserById
);

router.patch(
  '/:id/role',
  [
    param('id').isMongoId().withMessage('Invalid user ID'),
    body('role')
      .isIn(['viewer', 'analyst', 'admin'])
      .withMessage('Role must be viewer, analyst, or admin'),
  ],
  validate,
  updateUserRole
);

router.patch(
  '/:id/status',
  [
    param('id').isMongoId().withMessage('Invalid user ID'),
    body('isActive').isBoolean().withMessage('isActive must be true or false'),
  ],
  validate,
  updateUserStatus
);

router.delete(
  '/:id',
  [param('id').isMongoId().withMessage('Invalid user ID')],
  validate,
  deleteUser
);

export default router;
