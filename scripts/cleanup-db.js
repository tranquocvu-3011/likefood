/**
 * LIKEFOOD - Database Cleanup Script
 * Removes expired tokens, old logs, and orphan data
 * Run: node scripts/cleanup-db.js
 */

const { PrismaClient } = require('../src/generated/client');
const prisma = new PrismaClient();

async function cleanup() {
  console.log('🧹 LIKEFOOD Database Cleanup\n');
  const results = {};

  try {
    // 1. Expired verification tokens
    const expiredVerif = await prisma.verificationtoken.deleteMany({
      where: { expires: { lt: new Date() } }
    });
    results['Expired verification tokens'] = expiredVerif.count;

    // 2. Expired 2FA tokens
    const expired2FA = await prisma.twofactortoken.deleteMany({
      where: { expires: { lt: new Date() } }
    });
    results['Expired 2FA tokens'] = expired2FA.count;

    // 3. Login history > 90 days
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
    const oldLogins = await prisma.loginhistory.deleteMany({
      where: { createdAt: { lt: ninetyDaysAgo } }
    });
    results['Old login history (>90d)'] = oldLogins.count;

    // 4. Behavior events > 60 days
    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);
    const oldBehavior = await prisma.BehaviorEvent.deleteMany({
      where: { createdAt: { lt: sixtyDaysAgo } }
    });
    results['Old behavior events (>60d)'] = oldBehavior.count;

    // 5. Conversation history > 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const oldConversations = await prisma.ConversationHistory.deleteMany({
      where: { createdAt: { lt: thirtyDaysAgo } }
    });
    results['Old conversations (>30d)'] = oldConversations.count;

    // 6. Read push notifications > 30 days
    const oldPushNotifs = await prisma.PushNotification.deleteMany({
      where: { readAt: { not: null }, sentAt: { lt: thirtyDaysAgo } }
    });
    results['Old read push notifications'] = oldPushNotifs.count;

    // 7. Sent email queue > 30 days
    const oldEmailQueue = await prisma.emailqueue.deleteMany({
      where: { status: 'SENT', createdAt: { lt: thirtyDaysAgo } }
    });
    results['Old sent email queue'] = oldEmailQueue.count;

    // 8. Expired active coupons → mark as inactive
    const expiredCoupons = await prisma.Coupon.updateMany({
      where: { isActive: true, endDate: { lt: new Date() } },
      data: { isActive: false }
    });
    results['Expired coupons deactivated'] = expiredCoupons.count;

    // 9. Cart items referencing deleted products
    const orphanCartItems = await prisma.cartitem.deleteMany({
      where: { product: { isDeleted: true } }
    });
    results['Orphan cart items (deleted products)'] = orphanCartItems.count;

    // 10. Empty carts (no items, created > 7 days ago)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const emptyCarts = await prisma.cart.deleteMany({
      where: {
        items: { none: {} },
        createdAt: { lt: sevenDaysAgo }
      }
    });
    results['Empty old carts'] = emptyCarts.count;

    // 11. Expired flash sale campaigns → deactivate
    const expiredFlashSales = await prisma.flashsalecampaign.updateMany({
      where: { isActive: true, endAt: { lt: new Date() } },
      data: { isActive: false }
    });
    results['Expired flash sales deactivated'] = expiredFlashSales.count;

    // 12. Old product views > 90 days (analytics data, keep recent)
    const oldProductViews = await prisma.productview.deleteMany({
      where: { createdAt: { lt: ninetyDaysAgo } }
    });
    results['Old product views (>90d)'] = oldProductViews.count;

    // Print results
    console.log('📋 Cleanup Results:');
    let totalCleaned = 0;
    for (const [action, count] of Object.entries(results)) {
      const icon = count > 0 ? '✅' : '⬜';
      console.log(`  ${icon} ${action}: ${count}`);
      totalCleaned += count;
    }
    console.log(`\n🎯 Total records cleaned: ${totalCleaned}`);
    console.log('✅ Cleanup complete!');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

cleanup();
