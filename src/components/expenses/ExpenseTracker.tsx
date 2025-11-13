
"use client";

import { useState } from "react";
import { ExpenseForm } from "./ExpenseForm";
import { ExpenseList } from "./ExpenseList";

export function ExpenseTracker() {
    // This key is used to force a re-render of the ExpenseList when a new expense is added.
    const [refreshKey, setRefreshKey] = useState(0);

    const handleFormSubmit = () => {
        // This is no longer strictly necessary if ExpenseList uses useCollection correctly,
        // but can be kept as a backup for immediate re-renders if needed.
        setRefreshKey(prev => prev + 1);
    }

  return (
    <div className="grid md:grid-cols-3 gap-8">
        <div className="md:col-span-1">
            <ExpenseForm onFormSubmit={handleFormSubmit} />
        </div>
        <div className="md:col-span-2">
            {/* The refreshKey prop is removed as useCollection handles real-time updates */}
            <ExpenseList />
        </div>
    </div>
  );
}
