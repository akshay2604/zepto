import { useEffect, useState } from 'react'
import type { CatalogProduct, Category } from '../types'

export function useCatalog(warehouseId: string | null, categoryId: string | null = null) {
  const [products, setProducts] = useState<CatalogProduct[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(false)

  // Fetch categories once
  useEffect(() => {
    fetch('/catalog/categories')
      .then(r => r.json())
      .then(setCategories)
      .catch(() => {})
  }, [])

  // Fetch products whenever warehouseId or categoryId changes
  useEffect(() => {
    if (!warehouseId) return
    setLoading(true)
    const params = new URLSearchParams({ warehouseId })
    if (categoryId) params.set('categoryId', categoryId)

    fetch(`/catalog/products?${params}`)
      .then(r => r.json())
      .then(setProducts)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [warehouseId, categoryId])

  return { products, categories, loading }
}
