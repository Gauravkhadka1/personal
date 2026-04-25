"use client"
import React, { useState } from 'react';
import SystemFeedbackSidebar from '@/components/SystemFeedbackSidebar';
import SystemFeedbackCard from '@/components/SystemFeedbackCard';

const SystemFeedbackPage: React.FC = () => {
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);

  return (
    <div className="flex gap-4 p-4">
            <div className="w-2/3">
        <SystemFeedbackCard selectedUserId={selectedUserId} />
      </div>
      <div className="w-1/3">
        <SystemFeedbackSidebar 
          onUserSelect={setSelectedUserId}
          selectedUserId={selectedUserId}
        />
      </div>
    </div>
  );
};

export default SystemFeedbackPage;