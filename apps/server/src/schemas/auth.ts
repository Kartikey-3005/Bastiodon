import { z } from "zod";

export const SignupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  pin: z.string().regex(/^\d{6}$/).optional(),
  plan: z.enum(["BASIC", "PRO", "ULTIMATE"]).optional()
});

export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

export const VerifyPinSchema = z.object({
  pin: z.string().regex(/^\d{6}$/)
});

export const UpdatePinSchema = z.object({
  currentPin: z.string().regex(/^\d{6}$/).optional(),
  newPin: z.string().regex(/^\d{6}$/)
});

export const CreatePairingCodeSchema = z.object({
  name: z.string().min(1).optional(),
  browser: z.string().min(1).optional()
});

export const PairDeviceSchema = z.object({
  pairingCode: z.string().min(4).max(10),
  name: z.string().min(1).optional(),
  browser: z.string().min(1).optional()
});

export const DeleteDeviceSchema = z.object({
  pin: z.string().regex(/^\d{6}$/)
});

export const GoogleAuthSchema = z.object({
  credential: z.string().min(10)
});
