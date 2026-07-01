"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";
import AuthPanel from "@/components/AuthPanel";
import ContentForm from "@/components/ContentForm";
import UserBar from "@/components/UserBar";

export default function AppShell() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [creditsVersion, setCreditsVersion] = useState(0);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 animate-fade-in">
        <div className="relative mb-4 flex h-12 w-12 items-center justify-center">
          <div className="absolute inset-0 animate-spin rounded-full border-2 border-brand-500/30 border-t-brand-400" />
          <div className="absolute inset-1 animate-spin rounded-full border-2 border-brand-400/20 border-t-brand-300" style={{ animationDirection: "reverse", animationDuration: "1s" }} />
          <span className="text-base">✨</span>
        </div>
        <p className="text-sm text-zinc-500">Cargando...</p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      {user ? (
        <>
          <UserBar creditsVersion={creditsVersion} />
          <ContentForm
            onCreditsUpdate={() => setCreditsVersion((v) => v + 1)}
          />
        </>
      ) : (
        <AuthPanel />
      )}
    </div>
  );
}
