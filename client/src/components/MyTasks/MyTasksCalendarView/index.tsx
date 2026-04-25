import React from 'react';
import CalendarHeader from '@/components/Calendar/CalendarHeader';
import CalendarMainView from '@/components/Calendar/CalendarMainView';
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Filter, X, Grid3x3, Calendar } from "lucide-react";
import { useAuth } from "../../../context/AuthContext";

type CalendarViewProps = {
  activeTab: string;
  setActiveTab: (tabName: string) => void;
};

const TabButton = ({ name, icon, setActiveTab, activeTab }: {
  name: string;
  icon: React.ReactNode;
  setActiveTab: (tabName: string) => void;
  activeTab: string;
}) => {
  const isActive = activeTab === name;

  return (
    <button
      className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium ${
        isActive
          ? "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-300"
          : "text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
      }`}
      onClick={() => setActiveTab(name)}
    >
      {icon}
      {name}
    </button>
  );
};

const MyTasksCalendarView = ({ activeTab, setActiveTab }: CalendarViewProps) => {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = React.useState("");

  return (
    <div className="dark:bg-primary-dark">
      {/* Header with search and filters - same as Board view */}
      <div className="sticky top-0 z-10 border-b border-t border-gray-200 bg-white px-4 py-2 dark:border-gray-700 dark:bg-secondary-dark">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
            {user?.username} Task's
          </h1>
          <div className="flex items-center space-x-2">
            {/* Search Input */}
            {/* <div className="relative rounded-md border dark:border-gray-600">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 border text-gray-500 dark:border-gray-700 dark:text-gray-400" />
              <Input
                type="search"
                placeholder="Search tasks..."
                className="w-full pl-9 dark:text-gray-200"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div> */}

            {/* <button
              className="flex items-center space-x-2 rounded-md border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              <Filter className="h-4 w-4" />
              <span>Filter</span>
            </button> */}

            <div className="flex gap-2">
              <TabButton
                name="Board"
                icon={<Grid3x3 className="h-5 w-5" />}
                setActiveTab={setActiveTab}
                activeTab={activeTab}
              />
              <TabButton
                name="Calendar"
                icon={<Calendar className="h-5 w-5" />}
                setActiveTab={setActiveTab}
                activeTab={activeTab}
              />
            </div>
          </div>
        </div>
      </div>

      <div className=''>
        <CalendarHeader/>
        <CalendarMainView/>
      </div>
    </div>
  );
};

export default MyTasksCalendarView;