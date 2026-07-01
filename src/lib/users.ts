import type { PaymentMethod, Plan } from "@/lib/prompt";

export interface UserProfile {
  id: string;
  plan: Plan;
  credits: number;
  payment_method: PaymentMethod;
}

export function hasActiveSubscription(plan: Plan): boolean {
  return plan === "starter" || plan === "pro";
}

export function canGenerate(profile: UserProfile): boolean {
  if (hasActiveSubscription(profile.plan)) return true;
  return profile.plan === "free" && profile.credits > 0;
}
