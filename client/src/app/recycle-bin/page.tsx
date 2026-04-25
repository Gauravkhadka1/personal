// client/src/app/recyclebin/page.tsx
"use client";

import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import DeletedTasksPage from "./tasks/page";
import DeletedSubtasksPage from "./subtasks/page"; // Your existing subtasks page

const RecycleBinMainPage = () => {
  const [activeTab, setActiveTab] = useState("tasks");

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Recycle Bin</h1>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="tasks">Deleted Tasks</TabsTrigger>
          <TabsTrigger value="subtasks">Deleted Subtasks</TabsTrigger>
        </TabsList>
        
        <TabsContent value="tasks">
          <DeletedTasksPage />
        </TabsContent>
        
        <TabsContent value="subtasks">
          <DeletedSubtasksPage />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default RecycleBinMainPage;