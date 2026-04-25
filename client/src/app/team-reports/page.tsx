// // Update your reports page.tsx
// "use client";

// import React from "react";
// import { useAuth } from "@/context/AuthContext";
// import withAuth from "../../hoc/withAuth";
// import { TeamReportsTable } from "@/components/Dashboard/TeamReportsTable";

// const TeamReports = () => {
//   const { user } = useAuth();

//   return (
//     <div className="p-4">
//       <TeamReportsTable 
//         isAdmin={user?.role === "ADMIN"} 
//         currentUser={user}
//           showTopRows={undefined}
//             title="Team Reports"
//       />
//     </div>
//   );
// };

// export default withAuth(TeamReports);

import React from 'react'

type Props = {}

const TeamReportPage = (props: Props) => {
  return (
    <div>TeamReportPage</div>
  )
}

export default TeamReportPage