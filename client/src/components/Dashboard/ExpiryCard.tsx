import Link from "next/link";
import { Clock } from "lucide-react";

export const ExpiryCard = ({
  expiringIn30Days,
  expiringIn15Days,
  expiringIn7Days,
  expired,
}: {
  expiringIn30Days: number;
  expiringIn15Days: number;
  expiringIn7Days: number;
  expired: number;
}) => (
  <div className="flex-1 rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-all hover:shadow-md dark:border-secondary dark:bg-secondary">
    <Link href="/expiry">
      <h2 className="mb-4 flex items-center gap-2 text-xl font-semibold text-gray-800 dark:text-gray-300">
        <Clock className="h-7 w-7 text-amber-500 dark:text-amber-400" />
        Expiry Status
      </h2>
    </Link>

    <div className="flex flex-wrap items-center justify-between gap-4">
      {/* 30 Days Left */}
      <Link
        href="/expiry/list?filter=30"
        className="group flex-1 min-w-[100px] rounded-lg border border-gray-200 bg-white p-4 transition-all hover:shadow-md dark:border-gray-700 dark:bg-secondary"
      >
        <div className="flex flex-col items-center gap-2 text-center">
          <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
            {expiringIn30Days}
          </p>
          <h3 className="text-base font-medium text-gray-500 dark:text-gray-400">
            30 Days Left
          </h3>
        </div>
      </Link>

      {/* 15 Days Left */}
      <Link
        href="/expiry/list?filter=15"
        className="group flex-1 min-w-[100px] rounded-lg border border-gray-200 bg-white p-4 transition-all hover:shadow-md dark:border-gray-700 dark:bg-secondary"
      >
        <div className="flex flex-col items-center gap-2 text-center">
          <p className="text-3xl font-bold text-amber-600 dark:text-amber-400">
            {expiringIn15Days}
          </p>
          <h3 className="text-base font-medium text-gray-500 dark:text-gray-400">
            15 Days Left
          </h3>
        </div>
      </Link>

      {/* 7 Days Left */}
      <Link
        href="/expiry/list?filter=7"
        className="group flex-1 min-w-[100px] rounded-lg border border-gray-200 bg-white p-4 transition-all hover:shadow-md dark:border-gray-700 dark:bg-secondary"
      >
        <div className="flex flex-col items-center gap-2 text-center">
          <p className="text-3xl font-bold text-orange-600 dark:text-orange-400">
            {expiringIn7Days}
          </p>
          <h3 className="text-base font-medium text-gray-500 dark:text-gray-400">
            7 Days Left
          </h3>
        </div>
      </Link>

      {/* Expired */}
      <Link
        href="/expiry/list?filter=expired"
        className="group flex-1 min-w-[100px] rounded-lg border border-gray-200 bg-white p-4 transition-all hover:shadow-md dark:border-gray-700 dark:bg-secondary"
      >
        <div className="flex flex-col items-center gap-2 text-center">
          <p className="text-3xl font-bold text-red-600 dark:text-red-400">
            {expired}
          </p>
          <h3 className="text-base font-medium text-gray-500 dark:text-gray-400">
            Expired
          </h3>
        </div>
      </Link>
    </div>
  </div>
);