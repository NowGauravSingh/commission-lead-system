"use client";

import { useEffect, useState } from "react";

const API_URL = "http://localhost:5000/api";

export default function LeadsPage() {
  const [leads, setLeads] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);

  const [title, setTitle] = useState("");
  const [revenue, setRevenue] = useState("");

  const [message, setMessage] = useState("");
  const [selectedLead, setSelectedLead] = useState<any>(null);

  useEffect(() => {
    loadLeads();
    loadUsers();
  }, []);

  // Load all leads
  async function loadLeads() {
    try {
      const response = await fetch(`${API_URL}/leads`);
      const data = await response.json();

      setLeads(data);
    } catch (error) {
      console.error("Failed to load leads:", error);
    }
  }

  // Load all users
  async function loadUsers() {
    try {
      const response = await fetch(`${API_URL}/users`);
      const data = await response.json();

      setUsers(data);
    } catch (error) {
      console.error("Failed to load users:", error);
    }
  }

  // Create a new lead
  async function createLead(event: React.FormEvent) {
    event.preventDefault();

    setMessage("");

    try {
      const response = await fetch(`${API_URL}/leads`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          revenue: Number(revenue),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.error || "Failed to create lead");
        return;
      }

      setMessage("Lead created successfully");

      setTitle("");
      setRevenue("");

      loadLeads();
    } catch (error) {
      console.error("Create lead error:", error);
      setMessage("Something went wrong");
    }
  }

  // Assign lead to a user
  async function assignLead(leadId: string, userId: string) {
    if (!userId) return;

    try {
      const response = await fetch(
        `${API_URL}/leads/${leadId}/assign`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userId,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.error || "Failed to assign lead");
        return;
      }

      setMessage("Lead assigned successfully");

      loadLeads();
    } catch (error) {
      console.error("Assign lead error:", error);
      setMessage("Something went wrong");
    }
  }

  // Close lead
  async function closeLead(leadId: string) {
    try {
      const response = await fetch(
        `${API_URL}/leads/${leadId}/close`,
        {
          method: "POST",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.error || "Failed to close lead");
        return;
      }

      setMessage("Lead closed successfully");

      loadLeads();
    } catch (error) {
      console.error("Close lead error:", error);
      setMessage("Something went wrong");
    }
  }

  // View complete lead details
  async function viewLeadDetails(leadId: string) {
    try {
      const response = await fetch(
        `${API_URL}/leads/${leadId}`
      );

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.error || "Failed to load lead details");
        return;
      }

      setSelectedLead(data);
    } catch (error) {
      console.error("Lead details error:", error);
      setMessage("Something went wrong");
    }
  }

  return (
    <main className="min-h-screen bg-gray-100 p-8">
      <div className="mx-auto max-w-7xl">

        {/* Back to Dashboard */}
        <a
          href="/"
          className="mb-6 inline-block rounded-lg bg-gray-800 px-4 py-2 font-medium text-white hover:bg-gray-900"
        >
          ← Back to Dashboard
        </a>

        {/* Page Heading */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Leads
          </h1>

          <p className="mt-1 text-gray-600">
            Create, assign and manage your leads
          </p>
        </div>

        {/* Create Lead */}
        <section className="mb-8 rounded-xl bg-white p-6 shadow">
          <h2 className="mb-5 text-xl font-semibold text-gray-900">
            Create Lead
          </h2>

          <form
            onSubmit={createLead}
            className="grid gap-4 md:grid-cols-3"
          >
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Lead title"
              className="rounded-lg border border-gray-300 bg-white p-3 text-gray-900 placeholder:text-gray-500"
              required
            />

            <input
              type="number"
              value={revenue}
              onChange={(e) => setRevenue(e.target.value)}
              placeholder="Revenue"
              min="1"
              className="rounded-lg border border-gray-300 bg-white p-3 text-gray-900 placeholder:text-gray-500"
              required
            />

            <button
              type="submit"
              className="rounded-lg bg-blue-600 p-3 font-medium text-white hover:bg-blue-700"
            >
              Create Lead
            </button>
          </form>

          {message && (
            <p className="mt-4 text-sm font-medium text-gray-900">
              {message}
            </p>
          )}
        </section>

        {/* Leads List */}
        <section className="rounded-xl bg-white p-6 shadow">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">
              All Leads
            </h2>

            <span className="rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-700">
              {leads.length} Leads
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="p-3 text-gray-700">
                    Title
                  </th>

                  <th className="p-3 text-gray-700">
                    Revenue
                  </th>

                  <th className="p-3 text-gray-700">
                    Status
                  </th>

                  <th className="p-3 text-gray-700">
                    Assigned To
                  </th>

                  <th className="p-3 text-gray-700">
                    Assign
                  </th>

                  <th className="p-3 text-gray-700">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody>
                {leads.map((lead) => (
                  <tr
                    key={lead.id}
                    className="border-b last:border-0"
                  >
                    {/* Title */}
                    <td className="p-3 font-medium text-gray-900">
                      {lead.title}
                    </td>

                    {/* Revenue */}
                    <td className="p-3 text-gray-700">
                      ₹{Number(lead.revenue).toLocaleString()}
                    </td>

                    {/* Status */}
                    <td className="p-3">
                      {lead.status === "OPEN" ? (
                        <span className="rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-700">
                          OPEN
                        </span>
                      ) : (
                        <span className="rounded-full bg-gray-200 px-3 py-1 text-sm font-medium text-gray-700">
                          CLOSED
                        </span>
                      )}
                    </td>

                    {/* Assigned user */}
                    <td className="p-3 text-gray-700">
                      {lead.assignedTo?.name ?? "Not assigned"}
                    </td>

                    {/* Assign */}
                    <td className="p-3">
                      {lead.status === "OPEN" ? (
                        <select
                          value={lead.assignedTo?.id ?? ""}
                          onChange={(e) =>
                            assignLead(
                              lead.id,
                              e.target.value
                            )
                          }
                          className="rounded-lg border border-gray-300 bg-white p-2 text-sm text-gray-900"
                        >
                          <option value="">
                            Select user
                          </option>

                          {users.map((user) => (
                            <option
                              key={user.id}
                              value={user.id}
                            >
                              {user.name}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <span className="text-sm text-gray-500">
                          Closed
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="p-3">
                      <div className="flex gap-2">
                        <button
                          onClick={() =>
                            viewLeadDetails(lead.id)
                          }
                          className="rounded-lg bg-gray-800 px-3 py-2 text-sm font-medium text-white hover:bg-gray-900"
                        >
                          Details
                        </button>

                        {lead.status === "OPEN" && (
                          <button
                            onClick={() =>
                              closeLead(lead.id)
                            }
                            disabled={!lead.assignedTo}
                            className="rounded-lg bg-green-600 px-3 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:bg-gray-300"
                          >
                            Close
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}

                {leads.length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      className="p-8 text-center text-gray-500"
                    >
                      No leads found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* Lead Details */}
        {selectedLead && (
          <section className="mt-8 rounded-xl bg-white p-6 shadow">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  Lead Details
                </h2>

                <p className="text-gray-500">
                  {selectedLead.title}
                </p>
              </div>

              <button
                onClick={() => setSelectedLead(null)}
                className="rounded-lg bg-gray-200 px-4 py-2 text-sm font-medium text-gray-800 hover:bg-gray-300"
              >
                Close
              </button>
            </div>

            {/* Basic Information */}
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-lg bg-gray-50 p-4">
                <p className="text-sm text-gray-500">
                  Revenue
                </p>

                <p className="mt-1 text-xl font-semibold text-gray-900">
                  ₹
                  {Number(
                    selectedLead.revenue
                  ).toLocaleString()}
                </p>
              </div>

              <div className="rounded-lg bg-gray-50 p-4">
                <p className="text-sm text-gray-500">
                  Status
                </p>

                <p className="mt-1 text-xl font-semibold text-gray-900">
                  {selectedLead.status}
                </p>
              </div>

              <div className="rounded-lg bg-gray-50 p-4">
                <p className="text-sm text-gray-500">
                  Assigned Agent
                </p>

                <p className="mt-1 text-xl font-semibold text-gray-900">
                  {selectedLead.assignedTo?.name ??
                    "Not assigned"}
                </p>
              </div>
            </div>

            {/* User Hierarchy */}
            <div className="mt-8">
              <h3 className="mb-4 text-lg font-semibold text-gray-900">
                User Hierarchy
              </h3>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-lg border p-4">
                  <p className="text-sm text-gray-500">
                    Level 1 - Agent
                  </p>

                  <p className="mt-1 font-semibold text-gray-900">
                    {selectedLead.assignedTo?.name ??
                      "N/A"}
                  </p>
                </div>

                <div className="rounded-lg border p-4">
                  <p className="text-sm text-gray-500">
                    Level 2 - Manager
                  </p>

                  <p className="mt-1 font-semibold text-gray-900">
                    {selectedLead.assignedTo?.manager?.name ??
                      "N/A"}
                  </p>
                </div>

                <div className="rounded-lg border p-4">
                  <p className="text-sm text-gray-500">
                    Level 3 - Manager&apos;s Manager
                  </p>

                  <p className="mt-1 font-semibold text-gray-900">
                    {selectedLead.assignedTo?.manager?.manager
                      ?.name ?? "N/A"}
                  </p>
                </div>
              </div>
            </div>

            {/* Commission Breakdown */}
            <div className="mt-8">
              <h3 className="mb-4 text-lg font-semibold text-gray-900">
                Commission Breakdown
              </h3>

              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b bg-gray-50">
                      <th className="p-3 text-gray-700">
                        Type
                      </th>

                      <th className="p-3 text-gray-700">
                        User
                      </th>

                      <th className="p-3 text-gray-700">
                        Amount
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {selectedLead.commissions?.map(
                      (commission: any) => (
                        <tr
                          key={commission.id}
                          className="border-b last:border-0"
                        >
                          <td className="p-3 text-gray-900">
                            {commission.type}
                          </td>

                          <td className="p-3 text-gray-700">
                            {commission.user?.name ??
                              "Company"}
                          </td>

                          <td className="p-3 font-medium text-gray-900">
                            ₹
                            {Number(
                              commission.amount
                            ).toLocaleString()}
                          </td>
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              </div>

              {/* Total */}
              {selectedLead.commissions?.length > 0 && (
                <div className="mt-4 flex justify-end">
                  <div className="rounded-lg bg-gray-100 px-5 py-3">
                    <span className="mr-3 text-gray-600">
                      Total Commission:
                    </span>

                    <span className="font-bold text-gray-900">
                      ₹
                      {selectedLead.commissions
                        .reduce(
                          (
                            total: number,
                            commission: any
                          ) =>
                            total +
                            Number(commission.amount),
                          0
                        )
                        .toLocaleString()}
                    </span>
                  </div>
                </div>
              )}

              {selectedLead.commissions?.length === 0 && (
                <p className="mt-4 text-sm text-gray-500">
                  Commission will appear after the lead
                  is closed.
                </p>
              )}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}