"use client";

import { useEffect, useState } from "react";

type User = {
  id: string;
  email: string;
  name: string | null;
  createdAt: string;
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);

  const [search, setSearch] = useState(""); // ✅ buscador

  // 👉 fecha obligatoria de tu API
  const from = "2024-01-01";

  const fetchUsers = async (pageNumber = 1, q = "") => {
    setLoading(true);

    const params = new URLSearchParams({
      from,
      page: String(pageNumber),
    });

    if (q) params.set("q", q); // ✅ búsqueda por nombre o email

    const res = await fetch(`/api/admin/users/list?${params.toString()}`);
    const data = await res.json();

    setUsers(data.users);
    setTotalPages(data.totalPages);
    setPage(data.page);

    setLoading(false);
  };

  // ✅ carga inicial
  useEffect(() => {
    fetchUsers(1, search);
  }, []);

  // ✅ debounce simple para el buscador
  useEffect(() => {
    const timeout = setTimeout(() => {
      fetchUsers(1, search);
    }, 400);

    return () => clearTimeout(timeout);
  }, [search]);

  const deleteUser = async (id: string) => {
    const confirm = window.confirm("Are you sure you want to delete this user?");
    if (!confirm) return;

    await fetch(`/api/admin/users/${id}`, {
      method: "DELETE",
    });

    fetchUsers(page, search);
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Users Management</h1>

      {/* ✅ BUSCADOR */}
      <input
        type="text"
        placeholder="Buscar por nombre o email..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="mb-4 w-full max-w-sm rounded border px-3 py-2"
      />

      {loading && <p>Loading...</p>}

      <table className="w-full border">
        <thead>
          <tr className="bg-gray-100">
            <th className="p-2">Name</th>
            <th className="p-2">Email</th>
            <th className="p-2">Created</th>
            <th className="p-2">Actions</th>
          </tr>
        </thead>

        <tbody>
          {users.map((user) => (
            <tr key={user.id} className="border-t">
              <td className="p-2">{user.name || "-"}</td>
              <td className="p-2">{user.email}</td>
              <td className="p-2">
                {new Date(user.createdAt).toLocaleDateString()}
              </td>
              <td className="p-2">
                <button
                  onClick={() => deleteUser(user.id)}
                  className="bg-red-600 text-white px-3 py-1 rounded"
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* ✅ PAGINACIÓN */}
      <div className="flex gap-3 mt-4">
        <button
          disabled={page === 1}
          onClick={() => fetchUsers(page - 1, search)}
          className="border px-3 py-1 rounded disabled:opacity-40"
        >
          ⬅ Prev
        </button>

        <span>
          Page {page} of {totalPages}
        </span>

        <button
          disabled={page === totalPages}
          onClick={() => fetchUsers(page + 1, search)}
          className="border px-3 py-1 rounded disabled:opacity-40"
        >
          Next ➡
        </button>
      </div>
    </div>
  );
}
