import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Navbar } from './components/Navbar'
import { ActiveDeliveryView } from './views/ActiveDeliveryView'
import { DeliveryHistoryView } from './views/DeliveryHistoryView'

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-emerald-50">
        <Navbar />
        <Routes>
          <Route path="/" element={<ActiveDeliveryView />} />
          <Route path="/history" element={<DeliveryHistoryView />} />
        </Routes>
      </div>
    </BrowserRouter>
  )
}
