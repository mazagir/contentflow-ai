"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

interface Profile {
  plan: string;
  credits: number;
  paymentMethod: string;
}

interface UserBarProps {
  creditsVersion?: number;
}

export default function UserBar({ creditsVersion = 0 }: UserBarProps) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();

    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      if (user) {
        fetch("/api/profile")
          .then((r) => r.json())
          .then(setProfile)
          .finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });
  }, [creditsVersion]);

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.reload();
  }

  if (loading) return null;
  if (!user) return null;

  const isPaid = profile?.plan === "starter" || profile?.plan === "pro";
  const initials = user.email?.charAt(0).toUpperCase() ?? "?";

  return (
    <div className="mb-8 animate-fade-in">
      <div className="glass-card-hover flex flex-wrap items-center justify-between gap-4 px-5 py-3.5">
        <div className="flex items-center gap-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500/20 to-brand-600/20 ring-1 ring-brand-500/20">
            <span className="text-sm font-semibold text-brand-400">
              {initials}
            </span>
          </div>
          <div className="text-sm">
            <span className="text-zinc-300">{user.email}</span>
            <span className="mx-2 text-zinc-700">·</span>
            {isPaid ? (
              <span className="badge-plan-premium capitalize">
                <span className="h-1.5 w-1.5 rounded-full bg-brand-400" />
                {profile?.plan}
              </span>
            ) : (
              <span className="badge-plan-free">Free</span>
            )}
            <span className="mx-2 text-zinc-700">·</span>
            {isPaid ? (
              <span className="text-brand-400/80">Ilimitado</span>
            ) : (
              <span className="text-zinc-400">
                {profile?.credits ?? 0} créditos
              </span>
            )}
          </div>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          className="rounded-lg border border-white/5 bg-white/5 px-3 py-1.5 text-xs text-zinc-500 transition-all hover:border-white/10 hover:bg-white/10 hover:text-zinc-300"
        >
          Cerrar sesión
        </button>
      </div>
    </div>
  );
}
