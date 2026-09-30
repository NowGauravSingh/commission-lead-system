"use client";

import { useEffect, useState } from "react";

export default function Home() {
  const [users, setUsers] = useState([]);
  const [leads, setLeads] = useState([]);

  useEffect(() => {
    loadUsers();
    loadLeads();
  }, []);

  async function loadUsers() {
    try {
      const response = await fetch("/api/users");
      const data = await response.json();
      setUsers(data);
    } catch (error) {
      console.error("Failed to load users:", error);
    }
  }

  async function loadLeads() {
    try {
      const response = await fetch("/api/leads");
      const data = await response.json();
      setLeads(data);
    } catch (error) {
      console.error("Failed to load leads:", error);
    }
  }

  return (
    <main className="min-h-screen bg-gray-100 p-8">
      <h1 className="mb-8 text-3xl font-bold text-gray-900">
        Commission Lead Management
      </h1>

      <section className="mb-8 rounded-lg bg-white p-6 shadow">
        <h2 className="mb-4 text-xl font-semibold text-gray-900">
          Users
        </h2>

        {users.length === 0 ? (
          <p className="text-gray-600">No users found.</p>
        ) : (
          <div className="space-y-3">
            {users.map((user) => (
              <div
                key={user.id}
                className="rounded border border-gray-200 p-3"
              >
                <p className="font-medium text-gray-900">{user.name}</p>
                <p className="text-sm text-gray-600">{user.email}</p>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="rounded-lg bg-white p-6 shadow">
        <h2 className="mb-4 text-xl font-semibold text-gray-900">
          Leads
        </h2>

        {leads.length === 0 ? (
          <p className="text-gray-600">No leads found.</p>
        ) : (
          <div className="space-y-3">
            {leads.map((lead) => (
              <div
                key={lead.id}
                className="rounded border border-gray-200 p-4"
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900">
                    {lead.title}
                  </h3>

                  <span
                    className={
                      lead.status === "CLOSED"
                        ? "font-medium text-red-600"
                        : "font-medium text-green-600"
                    }
                  >
                    {lead.status}
                  </span>
                </div>

                <p className="mt-2 text-gray-700">
                  Revenue: ₹{lead.revenue}
                </p>

                <p className="text-sm text-gray-600">
                  Assigned to:{" "}
                  {lead.assignedTo?.name ?? "Not assigned"}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}