import { PrismaClient, PlanTier, ScanEventType, ScanSeverity } from "../src/generated/client/index.js";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash("ParentSecurePass2026!", salt);
  const pinHash = await bcrypt.hash("654321", salt);

  const parent = await prisma.user.upsert({
    where: { email: "parent.demo@bastiodon.com" },
    update: {
      passwordHash,
      pinHash,
      plan: PlanTier.PRO
    },
    create: {
      email: "parent.demo@bastiodon.com",
      passwordHash,
      pinHash,
      plan: PlanTier.PRO
    }
  });

  const device = await prisma.childDevice.upsert({
    where: { pairingCode: "BST789" },
    update: {
      name: "Aarav's Study Laptop",
      browser: "Chrome 122 / Windows",
      deviceToken: "bst_token_aarav_laptop_secure_2026",
      isOnline: true,
      incognitoLocked: true,
      lastSeenAt: new Date()
    },
    create: {
      parentId: parent.id,
      name: "Aarav's Study Laptop",
      browser: "Chrome 122 / Windows",
      pairingCode: "BST789",
      deviceToken: "bst_token_aarav_laptop_secure_2026",
      isOnline: true,
      incognitoLocked: true,
      lastSeenAt: new Date()
    }
  });

  await prisma.blockingRule.upsert({
    where: { deviceId: device.id },
    update: {
      blockAdult: true,
      blockStreaming: true,
      blockGaming: false,
      scanChats: true,
      lockIncognito: true,
      customDomains: ["gambling.com", "bet365.com", "omega-chat.net"]
    },
    create: {
      deviceId: device.id,
      blockAdult: true,
      blockStreaming: true,
      blockGaming: false,
      scanChats: true,
      lockIncognito: true,
      customDomains: ["gambling.com", "bet365.com", "omega-chat.net"]
    }
  });

  const sampleEvents = [
    {
      deviceId: device.id,
      eventType: ScanEventType.BLOCKED_DOMAIN,
      source: "adult-content-blocked.com",
      snippet: "Blocked by adult category protection engine",
      severity: ScanSeverity.CRITICAL
    },
    {
      deviceId: device.id,
      eventType: ScanEventType.CHAT_ALERT,
      source: "Roblox In-Game Chat",
      snippet: 'Flagged message pattern: "what is your home address"',
      severity: ScanSeverity.WARNING
    },
    {
      deviceId: device.id,
      eventType: ScanEventType.SEARCH_ALERT,
      source: "Google Search",
      snippet: 'Query flagged: "how to bypass safe search restriction"',
      severity: ScanSeverity.WARNING
    },
    {
      deviceId: device.id,
      eventType: ScanEventType.INCOGNITO_ATTEMPT,
      source: "Chrome Browser Process",
      snippet: "Private browsing window intercepted and closed",
      severity: ScanSeverity.WARNING
    },
    {
      deviceId: device.id,
      eventType: ScanEventType.URL_VISIT,
      source: "khanacademy.org/math",
      snippet: "Algebra homework review session (45 minutes)",
      severity: ScanSeverity.SAFE
    },
    {
      deviceId: device.id,
      eventType: ScanEventType.URL_VISIT,
      source: "wikipedia.org/wiki/Science",
      snippet: "Physics textbook chapter reference reading",
      severity: ScanSeverity.SAFE
    }
  ];

  await prisma.scanEvent.deleteMany({ where: { deviceId: device.id } });
  for (const ev of sampleEvents) {
    await prisma.scanEvent.create({ data: ev });
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const hourlyMatrix = [0, 0, 0, 0, 0, 1, 2, 3, 2, 2, 1, 2, 3, 4, 4, 3, 2, 3, 4, 4, 3, 2, 1, 0];
  const categorySplit = {
    study: 64,
    safeBrowsing: 24,
    blockedThreats: 12
  };

  await prisma.dailySummary.upsert({
    where: {
      deviceId_date: {
        deviceId: device.id,
        date: today
      }
    },
    update: {
      totalHours: 4.8,
      domainReach: 10200,
      hourlyActivityJson: hourlyMatrix,
      categoryBreakdownJson: categorySplit,
      blocksCount: 14,
      alertsCount: 2
    },
    create: {
      deviceId: device.id,
      date: today,
      totalHours: 4.8,
      domainReach: 10200,
      hourlyActivityJson: hourlyMatrix,
      categoryBreakdownJson: categorySplit,
      blocksCount: 14,
      alertsCount: 2
    }
  });

  console.log("Seeding completed successfully for user:", parent.email);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
