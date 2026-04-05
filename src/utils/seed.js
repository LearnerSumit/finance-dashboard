import 'dotenv/config';
import mongoose from 'mongoose';
import connectDB from '../config/db.js';
import User from '../models/User.js';
import Transaction from '../models/Transaction.js';

const users = [
  { name: 'Alice Admin', email: 'admin@demo.com', password: 'password123', role: 'admin' },
  { name: 'Annie Analyst', email: 'analyst@demo.com', password: 'password123', role: 'analyst' },
  { name: 'Victor Viewer', email: 'viewer@demo.com', password: 'password123', role: 'viewer' },
];

const categories = {
  income: ['salary', 'freelance', 'investment', 'business', 'other_income'],
  expense: ['food', 'transport', 'utilities', 'entertainment', 'healthcare', 'education', 'shopping', 'rent'],
};

const randomBetween = (min, max) => parseFloat((Math.random() * (max - min) + min).toFixed(2));

const randomDate = (monthsBack) => {
  const d = new Date();
  d.setMonth(d.getMonth() - Math.floor(Math.random() * monthsBack));
  d.setDate(Math.floor(Math.random() * 28) + 1);
  return d;
};

const seed = async () => {
  try {
    await connectDB();

    // Clean up
    await User.deleteMany({});
    await Transaction.deleteMany({});
    console.log('🧹 Cleared existing data');

    // Create users
    const createdUsers = await User.create(users);
    console.log('👥 Created users:', createdUsers.map((u) => `${u.name} (${u.role})`).join(', '));

    const adminUser = createdUsers.find((u) => u.role === 'admin');

    // Generate 50 transactions across the last 6 months
    const transactions = [];
    for (let i = 0; i < 50; i++) {
      const type = Math.random() > 0.45 ? 'expense' : 'income';
      const categoryList = categories[type];
      const category = categoryList[Math.floor(Math.random() * categoryList.length)];

      transactions.push({
        amount: type === 'income' ? randomBetween(500, 8000) : randomBetween(20, 2000),
        type,
        category,
        date: randomDate(6),
        description: `${type === 'income' ? 'Received' : 'Paid for'} ${category.replace('_', ' ')}`,
        createdBy: adminUser._id,
      });
    }

    await Transaction.create(transactions);
    console.log(`💰 Created ${transactions.length} transactions`);

    console.log('\n✅ Seed complete! Test credentials:');
    console.log('   admin@demo.com   / password123  (admin)');
    console.log('   analyst@demo.com / password123  (analyst)');
    console.log('   viewer@demo.com  / password123  (viewer)');

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('❌ Seed failed:', err.message);
    process.exit(1);
  }
};

seed();
