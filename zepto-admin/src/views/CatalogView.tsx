import { useEffect, useState } from 'react'
import {
  ChevronDown,
  ChevronUp,
  Pencil,
  X,
  Plus,
  Loader2,
  Tag,
  Package,
} from 'lucide-react'
import { clsx } from 'clsx'
import type { Category, Product, Variant } from '../types'

// ─── Form shape types ────────────────────────────────────────────────────────

interface ProductForm {
  name: string
  brand: string
  description: string
  categoryId: string
}

interface VariantForm {
  displayName: string
  skuCode: string
  packSize: string
  unit: string
  mrp: string
  sellingPrice: string
  imageUrl: string
}

interface EditVariantForm {
  mrp: string
  sellingPrice: string
  imageUrl: string
  available: boolean
}

interface CategoryForm {
  name: string
  parentId: string
}

const EMPTY_PRODUCT_FORM: ProductForm = {
  name: '',
  brand: '',
  description: '',
  categoryId: '',
}

const EMPTY_VARIANT_FORM: VariantForm = {
  displayName: '',
  skuCode: '',
  packSize: '',
  unit: '',
  mrp: '',
  sellingPrice: '',
  imageUrl: '',
}

const EMPTY_CATEGORY_FORM: CategoryForm = { name: '', parentId: '' }

// ─── Shared input / label classnames ─────────────────────────────────────────

const inputCls =
  'w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500'

const labelCls = 'mb-1 block text-xs font-medium text-gray-700'

// ─── Modal wrapper ────────────────────────────────────────────────────────────

