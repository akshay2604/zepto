import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Navbar } from './components/Navbar'
import { PickerQueueView } from './views/PickerQueueView'
import { PickersView } from './views/PickersView'
import { InventoryBoardView } from './views/InventoryBoardView'
import { MovementFeedView } from './views/MovementFeedView'
import { WarehouseProvider } from './context/WarehouseContext'

export default function App() {
  return (
    <BrowserRouter>
      <WarehouseProvider>
        <div className="min-h-screen bg-gray-50">
          <Navbar />
          <Routes>
            <Route path="/" element={<Navigate to="/picker" replace />} />
            <Route path="/picker" element={<PickerQueueView />} />
            <Route path="/pickers" element={<PickersView />} />
            <Route path="/inventory" element={<InventoryBoardView />} />
            <Route path="/movements" element={<MovementFeedView />} />
          </Routes>
        </div>
      </WarehouseProvider>
    </BrowserRouter>
  )
}
