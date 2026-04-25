"use client";
import TasksBoardView from '@/components/Task/BoardView'
import React from 'react'
import { useTaskSocket } from "@/hooks/useTaskSocket"; 
import { useAuth } from "../../context/AuthContext";
import withAuth from "../../hoc/withAuth";

const TodayTasks = () => {
    const { user } = useAuth();
    const userId = user?.userId?.toString();
       useTaskSocket(userId);
  return (
    <div>
      <TasksBoardView tvMode={true} tvScrollSpeed={120} />
    </div>
  )
}

export default TodayTasks