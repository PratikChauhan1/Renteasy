const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Clean existing data
  await prisma.notification.deleteMany({});
  await prisma.document.deleteMany({});
  await prisma.complaint.deleteMany({});
  await prisma.payment.deleteMany({});
  await prisma.rentCycle.deleteMany({});
  await prisma.room.deleteMany({});
  await prisma.announcement.deleteMany({});
  await prisma.property.deleteMany({});
  await prisma.tenantProfile.deleteMany({});
  await prisma.ownerProfile.deleteMany({});
  await prisma.user.deleteMany({});

  console.log('Cleared existing data.');

  // Create hashed password
  const hashedPassword = await bcrypt.hash('password', 10);

  // 1. Create Landlord
  const ownerUser = await prisma.user.create({
    data: {
      email: 'owner@example.com',
      password: hashedPassword,
      name: 'Rajesh Kumar',
      phone: '+919876543210',
      role: 'OWNER',
      ownerProfile: {
        create: {
          upiId: 'rajesh@paytm',
          upiName: 'Rajesh Kumar',
          upiQrCode: '/uploads/mock-qr.png',
        },
      },
    },
    include: { ownerProfile: true },
  });
  console.log('Created owner user:', ownerUser.email);

  // 2. Create Property
  const property = await prisma.property.create({
    data: {
      name: 'Greenwood Residency',
      address: 'Sector 62, Noida, Uttar Pradesh, 201301',
      ownerId: ownerUser.ownerProfile.id,
    },
  });
  console.log('Created property:', property.name);

  // 3. Create Rooms
  const room101 = await prisma.room.create({
    data: {
      number: '101',
      propertyId: property.id,
      capacity: 2,
      baseRent: 8000,
      inviteCode: 'JOIN101',
    },
  });

  const room102 = await prisma.room.create({
    data: {
      number: '102',
      propertyId: property.id,
      capacity: 1,
      baseRent: 12000,
      type: 'HOUSE',
      inviteCode: 'JOIN102',
    },
  });

  const room103 = await prisma.room.create({
    data: {
      number: '103',
      propertyId: property.id,
      capacity: 4,
      baseRent: 5000,
      inviteCode: 'JOIN103',
    },
  });
  console.log('Created rooms 101, 102, 103');

  // 4. Create Tenant User
  const tenantUser = await prisma.user.create({
    data: {
      email: 'tenant@example.com',
      password: hashedPassword,
      name: 'Amit Sharma',
      phone: '+918765432109',
      role: 'TENANT',
      tenantProfile: {
        create: {
          roomId: room101.id,
        },
      },
    },
    include: { tenantProfile: true },
  });
  console.log('Created tenant user:', tenantUser.email);

  // 5. Create Rent Cycle (Invoice)
  const rentCycle = await prisma.rentCycle.create({
    data: {
      tenantId: tenantUser.tenantProfile.id,
      billingMonth: '2026-07',
      baseRent: 8000,
      electricity: 750,
      water: 150,
      motorCharge: 200,
      otherBills: 100,
      otherBillsNotes: 'Internet charge',
      customCharges: [
        { label: 'Cleaning Maintenance', amount: 300 }
      ],
      totalAmount: 9500, // 8000 + 750 + 150 + 200 + 100 + 300
      status: 'PENDING',
      dueDate: new Date('2026-07-25T18:30:00.000Z'),
    },
  });
  console.log('Created active rent cycle invoice for Amit Sharma');

  // 6. Create Complaint
  await prisma.complaint.create({
    data: {
      tenantId: tenantUser.tenantProfile.id,
      title: 'Leakage in bathroom tap',
      description: 'The washbasin tap has been leaking since yesterday. It is wasting water and creating a mess.',
      category: 'Plumbing',
      urgency: 'MEDIUM',
      status: 'PENDING',
    },
  });
  console.log('Created pending complaint');

  // 7. Create Announcement
  await prisma.announcement.create({
    data: {
      propertyId: property.id,
      title: 'Monthly Lift Maintenance',
      content: 'Please note that the lift will be shut down for routine maintenance on Sunday, July 20th from 10:00 AM to 1:00 PM. Kindly plan accordingly.',
    },
  });
  console.log('Created announcement');

  // 8. Create Notification for tenant
  await prisma.notification.create({
    data: {
      receiverId: tenantUser.id,
      title: 'Rent Generated',
      message: 'Your rent invoice for July 2026 of ₹9,000 has been generated. Due date is July 25, 2026.',
    },
  });
  console.log('Created notification');

  console.log('Database seeding finished successfully!');
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
