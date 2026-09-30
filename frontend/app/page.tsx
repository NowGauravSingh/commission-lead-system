"use client";

import { useEffect, useState } from "react";

const API_URL = "http://localhost:5000/api";

export default function Dashboard() {
  const [users, setUsers] = useState<any[]>([]);
  const [leads, setLeads] = useState<any[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [usersResponse, leadsResponse] = await Promise.all([
        fetch(`${API_URL}/users`),
        fetch(`${API_URL}/leads`),
      ]);

      const usersData = await usersResponse.json();
      const leadsData = await leadsResponse.json();

      setUsers(usersData);
      setLeads(leadsData);
    } catch (error) {
      console.error("Dashboard error:", error);
    }
  }

  const openLeads = leads.filter(
    (lead) => lead.status === "OPEN"
  ).length;

  const closedLeads = leads.filter(
    (lead) => lead.status === "CLOSED"
  ).length;

  const totalRevenue = leads.reduce(
    (total, lead) => total + Number(lead.revenue),
    0
  );

  const totalCommission = leads.reduce(
    (total, lead) =>
      total +
      (lead.commissions || []).reduce(
        (sum: number, commission: any) =>
          sum + Number(commission.amount),
        0
      ),
    0
  );

  return (
    <main className="min-h-screen bg-gray-100 p-8">
      <div className="mx-auto max-w-7xl">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Commission Lead Dashboard
          </h1>

          <p className="mt-2 text-gray-600">
            Overview of users, leads and commissions
          </p>
        </div>

        {/* Navigation */}
        <div className="mb-8 flex gap-3">
          <a
            href="/"
            className="rounded-lg bg-blue-600 px-5 py-3 font-medium text-white"
          >
            Dashboard
          </a>

          <a
            href="/users"
            className="rounded-lg bg-white px-5 py-3 font-medium text-gray-800 shadow hover:bg-gray-50"
          >
            Users
          </a>

          <a
            href="/leads"
            className="rounded-lg bg-white px-5 py-3 font-medium text-gray-800 shadow hover:bg-gray-50"
          >
            Leads
          </a>
        </div>

        {/* Statistics */}
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">

          {/* Users */}
          <div className="rounded-xl bg-white p-6 shadow">
            <p className="text-sm font-medium text-gray-500">
              Total Users
            </p>

            <p className="mt-2 text-3xl font-bold text-gray-900">
              {users.length}
            </p>
          </div>

          {/* Total Leads */}
          <div className="rounded-xl bg-white p-6 shadow">
            <p className="text-sm font-medium text-gray-500">
              Total Leads
            </p>

            <p className="mt-2 text-3xl font-bold text-gray-900">
              {leads.length}
            </p>
          </div>

          {/* Open Leads */}
          <div className="rounded-xl bg-white p-6 shadow">
            <p className="text-sm font-medium text-gray-500">
              Open Leads
            </p>

            <p className="mt-2 text-3xl font-bold text-green-600">
              {openLeads}
            </p>
          </div>

          {/* Closed Leads */}
          <div className="rounded-xl bg-white p-6 shadow">
            <p className="text-sm font-medium text-gray-500">
              Closed Leads
            </p>

            <p className="mt-2 text-3xl font-bold text-gray-700">
              {closedLeads}
            </p>
          </div>

          {/* Revenue */}
          <div className="rounded-xl bg-white p-6 shadow">
            <p className="text-sm font-medium text-gray-500">
              Total Revenue
            </p>

            <p className="mt-2 text-3xl font-bold text-gray-900">
              ₹{totalRevenue.toLocaleString()}
            </p>
          </div>

          {/* Commission */}
          <div className="rounded-xl bg-white p-6 shadow">
            <p className="text-sm font-medium text-gray-500">
              Total Commission
            </p>

            <p className="mt-2 text-3xl font-bold text-blue-600">
              ₹{totalCommission.toLocaleString()}
            </p>
          </div>
        </div>

        {/* Quick Actions */}
        <section className="mt-8 rounded-xl bg-white p-6 shadow">
          <h2 className="text-xl font-semibold text-gray-900">
            Quick Actions
          </h2>

          <div className="mt-5 flex flex-wrap gap-4">
            <a
              href="/users"
              className="rounded-lg bg-blue-600 px-5 py-3 font-medium text-white hover:bg-blue-700"
            >
              Manage Users
            </a>

            <a
              href="/leads"
              className="rounded-lg bg-gray-800 px-5 py-3 font-medium text-white hover:bg-gray-900"
            >
              Manage Leads
            </a>
          </div>
        </section>

      </div>
    </main>
  );
}