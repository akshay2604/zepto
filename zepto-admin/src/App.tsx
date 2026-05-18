import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Navbar } from './components/Navbar'
import { DashboardView } from './views/DashboardView'
import { AnalyticsView } from './views/AnalyticsView'
import { SimulatorView } from './views/SimulatorView'
import { WarehousesView } from './views/WarehousesView'
import { CustomersView } from './views/CustomersView'
import { InventoryManagementView } from './views/InventoryManagementView'
import { CatalogView } from './views/CatalogView'
import { OrdersView } from './views/OrdersView'

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <Routes>
          <Route path="/" element={<DashboardView />} />
          <Route path="/analytics" element={<AnalyticsView />} />
          <Route path="/catalog" element={<CatalogView />} />
          <Route path="/warehouses" element={<WarehousesView />} />
          <Route path="/customers" element={<CustomersView />} />
          <Route path="/inventory" element={<InventoryManagementView />} />
          <Route path="/orders" element={<OrdersView />} />
          <Route path="/simulator" element={<SimulatorView />} />
        </Routes>
      </div>
    </BrowserRouter>
  )
}
