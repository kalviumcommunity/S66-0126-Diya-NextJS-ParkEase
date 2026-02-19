const { PrismaClient, UserRole, SlotStatus, BookingStatus } = require('@prisma/client');
const bcryptjs = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // ============================================
  // 1. Create or update admin user
  // ============================================
  const adminEmail = 'admin@parkease.com';
  const adminPasswordHash = await bcryptjs.hash('admin123', 10);

  const adminUser = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      passwordHash: adminPasswordHash,
      name: 'Admin User',
      role: UserRole.ADMIN,
    },
  });
  console.log(`✅ Admin user: ${adminUser.email} (ID: ${adminUser.id})`);

  // ============================================
  // 2. Create parking slots grid (5 rows × 10 columns)
  // ============================================
  const rows = 5;
  const cols = 10;
  const slotsToCreate = [];

  for (let row = 1; row <= rows; row++) {
    for (let col = 1; col <= cols; col++) {
      slotsToCreate.push({
        row,
        column: col,
        status: SlotStatus.AVAILABLE,
      });
    }
  }

  // Upsert slots (idempotent)
  let createdSlots = 0;
  for (const slot of slotsToCreate) {
    try {
      const result = await prisma.parkingSlot.upsert({
        where: { unique_slot_location: { row: slot.row, column: slot.column } },
        update: {},
        create: slot,
      });
      if (result) createdSlots++;
    } catch (e) {
      // Slot might already exist
    }
  }
  console.log(`✅ Parking slots: ${createdSlots}/${slotsToCreate.length} (5×10 grid)`);

  // ============================================
  // 3. Create test users
  // ============================================
  const testUsers = [];
  for (let i = 1; i <= 3; i++) {
    const email = `user${i}@parkease.com`;
    const hashedPassword = await bcryptjs.hash(`password${i}`, 10);

    const user = await prisma.user.upsert({
      where: { email },
      update: {},
      create: {
        email,
        passwordHash: hashedPassword,
        name: `Test User ${i}`,
        role: UserRole.USER,
      },
    });
    testUsers.push(user);
  }
  console.log(`✅ Test users created: ${testUsers.length}`);

  // ============================================
  // 4. Create sample bookings with future times
  // ============================================
  const now = new Date();
  const slotsForBooking = await prisma.parkingSlot.findMany({
    take: 3,
  });

  let bookingsCreated = 0;
  for (let i = 0; i < Math.min(testUsers.length, slotsForBooking.length); i++) {
    const startTime = new Date(now.getTime() + (i + 1) * 24 * 60 * 60 * 1000); // Future dates
    const endTime = new Date(startTime.getTime() + 2 * 60 * 60 * 1000); // 2 hours later

    try {
      const booking = await prisma.booking.create({
        data: {
          userId: testUsers[i].id,
          slotId: slotsForBooking[i].id,
          startTime,
          endTime,
          status: BookingStatus.CONFIRMED,
        },
      });

      if (booking) {
        // Update slot status to OCCUPIED for booked slots
        await prisma.parkingSlot.update({
          where: { id: slotsForBooking[i].id },
          data: { status: SlotStatus.OCCUPIED },
        });
        bookingsCreated++;
      }
    } catch (e) {
      // Booking might already exist
    }
  }
  console.log(`✅ Sample bookings created: ${bookingsCreated}`);

  // ============================================
  // 5. Create a few crowd reports
  // ============================================
  const slotsForCrowdReports = await prisma.parkingSlot.findMany({
    take: 3,
  });

  let crowdReportsCreated = 0;
  const crowdActions = ['OCCUPIED', 'LEFT', 'OCCUPIED'];

  for (let i = 0; i < slotsForCrowdReports.length; i++) {
    // Check if a recent report exists at this location
    const recentReport = await prisma.crowdReport.findFirst({
      where: {
        slotId: slotsForCrowdReports[i].id,
        timestamp: {
          gte: new Date(now.getTime() - 60 * 60 * 1000), // Last hour
        },
      },
    });

    if (!recentReport) {
      try {
        await prisma.crowdReport.create({
          data: {
            userId: testUsers[i % testUsers.length].id,
            slotId: slotsForCrowdReports[i].id,
            action: crowdActions[i],
          },
        });
        crowdReportsCreated++;
      } catch (e) {
        // Report might already exist
      }
    }
  }
  console.log(`✅ Crowd reports created: ${crowdReportsCreated}`);

  console.log('\n✨ Database seed completed successfully!');
  console.log('\n📊 Summary:');
  console.log(`   - Admin user: admin@parkease.com (password: admin123)`);
  console.log(`   - Parking slots: ${rows} rows × ${cols} columns`);
  console.log(`   - Test users: ${testUsers.length}`);
  console.log(`   - Sample bookings: ${bookingsCreated}`);
  console.log(`   - Crowd reports: ${crowdReportsCreated}`);
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
