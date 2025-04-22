import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  googleId: text("google_id").notNull().unique(),
  profilePic: text("profile_pic"),
  points: integer("points").notNull().default(0),
  referralCode: text("referral_code").notNull().unique(),
  referredBy: integer("referred_by").references(() => users.id),
});

export const spins = pgTable("spins", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  amount: integer("amount").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const withdrawals = pgTable("withdrawals", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  amount: integer("amount").notNull(),
  binanceUid: text("binance_uid").notNull(),
  status: text("status").notNull().default("pending"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const referrals = pgTable("referrals", {
  id: serial("id").primaryKey(),
  referrerId: integer("referrer_id").notNull().references(() => users.id),
  referredId: integer("referred_id").notNull().references(() => users.id),
  points: integer("points").notNull().default(200),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  points: true,
});

export const insertSpinSchema = createInsertSchema(spins).omit({
  id: true,
  createdAt: true,
});

export const insertWithdrawalSchema = createInsertSchema(withdrawals).omit({
  id: true,
  status: true,
  createdAt: true,
});

export const insertReferralSchema = createInsertSchema(referrals).omit({
  id: true,
  createdAt: true,
});

// Define all relations
export const usersRelations = relations(users, ({ one, many }) => ({
  referrer: one(users, {
    fields: [users.referredBy],
    references: [users.id],
  }),
  referrals: many(referrals, { relationName: "user_referrals" }),
  spins: many(spins),
  withdrawals: many(withdrawals),
}));

export const spinsRelations = relations(spins, ({ one }) => ({
  user: one(users, {
    fields: [spins.userId],
    references: [users.id],
  }),
}));

export const withdrawalsRelations = relations(withdrawals, ({ one }) => ({
  user: one(users, {
    fields: [withdrawals.userId],
    references: [users.id],
  }),
}));

export const referralsRelations = relations(referrals, ({ one }) => ({
  referrer: one(users, {
    fields: [referrals.referrerId],
    references: [users.id],
    relationName: "user_referrals",
  }),
  referred: one(users, {
    fields: [referrals.referredId],
    references: [users.id],
  }),
}));

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type Spin = typeof spins.$inferSelect;
export type Withdrawal = typeof withdrawals.$inferSelect;
export type Referral = typeof referrals.$inferSelect;
