// components/AssignedActivityList.jsx
import AssignedActivityCard from "./assigned-activity-card";
import { ACTIVITIES } from "@/data/activity"; // 경로는 실제 위치에 맞춰 수정

export default function AssignedActivityList() {
  return (
    <>
      <div className="flex items-center justify-center pt-5 text-md text-gray-500 font-bold">
        배정된 활동
      </div>
      <div className="grid grid-cols-2 gap-x-6 gap-y-10 pt-3">
        {ACTIVITIES.map((a) => (
          <AssignedActivityCard key={a.id} activity={a} />
        ))}
      </div>
    </>
  );
}
