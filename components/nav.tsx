"use client"

import Link from "next/link"
import { useSession, signOut } from "next-auth/react"
import { useState } from "react"

export function Nav() {
  const { data: session } = useSession()
  const [search, setSearch] = useState("")

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (search.trim()) {
      window.location.href = `/search?q=${encodeURIComponent(search)}`
    }
  }

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-red-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">IW</span>
              </div>
              <span className="font-bold text-lg">Demo Store</span>
            </Link>
            <div className="hidden md:flex items-center gap-6">
              <Link href="/" className="text-sm text-gray-600 hover:text-gray-900">
                Products
              </Link>
              {session && (
                <Link href="/orders" className="text-sm text-gray-600 hover:text-gray-900">
                  Orders
                </Link>
              )}
              {session?.user?.role === "admin" && (
                <>
                  <Link href="/admin/chaos" className="text-sm text-red-600 hover:text-red-800 font-medium">
                    Chaos Panel
                  </Link>
                  <Link href="/admin/products" className="text-sm text-gray-600 hover:text-gray-900">
                    Manage Products
                  </Link>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center gap-4">
            <form onSubmit={handleSearch} className="hidden sm:block">
              <input
                type="text"
                placeholder="Search products..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-64 px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </form>

            {session ? (
              <div className="flex items-center gap-4">
                <Link
                  href="/cart"
                  className="text-sm text-gray-600 hover:text-gray-900 flex items-center gap-1"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" />
                  </svg>
                  Cart
                </Link>
                <span className="text-sm text-gray-500">{session.user.name}</span>
                {session.user.role === "admin" && (
                  <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-medium">
                    Admin
                  </span>
                )}
                <button
                  onClick={() => signOut()}
                  className="text-sm text-gray-500 hover:text-gray-700"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link
                  href="/login"
                  className="text-sm text-gray-600 hover:text-gray-900"
                >
                  Sign In
                </Link>
                <Link
                  href="/register"
                  className="text-sm bg-orange-600 text-white px-4 py-1.5 rounded-lg hover:bg-orange-700"
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
