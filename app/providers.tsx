"use client";

import { ThemeProvider } from "next-themes";
import React from "react";
import { I18nProvider } from "@/lib/i18n/context";

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
            <I18nProvider>
                {children}
            </I18nProvider>
        </ThemeProvider>
    );
}
