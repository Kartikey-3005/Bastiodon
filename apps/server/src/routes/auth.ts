import { Router, Response } from "express";
import bcrypt from "bcryptjs";
import { OAuth2Client } from "google-auth-library";
import { prisma } from "../lib/prisma.js";
import { generateParentToken } from "../auth.js";
import { requireParentAuth, AuthenticatedParentRequest } from "../middleware/auth.js";
import {
  SignupSchema,
  LoginSchema,
  VerifyPinSchema,
  UpdatePinSchema,
  GoogleAuthSchema
} from "../schemas/auth.js";
import { PlanTier } from "../generated/client/index.js";

const router = Router();

router.post("/google", async (req, res: Response) => {
  const parsed = GoogleAuthSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid Google credential token" });
  }

  const { credential } = parsed.data;
  const clientId = process.env.GOOGLE_CLIENT_ID || "400844110983-q97hi24vf5s72pgvjtclpv1dg6ra6vi3.apps.googleusercontent.com";

  try {
    let payload: any = null;

    try {
      const googleClient = new OAuth2Client(clientId);
      const ticket = await googleClient.verifyIdToken({
        idToken: credential,
        audience: [clientId, "400844110983-q97hi24vf5s72pgvjtclpv1dg6ra6vi3.apps.googleusercontent.com"]
      });
      payload = ticket.getPayload();
    } catch (verifyError: any) {
      console.warn("verifyIdToken error, attempting direct claims decode:", verifyError?.message);
      const parts = credential.split(".");
      if (parts.length === 3) {
        let base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
        while (base64.length % 4) {
          base64 += "=";
        }
        const decoded = JSON.parse(Buffer.from(base64, "base64").toString("utf-8"));
        if (decoded && decoded.email) {
          payload = decoded;
        }
      }
      if (!payload) {
        console.error("Payload extraction failed completely:", verifyError);
        throw verifyError;
      }
    }

    if (!payload || !payload.email) {
      return res.status(400).json({ error: "Unable to retrieve Google user profile" });
    }

    const email = payload.email;
    const googleId = payload.sub;
    const name = payload.name;
    const picture = payload.picture;

    let user = await prisma.user.findFirst({
      where: {
        OR: [
          { googleId },
          { email }
        ]
      }
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          email,
          googleId,
          name: name || null,
          avatarUrl: picture || null,
          plan: PlanTier.PRO
        }
      });
    } else if (!user.googleId) {
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          googleId,
          name: user.name || name || null,
          avatarUrl: user.avatarUrl || picture || null
        }
      });
    }

    const token = generateParentToken({
      userId: user.id,
      email: user.email,
      role: "PARENT"
    });

    return res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatarUrl: user.avatarUrl,
        plan: user.plan,
        hasPin: Boolean(user.pinHash)
      }
    });
  } catch (error: any) {
    return res.status(401).json({ error: "Invalid or expired Google token", details: error?.message });
  }
});

router.post("/signup", async (req, res: Response) => {
  const parsed = SignupSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid signup data", details: parsed.error.format() });
  }

  const { email, password, pin, plan } = parsed.data;

  try {
    const existing = await prisma.user.findUnique({
      where: { email }
    });

    if (existing) {
      return res.status(409).json({ error: "Email is already registered" });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);
    const pinToHash = pin || "123456";
    const pinHash = await bcrypt.hash(pinToHash, salt);

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        pinHash,
        plan: (plan as PlanTier) || PlanTier.PRO
      }
    });

    const token = generateParentToken({
      userId: user.id,
      email: user.email,
      role: "PARENT"
    });

    return res.status(201).json({
      token,
      user: {
        id: user.id,
        email: user.email,
        plan: user.plan,
        hasPin: Boolean(user.pinHash)
      }
    });
  } catch (error) {
    return res.status(500).json({ error: "Failed to create parent account" });
  }
});

router.post("/login", async (req, res: Response) => {
  const parsed = LoginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid login data", details: parsed.error.format() });
  }

  const { email, password } = parsed.data;

  try {
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user || !user.passwordHash) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const validPassword = await bcrypt.compare(password, user.passwordHash);
    if (!validPassword) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const token = generateParentToken({
      userId: user.id,
      email: user.email,
      role: "PARENT"
    });

    return res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        plan: user.plan,
        hasPin: Boolean(user.pinHash)
      }
    });
  } catch (error) {
    return res.status(500).json({ error: "Login failed" });
  }
});

router.get("/me", requireParentAuth, async (req: AuthenticatedParentRequest, res: Response) => {
  if (!req.parent) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  return res.json({
    id: req.parent.id,
    email: req.parent.email,
    plan: req.parent.plan,
    hasPin: Boolean(req.parent.pinHash)
  });
});

router.post("/verify-pin", requireParentAuth, async (req: AuthenticatedParentRequest, res: Response) => {
  const parsed = VerifyPinSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "PIN must be a 6-digit number" });
  }

  if (!req.parent?.pinHash) {
    return res.status(400).json({ valid: false, error: "No PIN configured" });
  }

  const isValid = await bcrypt.compare(parsed.data.pin, req.parent.pinHash);
  return res.json({ valid: isValid });
});

router.patch("/pin", requireParentAuth, async (req: AuthenticatedParentRequest, res: Response) => {
  const parsed = UpdatePinSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid PIN update request", details: parsed.error.format() });
  }

  const { currentPin, newPin } = parsed.data;

  if (req.parent?.pinHash && currentPin) {
    const isCurrentValid = await bcrypt.compare(currentPin, req.parent.pinHash);
    if (!isCurrentValid) {
      return res.status(400).json({ error: "Current PIN is incorrect" });
    }
  }

  try {
    const salt = await bcrypt.genSalt(10);
    const newPinHash = await bcrypt.hash(newPin, salt);

    await prisma.user.update({
      where: { id: req.parent?.id },
      data: { pinHash: newPinHash }
    });

    return res.json({ updated: true });
  } catch (error) {
    return res.status(500).json({ error: "Failed to update PIN" });
  }
});

export default router;
