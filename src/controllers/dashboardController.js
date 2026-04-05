import Transaction from '../models/Transaction.js';

// GET /api/dashboard/summary
export const getSummary = async (req, res, next) => {
  try {
    const result = await Transaction.aggregate([
      { $match: { isDeleted: false } },
      {
        $group: {
          _id: '$type',
          total: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
    ]);

    let totalIncome = 0;
    let totalExpenses = 0;
    let incomeCount = 0;
    let expenseCount = 0;

    result.forEach((item) => {
      if (item._id === 'income') {
        totalIncome = item.total;
        incomeCount = item.count;
      } else {
        totalExpenses = item.total;
        expenseCount = item.count;
      }
    });

    res.status(200).json({
      success: true,
      summary: {
        totalIncome: parseFloat(totalIncome.toFixed(2)),
        totalExpenses: parseFloat(totalExpenses.toFixed(2)),
        netBalance: parseFloat((totalIncome - totalExpenses).toFixed(2)),
        totalTransactions: incomeCount + expenseCount,
        incomeCount,
        expenseCount,
      },
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/dashboard/category-breakdown
export const getCategoryBreakdown = async (req, res, next) => {
  try {
    const { type } = req.query; // optional filter by type
    const matchStage = { isDeleted: false };
    if (type) matchStage.type = type;

    const breakdown = await Transaction.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: { type: '$type', category: '$category' },
          total: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
      { $sort: { total: -1 } },
      {
        $project: {
          _id: 0,
          type: '$_id.type',
          category: '$_id.category',
          total: { $round: ['$total', 2] },
          count: 1,
        },
      },
    ]);

    res.status(200).json({ success: true, breakdown });
  } catch (error) {
    next(error);
  }
};

// GET /api/dashboard/monthly-trends
export const getMonthlyTrends = async (req, res, next) => {
  try {
    const { year = new Date().getFullYear() } = req.query;

    const trends = await Transaction.aggregate([
      {
        $match: {
          isDeleted: false,
          date: {
            $gte: new Date(`${year}-01-01`),
            $lte: new Date(`${year}-12-31T23:59:59`),
          },
        },
      },
      {
        $group: {
          _id: { month: { $month: '$date' }, type: '$type' },
          total: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.month': 1 } },
      {
        $project: {
          _id: 0,
          month: '$_id.month',
          type: '$_id.type',
          total: { $round: ['$total', 2] },
          count: 1,
        },
      },
    ]);

    // Shape into {month, income, expense} per month for easy frontend consumption
    const monthMap = {};
    trends.forEach(({ month, type, total, count }) => {
      if (!monthMap[month]) monthMap[month] = { month, income: 0, expense: 0, incomeCount: 0, expenseCount: 0 };
      monthMap[month][type] = total;
      monthMap[month][`${type}Count`] = count;
    });

    const formatted = Object.values(monthMap).sort((a, b) => a.month - b.month);

    res.status(200).json({ success: true, year: Number(year), trends: formatted });
  } catch (error) {
    next(error);
  }
};

// GET /api/dashboard/recent-activity
export const getRecentActivity = async (req, res, next) => {
  try {
    const { limit = 5 } = req.query;

    const recent = await Transaction.find()
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 })
      .limit(Number(limit));

    res.status(200).json({ success: true, recent });
  } catch (error) {
    next(error);
  }
};

// GET /api/dashboard/weekly-trends
export const getWeeklyTrends = async (req, res, next) => {
  try {
    // Last 8 weeks
    const eightWeeksAgo = new Date();
    eightWeeksAgo.setDate(eightWeeksAgo.getDate() - 56);

    const trends = await Transaction.aggregate([
      {
        $match: {
          isDeleted: false,
          date: { $gte: eightWeeksAgo },
        },
      },
      {
        $group: {
          _id: {
            week: { $isoWeek: '$date' },
            year: { $isoWeekYear: '$date' },
            type: '$type',
          },
          total: { $sum: '$amount' },
        },
      },
      { $sort: { '_id.year': 1, '_id.week': 1 } },
      {
        $project: {
          _id: 0,
          week: '$_id.week',
          year: '$_id.year',
          type: '$_id.type',
          total: { $round: ['$total', 2] },
        },
      },
    ]);

    res.status(200).json({ success: true, trends });
  } catch (error) {
    next(error);
  }
};
