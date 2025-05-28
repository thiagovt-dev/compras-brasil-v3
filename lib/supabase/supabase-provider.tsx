"use client";

import type React from "react";

import { createContext, useContext, useState } from "react";
import { createClientSupabaseClient } from "@/lib/supabase/client";
import type { SupabaseClient } from "@supabase/supabase-js";

type SupabaseContext = {
  supabase: SupabaseClient;
};

const Context = createContext<SupabaseContext | undefined>(undefined);

export default function SupabaseProvider({ children }: { children: React.ReactNode }) {
  const [supabase] = useState(() => createClientComponentClient());

  return (
    <Context.Provider value={{ supabase }}>
      <>{children}</>
    </Context.Provider>
  );
}

export const useSupabaseClient = () => {
  const context = useContext(Context);

  if (context === undefined) {
    throw new Error("useSupabaseClient must be used within a SupabaseProvider");
  }

  return context.supabase;
};
