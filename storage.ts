import { users, spins, withdrawals, referrals, type User, type InsertUser, type Spin, type Withdrawal, type Referral } from "@shared/schema";
import { nanoid } from "nanoid";
import { db } from "./db";
import { eq, and, gte } from "drizzle-orm";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByGoogleId(googleId: string): Promise<User | undefined>;
  getUserByReferralCode(referralCode: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserPoints(userId: number, points: number): Promise<User | undefined>;
  updateUserProfile(userId: number, updates: { username?: string, profilePic?: string }): Promise<User | undefined>;
  
  // Spin operations
  getSpinsByUserId(userId: number, limit?: number): Promise<Spin[]>;
  getSpinsCountByUserIdToday(userId: number): Promise<number>;
  createSpin(userId: number, amount: number): Promise<Spin>;
  
  // Withdrawal operations
  getWithdrawalsByUserId(userId: number): Promise<Withdrawal[]>;
  createWithdrawal(userId: number, amount: number, binanceUid: string): Promise<Withdrawal>;
  
  // Referral operations
  getReferralsByReferrerId(referrerId: number): Promise<Referral[]>;
  createReferral(referrerId: number, referredId: number): Promise<Referral>;
  getReferralsCountByReferrerId(referrerId: number): Promise<number>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async getUserByGoogleId(googleId: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.googleId, googleId));
    return user;
  }

  async getUserByReferralCode(referralCode: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.referralCode, referralCode));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values({
        ...insertUser,
        points: 0,
        referralCode: nanoid(8)
      })
      .returning();
    return user;
  }

  async updateUserPoints(userId: number, points: number): Promise<User | undefined> {
    const user = await this.getUser(userId);
    if (!user) return undefined;

    const [updatedUser] = await db
      .update(users)
      .set({ points: user.points + points })
      .where(eq(users.id, userId))
      .returning();
    
    return updatedUser;
  }

  async updateUserProfile(userId: number, updates: { username?: string, profilePic?: string }): Promise<User | undefined> {
    const user = await this.getUser(userId);
    if (!user) return undefined;

    const [updatedUser] = await db
      .update(users)
      .set(updates)
      .where(eq(users.id, userId))
      .returning();
    
    return updatedUser;
  }

  // Spin operations
  async getSpinsByUserId(userId: number, limit?: number): Promise<Spin[]> {
    const query = db
      .select()
      .from(spins)
      .where(eq(spins.userId, userId))
      .orderBy(spins.createdAt);
    
    if (limit) {
      query.limit(limit);
    }
    
    return await query;
  }

  async getSpinsCountByUserIdToday(userId: number): Promise<number> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const result = await db
      .select({ count: spins.id })
      .from(spins)
      .where(
        and(
          eq(spins.userId, userId),
          gte(spins.createdAt, today)
        )
      );
    
    return result.length;
  }

  async createSpin(userId: number, amount: number): Promise<Spin> {
    const [spin] = await db
      .insert(spins)
      .values({
        userId,
        amount
      })
      .returning();
    
    // Update user points
    await this.updateUserPoints(userId, amount);
    
    return spin;
  }

  // Withdrawal operations
  async getWithdrawalsByUserId(userId: number): Promise<Withdrawal[]> {
    return await db
      .select()
      .from(withdrawals)
      .where(eq(withdrawals.userId, userId))
      .orderBy(withdrawals.createdAt);
  }

  async createWithdrawal(userId: number, amount: number, binanceUid: string): Promise<Withdrawal> {
    const [withdrawal] = await db
      .insert(withdrawals)
      .values({
        userId,
        amount,
        binanceUid,
        status: "pending"
      })
      .returning();
    
    // Deduct points from user
    const user = await this.getUser(userId);
    if (user) {
      await db
        .update(users)
        .set({ points: user.points - amount })
        .where(eq(users.id, userId));
    }
    
    return withdrawal;
  }

  // Referral operations
  async getReferralsByReferrerId(referrerId: number): Promise<Referral[]> {
    return await db
      .select()
      .from(referrals)
      .where(eq(referrals.referrerId, referrerId))
      .orderBy(referrals.createdAt);
  }

  async createReferral(referrerId: number, referredId: number): Promise<Referral> {
    const [referral] = await db
      .insert(referrals)
      .values({
        referrerId,
        referredId,
        points: 200
      })
      .returning();
    
    // Add referral bonus to the referrer
    await this.updateUserPoints(referrerId, 200);
    
    return referral;
  }

  async getReferralsCountByReferrerId(referrerId: number): Promise<number> {
    const result = await db
      .select()
      .from(referrals)
      .where(eq(referrals.referrerId, referrerId));
    
    return result.length;
  }
}

export const storage = new DatabaseStorage();
