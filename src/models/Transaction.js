import mongoose from 'mongoose';

const transactionSchema = new mongoose.Schema(
  {
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: [0.01, 'Amount must be greater than 0'],
    },
    type: {
      type: String,
      required: [true, 'Type is required'],
      enum: {
        values: ['income', 'expense'],
        message: 'Type must be income or expense',
      },
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      trim: true,
      enum: {
        values: [
          'salary',
          'freelance',
          'investment',
          'business',
          'other_income',
          'food',
          'transport',
          'utilities',
          'entertainment',
          'healthcare',
          'education',
          'shopping',
          'rent',
          'other_expense',
        ],
        message: 'Invalid category',
      },
    },
    date: {
      type: Date,
      required: [true, 'Date is required'],
      default: Date.now,
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters'],
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    isDeleted: {
      type: Boolean,
      default: false, // soft delete
    },
    deletedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Index for common query patterns
transactionSchema.index({ date: -1 });
transactionSchema.index({ type: 1, category: 1 });
transactionSchema.index({ createdBy: 1 });
transactionSchema.index({ isDeleted: 1 });

// Default filter: exclude soft-deleted records
transactionSchema.pre(/^find/, function (next) {
  if (this.getFilter().isDeleted === undefined) {
    this.where({ isDeleted: false });
  }
  next();
});

const Transaction = mongoose.model('Transaction', transactionSchema);
export default Transaction;
