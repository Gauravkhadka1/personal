"use client"; // Make this a Client Component

import { usePathname } from "next/navigation";
import DashboardWrapper from "./dashboardWrapper";

export default function LayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  // Define pages where DashboardWrapper should NOT be used
  const noWrapperPages = ["/", "/signup", "/today-tasks"];

  // Also handle routes with trailing slashes or different patterns
  const isExcludedPage = noWrapperPages.some(
    (page) => pathname === page || pathname === `${page}/`,
  );

  return (
    <>
      {isExcludedPage ? (
        children
      ) : (
        <DashboardWrapper>{children}</DashboardWrapper>
      )}
    </>
  );
}
