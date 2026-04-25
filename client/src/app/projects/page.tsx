"use client";

import React, { useState, useEffect } from "react";
import Board from "./ProjectBoardView";
import CreateTask from "@/components/Task/CreateTask";
import withRoleAuth from "../../hoc/withRoleAuth";

type Props = {
  params: { id: string };
};

const NewProject = ({ params }: Props) => {
  const { id } = params;
  const [activeTab, setActiveTab] = useState("Board");
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);

  // if (isLoading) return <div>Loading...</div>;
  // if (error) return <div>An error occurred while fetching project data.</div>;

  return (
    <div className="dark:bg-primary-dark h-[100%]">
      <CreateTask
        isOpen={isCreateTaskOpen}
        onClose={() => setIsCreateTaskOpen(false)}
        id={id}
      />
      {activeTab === "Board" && <Board />}
    </div>
  );
};

export default withRoleAuth(NewProject, ["ADMIN", "DESIGNER", "DEVELOPER"]);