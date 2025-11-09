import Link from "next/link";

// components/AssignedActivityCard.jsx
export default function AssignedActivityCard({ activity }) {
  const fmt = (d) => (d?.length >= 8 ? d.slice(2) : d || ""); // "2025-03-01" -> "25-03-01"

  return (
    <Link href={`/dive-management/first/${activity.id}`}>
      <div
        className="
        rounded-3xl p-5
        bg-gradient-to-br from-[#F0FDFF] to-[#DDF4FF]
        shadow-[0_8px_0_0_rgba(55,154,255,0.20)]
        border border-white/70
      "
      >
        <div className="text-xl font-extrabold tracking-tight text-gray-900">
          {activity.title}
        </div>

        <div className="mt-4 space-y-1 text-[17px] leading-6 text-gray-500">
          <div>{fmt(activity.startDate)}</div>
          <div>~{fmt(activity.endDate)}</div>
        </div>

        <div className="mt-6 text-[15px] font-semibold text-sky-400/80 underline underline-offset-4">
          {activity.region}
        </div>
      </div>
    </Link>
  );
}
