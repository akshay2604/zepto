import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { CartProvider } from './context/CartContext'
import { UserProvider } from './context/UserContext'
import { Navbar } from './components/Navbar'
import { LiveFeedView } from './views/LiveFeedView'
import { ShopView } from './views/ShopView'
import { HistoryView } from './views/HistoryView'
import { CustomerSwitcherView } from './views/CustomerSwitcherView'

export default function App() {
  return (
    <UserProvider>
      <CartProvider>
        <BrowserRouter>
          <div className="min-h-screen bg-gray-50">
            <Navbar />
            <Routes>
              <Route path="/" element={<LiveFeedView />} />
              <Route path="/shop" element={<ShopView />} />
              <Route path="/history" element={<HistoryView />} />
              <Route path="/customers" element={<CustomerSwitcherView />} />
            </Routes>
          </div>
        </BrowserRouter>
      </CartProvider>
    </UserProvider>
  )
}
