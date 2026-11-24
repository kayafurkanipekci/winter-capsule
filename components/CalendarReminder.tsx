"use client";

import { useEffect, useState } from "react";
import { Calendar } from "lucide-react";
import { getTargetYear } from "@/lib/capsuleTime";
import { useI18n } from "@/lib/i18n/context";

export default function CalendarReminder() {
    const { t } = useI18n();
    const [origin, setOrigin] = useState("https://yilbasi-kapsulu.vercel.app");
    const targetYear = getTargetYear();

    useEffect(() => {
        if (typeof window !== "undefined") {
            setOrigin(window.location.origin);
        }
    }, []);

    // 1 Ocak <targetYear> 00:00 (kullanıcının yerel saatine göre)
    const title = encodeURIComponent(t.calendarReminder.eventTitle);
    const details = encodeURIComponent(t.calendarReminder.eventDetails(origin));
    const dates = `${targetYear}0101T000000/${targetYear}0101T010000`;

    const googleUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&details=${details}&dates=${dates}`;

    return (
        <a
            href={googleUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full py-3 bg-[#e6d5aa]/30 border border-[#8b7355]/30 rounded text-[#5d4037] font-cinzel text-sm hover:bg-[#e6d5aa]/50 transition-colors"
        >
            <Calendar size={18} />
            <span>{t.calendarReminder.buttonLabel}</span>
        </a>
    );
}
