import { z } from "zod";

const safeUrl = z.string().refine(
  (value) =>
    value.startsWith("/") ||
    value.startsWith("#") ||
    value.startsWith("https://") ||
    value.startsWith("mailto:") ||
    value.startsWith("https://wa.me/"),
  "Use a relative URL, https://, mailto:, or https://wa.me/ link."
);

export const ctaSchema = z.object({
  label: z.string().min(1).max(48),
  href: safeUrl
});

export const heroEditorSchema = z.object({
  eyebrow: z.string().min(1).max(80),
  title: z.string().min(1).max(140),
  description: z.string().min(1).max(320),
  primary_cta: ctaSchema,
  secondary_cta: ctaSchema.optional()
});

export const onboardingSchema = z.object({
  firmName: z.string().min(2, "Enter the firm name.").max(120),
  founderName: z.string().min(2, "Enter the CA or founder name.").max(120),
  city: z.string().min(2, "Enter the city.").max(80),
  address: z.string().min(8, "Enter the office address.").max(240),
  phone: z.string().min(8).max(24),
  whatsapp: z.string().min(8).max(24),
  email: z.string().email(),
  services: z.array(z.string()).min(1, "Select at least one service."),
  templateKey: z.enum(["modern_ca", "traditional_ca", "premium_ca"]),
  themeKey: z.enum(["navy_gold", "emerald_cream", "charcoal_blue"])
});

export const leadFormSchema = z.object({
  name: z.string().min(2).max(120),
  business_name: z.string().max(120).optional(),
  city: z.string().max(80).optional(),
  phone: z.string().min(8).max(24),
  email: z.string().email().optional().or(z.literal("")),
  inquiry_type: z.enum(["Free consultation", "General inquiry", "Join our team", "Other"]),
  service_interest: z.string().max(120).optional(),
  message: z.string().max(1000).optional(),
  website: z.string().max(0).optional()
});
