/**
 * LIKEFOOD - Import Data After Schema Migration
 * Imports exported JSON data into the new Int-ID schema
 * Run: node scripts/import-data.js
 */
require('dotenv').config({ path: '.env.local' });
if (!process.env.DATABASE_URL) require('dotenv').config({ path: '.env' });

const { PrismaClient } = require('../src/generated/client');
const fs = require('fs');
const path = require('path');
const prisma = new PrismaClient();

async function importAll() {
  console.log('📥 LIKEFOOD - Import Data\n');

  const dataPath = path.join(__dirname, 'exported-data.json');
  if (!fs.existsSync(dataPath)) {
    console.error('❌ exported-data.json not found!');
    return;
  }

  const raw = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
  
  // Build old-ID → new-ID mappings
  const idMap = {
    users: new Map(),
    brands: new Map(),
    categories: new Map(),
    tags: new Map(),
    products: new Map(),
    productVariants: new Map(),
    productImages: new Map(),
    carts: new Map(),
    cartItems: new Map(),
    orders: new Map(),
    orderItems: new Map(),
    coupons: new Map(),
    posts: new Map(),
    reviews: new Map(),
    flashSaleCampaigns: new Map(),
    notifications: new Map(),
    systemSettings: new Map(),
    contactMessages: new Map(),
    referralProfiles: new Map(),
    referralRelations: new Map(),
    referralMilestones: new Map(),
  };

  let imported = 0;
  let errors = 0;

  async function importTable(name, records, createFn) {
    if (!records || records.length === 0) return;
    for (const record of records) {
      try {
        await createFn(record);
        imported++;
      } catch (err) {
        errors++;
        console.error(`  ⚠️ ${name}: ${err.message.split('\n')[0]}`);
      }
    }
    console.log(`  ✅ ${name}: ${records.length} records`);
  }

  try {
    // 1. Users (must be first due to FK dependencies)
    await importTable('users', raw.users, async (u) => {
      const created = await prisma.user.create({
        data: {
          email: u.email,
          password: u.password,
          name: u.name,
          role: u.role === 'SUPER_ADMIN' ? 'ADMIN' : u.role,
          emailVerified: u.emailVerified,
          image: u.image,
          phone: u.phone,
          avatarUrl: u.avatarUrl,
          lastCheckIn: u.lastCheckIn,
          points: u.points || 0,
          twoFactorEnabled: u.twoFactorEnabled || false,
          failedLoginAttempts: u.failedLoginAttempts || 0,
          lockedUntil: u.lockedUntil,
          notificationPreferences: u.notificationPreferences,
          createdAt: new Date(u.createdAt),
          updatedAt: new Date(u.updatedAt),
        }
      });
      idMap.users.set(u.id, created.id);
    });

    // 2. Brands
    await importTable('brands', raw.brands, async (b) => {
      const created = await prisma.brand.create({
        data: {
          name: b.name, nameEn: b.nameEn, slug: b.slug,
          logo: b.logo, isActive: b.isActive,
          createdAt: new Date(b.createdAt), updatedAt: new Date(b.updatedAt),
        }
      });
      idMap.brands.set(b.id, created.id);
    });

    // 3. Categories (handle parentId)
    // First pass: create all without parentId
    for (const c of raw.categories || []) {
      const created = await prisma.category.create({
        data: {
          name: c.name, nameEn: c.nameEn, slug: c.slug,
          description: c.description, descriptionEn: c.descriptionEn,
          imageUrl: c.imageUrl, position: c.position,
          isVisible: c.isVisible, isActive: c.isActive,
          createdAt: new Date(c.createdAt), updatedAt: new Date(c.updatedAt),
        }
      });
      idMap.categories.set(c.id, created.id);
      imported++;
    }
    // Second pass: update parentIds
    for (const c of raw.categories || []) {
      if (c.parentId && idMap.categories.has(c.parentId)) {
        await prisma.category.update({
          where: { id: idMap.categories.get(c.id) },
          data: { parentId: idMap.categories.get(c.parentId) }
        });
      }
    }
    if (raw.categories?.length) console.log(`  ✅ categories: ${raw.categories.length} records`);

    // 4. Tags
    await importTable('tags', raw.tags, async (t) => {
      const created = await prisma.tag.create({
        data: {
          name: t.name, nameEn: t.nameEn, slug: t.slug,
          isActive: t.isActive,
          createdAt: new Date(t.createdAt), updatedAt: new Date(t.updatedAt),
        }
      });
      idMap.tags.set(t.id, created.id);
    });

    // 5. Products
    await importTable('products', raw.products, async (p) => {
      const created = await prisma.product.create({
        data: {
          name: p.name, nameEn: p.nameEn, slug: p.slug,
          description: p.description, descriptionEn: p.descriptionEn,
          price: p.price, salePrice: p.salePrice,
          saleStartAt: p.saleStartAt ? new Date(p.saleStartAt) : null,
          saleEndAt: p.saleEndAt ? new Date(p.saleEndAt) : null,
          isOnSale: p.isOnSale, badgeText: p.badgeText, badgeTextEn: p.badgeTextEn,
          image: p.image, category: p.category,
          categoryId: p.categoryId ? idMap.categories.get(p.categoryId) || null : null,
          inventory: p.inventory, featured: p.featured, isVisible: p.isVisible,
          brandId: p.brandId ? idMap.brands.get(p.brandId) || null : null,
          originalPrice: p.originalPrice, tags: p.tags,
          ratingAvg: p.ratingAvg, ratingCount: p.ratingCount, soldCount: p.soldCount,
          code: p.code, weight: p.weight, weightEn: p.weightEn,
          deletedAt: p.deletedAt ? new Date(p.deletedAt) : null,
          isDeleted: p.isDeleted,
          createdAt: new Date(p.createdAt), updatedAt: new Date(p.updatedAt),
        }
      });
      idMap.products.set(p.id, created.id);
    });

    // 6. Product Tags
    await importTable('productTags', raw.productTags, async (pt) => {
      const productId = idMap.products.get(pt.productId);
      const tagId = idMap.tags.get(pt.tagId);
      if (productId && tagId) {
        await prisma.producttag.create({ data: { productId, tagId, createdAt: new Date(pt.createdAt) } });
      }
    });

    // 7. Product Images
    await importTable('productImages', raw.productImages, async (pi) => {
      const productId = idMap.products.get(pi.productId);
      if (productId) {
        const created = await prisma.productimage.create({
          data: { productId, imageUrl: pi.imageUrl, altText: pi.altText, order: pi.order, isPrimary: pi.isPrimary, createdAt: new Date(pi.createdAt), updatedAt: new Date(pi.updatedAt) }
        });
        idMap.productImages.set(pi.id, created.id);
      }
    });

    // 8. Product Variants
    await importTable('productVariants', raw.productVariants, async (pv) => {
      const productId = idMap.products.get(pv.productId);
      if (productId) {
        const created = await prisma.productvariant.create({
          data: {
            productId, weight: pv.weight, weightEn: pv.weightEn,
            flavor: pv.flavor, flavorEn: pv.flavorEn,
            priceAdjustment: pv.priceAdjustment, stock: pv.stock,
            sku: pv.sku, isActive: pv.isActive,
            createdAt: new Date(pv.createdAt), updatedAt: new Date(pv.updatedAt),
          }
        });
        idMap.productVariants.set(pv.id, created.id);
      }
    });

    // 9. Product Specifications
    await importTable('productSpecifications', raw.productSpecifications, async (ps) => {
      const productId = idMap.products.get(ps.productId);
      if (productId) {
        await prisma.productspecification.create({
          data: { productId, key: ps.key, keyEn: ps.keyEn, value: ps.value, valueEn: ps.valueEn, order: ps.order, createdAt: new Date(ps.createdAt), updatedAt: new Date(ps.updatedAt) }
        });
      }
    });

    // 10. Product Shipping
    await importTable('productShipping', raw.productShipping, async (ps) => {
      const productId = idMap.products.get(ps.productId);
      if (productId) {
        await prisma.productshipping.create({
          data: { productId, weight: ps.weight, length: ps.length, width: ps.width, height: ps.height, freeShipMin: ps.freeShipMin, shippingFee: ps.shippingFee, estimatedDays: ps.estimatedDays, createdAt: new Date(ps.createdAt), updatedAt: new Date(ps.updatedAt) }
        });
      }
    });

    // 11. Product Media
    await importTable('productMedia', raw.productMedia, async (pm) => {
      const productId = idMap.products.get(pm.productId);
      if (productId) {
        await prisma.productmedia.create({
          data: { productId, type: pm.type, url: pm.url, order: pm.order, isCover: pm.isCover, createdAt: new Date(pm.createdAt), updatedAt: new Date(pm.updatedAt) }
        });
      }
    });

    // 12. Coupons
    await importTable('coupons', raw.coupons, async (c) => {
      const created = await prisma.Coupon.create({
        data: {
          code: c.code, discountType: c.discountType, discountValue: c.discountValue,
          minOrderValue: c.minOrderValue, maxDiscount: c.maxDiscount,
          startDate: new Date(c.startDate), endDate: new Date(c.endDate),
          isActive: c.isActive, usageLimit: c.usageLimit, usedCount: c.usedCount,
          category: c.category,
          createdAt: new Date(c.createdAt), updatedAt: new Date(c.updatedAt),
        }
      });
      idMap.coupons.set(c.id, created.id);
    });

    // 13. Orders
    await importTable('orders', raw.orders, async (o) => {
      const userId = idMap.users.get(o.userId);
      if (userId) {
        const created = await prisma.order.create({
          data: {
            userId, status: o.status, subtotal: o.subtotal, shippingFee: o.shippingFee,
            discount: o.discount, total: o.total, couponCode: o.couponCode,
            shippingAddress: o.shippingAddress, shippingCity: o.shippingCity,
            shippingZipCode: o.shippingZipCode, shippingPhone: o.shippingPhone,
            shippingMethod: o.shippingMethod, carrier: o.carrier, trackingCode: o.trackingCode,
            shippedAt: o.shippedAt ? new Date(o.shippedAt) : null,
            deliveredAt: o.deliveredAt ? new Date(o.deliveredAt) : null,
            paymentMethod: o.paymentMethod, paymentStatus: o.paymentStatus,
            paymentIntentId: o.paymentIntentId, notes: o.notes,
            pointsDiscount: o.pointsDiscount, pointsUsed: o.pointsUsed,
            createdAt: new Date(o.createdAt), updatedAt: new Date(o.updatedAt),
          }
        });
        idMap.orders.set(o.id, created.id);
      }
    });

    // 14. Order Items
    await importTable('orderItems', raw.orderItems, async (oi) => {
      const orderId = idMap.orders.get(oi.orderId);
      const productId = idMap.products.get(oi.productId);
      if (orderId && productId) {
        const created = await prisma.orderitem.create({
          data: {
            orderId, productId,
            variantId: oi.variantId ? idMap.productVariants.get(oi.variantId) || null : null,
            quantity: oi.quantity, price: oi.price,
            nameSnapshot: oi.nameSnapshot, skuSnapshot: oi.skuSnapshot,
            createdAt: new Date(oi.createdAt),
          }
        });
        idMap.orderItems.set(oi.id, created.id);
      }
    });

    // 15. Order Events
    await importTable('orderEvents', raw.orderEvents, async (oe) => {
      const orderId = idMap.orders.get(oe.orderId);
      if (orderId) {
        await prisma.orderevent.create({
          data: { orderId, status: oe.status, note: oe.note, createdAt: new Date(oe.createdAt) }
        });
      }
    });

    // 16. Notifications
    await importTable('notifications', raw.notifications, async (n) => {
      const userId = idMap.users.get(n.userId);
      if (userId) {
        await prisma.notification.create({
          data: { userId, type: n.type, title: n.title, message: n.message, link: n.link, isRead: n.isRead, createdAt: new Date(n.createdAt) }
        });
      }
    });

    // 17. System Settings
    await importTable('systemSettings', raw.systemSettings, async (s) => {
      await prisma.systemsetting.create({
        data: { key: s.key, value: s.value, createdAt: new Date(s.createdAt), updatedAt: new Date(s.updatedAt) }
      });
    });

    // 18. Posts
    await importTable('posts', raw.posts, async (p) => {
      const created = await prisma.post.create({
        data: {
          title: p.title, titleEn: p.titleEn, slug: p.slug,
          summary: p.summary, summaryEn: p.summaryEn,
          content: p.content, contentEn: p.contentEn,
          image: p.image, authorName: p.authorName,
          category: p.category, categoryEn: p.categoryEn,
          isPublished: p.isPublished,
          publishedAt: new Date(p.publishedAt),
          createdAt: new Date(p.createdAt), updatedAt: new Date(p.updatedAt),
        }
      });
      idMap.posts.set(p.id, created.id);
    });

    // 19. Post Images
    await importTable('postImages', raw.postImages, async (pi) => {
      const postId = idMap.posts.get(pi.postId);
      if (postId) {
        await prisma.postimage.create({
          data: { postId, imageUrl: pi.imageUrl, altText: pi.altText, order: pi.order, createdAt: new Date(pi.createdAt) }
        });
      }
    });

    // 20. Wishlists
    await importTable('wishlists', raw.wishlists, async (w) => {
      const userId = idMap.users.get(w.userId);
      const productId = idMap.products.get(w.productId);
      if (userId && productId) {
        await prisma.wishlist.create({
          data: { userId, productId, createdAt: new Date(w.createdAt) }
        });
      }
    });

    // 21. Addresses
    await importTable('addresses', raw.addresses, async (a) => {
      const userId = idMap.users.get(a.userId);
      if (userId) {
        await prisma.address.create({
          data: {
            userId, fullName: a.fullName, phone: a.phone, address: a.address,
            city: a.city, state: a.state, zipCode: a.zipCode, country: a.country,
            isDefault: a.isDefault,
            createdAt: new Date(a.createdAt), updatedAt: new Date(a.updatedAt),
          }
        });
      }
    });

    // 22. User Vouchers
    await importTable('userVouchers', raw.userVouchers, async (uv) => {
      const userId = idMap.users.get(uv.userId);
      const couponId = idMap.coupons.get(uv.couponId);
      if (userId && couponId) {
        await prisma.uservoucher.create({
          data: { userId, couponId, status: uv.status, claimedAt: new Date(uv.claimedAt), usedAt: uv.usedAt ? new Date(uv.usedAt) : null }
        });
      }
    });

    // 23. Point Transactions
    await importTable('pointTransactions', raw.pointTransactions, async (pt) => {
      const userId = idMap.users.get(pt.userId);
      if (userId) {
        await prisma.pointtransaction.create({
          data: { userId, amount: pt.amount, type: pt.type, description: pt.description, orderId: pt.orderId ? idMap.orders.get(pt.orderId) : null, createdAt: new Date(pt.createdAt) }
        });
      }
    });

    // 24. Login History
    await importTable('loginHistory', raw.loginHistory, async (lh) => {
      const userId = idMap.users.get(lh.userId);
      if (userId) {
        await prisma.loginhistory.create({
          data: { userId, ipAddress: lh.ipAddress, userAgent: lh.userAgent, country: lh.country, city: lh.city, isSuspicious: lh.isSuspicious, createdAt: new Date(lh.createdAt) }
        });
      }
    });

    // 25. Contact Messages
    await importTable('contactMessages', raw.contactMessages, async (cm) => {
      await prisma.contactmessage.create({
        data: { name: cm.name, email: cm.email, phone: cm.phone, subject: cm.subject, message: cm.message, status: cm.status, createdAt: new Date(cm.createdAt), updatedAt: new Date(cm.updatedAt) }
      });
    });

    // 26. Homepage Sections
    await importTable('homepageSections', raw.homepageSections, async (hs) => {
      await prisma.HomepageSection.create({
        data: {
          key: hs.key, title: hs.title, titleEn: hs.titleEn,
          subtitle: hs.subtitle, subtitleEn: hs.subtitleEn,
          description: hs.description, descriptionEn: hs.descriptionEn,
          config: hs.config, type: hs.type, isActive: hs.isActive,
          position: hs.position, limit: hs.limit,
          startAt: hs.startAt ? new Date(hs.startAt) : null,
          endAt: hs.endAt ? new Date(hs.endAt) : null,
          createdAt: new Date(hs.createdAt), updatedAt: new Date(hs.updatedAt),
        }
      });
    });

    // 27. AI Knowledge
    await importTable('aiKnowledge', raw.aiKnowledge, async (ak) => {
      await prisma.AiKnowledge.create({
        data: {
          category: ak.category, question: ak.question, answer: ak.answer,
          keywords: ak.keywords, language: ak.language, priority: ak.priority,
          isActive: ak.isActive,
          createdAt: new Date(ak.createdAt), updatedAt: new Date(ak.updatedAt),
        }
      });
    });

    // 28. Dynamic Pages
    await importTable('dynamicPages', raw.dynamicPages, async (dp) => {
      await prisma.DynamicPage.create({
        data: {
          title: dp.title, titleEn: dp.titleEn, slug: dp.slug,
          content: dp.content, contentEn: dp.contentEn,
          excerpt: dp.excerpt, excerptEn: dp.excerptEn,
          metaTitle: dp.metaTitle, metaDescription: dp.metaDescription,
          image: dp.image, template: dp.template, type: dp.type,
          isPublished: dp.isPublished, isDefault: dp.isDefault, order: dp.order,
          createdAt: new Date(dp.createdAt), updatedAt: new Date(dp.updatedAt),
        }
      });
    });

    // 29. Site Configs
    await importTable('siteConfigs', raw.siteConfigs, async (sc) => {
      await prisma.SiteConfig.create({
        data: {
          key: sc.key, value: sc.value, type: sc.type,
          category: sc.category, description: sc.description,
          isPublic: sc.isPublic,
          createdAt: new Date(sc.createdAt), updatedAt: new Date(sc.updatedAt),
        }
      });
    });

    // 30. Menu Items (handle parentId)
    const menuParents = new Map();
    for (const mi of raw.menuItems || []) {
      const created = await prisma.MenuItem.create({
        data: {
          name: mi.name, nameEn: mi.nameEn, slug: mi.slug,
          type: mi.type, url: mi.url, icon: mi.icon,
          categoryId: mi.categoryId ? idMap.categories.get(mi.categoryId) || null : null,
          productId: mi.productId ? idMap.products.get(mi.productId) || null : null,
          position: mi.position, isVisible: mi.isVisible, isActive: mi.isActive,
          createdAt: new Date(mi.createdAt), updatedAt: new Date(mi.updatedAt),
        }
      });
      menuParents.set(mi.id, created.id);
      imported++;
    }
    for (const mi of raw.menuItems || []) {
      if (mi.parentId && menuParents.has(mi.parentId)) {
        await prisma.MenuItem.update({
          where: { id: menuParents.get(mi.id) },
          data: { parentId: menuParents.get(mi.parentId) }
        });
      }
    }
    if (raw.menuItems?.length) console.log(`  ✅ menuItems: ${raw.menuItems.length} records`);

    // 31. Newsletter Subscribers
    await importTable('newsletterSubscribers', raw.newsletterSubscribers, async (ns) => {
      await prisma.newslettersubscriber.create({
        data: { email: ns.email, subscribedAt: new Date(ns.subscribedAt) }
      });
    });

    // 32. Referral Profiles
    await importTable('referralProfiles', raw.referralProfiles, async (rp) => {
      const userId = idMap.users.get(rp.userId);
      if (userId) {
        const created = await prisma.referralprofile.create({
          data: {
            userId, customCode: rp.customCode, systemCode: rp.systemCode,
            verifiedPhoneCodeEnabled: rp.verifiedPhoneCodeEnabled,
            customCodeChanges: rp.customCodeChanges,
            totalInvites: rp.totalInvites, qualifiedInvites: rp.qualifiedInvites,
            pendingBalance: rp.pendingBalance, availableBalance: rp.availableBalance,
            withdrawnBalance: rp.withdrawnBalance, convertedBalance: rp.convertedBalance,
            tier: rp.tier, fraudScore: rp.fraudScore, isLocked: rp.isLocked,
            lockReason: rp.lockReason,
            createdAt: new Date(rp.createdAt), updatedAt: new Date(rp.updatedAt),
          }
        });
        idMap.referralProfiles.set(rp.id, created.id);
      }
    });

    // 33. Product Views
    await importTable('productViews', raw.productViews, async (pv) => {
      const productId = idMap.products.get(pv.productId);
      if (productId) {
        await prisma.productview.create({
          data: { productId, userId: pv.userId ? idMap.users.get(pv.userId) || null : null, createdAt: new Date(pv.createdAt) }
        });
      }
    });

    // Summary
    console.log(`\n🎯 Total imported: ${imported} records`);
    if (errors > 0) console.log(`⚠️ Errors: ${errors}`);
    console.log('✅ Import complete!');

  } catch (error) {
    console.error('❌ Fatal error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

importAll();
