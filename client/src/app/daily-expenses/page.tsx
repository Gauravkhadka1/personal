'use client';

import React from 'react';
import DailyExpensesManager from '@/components/DailyExpensesManager';
import withRoleAuth from '@/hoc/withRoleAuth';

const DailyExpensesPage = () => {
  return <DailyExpensesManager />;
};

export default withRoleAuth(DailyExpensesPage, ['ADMIN', 'USER']);