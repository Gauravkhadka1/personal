import Link from "next/link";
import { ClipboardList } from "lucide-react";

export const TasksCard = ({
  taskStatusCounts,
  fullWidth = false,
}: {
  taskStatusCounts: any;
  fullWidth?: boolean;
}) => (
  <div
    className={`${fullWidth ? "w-full" : "flex-1"} rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-all hover:shadow-md dark:border-secondary dark:bg-secondary`}
  >
    <Link href={fullWidth ? "/mytasks" : "/alltasks"}>
      <h2 className="mb-4 flex items-center gap-2 text-xl font-semibold text-gray-800 dark:text-gray-300">
        <ClipboardList className="h-7 w-7 text-rose-500 dark:text-rose-400" />
        {fullWidth ? "My Tasks" : "All Tasks"}
      </h2>
    </Link>

    <div className="flex flex-wrap items-center justify-between gap-4">
      {/* To Do */}
      <Link
        href={fullWidth ? "/tasks" : "/tasks"}
        className="group flex-1 min-w-[100px] rounded-lg border border-gray-200 bg-white p-4 transition-all hover:shadow-md dark:border-gray-700 dark:bg-secondary"
      >
        <div className="flex flex-col items-center gap-2 text-center">
          <p className="text-3xl font-bold text-gray-600 dark:text-gray-300">
            {taskStatusCounts["To Do"]}
          </p>
          <h3 className="text-base font-medium text-gray-500 dark:text-gray-400">
            To Do
          </h3>
        </div>
      </Link>

      {/* In Progress */}
      <Link
         href={fullWidth ? "/tasks" : "/tasks"}
        className="group flex-1 min-w-[100px] rounded-lg border border-gray-200 bg-white p-4 transition-all hover:shadow-md dark:border-gray-700 dark:bg-secondary"
      >
        <div className="flex flex-col items-center gap-2 text-center">
          <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
            {taskStatusCounts["Work In Progress"]}
          </p>
          <h3 className="text-base font-medium text-gray-500 dark:text-gray-400">
            In Progress
          </h3>
        </div>
      </Link>

      {/* QA */}
      <Link
       href={fullWidth ? "/tasks" : "/tasks"}
        className="group flex-1 min-w-[100px] rounded-lg border border-gray-200 bg-white p-4 transition-all hover:shadow-md dark:border-gray-700 dark:bg-secondary"
      >
        <div className="flex flex-col items-center gap-2 text-center">
          <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">
            {taskStatusCounts["QA"]}
          </p>
          <h3 className="text-base font-medium text-gray-500 dark:text-gray-400">
            QA
          </h3>
        </div>
      </Link>

      {/* Completed */}
      <Link
         href={fullWidth ? "/tasks" : "/tasks"}
        className="group flex-1 min-w-[100px] rounded-lg border border-gray-200 bg-white p-4 transition-all hover:shadow-md dark:border-gray-700 dark:bg-secondary"
      >
        <div className="flex flex-col items-center gap-2 text-center">
          <p className="text-3xl font-bold text-green-600 dark:text-green-400">
            {taskStatusCounts["Completed"]}
          </p>
          <h3 className="text-base font-medium text-gray-500 dark:text-gray-400">
            Completed
          </h3>
        </div>
      </Link>
    </div>
  </div>
);