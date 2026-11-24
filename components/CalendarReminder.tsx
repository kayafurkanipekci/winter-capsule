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

  // Jan 1 <targetYear> 00:00 in user's local time
  const title = encodeURIComponent(t.calendarReminder.eventTitle);
  const details = encodeURIComponent(t.calendarReminder.eventDetails(origin));
  const dates = `${targetYear}0101T000000/${targetYear}0101T010000`;

  const googleUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&details=${details}&dates=${dates}`;

  return (
    <a
      href={googleUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center justify-center gap-2 w-full py-2.5 pixel-btn pixel-btn-green font-cinzel font-bold text-sm"
    >
      <Calendar size={16} />
      <span>{t.calendarReminder.buttonLabel}</span>
    </a>
  );
}
