import AssignedActivityList from "@/components/dive-management/assigned-activity-list";
import MainHeader from "@/components/mian-header";
import MainButton from "@/components/ui/main-button";

export default function DiveManagementPage() {
  return (
    <>
      <div className="p-5">
        <MainHeader />
        <AssignedActivityList />
        <div className="pt-10">
          <MainButton>제출내역</MainButton>
        </div>
        <div className="">
          <button
            className="mt-9 mx-auto  block text-[15px] font-medium text-gray-700 cursor-pointer"
            type="button"
          >
            로그아웃 <span className="inline-block translate-y-[1px]">›</span>
          </button>
        </div>
      </div>
    </>
  );
}
