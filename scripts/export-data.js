/**
 * LIKEFOOD - Export All Data Before Migration
 * Exports every table to JSON for re-import after schema reset
 * Run: node scripts/export-data.js
 */
require('dotenv').config({ path: '.env.local' });
if (!process.env.DATABASE_URL) require('dotenv').config({ path: '.env' });

const { PrismaClient } = require('../src/generated/client');
const fs = require('fs');
const path = require('path');
const prisma = new PrismaClient();

async function exportAll() {
  console.log('📦 LIKEFOOD - Export All Data\n');
  const data = {};

  try {
    // Core tables
    data.users = await prisma.user.findMany();
    data.verificationTokens = await prisma.verificationtoken.findMany();
    data.loginHistory = await prisma.loginhistory.findMany();
    data.activeSessions = await prisma.activesession.findMany();
    data.twoFactorTokens = await prisma.twofactortoken.findMany();
    data.addresses = await prisma.address.findMany();
    
    // Products
    data.brands = await prisma.brand.findMany();
    data.categories = await prisma.category.findMany();
    data.tags = await prisma.tag.findMany();
    data.products = await prisma.product.findMany();
    data.productTags = await prisma.producttag.findMany();
    data.productImages = await prisma.productimage.findMany();
    data.productMedia = await prisma.productmedia.findMany();
    data.productVariants = await prisma.productvariant.findMany();
    data.productViews = await prisma.productview.findMany();
    data.productSpecifications = await prisma.productspecification.findMany();
    data.productShipping = await prisma.productshipping.findMany();
    
    // Commerce
    data.carts = await prisma.cart.findMany();
    data.cartItems = await prisma.cartitem.findMany();
    data.orders = await prisma.order.findMany();
    data.orderItems = await prisma.orderitem.findMany();
    data.orderEvents = await prisma.orderevent.findMany();
    data.refundRequests = await prisma.refundrequest.findMany();
    data.reviews = await prisma.review.findMany();
    data.reviewMedia = await prisma.reviewmedia.findMany();
    data.coupons = await prisma.Coupon.findMany();
    data.userVouchers = await prisma.uservoucher.findMany();
    data.wishlists = await prisma.wishlist.findMany();
    data.pointTransactions = await prisma.pointtransaction.findMany();
    
    // Flash sales
    data.flashSaleCampaigns = await prisma.flashsalecampaign.findMany();
    data.flashSaleProducts = await prisma.flashsaleproduct.findMany();
    
    // Content
    data.notifications = await prisma.notification.findMany();
    data.banners = await prisma.banner.findMany();
    data.contactMessages = await prisma.contactmessage.findMany();
    data.systemSettings = await prisma.systemsetting.findMany();
    data.posts = await prisma.post.findMany();
    data.postImages = await prisma.postimage.findMany();
    data.productQAs = await prisma.productqa.findMany();
    data.newsletterSubscribers = await prisma.newslettersubscriber.findMany();
    data.emailQueue = await prisma.emailqueue.findMany();
    
    // AI/Analytics
    data.aiKnowledge = await prisma.AiKnowledge.findMany();
    data.behaviorEvents = await prisma.BehaviorEvent.findMany();
    data.conversationHistory = await prisma.ConversationHistory.findMany();
    data.dynamicPages = await prisma.DynamicPage.findMany();
    data.emailCampaigns = await prisma.emailcampaign.findMany();
    data.homepageSections = await prisma.HomepageSection.findMany();
    data.menuItems = await prisma.MenuItem.findMany();
    data.pushNotifications = await prisma.PushNotification.findMany();
    data.siteConfigs = await prisma.SiteConfig.findMany();
    data.userSegments = await prisma.UserSegment.findMany();
    
    // Referral system
    data.referralProfiles = await prisma.referralprofile.findMany();
    data.referralRelations = await prisma.referralrelation.findMany();
    data.referralCommissions = await prisma.referralcommission.findMany();
    data.referralMilestones = await prisma.referralmilestone.findMany();
    data.referralMilestoneRewards = await prisma.referralmilestonereward.findMany();
    data.referralCashouts = await prisma.referralcashout.findMany();
    data.referralAuditLogs = await prisma.referralauditlog.findMany();
    data.referralFraudSignals = await prisma.referralfraudsignal.findMany();
    data.referralWalletTxs = await prisma.referralwallettx.findMany();

    // Write to file
    const outPath = path.join(__dirname, 'exported-data.json');
    fs.writeFileSync(outPath, JSON.stringify(data, null, 2), 'utf-8');

    // Print summary
    console.log('📋 Export Summary:');
    let totalRecords = 0;
    for (const [table, records] of Object.entries(data)) {
      if (records.length > 0) {
        console.log(`  ✅ ${table}: ${records.length} records`);
      }
      totalRecords += records.length;
    }
    console.log(`\n🎯 Total: ${totalRecords} records exported`);
    console.log(`📁 Saved to: ${outPath}`);
    console.log('✅ Export complete!');
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

exportAll();
