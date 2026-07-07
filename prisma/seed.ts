import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import bcrypt from 'bcryptjs';
import 'dotenv/config';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Seeding database...');

  // 1. Create sample user
  const hashedPassword = await bcrypt.hash('test123', 10);
  const user = await prisma.user.upsert({
    where: { email: 'test@foliovega.com' },
    update: {},
    create: {
      email: 'test@foliovega.com',
      name: 'Test User',
      password: hashedPassword,
      consentGiven: true,
      consentDate: new Date(),
    },
  });
  console.log(`Created user: ${user.email} (${user.id})`);

  // 2. Create SchemeMaster entries with fund manager & risk data
  const schemes = [
    {
      schemeCode: '118531',
      schemeName: 'Franklin India Large Cap Fund',
      category: 'Large Cap',
      fundHouse: 'Franklin Templeton Mutual Fund',
      latestNav: 187.45,
      riskLevel: 'Moderate',
      volatility: 0.15,
      sharpeRatio: 1.2,
      sortinoRatio: 1.8,
      maxDrawdown: 0.25,
      maxDrawdownDuration: 180,
      alpha: 0.02,
      beta: 0.95,
      rSquared: 0.92,
      treynorRatio: 0.08,
      riskScore: 45,
      fundManagerName: 'Ravi Gopalakrishnan',
      fundManagerTenure: '8 years',
    },
    {
      schemeCode: '119060',
      schemeName: 'HDFC Mid-Cap Opportunities Fund',
      category: 'Mid Cap',
      fundHouse: 'HDFC Mutual Fund',
      latestNav: 165.28,
      riskLevel: 'High',
      volatility: 0.22,
      sharpeRatio: 1.5,
      sortinoRatio: 2.1,
      maxDrawdown: 0.32,
      maxDrawdownDuration: 210,
      alpha: 0.05,
      beta: 1.1,
      rSquared: 0.88,
      treynorRatio: 0.10,
      riskScore: 60,
      fundManagerName: 'Chirag Setalvad',
      fundManagerTenure: '12 years',
    },
    {
      schemeCode: '118550',
      schemeName: 'SBI Small Cap Fund',
      category: 'Small Cap',
      fundHouse: 'SBI Mutual Fund',
      latestNav: 156.75,
      riskLevel: 'Very High',
      volatility: 0.28,
      sharpeRatio: 1.8,
      sortinoRatio: 2.4,
      maxDrawdown: 0.38,
      maxDrawdownDuration: 250,
      alpha: 0.07,
      beta: 1.2,
      rSquared: 0.85,
      treynorRatio: 0.12,
      riskScore: 72,
      fundManagerName: 'R. Srinivasan',
      fundManagerTenure: '6 years',
    },
    {
      schemeCode: '118834',
      schemeName: 'DSP Flexi Cap Fund',
      category: 'Flexi Cap',
      fundHouse: 'DSP Mutual Fund',
      latestNav: 210.30,
      riskLevel: 'Moderate to High',
      volatility: 0.18,
      sharpeRatio: 1.3,
      sortinoRatio: 1.9,
      maxDrawdown: 0.22,
      maxDrawdownDuration: 150,
      alpha: 0.03,
      beta: 0.98,
      rSquared: 0.91,
      treynorRatio: 0.09,
      riskScore: 50,
      fundManagerName: 'Vinit Sambre',
      fundManagerTenure: '10 years',
    },
    {
      schemeCode: '119598',
      schemeName: 'Mirae Asset Large Cap Fund',
      category: 'Large Cap',
      fundHouse: 'Mirae Asset Mutual Fund',
      latestNav: 98.50,
      riskLevel: 'Moderate',
      volatility: 0.14,
      sharpeRatio: 1.1,
      sortinoRatio: 1.7,
      maxDrawdown: 0.20,
      maxDrawdownDuration: 140,
      alpha: 0.01,
      beta: 0.92,
      rSquared: 0.93,
      treynorRatio: 0.07,
      riskScore: 40,
      fundManagerName: 'Neelesh Surana',
      fundManagerTenure: '15 years',
    },
    {
      schemeCode: '120015',
      schemeName: 'Axis Bluechip Fund',
      category: 'Large Cap',
      fundHouse: 'Axis Mutual Fund',
      latestNav: 45.82,
      riskLevel: 'Moderate',
      volatility: 0.16,
      sharpeRatio: 1.0,
      sortinoRatio: 1.5,
      maxDrawdown: 0.23,
      maxDrawdownDuration: 160,
      alpha: 0.015,
      beta: 0.93,
      rSquared: 0.91,
      treynorRatio: 0.065,
      riskScore: 42,
      fundManagerName: 'Jinesh Gopani',
      fundManagerTenure: '9 years',
    },
    {
      schemeCode: '118625',
      schemeName: 'ICICI Prudential Value Discovery Fund',
      category: 'Flexi Cap',
      fundHouse: 'ICICI Prudential Mutual Fund',
      latestNav: 185.60,
      riskLevel: 'Moderate to High',
      volatility: 0.20,
      sharpeRatio: 1.4,
      sortinoRatio: 2.0,
      maxDrawdown: 0.28,
      maxDrawdownDuration: 190,
      alpha: 0.04,
      beta: 1.05,
      rSquared: 0.89,
      treynorRatio: 0.11,
      riskScore: 55,
      fundManagerName: 'Sankaran Naren',
      fundManagerTenure: '18 years',
    },
    {
      schemeCode: '119063',
      schemeName: 'Kotak Emerging Equity Fund',
      category: 'Mid Cap',
      fundHouse: 'Kotak Mahindra Mutual Fund',
      latestNav: 88.35,
      riskLevel: 'High',
      volatility: 0.24,
      sharpeRatio: 1.6,
      sortinoRatio: 2.2,
      maxDrawdown: 0.30,
      maxDrawdownDuration: 200,
      alpha: 0.055,
      beta: 1.15,
      rSquared: 0.87,
      treynorRatio: 0.11,
      riskScore: 65,
      fundManagerName: 'Harsha Upadhyaya',
      fundManagerTenure: '11 years',
    },
  ];

  for (const scheme of schemes) {
    await prisma.schemeMaster.upsert({
      where: { schemeCode: scheme.schemeCode },
      update: scheme,
      create: scheme,
    });
  }
  console.log(`Created ${schemes.length} SchemeMaster entries`);

  // 3. Create a portfolio with holdings & transactions
  let portfolio = await prisma.portfolio.findFirst({ where: { userId: user.id } });
  if (!portfolio) {
    portfolio = await prisma.portfolio.create({
      data: { userId: user.id, name: 'My Mutual Fund Portfolio' },
    });
  }
  console.log(`Portfolio: ${portfolio.id}`);

  // Create holdings and transactions
  const holdingsData = [
    { schemeCode: '118531', units: 50, amount: 5000, date: new Date('2024-01-15') },
    { schemeCode: '119060', units: 30, amount: 8000, date: new Date('2024-02-10') },
    { schemeCode: '118550', units: 25, amount: 6000, date: new Date('2024-03-05') },
    { schemeCode: '118834', units: 20, amount: 4000, date: new Date('2024-04-20') },
    { schemeCode: '119598', units: 40, amount: 3000, date: new Date('2024-05-12') },
    { schemeCode: '120015', units: 100, amount: 3500, date: new Date('2024-06-01') },
    { schemeCode: '118625', units: 35, amount: 7000, date: new Date('2024-07-08') },
    { schemeCode: '119063', units: 45, amount: 5500, date: new Date('2024-08-15') },
  ];

  for (const h of holdingsData) {
    let holding = await prisma.holding.findFirst({
      where: { portfolioId: portfolio.id, schemeCode: h.schemeCode },
    });
    if (holding) {
      holding = await prisma.holding.update({
        where: { id: holding.id },
        data: { units: h.units },
      });
    } else {
      holding = await prisma.holding.create({
        data: { portfolioId: portfolio.id, schemeCode: h.schemeCode, units: h.units },
      });
    }

    const existingTx = await prisma.transaction.findFirst({
      where: { holdingId: holding.id, type: 'BUY' },
    });
    if (!existingTx) {
      await prisma.transaction.create({
        data: {
          holdingId: holding.id,
          date: h.date,
          amount: h.amount,
          units: h.units,
          type: 'BUY',
        },
      });
    }
  }
  console.log(`Created/verified ${holdingsData.length} holdings with transactions`);

  console.log('\nSeed completed!');
  console.log('Login credentials: test@foliovega.com / test123');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
