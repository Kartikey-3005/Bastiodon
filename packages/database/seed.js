const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Seeding Subscription Plans...');
  
  await prisma.subscriptionPlan.upsert({
    where: { tier: 'BASIC' },
    update: {},
    create: {
      name: 'Basic Shield',
      tier: 'BASIC',
      priceInr: 199,
      maxDevices: 1,
      popular: false,
      featuresJson: JSON.stringify([
        '1 Child Laptop / Browser Protected',
        'Real-time Adult & Porn Filter',
        'Live Web Navigation Log Feed',
        'Daily EOD Summary Reports',
        'Standard Tamper Protection PIN'
      ])
    }
  });

  await prisma.subscriptionPlan.upsert({
    where: { tier: 'PRO' },
    update: {},
    create: {
      name: 'Pro Guardian',
      tier: 'PRO',
      priceInr: 499,
      maxDevices: 3,
      popular: true,
      featuresJson: JSON.stringify([
        'Up to 3 Child Devices Protected',
        'Everything in Basic Shield',
        'Live In-Game & Web Chat Content Scanner',
        'Streaming & Gaming App Blocker',
        'Strict Incognito Mode Hard-Lock',
        'Instant Critical Threat SMS/Toast Alerts'
      ])
    }
  });

  await prisma.subscriptionPlan.upsert({
    where: { tier: 'ULTIMATE' },
    update: {},
    create: {
      name: 'Family Ultimate',
      tier: 'ULTIMATE',
      priceInr: 899,
      maxDevices: 10,
      popular: false,
      featuresJson: JSON.stringify([
        'Up to 10 Child Devices Monitored',
        'Everything in Pro Guardian',
        'Custom Keyword Dictionary Scanner',
        'Full Windows Registry System Hardening',
        'Priority 24/7 Safety Dispatch Desk',
        'Unlimited Historical EOD Archives'
      ])
    }
  });

  console.log('Database seeded successfully with Subscription Plans.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

