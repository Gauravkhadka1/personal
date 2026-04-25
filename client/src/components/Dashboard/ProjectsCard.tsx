import Link from "next/link";
import { FolderCode, FolderGit2 } from "lucide-react";

export const ProjectsCard = ({ clientStatusCounts }: { clientStatusCounts: any }) => (
  <div className="flex-1 rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-all hover:shadow-md dark:border-secondary dark:bg-secondary">
    <Link href="/projects">
      <h2 className="mb-4 flex items-center gap-2 text-xl font-semibold text-gray-800 dark:text-gray-300">
        <FolderCode className="h-7 w-7 text-indigo-500 dark:text-indigo-400" />
        Projects
      </h2>
    </Link>

    <div className="flex flex-wrap items-center justify-between gap-4">
      {/* New Projects */}
      <Link
        href="/projects"
        className="group flex-1 min-w-[100px] rounded-lg border border-gray-200 bg-white p-4 transition-all hover:shadow-md dark:border-gray-700 dark:bg-secondary"
      >
        <div className="flex flex-col items-center gap-2 text-center">
          <p className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">
            {clientStatusCounts.New}
          </p>
          <h3 className="text-base font-medium text-gray-500 dark:text-gray-400">
            New Projects
          </h3>
        </div>
      </Link>

      {/* Design */}
      <Link
        href="/projects"
        className="group flex-1 min-w-[100px] rounded-lg border border-gray-200 bg-white p-4 transition-all hover:shadow-md dark:border-gray-700 dark:bg-secondary"
      >
        <div className="flex flex-col items-center gap-2 text-center">
          <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">
            {clientStatusCounts.Design}
          </p>
          <h3 className="text-base font-medium text-gray-500 dark:text-gray-400">
            Design
          </h3>
        </div>
      </Link>

      {/* Development */}
      <Link
        href="/projects"
        className="group flex-1 min-w-[100px] rounded-lg border border-gray-200 bg-white p-4 transition-all hover:shadow-md dark:border-gray-700 dark:bg-secondary"
      >
        <div className="flex flex-col items-center gap-2 text-center">
          <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">
            {clientStatusCounts.Development}
          </p>
          <h3 className="text-base font-medium text-gray-500 dark:text-gray-400">
            Development
          </h3>
        </div>
      </Link>

      {/* Content Fillup */}
      <Link
        href="/projects"
        className="group flex-1 min-w-[100px] rounded-lg border border-gray-200 bg-white p-4 transition-all hover:shadow-md dark:border-gray-700 dark:bg-secondary"
      >
        <div className="flex flex-col items-center gap-2 text-center">
          <p className="text-3xl font-bold text-amber-600 dark:text-amber-400">
            {clientStatusCounts["Content-Fillup"]}
          </p>
          <h3 className="text-base font-medium text-gray-500 dark:text-gray-400">
            Content Fillup
          </h3>
        </div>
      </Link>
    </div>
  </div>
);