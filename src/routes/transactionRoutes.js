import { Router } from "express";
import { body, param, query } from "express-validator";
import {
  getAllTransactions,
  getTransactionById,
  createTransaction,
  updateTransaction,
  deleteTransaction,
} from "../controllers/transactionController.js";
import { authenticate, authorize } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";

const router = Router();

const VALID_CATEGORIES = [
  "salary",
  "freelance",
  "investment",
  "business",
  "other_income",
  "food",
  "transport",
  "utilities",
  "entertainment",
  "healthcare",
  "education",
  "shopping",
  "rent",
  "other_expense",
];

const transactionBodyRules = [
  body("amount")
    .isFloat({ gt: 0 })
    .withMessage("Amount must be a positive number"),
  body("type")
    .isIn(["income", "expense"])
    .withMessage("Type must be income or expense"),
  body("category").isIn(VALID_CATEGORIES).withMessage("Invalid category"),
  body("date")
    .optional()
    .isISO8601()
    .withMessage("Date must be a valid ISO date"),
  body("description").optional().trim().isLength({ max: 500 }),
];

// All transaction routes require authentication
router.use(authenticate);

router.get(
  "/",
  [
    query("page")
      .optional()
      .isInt({ min: 1 })
      .withMessage("Page must be a positive integer"),
    query("limit")
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage("Limit must be 1-100"),
    query("type").optional().isIn(["income", "expense"]),
    query("category").optional().isIn(VALID_CATEGORIES),
    query("startDate").optional().isISO8601(),
    query("endDate").optional().isISO8601(),
    query("minAmount").optional().isFloat({ gt: 0 }),
    query("maxAmount").optional().isFloat({ gt: 0 }),
  ],
  validate,
  getAllTransactions,
);

router.get(
  "/:id",
  [param("id").isMongoId().withMessage("Invalid transaction ID")],
  validate,
  getTransactionById,
);

// Viewers cannot create or modify transactions
router.post(
  "/",
  authorize("analyst", "admin"),
  transactionBodyRules,
  validate,
  createTransaction,
);

router.put(
  "/:id",
  authorize("analyst", "admin"),
  [
    param("id").isMongoId().withMessage("Invalid transaction ID"),
    ...transactionBodyRules,
  ],
  validate,
  updateTransaction,
);

// Only admin can delete (soft delete)
router.delete(
  "/:id",
  authorize("admin"),
  [param("id").isMongoId().withMessage("Invalid transaction ID")],
  validate,
  deleteTransaction,
);

export default router;
