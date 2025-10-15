"use client";

import { useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import CalendarBadge from "@/app/components/CalendarBadge";

function toInputDateString(d: Date) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export default function HomeDateFilter() {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();

  const today = useMemo(() => toInputDateString(new Date()), []);
  const initial = sp.get("asOf") || today;

  return (
    <CalendarBadge
      initialDate={initial}
      onChange={(isoDate) => {
        const usp = new URLSearchParams(sp.toString());
        usp.set("asOf", isoDate);
        router.replace(`${pathname}?${usp.toString()}`, { scroll: false }); // 👈 opcional
      }}
    />
  );
}
