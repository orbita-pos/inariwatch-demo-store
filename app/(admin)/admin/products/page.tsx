"use client"

import { useSession } from "next-auth/react"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

interface Product {
  id: string
  name: string
  description: string
  price: number
  stock: number
  category: string
  isActive: boolean
}

function formatPrice(cents: number) {
  return `$${(cents / 100).toFixed(2)}`
}

export default function AdminProductsPage() {
  const { data: session, status } = useSession()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Product | null>(null)
  const [form, setForm] = useState({
    name: "",
    description: "",
    price: "",
    stock: "",
    category: "stickers",
  })
  const router = useRouter()

  useEffect(() => {
    if (status === "unauthenticated" || (session && session.user.role !== "admin")) {
      router.push("/")
      return
    }
    if (status === "authenticated") {
      loadProducts()
    }
  }, [status, session, router])

  const loadProducts = () => {
    fetch("/api/admin/products")
      .then((r) => r.json())
      .then(setProducts)
      .finally(() => setLoading(false))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const body = {
      ...(editing ? { id: editing.id } : {}),
      name: form.name,
      description: form.description,
      price: Math.round(parseFloat(form.price) * 100),
      stock: parseInt(form.stock),
      category: form.category,
    }

    await fetch("/api/admin/products", {
      method: editing ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })

    setShowForm(false)
    setEditing(null)
    setForm({ name: "", description: "", price: "", stock: "", category: "stickers" })
    loadProducts()
  }

  const deleteProduct = async (id: string) => {
    await fetch(`/api/admin/products?id=${id}`, { method: "DELETE" })
    loadProducts()
  }

  const startEdit = (p: Product) => {
    setEditing(p)
    setForm({
      name: p.name,
      description: p.description,
      price: (p.price / 100).toFixed(2),
      stock: String(p.stock),
      category: p.category,
    })
    setShowForm(true)
  }

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-8">
        <p className="text-gray-500">Loading products...</p>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Manage Products</h1>
        <button
          onClick={() => {
            setShowForm(!showForm)
            setEditing(null)
            setForm({ name: "", description: "", price: "", stock: "", category: "stickers" })
          }}
          className="px-4 py-2 bg-orange-600 text-white text-sm rounded-lg hover:bg-orange-700"
        >
          {showForm ? "Cancel" : "Add Product"}
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="bg-white border border-gray-200 rounded-lg p-4 mb-6 space-y-3"
        >
          <div className="grid grid-cols-2 gap-3">
            <input
              type="text"
              placeholder="Product name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
            <select
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value="stickers">Stickers</option>
              <option value="mugs">Mugs</option>
              <option value="t-shirts">T-Shirts</option>
              <option value="accessories">Accessories</option>
            </select>
          </div>
          <textarea
            placeholder="Description"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            rows={2}
          />
          <div className="grid grid-cols-2 gap-3">
            <input
              type="number"
              step="0.01"
              placeholder="Price ($)"
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
              required
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
            <input
              type="number"
              placeholder="Stock"
              value={form.stock}
              onChange={(e) => setForm({ ...form, stock: e.target.value })}
              required
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-orange-600 text-white text-sm rounded-lg hover:bg-orange-700"
          >
            {editing ? "Update Product" : "Create Product"}
          </button>
        </form>
      )}

      <div className="overflow-x-auto">
        <table className="w-full bg-white border border-gray-200 rounded-lg">
          <thead>
            <tr className="border-b border-gray-200 text-left text-xs text-gray-500 uppercase">
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Price</th>
              <th className="px-4 py-3">Stock</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id} className="border-b border-gray-100">
                <td className="px-4 py-3 text-sm font-medium">{p.name}</td>
                <td className="px-4 py-3 text-sm text-gray-500 capitalize">
                  {p.category}
                </td>
                <td className="px-4 py-3 text-sm">{formatPrice(p.price)}</td>
                <td className="px-4 py-3 text-sm">{p.stock}</td>
                <td className="px-4 py-3">
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full ${
                      p.isActive
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-100 text-gray-500"
                    }`}
                  >
                    {p.isActive ? "Active" : "Inactive"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <button
                      onClick={() => startEdit(p)}
                      className="text-xs text-blue-600 hover:underline"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => deleteProduct(p.id)}
                      className="text-xs text-red-600 hover:underline"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
