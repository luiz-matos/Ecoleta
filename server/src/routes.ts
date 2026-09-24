import express from "express"
import PointsController from "./controllers/PointController"
import ItemsController from "./controllers/ItemsController"
import upload from "./config/multer"
const routes = express.Router()
const pointsController = new PointsController()
const itemsController = new ItemsController()

routes.get("/items", itemsController.index)

routes.get("/points", pointsController.index)
routes.post("/points", upload.single("image"), pointsController.create)

routes.get("/points/:id", pointsController.show)

// index, show, create, update, delete

export default routes
