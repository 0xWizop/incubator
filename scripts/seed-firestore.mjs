// Seed script to create sample documents in Firestore
// Run with: node scripts/seed-firestore.mjs

import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, Timestamp } from 'firebase/firestore';

// Firebase config (same as your app)
const firebaseConfig = {
    apiKey: "AIzaSyCZMry_Zp0QszH8goQu4MYahIEqUz9En7s",
    authDomain: "incubatorprotocol-c31de.firebaseapp.com",
    projectId: "incubatorprotocol-c31de",
    storageBucket: "incubatorprotocol-c31de.firebasestorage.app",
    messagingSenderId: "231686186944",
    appId: "1:231686186944:web:5f84d9664aea4213094a25",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function seedFirestore() {
    const now = Timestamp.now();

    console.log('🌱 Seeding Firestore collections...\n');

    // 1. Sample User
    const sampleUserId = 'sample-user-001';
    await setDoc(doc(db, 'users', sampleUserId), {
        address: '0x1234567890abcdef1234567890abcdef12345678',
        chains: ['ethereum', 'base', 'arbitrum'],
        createdAt: now,
        referralCode: 'CX-SAMPLE',
        referredBy: null,
        totalVolume: 15000.50,
        lastActive: now,
        email: 'sample@example.com',
        displayName: 'Sample Trader',
        photoURL: null,
        preferences: {
            darkMode: true,
            defaultChain: 'ethereum',
            notifications: {
                tradeAlerts: true,
                rewardUpdates: true,
                priceAlerts: false,
            },
        },
    });
    console.log('✅ Created sample user in "users" collection');

    // 2. Sample Trade
    const sampleTradeId = 'sample-trade-001';
    await setDoc(doc(db, 'trades', sampleTradeId), {
        userId: sampleUserId,
        chainId: 'ethereum',
        tokenIn: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', // WETH
        tokenOut: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', // USDC
        amountIn: '1.5',
        amountOut: '4500',
        amountInUsd: 4500,
        txHash: '0xabc123def456789...',
        timestamp: now,
        priceImpact: 0.05,
        route: ['WETH', 'USDC'],
    });
    console.log('✅ Created sample trade in "trades" collection');

    // 3. Sample Rewards
    await setDoc(doc(db, 'rewards', sampleUserId), {
        userId: sampleUserId,
        tradingRewards: 45.50,
        referralRewards: 12.25,
        claimedRewards: 20.00,
        lastUpdated: now,
    });
    console.log('✅ Created sample rewards in "rewards" collection');

    // 4. Sample Referral
    await setDoc(doc(db, 'referrals', 'CX-SAMPLE'), {
        ownerId: sampleUserId,
        code: 'CX-SAMPLE',
        referredUsers: ['referred-user-001', 'referred-user-002'],
        totalReferralVolume: 5000,
        earnedRewards: 25.00,
    });
    console.log('✅ Created sample referral in "referrals" collection');

    console.log('\n🎉 All collections seeded! Check Firebase Console.');
    console.log('📊 https://console.firebase.google.com/project/incubatorprotocol-c31de/firestore\n');

    process.exit(0);
}

seedFirestore().catch((error) => {
    console.error('❌ Error seeding Firestore:', error);
    process.exit(1);
});