function ModalShell({
  title,
  onClose,
  children,
}: {
  title: string
  onClose: () => void
  children: React.ReactNode
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-md rounded-xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <h2 className="text-base font-semibold text-gray-900">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

// ─── Main view ────────────────────────────────────────────────────────────────

export function CatalogView() {
  const [activeTab, setActiveTab] = useState<'products' | 'categories'>('products')

  // Data
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)

  // Products tab UI state
  const [filterCategoryId, setFilterCategoryId] = useState('')
  const [expandedProductId, setExpandedProductId] = useState<string | null>(null)

  // Product modal
  const [productModalOpen, setProductModalOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [productForm, setProductForm] = useState<ProductForm>(EMPTY_PRODUCT_FORM)
  const [productSubmitting, setProductSubmitting] = useState(false)
  const [productError, setProductError] = useState<string | null>(null)

  // Variant add modal
  const [addVariantForProductId, setAddVariantForProductId] = useState<string | null>(null)
  const [variantForm, setVariantForm] = useState<VariantForm>(EMPTY_VARIANT_FORM)
  const [variantSubmitting, setVariantSubmitting] = useState(false)
  const [variantError, setVariantError] = useState<string | null>(null)

  // Variant edit modal
  const [editingVariant, setEditingVariant] = useState<Variant | null>(null)
  const [editVariantForm, setEditVariantForm] = useState<EditVariantForm>({
    mrp: '',
    sellingPrice: '',
    imageUrl: '',
    available: true,
  })
  const [editVariantSubmitting, setEditVariantSubmitting] = useState(false)
  const [editVariantError, setEditVariantError] = useState<string | null>(null)

  // Category modal
  const [categoryModalOpen, setCategoryModalOpen] = useState(false)
  const [categoryForm, setCategoryForm] = useState<CategoryForm>(EMPTY_CATEGORY_FORM)
  const [categorySubmitting, setCategorySubmitting] = useState(false)
  const [categoryError, setCategoryError] = useState<string | null>(null)

  // ─── Fetch helpers ──────────────────────────────────────────────────────────

  async function fetchProducts() {
    const res = await fetch('/catalog/products')
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return (await res.json()) as Product[]
  }

  async function fetchCategories() {
    const res = await fetch('/catalog/categories')
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return (await res.json()) as Category[]
  }

  async function reloadAll() {
    setLoading(true)
    try {
      const [prods, cats] = await Promise.all([fetchProducts(), fetchCategories()])
      setProducts(prods)
      setCategories(cats)
    } catch (e) {
      console.error('Failed to load catalog', e)
    } finally {
      setLoading(false)
    }
  }

  async function reloadCategories() {
    try {
      const cats = await fetchCategories()
      setCategories(cats)
    } catch (e) {
      console.error('Failed to reload categories', e)
    }
  }

  useEffect(() => {
    reloadAll()
  }, [])

  // ─── Derived data ───────────────────────────────────────────────────────────

  const displayedProducts = filterCategoryId
    ? products.filter((p) => p.categoryId === filterCategoryId)
    : products

  function categoryName(id: string | null) {
    if (!id) return '—'
    return categories.find((c) => c.id === id)?.name ?? '—'
  }

  // ─── Product modal handlers ─────────────────────────────────────────────────

  function openAddProduct() {
    setEditingProduct(null)
    setProductForm(EMPTY_PRODUCT_FORM)
    setProductError(null)
    setProductModalOpen(true)
  }

  function openEditProduct(p: Product) {
    setEditingProduct(p)
    setProductForm({
      name: p.name,
      brand: p.brand ?? '',
      description: p.description ?? '',
      categoryId: p.categoryId,
    })
    setProductError(null)
    setProductModalOpen(true)
  }

  function closeProductModal() {
    setProductModalOpen(false)
    setEditingProduct(null)
    setProductForm(EMPTY_PRODUCT_FORM)
    setProductError(null)
  }

  async function handleProductSubmit(e: React.FormEvent) {
    e.preventDefault()
    setProductSubmitting(true)
    setProductError(null)
    try {
      if (editingProduct) {
        const body: Record<string, unknown> = {}
        if (productForm.name !== editingProduct.name) body.name = productForm.name
        if (productForm.brand !== (editingProduct.brand ?? '')) body.brand = productForm.brand || null
        if (productForm.description !== (editingProduct.description ?? '')) body.description = productForm.description || null
        if (productForm.categoryId !== editingProduct.categoryId) body.categoryId = productForm.categoryId

        const res = await fetch(`/catalog/products/${editingProduct.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
      } else {
        const res = await fetch('/catalog/products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: productForm.name,
            brand: productForm.brand || null,
            description: productForm.description || null,
            categoryId: productForm.categoryId,
          }),
        })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
      }
      closeProductModal()
      await reloadAll()
    } catch (err) {
      setProductError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setProductSubmitting(false)
    }
  }

  async function handleDeactivateProduct(p: Product) {
    if (!window.confirm(`Deactivate product "${p.name}"?`)) return
    try {
      const res = await fetch(`/catalog/products/${p.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      setProducts((prev) => prev.filter((x) => x.id !== p.id))
    } catch (e) {
      console.error('Failed to deactivate product', e)
    }
  }

  // ─── Variant add modal handlers ─────────────────────────────────────────────

  function openAddVariant(productId: string) {
    setAddVariantForProductId(productId)
    setVariantForm(EMPTY_VARIANT_FORM)
    setVariantError(null)
  }

  function closeAddVariantModal() {
    setAddVariantForProductId(null)
    setVariantForm(EMPTY_VARIANT_FORM)
    setVariantError(null)
  }

  async function handleVariantSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!addVariantForProductId) return
    setVariantSubmitting(true)
    setVariantError(null)
    try {
      const res = await fetch(`/catalog/products/${addVariantForProductId}/variants`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          displayName: variantForm.displayName,
          skuCode: variantForm.skuCode,
          packSize: variantForm.packSize || null,
          unit: variantForm.unit || null,
          mrp: parseFloat(variantForm.mrp),
          sellingPrice: parseFloat(variantForm.sellingPrice),
          imageUrl: variantForm.imageUrl || null,
        }),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      closeAddVariantModal()
      await reloadAll()
    } catch (err) {
      setVariantError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setVariantSubmitting(false)
    }
  }

  // ─── Variant edit modal handlers ────────────────────────────────────────────

  function openEditVariant(v: Variant) {
    setEditingVariant(v)
    setEditVariantForm({
      mrp: String(v.mrp),
      sellingPrice: String(v.sellingPrice),
      imageUrl: v.imageUrl ?? '',
      available: v.available,
    })
    setEditVariantError(null)
  }

  function closeEditVariantModal() {
    setEditingVariant(null)
    setEditVariantError(null)
  }

  async function handleEditVariantSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!editingVariant) return
    setEditVariantSubmitting(true)
    setEditVariantError(null)
    try {
      const body: Record<string, unknown> = {}
      if (parseFloat(editVariantForm.mrp) !== editingVariant.mrp) body.mrp = parseFloat(editVariantForm.mrp)
      if (parseFloat(editVariantForm.sellingPrice) !== editingVariant.sellingPrice) body.sellingPrice = parseFloat(editVariantForm.sellingPrice)
      if ((editVariantForm.imageUrl || null) !== editingVariant.imageUrl) body.imageUrl = editVariantForm.imageUrl || null
      if (editVariantForm.available !== editingVariant.available) body.available = editVariantForm.available

      const res = await fetch(`/catalog/variants/${editingVariant.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      closeEditVariantModal()
      await reloadAll()
    } catch (err) {
      setEditVariantError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setEditVariantSubmitting(false)
    }
  }

  // ─── Inline available toggle ────────────────────────────────────────────────

  async function handleToggleAvailable(v: Variant) {
    const newVal = !v.available
    // Optimistic update
    setProducts((prev) =>
      prev.map((p) => ({
        ...p,
        variants: p.variants.map((vv) =>
          vv.id === v.id ? { ...vv, available: newVal } : vv,
        ),
      })),
    )
    try {
      const res = await fetch(`/catalog/variants/${v.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ available: newVal }),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
    } catch (e) {
      console.error('Toggle available failed, reverting', e)
      // Revert
      setProducts((prev) =>
        prev.map((p) => ({
          ...p,
          variants: p.variants.map((vv) =>
            vv.id === v.id ? { ...vv, available: v.available } : vv,
          ),
        })),
      )
    }
  }

  // ─── Category modal handlers ────────────────────────────────────────────────

  function openAddCategory() {
    setCategoryForm(EMPTY_CATEGORY_FORM)
    setCategoryError(null)
    setCategoryModalOpen(true)
  }

  function closeCategoryModal() {
    setCategoryModalOpen(false)
    setCategoryForm(EMPTY_CATEGORY_FORM)
    setCategoryError(null)
  }

  async function handleCategorySubmit(e: React.FormEvent) {
    e.preventDefault()
    setCategorySubmitting(true)
    setCategoryError(null)
    try {
      const res = await fetch('/catalog/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: categoryForm.name,
          parentId: categoryForm.parentId || null,
        }),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      closeCategoryModal()
      await reloadCategories()
    } catch (err) {
      setCategoryError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setCategorySubmitting(false)
    }
  }

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      {/* Page header */}
      <h1 className="mb-6 text-2xl font-bold text-gray-900">Catalog</h1>

      {/* Tabs */}
      <div className="mb-6 flex gap-6 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('products')}
          className={clsx(
            'flex items-center gap-1.5 pb-3 text-sm transition-colors',
            activeTab === 'products'
              ? 'border-b-2 border-violet-600 text-violet-700 font-semibold'
              : 'text-gray-500 hover:text-gray-700',
          )}
        >
          <Package className="h-4 w-4" />
          Products
        </button>
        <button
          onClick={() => setActiveTab('categories')}
          className={clsx(
            'flex items-center gap-1.5 pb-3 text-sm transition-colors',
            activeTab === 'categories'
              ? 'border-b-2 border-violet-600 text-violet-700 font-semibold'
              : 'text-gray-500 hover:text-gray-700',
          )}
        >
          <Tag className="h-4 w-4" />
          Categories
        </button>
      </div>

      {/* ── Products tab ── */}
      {activeTab === 'products' && (
        <>
          {/* Top bar */}
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <select
              value={filterCategoryId}
              onChange={(e) => setFilterCategoryId(e.target.value)}
              className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-800 outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
            >
              <option value="">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>

            <div className="ml-auto">
              <button
                onClick={openAddProduct}
                className="flex items-center gap-1.5 rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-violet-700 transition-colors"
              >
                <Plus className="h-4 w-4" />
                Add Product
              </button>
            </div>
          </div>

          {/* Products table */}
          <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="h-6 w-6 animate-spin text-violet-500" />
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    {['Name', 'Brand', 'Category', 'Variants', 'Status', 'Actions'].map((h) => (
                      <th
                        key={h}
                        className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {displayedProducts.map((p) => {
                    const expanded = expandedProductId === p.id
                    return (
                      <>
                        <tr
                          key={p.id}
                          className="hover:bg-violet-50"
                        >
                          {/* Name */}
                          <td className="px-4 py-3">
                            <button
                              onClick={() =>
                                setExpandedProductId(expanded ? null : p.id)
                              }
                              className="font-medium text-gray-800 hover:text-violet-700 text-left transition-colors"
                            >
                              {p.name}
                            </button>
                          </td>

                          {/* Brand */}
                          <td className="px-4 py-3 text-gray-600">
                            {p.brand ?? <span className="text-gray-300">—</span>}
                          </td>

                          {/* Category */}
                          <td className="px-4 py-3 text-gray-600">{p.categoryName}</td>

                          {/* Variants count + chevron */}
                          <td className="px-4 py-3">
                            <button
                              onClick={() =>
                                setExpandedProductId(expanded ? null : p.id)
                              }
                              className="flex items-center gap-1 text-gray-700 hover:text-violet-700 transition-colors"
                            >
                              <span className="font-semibold">{p.variants.length}</span>
                              {expanded ? (
                                <ChevronUp className="h-3.5 w-3.5" />
                              ) : (
                                <ChevronDown className="h-3.5 w-3.5" />
                              )}
                            </button>
                          </td>

                          {/* Status */}
                          <td className="px-4 py-3">
                            {p.active ? (
                              <span className="text-xs font-semibold text-green-700 bg-green-100 px-2 py-0.5 rounded-full">
                                ACTIVE
                              </span>
                            ) : (
                              <span className="text-xs font-semibold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                                INACTIVE
                              </span>
                            )}
                          </td>

                          {/* Actions */}
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => openEditProduct(p)}
                                className="flex items-center gap-1 rounded-md border border-gray-200 px-2.5 py-1 text-xs font-medium text-gray-600 hover:border-violet-400 hover:text-violet-700 transition-colors"
                              >
                                <Pencil className="h-3 w-3" />
                                Edit
                              </button>
                              {p.active && (
                                <button
                                  onClick={() => handleDeactivateProduct(p)}
                                  className="flex items-center gap-1 rounded-md border border-red-200 px-2.5 py-1 text-xs font-medium text-red-500 hover:border-red-400 hover:text-red-700 transition-colors"
                                >
                                  <X className="h-3 w-3" />
                                  Deactivate
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>

                        {/* Variant accordion */}
                        {expanded && (
                          <tr key={`${p.id}-variants`}>
                            <td colSpan={6} className="bg-violet-50/50 px-8 py-4">
                              <div className="rounded-lg border border-violet-100 bg-white overflow-hidden">
                                <table className="w-full text-xs">
                                  <thead className="bg-gray-50 border-b border-gray-100">
                                    <tr>
                                      {[
                                        'SKU',
                                        'Display Name',
                                        'Pack Size',
                                        'Unit',
                                        'MRP',
                                        'Selling Price',
                                        'Available',
                                        'Edit',
                                      ].map((h) => (
                                        <th
                                          key={h}
                                          className="px-3 py-2 text-left font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap"
                                        >
                                          {h}
                                        </th>
                                      ))}
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-gray-50">
                                    {p.variants.map((v) => (
                                      <tr key={v.id} className="hover:bg-violet-50">
                                        <td className="px-3 py-2 font-mono text-gray-400">
                                          {v.skuCode}
                                        </td>
                                        <td className="px-3 py-2 font-medium text-gray-800">
                                          {v.displayName}
                                        </td>
                                        <td className="px-3 py-2 text-gray-500">
                                          {v.packSize ?? <span className="text-gray-300">—</span>}
                                        </td>
                                        <td className="px-3 py-2 text-gray-500">
                                          {v.unit ?? <span className="text-gray-300">—</span>}
                                        </td>
                                        <td className="px-3 py-2 text-gray-700">
                                          ₹{v.mrp.toFixed(2)}
                                        </td>
                                        <td className="px-3 py-2 text-gray-700">
                                          ₹{v.sellingPrice.toFixed(2)}
                                        </td>
                                        <td className="px-3 py-2">
                                          <button
                                            onClick={() => handleToggleAvailable(v)}
                                            className={clsx(
                                              'rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors',
                                              v.available
                                                ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                                : 'bg-gray-100 text-gray-500 hover:bg-gray-200',
                                            )}
                                          >
                                            {v.available ? 'YES' : 'NO'}
                                          </button>
                                        </td>
                                        <td className="px-3 py-2">
                                          <button
                                            onClick={() => openEditVariant(v)}
                                            className="flex items-center gap-1 rounded-md border border-gray-200 px-2 py-1 text-xs font-medium text-gray-600 hover:border-violet-400 hover:text-violet-700 transition-colors"
                                          >
                                            <Pencil className="h-3 w-3" />
                                            Edit
                                          </button>
                                        </td>
                                      </tr>
                                    ))}
                                    {p.variants.length === 0 && (
                                      <tr>
                                        <td
                                          colSpan={8}
                                          className="px-3 py-4 text-center text-gray-400"
                                        >
                                          No variants yet
                                        </td>
                                      </tr>
                                    )}
                                  </tbody>
                                </table>
                                <div className="border-t border-gray-100 px-3 py-2.5">
                                  <button
                                    onClick={() => openAddVariant(p.id)}
                                    className="flex items-center gap-1.5 rounded-lg border border-violet-400 px-3 py-1.5 text-xs font-semibold text-violet-700 hover:bg-violet-50 transition-colors"
                                  >
                                    <Plus className="h-3.5 w-3.5" />
                                    Add Variant
                                  </button>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </>
                    )
                  })}
                  {displayedProducts.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-4 py-12 text-center text-gray-400">
                        {filterCategoryId ? 'No products in this category' : 'No products found'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}

      {/* ── Categories tab ── */}
      {activeTab === 'categories' && (
        <>
          <div className="mb-4 flex justify-end">
            <button
              onClick={openAddCategory}
              className="flex items-center gap-1.5 rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-violet-700 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Add Category
            </button>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="h-6 w-6 animate-spin text-violet-500" />
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    {['Name', 'Parent'].map((h) => (
                      <th
                        key={h}
                        className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {categories.map((c) => (
                    <tr key={c.id} className="hover:bg-violet-50">
                      <td className="px-4 py-3 font-medium text-gray-800">{c.name}</td>
                      <td className="px-4 py-3 text-gray-500">{categoryName(c.parentId)}</td>
                    </tr>
                  ))}
                  {categories.length === 0 && (
                    <tr>
                      <td colSpan={2} className="px-4 py-12 text-center text-gray-400">
                        No categories found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}

      {/* ══════════════════════════════════════
          MODALS
      ══════════════════════════════════════ */}

      {/* Add / Edit Product modal */}
      {productModalOpen && (
        <ModalShell
          title={editingProduct ? 'Edit Product' : 'Add Product'}
          onClose={closeProductModal}
        >
          <form onSubmit={handleProductSubmit} className="px-6 py-5 space-y-4">
            <div>
              <label className={labelCls}>
                Name <span className="text-red-500">*</span>
              </label>
              <input
                required
                type="text"
                value={productForm.name}
                onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                className={inputCls}
                placeholder="e.g. Amul Butter"
              />
            </div>

            <div>
              <label className={labelCls}>Brand</label>
              <input
                type="text"
                value={productForm.brand}
                onChange={(e) => setProductForm({ ...productForm, brand: e.target.value })}
                className={inputCls}
                placeholder="e.g. Amul"
              />
            </div>

            <div>
              <label className={labelCls}>Description</label>
              <textarea
                rows={2}
                value={productForm.description}
                onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                className={clsx(inputCls, 'resize-none')}
                placeholder="Short product description"
              />
            </div>

            <div>
              <label className={labelCls}>
                Category <span className="text-red-500">*</span>
              </label>
              <select
                required
                value={productForm.categoryId}
                onChange={(e) => setProductForm({ ...productForm, categoryId: e.target.value })}
                className={inputCls}
              >
                <option value="">Select a category</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {productError && (
              <p className="text-xs font-medium text-red-600 bg-red-50 rounded-lg px-3 py-2">
                {productError}
              </p>
            )}

            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={closeProductModal}
                className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={productSubmitting}
                className={clsx(
                  'flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold text-white transition-colors',
                  productSubmitting ? 'bg-violet-400 cursor-not-allowed' : 'bg-violet-600 hover:bg-violet-700',
                )}
              >
                {productSubmitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                {editingProduct ? 'Save Changes' : 'Create Product'}
              </button>
            </div>
          </form>
        </ModalShell>
      )}

      {/* Add Variant modal */}
      {addVariantForProductId !== null && (
        <ModalShell title="Add Variant" onClose={closeAddVariantModal}>
          <form onSubmit={handleVariantSubmit} className="px-6 py-5 space-y-4">
            <div>
              <label className={labelCls}>
                Display Name <span className="text-red-500">*</span>
              </label>
              <input
                required
                type="text"
                value={variantForm.displayName}
                onChange={(e) => setVariantForm({ ...variantForm, displayName: e.target.value })}
                className={inputCls}
                placeholder="e.g. Amul Butter 500g"
              />
            </div>

            <div>
              <label className={labelCls}>
                SKU Code <span className="text-red-500">*</span>
              </label>
              <input
                required
                type="text"
                value={variantForm.skuCode}
                onChange={(e) => setVariantForm({ ...variantForm, skuCode: e.target.value })}
                className={inputCls}
                placeholder="e.g. AMUL-BTR-500G"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Pack Size</label>
                <input
                  type="text"
                  value={variantForm.packSize}
                  onChange={(e) => setVariantForm({ ...variantForm, packSize: e.target.value })}
                  className={inputCls}
                  placeholder="e.g. 500g"
                />
              </div>
              <div>
                <label className={labelCls}>Unit</label>
                <input
                  type="text"
                  value={variantForm.unit}
                  onChange={(e) => setVariantForm({ ...variantForm, unit: e.target.value })}
                  className={inputCls}
                  placeholder="e.g. g"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>
                  MRP <span className="text-red-500">*</span>
                </label>
                <input
                  required
                  type="number"
                  step="0.01"
                  min="0"
                  value={variantForm.mrp}
                  onChange={(e) => setVariantForm({ ...variantForm, mrp: e.target.value })}
                  className={inputCls}
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className={labelCls}>
                  Selling Price <span className="text-red-500">*</span>
                </label>
                <input
                  required
                  type="number"
                  step="0.01"
                  min="0"
                  value={variantForm.sellingPrice}
                  onChange={(e) => setVariantForm({ ...variantForm, sellingPrice: e.target.value })}
                  className={inputCls}
                  placeholder="0.00"
                />
              </div>
            </div>

            <div>
              <label className={labelCls}>Image URL</label>
              <input
                type="text"
                value={variantForm.imageUrl}
                onChange={(e) => setVariantForm({ ...variantForm, imageUrl: e.target.value })}
                className={inputCls}
                placeholder="https://..."
              />
            </div>

            {variantError && (
              <p className="text-xs font-medium text-red-600 bg-red-50 rounded-lg px-3 py-2">
                {variantError}
              </p>
            )}

            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={closeAddVariantModal}
                className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={variantSubmitting}
                className={clsx(
                  'flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold text-white transition-colors',
                  variantSubmitting ? 'bg-violet-400 cursor-not-allowed' : 'bg-violet-600 hover:bg-violet-700',
                )}
              >
                {variantSubmitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Add Variant
              </button>
            </div>
          </form>
        </ModalShell>
      )}

      {/* Edit Variant modal */}
      {editingVariant !== null && (
        <ModalShell title="Edit Variant" onClose={closeEditVariantModal}>
          <form onSubmit={handleEditVariantSubmit} className="px-6 py-5 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>MRP</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={editVariantForm.mrp}
                  onChange={(e) => setEditVariantForm({ ...editVariantForm, mrp: e.target.value })}
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>Selling Price</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={editVariantForm.sellingPrice}
                  onChange={(e) =>
                    setEditVariantForm({ ...editVariantForm, sellingPrice: e.target.value })
                  }
                  className={inputCls}
                />
              </div>
            </div>

            <div>
              <label className={labelCls}>Image URL</label>
              <input
                type="text"
                value={editVariantForm.imageUrl}
                onChange={(e) =>
                  setEditVariantForm({ ...editVariantForm, imageUrl: e.target.value })
                }
                className={inputCls}
                placeholder="https://..."
              />
            </div>

            <label className="flex items-center gap-2 cursor-pointer select-none text-sm text-gray-700">
              <input
                type="checkbox"
                checked={editVariantForm.available}
                onChange={(e) =>
                  setEditVariantForm({ ...editVariantForm, available: e.target.checked })
                }
                className="accent-violet-600"
              />
              Available
            </label>

            {editVariantError && (
              <p className="text-xs font-medium text-red-600 bg-red-50 rounded-lg px-3 py-2">
                {editVariantError}
              </p>
            )}

            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={closeEditVariantModal}
                className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={editVariantSubmitting}
                className={clsx(
                  'flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold text-white transition-colors',
                  editVariantSubmitting
                    ? 'bg-violet-400 cursor-not-allowed'
                    : 'bg-violet-600 hover:bg-violet-700',
                )}
              >
                {editVariantSubmitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Save Changes
              </button>
            </div>
          </form>
        </ModalShell>
      )}

      {/* Add Category modal */}
      {categoryModalOpen && (
        <ModalShell title="Add Category" onClose={closeCategoryModal}>
          <form onSubmit={handleCategorySubmit} className="px-6 py-5 space-y-4">
            <div>
              <label className={labelCls}>
                Name <span className="text-red-500">*</span>
              </label>
              <input
                required
                type="text"
                value={categoryForm.name}
                onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                className={inputCls}
                placeholder="e.g. Dairy & Eggs"
              />
            </div>

            <div>
              <label className={labelCls}>Parent Category</label>
              <select
                value={categoryForm.parentId}
                onChange={(e) => setCategoryForm({ ...categoryForm, parentId: e.target.value })}
                className={inputCls}
              >
                <option value="">None / Top level</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {categoryError && (
              <p className="text-xs font-medium text-red-600 bg-red-50 rounded-lg px-3 py-2">
                {categoryError}
              </p>
            )}

            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={closeCategoryModal}
                className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={categorySubmitting}
                className={clsx(
                  'flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold text-white transition-colors',
                  categorySubmitting
                    ? 'bg-violet-400 cursor-not-allowed'
                    : 'bg-violet-600 hover:bg-violet-700',
                )}
              >
                {categorySubmitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Create Category
              </button>
            </div>
          </form>
        </ModalShell>
      )}
    </div>
  )
}
