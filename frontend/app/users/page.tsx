"use client";

import { useEffect, useState } from "react";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL;

export default function UsersPage() {
  const [users, setUsers] = useState<any[]>([]);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [managerId, setManagerId] = useState("");

  const [message, setMessage] = useState("");

  useEffect(() => {
    loadUsers();
  }, []);

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

  // Create a new user
  async function createUser(event: React.FormEvent) {
    event.preventDefault();

    setMessage("");

    try {
      const response = await fetch(`${API_URL}/users`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          email,
          managerId: managerId || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.error || "Failed to create user");
        return;
      }

      setMessage("User created successfully");

      // Clear form
      setName("");
      setEmail("");
      setManagerId("");

      // Refresh users
      loadUsers();
    } catch (error) {
      console.error("Create user error:", error);
      setMessage("Something went wrong");
    }
  }

  return (
    <main className="min-h-screen bg-gray-100 p-8">
      <div className="mx-auto max-w-6xl">

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
            Users
          </h1>

          <p className="mt-1 text-gray-600">
            Create and manage users and their hierarchy
          </p>
        </div>

        {/* Create User */}
        <section className="mb-8 rounded-xl bg-white p-6 shadow">
          <h2 className="mb-5 text-xl font-semibold text-gray-900">
            Create User
          </h2>

          <form
            onSubmit={createUser}
            className="grid gap-4 md:grid-cols-4"
          >
            {/* Name */}
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Name"
              className="rounded-lg border border-gray-300 bg-white p-3 text-gray-900 placeholder:text-gray-500"
              required
            />

            {/* Email */}
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              className="rounded-lg border border-gray-300 bg-white p-3 text-gray-900 placeholder:text-gray-500"
              required
            />

            {/* Manager */}
            <select
              value={managerId}
              onChange={(e) => setManagerId(e.target.value)}
              className="rounded-lg border border-gray-300 bg-white p-3 text-gray-900"
            >
              <option value="">No Manager</option>

              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name}
                </option>
              ))}
            </select>

            {/* Create button */}
            <button
              type="submit"
              className="rounded-lg bg-blue-600 p-3 font-medium text-white hover:bg-blue-700"
            >
              Create User
            </button>
          </form>

          {/* Message */}
          {message && (
            <p className="mt-4 text-sm font-medium text-gray-900">
              {message}
            </p>
          )}
        </section>

        {/* Users List */}
        <section className="rounded-xl bg-white p-6 shadow">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">
              All Users
            </h2>

            <span className="rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-700">
              {users.length} Users
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="p-3 text-gray-700">
                    Name
                  </th>

                  <th className="p-3 text-gray-700">
                    Email
                  </th>

                  <th className="p-3 text-gray-700">
                    Manager
                  </th>
                </tr>
              </thead>

              <tbody>
                {users.map((user) => (
                  <tr
                    key={user.id}
                    className="border-b last:border-0"
                  >
                    <td className="p-3 font-medium text-gray-900">
                      {user.name}
                    </td>

                    <td className="p-3 text-gray-700">
                      {user.email}
                    </td>

                    <td className="p-3 text-gray-700">
                      {user.manager?.name ?? "No manager"}
                    </td>
                  </tr>
                ))}

                {users.length === 0 && (
                  <tr>
                    <td
                      colSpan={3}
                      className="p-8 text-center text-gray-500"
                    >
                      No users found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

      </div>
    </main>
  );
}