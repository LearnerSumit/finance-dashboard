import Transaction from '../models/Transaction.js';

// GET /api/transactions — viewer, analyst, admin
export const getAllTransactions = async (req, res, next) => {
  try {
    const {
      type,
      category,
      startDate,
      endDate,
      minAmount,
      maxAmount,
      search,
      page = 1,
      limit = 10,
      sortBy = 'date',
      sortOrder = 'desc',
    } = req.query;

    const filter = {};

    if (type) filter.type = type;
    if (category) filter.category = category;

    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(endDate);
    }

    if (minAmount || maxAmount) {
      filter.amount = {};
      if (minAmount) filter.amount.$gte = Number(minAmount);
      if (maxAmount) filter.amount.$lte = Number(maxAmount);
    }

    if (search) {
      filter.description = { $regex: search, $options: 'i' };
    }

    const skip = (Number(page) - 1) * Number(limit);
    const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

    const [transactions, total] = await Promise.all([
      Transaction.find(filter)
        .populate('createdBy', 'name email role')
        .sort(sort)
        .skip(skip)
        .limit(Number(limit)),
      Transaction.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      total,
      page: Number(page),
      totalPages: Math.ceil(total / Number(limit)),
      transactions,
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/transactions/:id
export const getTransactionById = async (req, res, next) => {
  try {
    const transaction = await Transaction.findById(req.params.id).populate(
      'createdBy',
      'name email role'
    );

    if (!transaction) {
      return res.status(404).json({ success: false, message: 'Transaction not found' });
    }

    res.status(200).json({ success: true, transaction });
  } catch (error) {
    next(error);
  }
};

// POST /api/transactions — analyst, admin only
export const createTransaction = async (req, res, next) => {
  try {
    const { amount, type, category, date, description } = req.body;

    const transaction = await Transaction.create({
      amount,
      type,
      category,
      date: date || new Date(),
      description,
      createdBy: req.user._id,
    });

    await transaction.populate('createdBy', 'name email role');

    res.status(201).json({
      success: true,
      message: 'Transaction created successfully',
      transaction,
    });
  } catch (error) {
    next(error);
  }
};

// PUT /api/transactions/:id — analyst, admin only
export const updateTransaction = async (req, res, next) => {
  try {
    const { amount, type, category, date, description } = req.body;

    const transaction = await Transaction.findByIdAndUpdate(
      req.params.id,
      { amount, type, category, date, description },
      { new: true, runValidators: true }
    ).populate('createdBy', 'name email role');

    if (!transaction) {
      return res.status(404).json({ success: false, message: 'Transaction not found' });
    }

    res.status(200).json({
      success: true,
      message: 'Transaction updated successfully',
      transaction,
    });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/transactions/:id — admin only (soft delete)
export const deleteTransaction = async (req, res, next) => {
  try {
    const transaction = await Transaction.findByIdAndUpdate(
      req.params.id,
      { isDeleted: true, deletedAt: new Date() },
      { new: true }
    );

    if (!transaction) {
      return res.status(404).json({ success: false, message: 'Transaction not found' });
    }

    res.status(200).json({ success: true, message: 'Transaction deleted successfully' });
  } catch (error) {
    next(error);
  }
};
