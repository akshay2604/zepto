import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { RiderProvider, useRider } from './context/RiderContext'
import { Navbar } from './components/Navbar'
import { ActiveDeliveryView } from './views/ActiveDeliveryView'
import { DeliveryHistoryView } from './views/DeliveryHistoryView'
import { RiderOnboardingView } from './views/RiderOnboardingView'

function AppShell() {
  const { rider } = useRider()

  if (!rider) {
    return (
      <div className="min-h-screen bg-emerald-50">
        <RiderOnboardingView />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-emerald-50">
      <Navbar />
      <Routes>
        <Route path="/" element={<ActiveDeliveryView />} />
        <Route path="/history" element={<DeliveryHistoryView />} />
      </Routes>
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <RiderProvider>
        <AppShell />
      </RiderProvider>
    </BrowserRouter>
  )
}
