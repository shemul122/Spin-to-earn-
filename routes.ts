import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertUserSchema, insertWithdrawalSchema } from "@shared/schema";
import jwt from "jsonwebtoken";
import cors from "cors";
import cookieParser from "cookie-parser";
import { z } from "zod";

const JWT_SECRET = process.env.JWT_SECRET || "super-secret-jwt-key";

// Middleware to verify JWT
const authenticate = async (req: Request, res: Response, next: Function) => {
  try {
    const token = req.cookies.token;
    if (!token) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as { id: number };
    const user = await storage.getUser(decoded.id);
    
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }
    
    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid token" });
  }
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Express middleware
  app.use(cookieParser());
  app.use(cors({
    origin: true,
    credentials: true
  }));
  
  // Test routes to check if server is working
  app.get("/api/ping", (req, res) => {
    return res.status(200).json({ message: "pong", time: new Date().toISOString() });
  });
  
  app.get("/test", (req, res) => {
    res.setHeader('Content-Type', 'text/html');
    return res.status(200).send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Server Test</title>
        </head>
        <body>
          <h1>Server is working!</h1>
          <p>Current time: ${new Date().toISOString()}</p>
          <p>This is a test page to verify that the server can serve static content.</p>
        </body>
      </html>
    `);
  });

  // Login route - find user by username and email
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, email } = req.body;
      
      if (!username || !email) {
        return res.status(400).json({ message: "Missing required fields" });
      }
      
      // Try to find user by email
      let user = await storage.getUserByEmail(email);
      
      // If not found by email, check if username matches
      if (!user && username) {
        const usernameUser = await storage.getUserByUsername(username);
        if (usernameUser && usernameUser.email === email) {
          user = usernameUser;
        }
      }
      
      if (user) {
        // Set user session
        req.session.userId = user.id;
        return res.status(200).json({ user });
      } else {
        return res.status(404).json({ message: "User not found" });
      }
    } catch (error) {
      console.error("Auth error:", error);
      return res.status(500).json({ message: "Authentication failed" });
    }
  });

  // Authentication/signup routes
  app.post("/api/auth/google", async (req, res) => {
    try {
      const { googleId, email, username, profilePic } = req.body;
      
      if (!googleId || !email || !username) {
        return res.status(400).json({ message: "Missing required fields" });
      }
      
      // Check if user exists
      let user = await storage.getUserByGoogleId(googleId);
      
      // Also check if user exists by email
      if (!user) {
        user = await storage.getUserByEmail(email);
      }
      
      // Also check if user exists by username
      if (!user) {
        user = await storage.getUserByUsername(username);
      }
      
      // If user already exists, return error
      if (user) {
        // Set user session
        req.session.userId = user.id;
        return res.status(200).json({ user, message: "Logged in successfully" });
      }
      
      // If user doesn't exist, create a new one
      // Check if referral code was provided
      let referredBy: number | undefined = undefined;
      if (req.body.referralCode) {
        const referrer = await storage.getUserByReferralCode(req.body.referralCode);
        if (referrer) {
          referredBy = referrer.id;
        }
      }
      
      // Create new user
      user = await storage.createUser({
        username,
        email,
        googleId,
        profilePic: profilePic || null,
        referralCode: Math.random().toString(36).substring(2, 10),
        referredBy
      });
      
      // Process referral bonus if applicable
      if (referredBy) {
        await storage.createReferral(referredBy, user.id);
      }
      
      // Generate JWT token
      const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: "7d" });
      
      // Send token as cookie
      res.cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
      });
      
      return res.status(200).json({ user: { 
        id: user.id, 
        username: user.username, 
        email: user.email,
        profilePic: user.profilePic,
        points: user.points,
        referralCode: user.referralCode
      }});
    } catch (error) {
      console.error("Auth error:", error);
      return res.status(500).json({ message: "Authentication failed" });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    res.clearCookie("token");
    return res.status(200).json({ message: "Logged out successfully" });
  });

  app.get("/api/auth/me", authenticate, (req, res) => {
    const user = req.user;
    return res.status(200).json({ 
      id: user.id, 
      username: user.username, 
      email: user.email,
      profilePic: user.profilePic,
      points: user.points,
      referralCode: user.referralCode
    });
  });
  
  // Spin routes
  app.get("/api/spins/count", authenticate, async (req, res) => {
    try {
      const userId = req.user.id;
      const count = await storage.getSpinsCountByUserIdToday(userId);
      return res.status(200).json({ count, remaining: Math.max(0, 10 - count) });
    } catch (error) {
      console.error("Spin count error:", error);
      return res.status(500).json({ message: "Failed to get spin count" });
    }
  });

  app.post("/api/spins", authenticate, async (req, res) => {
    try {
      const userId = req.user.id;
      
      // Check if user has spins left
      const spinsToday = await storage.getSpinsCountByUserIdToday(userId);
      if (spinsToday >= 10) {
        return res.status(400).json({ message: "No spins left today" });
      }
      
      // Determine points for this spin
      let points: number;
      
      if (spinsToday === 0) {
        // First spin of the day gives 50 points
        points = 50;
      } else {
        // Random between 5 and 40 points (reduced rewards)
        const values = [5, 8, 10, 12, 15, 20, 25, 30, 40];
        points = values[Math.floor(Math.random() * values.length)];
      }
      
      // Create spin record
      const spin = await storage.createSpin(userId, points);
      
      // Get updated user
      const user = await storage.getUser(userId);
      
      return res.status(200).json({ 
        spin, 
        points: user?.points, 
        spinsRemaining: 10 - (spinsToday + 1) 
      });
    } catch (error) {
      console.error("Spin error:", error);
      return res.status(500).json({ message: "Failed to process spin" });
    }
  });

  app.get("/api/spins/recent", authenticate, async (req, res) => {
    try {
      const userId = req.user.id;
      const spins = await storage.getSpinsByUserId(userId, 10);
      return res.status(200).json(spins);
    } catch (error) {
      console.error("Recent spins error:", error);
      return res.status(500).json({ message: "Failed to get recent spins" });
    }
  });
  
  // Withdrawal routes
  app.post("/api/withdrawals", authenticate, async (req, res) => {
    try {
      const userId = req.user.id;
      const withdrawalData = insertWithdrawalSchema.parse({
        userId,
        amount: req.body.amount,
        binanceUid: req.body.binanceUid,
      });
      
      // Validate withdrawal amount
      if (withdrawalData.amount < 1000) {
        return res.status(400).json({ message: "Minimum withdrawal amount is 1000 points" });
      }
      
      // Check if user has enough points
      const user = await storage.getUser(userId);
      if (!user || user.points < withdrawalData.amount) {
        return res.status(400).json({ message: "Insufficient points" });
      }
      
      // Process withdrawal
      const withdrawal = await storage.createWithdrawal(
        userId, 
        withdrawalData.amount, 
        withdrawalData.binanceUid
      );
      
      return res.status(200).json(withdrawal);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid withdrawal data", errors: error.errors });
      }
      console.error("Withdrawal error:", error);
      return res.status(500).json({ message: "Failed to process withdrawal" });
    }
  });

  app.get("/api/withdrawals", authenticate, async (req, res) => {
    try {
      const userId = req.user.id;
      const withdrawals = await storage.getWithdrawalsByUserId(userId);
      return res.status(200).json(withdrawals);
    } catch (error) {
      console.error("Withdrawals error:", error);
      return res.status(500).json({ message: "Failed to get withdrawals" });
    }
  });
  
  // Profile routes
  app.patch("/api/profile", authenticate, async (req, res) => {
    try {
      const userId = req.user.id;
      const { username, profilePic } = req.body;
      
      if (!username && !profilePic) {
        return res.status(400).json({ message: "No updates provided" });
      }
      
      const updatedUser = await storage.updateUserProfile(userId, { username, profilePic });
      
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      return res.status(200).json({ 
        id: updatedUser.id, 
        username: updatedUser.username, 
        email: updatedUser.email,
        profilePic: updatedUser.profilePic,
        points: updatedUser.points,
        referralCode: updatedUser.referralCode
      });
    } catch (error) {
      console.error("Profile update error:", error);
      return res.status(500).json({ message: "Failed to update profile" });
    }
  });
  
  // Referral routes
  app.get("/api/referrals", authenticate, async (req, res) => {
    try {
      const userId = req.user.id;
      const referrals = await storage.getReferralsByReferrerId(userId);
      
      // Get details of referred users
      const referralDetails = await Promise.all(
        referrals.map(async (referral) => {
          const referredUser = await storage.getUser(referral.referredId);
          return {
            ...referral,
            referredUser: referredUser ? {
              id: referredUser.id,
              username: referredUser.username,
              profilePic: referredUser.profilePic,
            } : null,
          };
        })
      );
      
      return res.status(200).json(referralDetails);
    } catch (error) {
      console.error("Referrals error:", error);
      return res.status(500).json({ message: "Failed to get referrals" });
    }
  });

  app.get("/api/referrals/count", authenticate, async (req, res) => {
    try {
      const userId = req.user.id;
      const count = await storage.getReferralsCountByReferrerId(userId);
      return res.status(200).json({ count });
    } catch (error) {
      console.error("Referrals count error:", error);
      return res.status(500).json({ message: "Failed to get referrals count" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

// Augment Express Request interface
declare global {
  namespace Express {
    interface Request {
      user: import("@shared/schema").User;
    }
  }
}
