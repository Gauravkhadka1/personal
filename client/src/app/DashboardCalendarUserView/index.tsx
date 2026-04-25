import React from 'react'
import CalendarHeader from '@/components/Calendar/CalendarHeader'
import CalendarMainView from '@/components/CalendarUserMainView'

type Props = {}
type CalendarViewProps = {
  activeTab: string;
  setActiveTab: (tabName: string) => void;
};

const DashboardCalendarView = ({ activeTab, setActiveTab }: CalendarViewProps) => {
  return (
    <div className=''>
     <CalendarHeader/>
     <CalendarMainView/>
      </div>
  )
}

export default DashboardCalendarView