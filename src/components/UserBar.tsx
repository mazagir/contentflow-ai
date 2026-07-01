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

  return (
    <div className="mb-8 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-zinc-800 bg-zinc-900/40 px-4 py-3">
      <div className="text-sm text-zinc-400">
        <span className="text-zinc-200">{user.email}</span>
        <span className="mx-2 text-zinc-700">·</span>
        <span className="capitalize text-brand-400">
          {profile?.plan ?? "free"}
        </span>
        {!isPaid && (
          <>
            <span className="mx-2 text-zinc-700">·</span>
            <span>{profile?.credits ?? 0} créditos</span>
          </>
        )}
        {isPaid && (
          <>
            <span className="mx-2 text-zinc-700">·</span>
            <span className="text-brand-400">Ilimitado</span>
          </>
        )}
      </div>
      <button
        type="button"
        onClick={handleLogout}
        className="text-sm text-zinc-500 hover:text-zinc-300"
      >
        Cerrar sesión
      </button>
    </div>
  );
}
