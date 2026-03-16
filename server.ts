import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import { createServer as createViteServer } from "vite";
import path from "path";
import { GoogleGenerativeAI } from "@google/generative-ai";
import Groq from "groq-sdk";
import dotenv from "dotenv";
import NodeCache from "node-cache";
import jwt from "jsonwebtoken";
import { Pool } from "pg";
import bcrypt from "bcryptjs";
import { OAuth2Client } from "google-auth-library";
import nodemailer from "nodemailer";
import cron from "node-cron";

dotenv.config();

const cache = new NodeCache({ stdTTL: 60 });
const ai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const dbUrl = process.env.DATABASE_URL;
const client = new OAuth2Client(process.env.VITE_GOOGLE_CLIENT_ID);
const JWT_SECRET = process.env.JWT_SECRET || "super-secret-churn-key-2026";

// Initialize PostgreSQL connection pool (Neon DB)
// Check if DATABASE_URL is provided, otherwise log a warning
if (!process.env.DATABASE_URL) {
  console.warn("WARNING: DATABASE_URL environment variable is not set. Database connection will fail.");
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false, // Required for Neon DB
  },
});

// --- Email Configuration ---
console.log("[CONFIG] SMTP User initialized as:", process.env.SMTP_USER);

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

async function sendEmail(to: string, subject: string, text: string, html?: string) {
  console.log(`[EMAIL] Attempting to send email to ${to}...`);
  try {
    const info = await transporter.sendMail({
      from: `"NOVA Automation Core" <${process.env.SMTP_USER}>`,
      to,
      subject,
      text,
      html
    });
    console.log(`[EMAIL] Dispatched to ${to}. MessageId: ${info.messageId}`);
    return info;
  } catch (error: any) {
    console.error(`[EMAIL_ERROR] Failed to send to ${to}:`, error.message || error);
    throw error;
  }
}

