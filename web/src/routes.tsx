import { Route, Routes, BrowserRouter } from "react-router-dom"

import Home from "./pages/Home"
import CreatePoint from "./pages/CreatePoint"
import SearchPoints from "./pages/SearchPoints"

const Router = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Home />} path="/" />
        <Route element={<CreatePoint />} path="/create-point" />
        <Route element={<SearchPoints />} path="/points" />
      </Routes>
    </BrowserRouter>
  )
}

export default Router
