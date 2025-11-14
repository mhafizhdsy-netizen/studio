"use client";

import { useState } from "react";
import { ExpenseForm } from "./ExpenseForm";
import { ExpenseList } from "./ExpenseList";

export function ExpenseTracker() {
    const [refreshKey, setRefreshKey] = useState(0);

    const handleFormSubmit = () => {
        setRefreshKey(prev => prev + 1);
    }

  return (
    <div className="grid md:grid-cols-3 gap-8">
        <div className="md:col-span-1">
            <ExpenseForm onFormSubmit={handleFormSubmit} />
        </div>
        <div className="md:col-span-2">
            <ExpenseList refreshKey={refreshKey} />
        </div>
    </div>
  );
}