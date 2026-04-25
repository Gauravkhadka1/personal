import Link from "next/link";
import { Users } from "lucide-react";

export const ProspectsCard = ({ prospectStatusCounts }: { prospectStatusCounts: any }) => (
  <div className="flex-1 rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-all hover:shadow-md dark:border-secondary dark:bg-secondary">
    <Link href="/prospects">
      <h2 className="mb-4 flex items-center gap-2 text-xl font-semibold text-gray-800 dark:text-gray-300">
        <Users className="h-7 w-7 text-emerald-500 dark:text-emerald-400" />
        Prospects
      </h2>
    </Link>

    <div className="flex flex-wrap items-center justify-between gap-4">
      {/* New Prospects */}
      <Link
        href="/prospects?status=New"
        className="group flex-1 min-w-[100px] rounded-lg border border-gray-200 bg-white p-4 transition-all hover:shadow-md dark:border-gray-700 dark:bg-secondary"
      >
        <div className="flex flex-col items-center gap-2 text-center">
          <p className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">
            {prospectStatusCounts.New}
          </p>
          <h3 className="text-base font-medium text-gray-500 dark:text-gray-400">
            New
          </h3>
        </div>
      </Link>

      {/* Dealing */}
      <Link
        href="/prospects?status=Dealing"
        className="group flex-1 min-w-[100px] rounded-lg border border-gray-200 bg-white p-4 transition-all hover:shadow-md dark:border-gray-700 dark:bg-secondary"
      >
        <div className="flex flex-col items-center gap-2 text-center">
          <p className="text-3xl font-bold text-cyan-600 dark:text-cyan-400">
            {prospectStatusCounts.Dealing}
          </p>
          <h3 className="text-base font-medium text-gray-500 dark:text-gray-400">
            Dealing
          </h3>
        </div>
      </Link>

      {/* Quote Sent */}
      <Link
        href="/prospects?status=QuoteSent"
        className="group flex-1 min-w-[100px] rounded-lg border border-gray-200 bg-white p-4 transition-all hover:shadow-md dark:border-gray-700 dark:bg-secondary"
      >
        <div className="flex flex-col items-center gap-2 text-center">
          <p className="text-3xl font-bold text-violet-600 dark:text-violet-400">
            {prospectStatusCounts.QuoteSent}
          </p>
          <h3 className="text-base font-medium text-gray-500 dark:text-gray-400">
            Quote Sent
          </h3>
        </div>
      </Link>

      {/* Agreement Sent */}
      <Link
        href="/prospects?status=AgreementSent"
        className="group flex-1 min-w-[100px] rounded-lg border border-gray-200 bg-white p-4 transition-all hover:shadow-md dark:border-gray-700 dark:bg-secondary"
      >
        <div className="flex flex-col items-center gap-2 text-center">
          <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">
            {prospectStatusCounts.AgreementSent}
          </p>
          <h3 className="text-base font-medium text-gray-500 dark:text-gray-400">
            Agreement Sent
          </h3>
        </div>
      </Link>
    </div>
  </div>
);