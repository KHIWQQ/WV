"use client";

import { useEffect, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAppStore } from "@/stores/useAppStore";
import { Profile } from "@/types";

export function SupabaseProvider({ children }: { children: React.ReactNode }) {
    const setProfile = useAppStore((state) => state.setProfile);
    const supabase = useMemo(() => createClient(), []);

    useEffect(() => {

        // Use getUser() instead of getSession() to validate JWT with the server
        const fetchUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();

            if (user) {
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', user.id)
                    .single();

                if (profile) {
                    setProfile(profile as Profile);
                }
            } else {
                setProfile(null);
            }
        };

        fetchUser();

        // Listen for auth changes to update store accordingly
        const { data: authListener } = supabase.auth.onAuthStateChange(
            async (_event, session) => {
                if (session?.user) {
                    const { data: profile } = await supabase
                        .from('profiles')
                        .select('*')
                        .eq('id', session.user.id)
                        .single();

                    if (profile) {
                        setProfile(profile as Profile);
                    }
                } else {
                    setProfile(null);
                }
            }
        );

        return () => {
            authListener.subscription.unsubscribe();
        };
        // `supabase` is a useMemo with [] deps → stable reference for the
        // component lifetime, so listing it here doesn't cause re-runs but
        // satisfies react-hooks/exhaustive-deps.
    }, [setProfile, supabase]);

    return <>{children}</>;
}