// Initialize database tables
async function initDB() {
  try {
    // 1. Ensure users table has 'role' column (handled by a separate ALTER if table exists)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(50) DEFAULT 'user',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Check if role column exists, if not add it
    const roleColCheck = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name='users' AND column_name='role';
    `);
    if (roleColCheck.rows.length === 0) {
      await pool.query("ALTER TABLE users ADD COLUMN role VARCHAR(50) DEFAULT 'user';");
      console.log("Added 'role' column to 'users' table.");
    }

    // 2. Create activity_logs table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS activity_logs (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        action_type VARCHAR(100) NOT NULL,
        details TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 3. Create churn_predictions table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS churn_predictions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        customer_name VARCHAR(255),
        churn_score INTEGER,
        risk_level VARCHAR(50),
        input_features JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 4. Create ai_learning_feedback table for Self-Correction Loop
    await pool.query(`
      CREATE TABLE IF NOT EXISTS ai_learning_feedback (
        id SERIAL PRIMARY KEY,
        prediction_id INTEGER REFERENCES churn_predictions(id),
        is_correct BOOLEAN,
        failure_reason TEXT,
        learned_lesson TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    console.log("Database schema verified and initialized successfully.");
  } catch (error) {
    console.error("Failed to initialize database. Please check your DATABASE_URL:", error);
  }
}

// Extend Express Request type to include user
interface AuthRequest extends Request {
  user?: any;
}

async function startServer() {
  await initDB();
  const app = express();
  const PORT = process.env.PORT || 5000;

  app.use(cors());
  app.use(express.json());

  // --- Auth Routes ---
  app.post("/api/auth/register", async (req: Request, res: Response): Promise<any> => {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ error: "Email and password required" });
      }

      // Check if user exists
      const userCheck = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
      if (userCheck.rows.length > 0) {
        return res.status(400).json({ error: "User already exists" });
      }

      // Hash password and insert user
      const hashedPassword = await bcrypt.hash(password, 10);
      const result = await pool.query(
        "INSERT INTO users (email, password) VALUES ($1, $2) RETURNING id, email",
        [email, hashedPassword]
      );
      
      const user = result.rows[0];
      const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: "24h" });
      res.json({ token, user: { email: user.email } });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/auth/google", async (req: Request, res: Response): Promise<any> => {
    try {
      const { token } = req.body;
      const ticket = await client.verifyIdToken({
        idToken: token,
        audience: process.env.VITE_GOOGLE_CLIENT_ID,
      });
      const payload = ticket.getPayload();
      if (!payload) return res.status(400).json({ error: "Invalid token" });

      const { email, sub: googleId } = payload;

      // Check if user exists, if not create one
      let result = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
      let user = result.rows[0];

      if (!user) {
        // Create user with a dummy password since they use Google
        const dummyPassword = await bcrypt.hash(googleId || "google-auth", 10);
        const insert = await pool.query(
          "INSERT INTO users (email, password) VALUES ($1, $2) RETURNING id, email",
          [email, dummyPassword]
        );
        user = insert.rows[0];
      }

      const jwtToken = jwt.sign(
        { id: user.id, email: user.email, role: user.role }, 
        JWT_SECRET, 
        { expiresIn: "24h" }
      );
      res.json({ token: jwtToken, user: { email: user.email, role: user.role } });
    } catch (error) {
      console.error("Google Auth error:", error);
      res.status(500).json({ error: "Authentication failed" });
    }
  });

  app.post("/api/auth/login", async (req: Request, res: Response): Promise<any> => {
    try {
      const { email, password } = req.body;
      
      // Find user
      const result = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
      const user = result.rows[0];
      
      if (!user) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: "24h" });
      res.json({ token, user: { email: user.email } });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // --- TEST AUTOMATION ROUTE (Temporary) ---
  app.get("/api/test-automation", async (req: Request, res: Response) => {
    console.log("[TEST] Manually triggering automation report...");
    try {
      if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
        return res.status(400).json({ error: "Email credentials not fully configured in .env" });
      }

      await sendEmail(
        process.env.ADMIN_EMAIL || "",
        "🚀 NOVA CORE: SYSTEM AUTOMATION TEST",
        "This is an automated test signal from your ChurnAI Strategic Hub. The link is secure and the intelligence engine is operational.",
        `<div style="font-family: monospace; background: #0a0a0a; color: #f59e0b; padding: 20px; border: 1px solid #f59e0b; border-radius: 8px;">
          <h2 style="color: #fff; border-bottom: 2px solid #f59e0b; padding-bottom: 10px;">CHURN AI // SYSTEM ACTIVE</h2>
          <p>Intelligence Core: <strong>STABILIZED</strong></p>
          <p>Automation Link: <strong>VERIFIED</strong></p>
          <hr style="border: 0.5px solid #333; margin: 20px 0;">
          <p style="font-size: 10px; color: #888;">This signal confirms that your Manager Agent and Retention Agent are ready for deployment.</p>
          <p style="font-size: 10px; color: #888;">Recipient: ${process.env.ADMIN_EMAIL}</p>
        </div>`
      );
      res.json({ message: "Test report sent to " + process.env.ADMIN_EMAIL });
    } catch (err: any) {
      console.error("[TEST_ERROR]", err);
      res.status(500).json({ error: "Test failed: " + err.message });
    }
  });

  // --- Middleware to verify JWT ---
  const authenticateToken = (req: AuthRequest, res: Response, next: NextFunction): any => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ error: "Unauthorized" });

    jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
      if (err) {
        console.error("[AUTH] JWT Verification Failed:", err.message);
        return res.status(403).json({ error: "Forbidden: Session invalid or expired. Please login again." });
      }
      req.user = user;
      next();
    });
  };

  // --- API Routes ---
  app.post("/api/logs", authenticateToken, async (req: AuthRequest, res: Response) => {
    try {
      const { actionType, details } = req.body;
      const userId = req.user.id;

      await pool.query(
        "INSERT INTO activity_logs (user_id, action_type, details) VALUES ($1, $2, $3)",
        [userId, actionType, details]
      );

      res.json({ message: "Log saved successfully" });
    } catch (error) {
      console.error("Failed to save log:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Health check for API
  app.get("/api/health", (req, res) => {
    res.json({ status: "REACHABLE", system: "NOVA_CORE", timestamp: new Date().toISOString() });
  });

  app.post("/api/chat", authenticateToken, async (req: AuthRequest, res: Response) => {
    console.log("[API] Chat signal received from:", req.user.email);
    try {
      const { message, history } = req.body;
      
      const completion = await groq.chat.completions.create({
        messages: [
          {
            role: "system",
            content: `You are NOVA AI, the intelligence core of a Churn Analytics Command Center. 
            
            ADAPTIVE LOGIC PROTOCOL:
            1. CUSTOMER DATA QUERIES: If the user asks about Churn, Pandas, Numpy, or Dataset patterns, provide deep, technical, and strategic insights. Use tags like [ANALYSIS] and [STRATEGY].
            2. GENERAL CHAT: If the user says "Hi", "How are you", or general talk, respond like a futuristic AI system—polite, efficient, and technical (e.g., 'Core systems stabilized. Ready for data injection. How can I assist?').
            3. KNOWLEDGE SCOPE: You are an expert in Customer Retention and High-Churn patterns in Telecom/Fiber sectors. 
            
            Keep responses concise, formatted with markdown, and highly professional.`
          },
          ...(history || [])
            .filter((h: any, idx: number) => !(idx === 0 && h.role === 'agent')) // Skip initial greeting
            .map((h: any) => ({
              role: h.role === 'agent' ? 'assistant' : 'user',
              content: h.content
            })),
          { role: "user", content: message }
        ],
        model: "llama-3.3-70b-versatile",
        temperature: 0.7,
        max_tokens: 1024,
      });

      res.json({ reply: completion.choices[0]?.message?.content || "Communication link failed." });
    } catch (error: any) {
      console.error("Groq Chat Error:", error?.message || error);
      res.status(500).json({ error: "Intelligence Core failure. Switch to redundant link." });
    }
  });

  app.post("/api/reports/ai-summary", authenticateToken, async (req: AuthRequest, res: Response) => {
    try {
      const { data } = req.body;
      const completion = await groq.chat.completions.create({
        messages: [
          {
            role: "system",
            content: "You are a Churn Strategy Consultant. Analyze the provided customer data and provide exactly 3 bullet points of high-level strategic advice to reduce churn. Be concise."
          },
          { role: "user", content: `Analyze this data: ${JSON.stringify(data)}` }
        ],
        model: "llama-3.3-70b-versatile",
      });
      
      res.json({ summary: completion.choices[0]?.message?.content || "No summary generated." });
    } catch (error) {
      console.error("Summary Error:", error);
      res.status(500).json({ error: "Failed to generate AI summary" });
    }
  });

  app.get("/api/logs/history", authenticateToken, async (req: AuthRequest, res: Response) => {
    try {
      let query = "SELECT a.*, u.email FROM activity_logs a JOIN users u ON a.user_id = u.id";
      const params: any[] = [];
      
      if (req.user.role !== 'admin') {
        query += " WHERE a.user_id = $1";
        params.push(req.user.id);
      }
      
      query += " ORDER BY a.created_at DESC LIMIT 50";
      const result = await pool.query(query, params);
      res.json(result.rows);
    } catch (error) {
      console.error("Failed to fetch logs:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/predictions", authenticateToken, async (req: AuthRequest, res: Response) => {
    try {
      const cacheKey = `preds_${req.user.id}_${req.user.role}`;
      const cachedData = cache.get(cacheKey);
      
      if (cachedData) {
        return res.json(cachedData);
      }

      let query = "SELECT p.*, u.email FROM churn_predictions p JOIN users u ON p.user_id = u.id";
      const params = [];
      
      if (req.user.role !== 'admin') {
        query += " WHERE p.user_id = $1";
        params.push(req.user.id);
      }
      
      query += " ORDER BY p.created_at DESC";
      const result = await pool.query(query, params);
      
      cache.set(cacheKey, result.rows);
      res.json(result.rows);
    } catch (error) {
      console.error("[API] Predictions Error:", error);
      res.status(500).json({ error: "Failed to fetch predictions" });
    }
  });

  // Invalidating cache on new prediction
  app.post("/api/predictions", authenticateToken, async (req: AuthRequest, res: Response) => {
    try {
      const { customerName, churnScore, riskLevel, inputFeatures } = req.body;
      const userId = req.user.id;

      const result = await pool.query(
        "INSERT INTO churn_predictions (user_id, customer_name, churn_score, risk_level, input_features) VALUES ($1, $2, $3, $4, $5) RETURNING *",
        [userId, customerName, churnScore, riskLevel, JSON.stringify(inputFeatures)]
      );

      cache.del(`preds_${req.user.id}_${req.user.role}`);
      if (req.user.role === 'admin') cache.flushAll(); // Clear all if admin adds
      
      res.json(result.rows[0]);
    } catch (error) {
      console.error("Prediction save error:", error);
      res.status(500).json({ error: "Failed to save prediction" });
    }
  });

  app.post("/api/predictions/feedback", authenticateToken, async (req: AuthRequest, res: Response) => {
    try {
      const { predictionId, isCorrect, failureReason } = req.body;
      
      // 1. Fetch the original prediction for context
      const predResult = await pool.query("SELECT * FROM churn_predictions WHERE id = $1", [predictionId]);
      const prediction = predResult.rows[0];

      if (!prediction) return res.status(404).json({ error: "Prediction not found" });

      // 2. Ask Gemini to analyze the mistake and provide a "Learned Lesson"
      let learnedLesson = "Operational parameters confirmed.";
      if (!isCorrect) {
        const model = ai.getGenerativeModel({ model: "gemini-2.0-flash" });
        const learningPrompt = `
          The ChurnAI model made a MISTAKE.
          Original Prediction: ${prediction.churn_score}% risk.
          Input Data: ${JSON.stringify(prediction.input_features)}
          Reason for failure: ${failureReason}
          
          Provide a technical 'Learned Lesson' for the system prompt update. 
          Respond in 1 short sentence.
        `;
        const result = await model.generateContent(learningPrompt);
        learnedLesson = result.response.text();
      }

      // 3. Save feedback
      await pool.query(
        "INSERT INTO ai_learning_feedback (prediction_id, is_correct, failure_reason, learned_lesson) VALUES ($1, $2, $3, $4)",
        [predictionId, isCorrect, failureReason, learnedLesson]
      );

      res.json({ message: "Intelligence loop closed. Lesson archived.", learnedLesson });
    } catch (error) {
      console.error("Feedback error:", error);
      res.status(500).json({ error: "Failed to process feedback loop" });
    }
  });

  app.post("/api/predict", authenticateToken, async (req: AuthRequest, res: Response) => {
    try {
      const { contract, monthlyBill, tenure, internetService, paymentMethod } = req.body;
      
      const prompt = `
        You are ChurnAI, an industrial-grade Machine Learning model predicting customer churn.
        Analyze the following customer data and provide:
        1. A churn probability percentage (0-100%).
        2. A brief, analytical explanation of WHY this customer is at risk or safe, in simple human language.
        
        Customer Data:
        - Contract: ${contract}
        - Monthly Bill: $${monthlyBill}
        - Tenure: ${tenure} months
        - Internet Service: ${internetService}
        - Payment Method: ${paymentMethod}
        
        Respond ONLY with a JSON object in this format:
        {
          "probability": 85,
          "reasoning": "Explanation here..."
        }
      `;

      const model = ai.getGenerativeModel({ model: "gemini-2.0-flash" });
      const promptText = `${prompt}\nRespond ONLY with a JSON object.`;
      
      const result = await model.generateContent(promptText);
      const response = await result.response;
      const text = response.text().replace(/```json|```/g, "").trim();
      
      const resultData = JSON.parse(text || "{}");

      // --- RETENTION AGENT: Automatic Outreach ---
      // If risk is High (>= 70%), send an automated personalized email
      if (resultData.probability >= 70 && req.body.customerEmail) {
        console.log(`[AGENT] High risk detected for ${req.body.customerEmail}. Initiating Retention Protocol...`);
        
        const emailPrompt = `
          You are a Customer Success Manager at a Telecom company. 
          A loyal customer is at high risk of leaving because: ${resultData.reasoning}.
          
          Write a short, empathetic email (3-4 sentences) to the customer.
          Offer them a personalized 20% discount for the next 3 months and a direct support link.
          Tone: Professional, caring, and urgent.
          Keep it concise.
        `;

        try {
          const emailResult = await model.generateContent(emailPrompt);
          const emailBody = emailResult.response.text();
          
          await sendEmail(
            req.body.customerEmail,
            "Special Offer: We Value Your Loyalty",
            emailBody,
            `<div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
              <h2 style="color: #2563eb;">We'd hate to see you go!</h2>
              <p style="white-space: pre-wrap;">${emailBody.replace(/\n/g, '<br>')}</p>
              <div style="margin-top: 20px; padding: 15px; background: #f8fafc; border-radius: 4px;">
                <strong>Your Exclusive Code:</strong> <span style="color: #ef4444; font-weight: bold;">RETAIN2026</span>
              </div>
            </div>`
          );
        } catch (emailErr) {
          console.error("[AGENT_ERROR] Failed to send retention email:", emailErr);
        }
      }

      res.json(resultData);
    } catch (error) {
      console.error("Prediction error:", error);
      res.status(500).json({ error: "Failed to generate prediction" });
    }
  });

  // Consolidating AI routes - removing duplicates


  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  // --- Global Error Handler ---
  app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    console.error("[CRITICAL] Unhandled Exception:", err);
    res.status(500).json({ error: "Internal Server Error / Connection Core Failure" });
  });

  app.listen(Number(PORT), "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
    
    // --- AUTOMATION ENGINE: Manager Agent (Weekly Report) ---
    // Runs every Monday at 09:00 AM
    cron.schedule('0 9 * * 1', async () => {
      console.log("[CRON] Manager Agent initiated. Collecting weekly intelligence...");
      try {
        // 1. Fetch weekly data
        const stats = await pool.query(`
          SELECT 
            COUNT(*) as total_preds,
            COUNT(*) FILTER (WHERE risk_level = 'High') as high_risk_count
          FROM churn_predictions 
          WHERE created_at > NOW() - INTERVAL '7 days'
        `);

        if (stats.rows[0].total_preds === '0') {
          return console.log("[CRON] No new data this week. Skipping report.");
        }

        // 2. Ask Gemini for a Strategic Summary
        const model = ai.getGenerativeModel({ model: "gemini-2.0-flash" });
        const analysisPrompt = `
          Analyze this week's Churn intelligence:
          - Total Customers Scanned: ${stats.rows[0].total_preds}
          - High Risk Detections: ${stats.rows[0].high_risk_count}
          
          Provide a professional 2-paragraph strategic summary for the CEO. 
          Use a futuristic and serious tone. Mention the urgency of retaining high-risk clusters.
        `;
        
        const result = await model.generateContent(analysisPrompt);
        const summary = result.response.text();

        // 3. Email to Admin
        await sendEmail(
          process.env.ADMIN_EMAIL || "",
          "🚨 WEEKLY CHURN INTELLIGENCE REPORT - CONFIDENTIAL",
          summary,
          `<div style="font-family: monospace; background: #0a0a0a; color: #f59e0b; padding: 20px; border: 1px solid #f59e0b;">
            <h2 style="color: #fff;">CHURN AI // MISSION SUMMARY</h2>
            <p>${summary.replace(/\n/g, '<br>')}</p>
            <hr style="border: 0.5px solid #333;">
            <p style="font-size: 10px; color: #666;">AUTONOMOUS REPORT GENERATED BY NOVA_CORE</p>
          </div>`
        );
      } catch (err) {
        console.error("[CRON_ERROR] Manager Agent failed:", err);
      }
    });
  });
}

process.on('unhandledRejection', (reason, promise) => {
  console.error('[FATAL] Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (err) => {
  console.error('[FATAL] Uncaught Exception thrown:', err);
});

startServer();
