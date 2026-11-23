const { PrismaClient } = require('./dist-client');
const prisma = new PrismaClient();

module.exports = { prisma };

