"use client";

import { Calendar } from "lucide-react";

export default function CalendarReminder() {
    // 1 Ocak 2026 00:00
    // Google Calendar URL Format:
    // https://calendar.google.com/calendar/render?action=TEMPLATE&text=TITLE&details=DETAILS&location=LOCATION&dates=START/END

    const title = encodeURIComponent("Yılbaşı Kapsülü Açılıyor!");
    const details = encodeURIComponent("Geçmişten gelen mesajlarını okuma vakti! Hemen tıkla: https://yilbasi-kapsulu.vercel.app");
    const dates = "20260101T000000Z/20260101T010000Z"; // UTC

    const googleUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&details=${details}&dates=${dates}`;

    return (
        <a
            href={googleUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full py-3 bg-[#e6d5aa]/30 border border-[#8b7355]/30 rounded text-[#5d4037] font-cinzel text-sm hover:bg-[#e6d5aa]/50 transition-colors"
        >
            <Calendar size={18} />
            <span>Google Takvime Ekle</span>
        </a>
    );
}
