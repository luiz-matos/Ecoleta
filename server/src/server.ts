import express from "express"
import cors from "cors"
import path from "path"
import routes from "./routes"
import errorHandler from "./middlewares/errorHandler"

const app = express()
app.use(cors())
app.use(express.json())
app.use(routes)
app.use("/uploads", express.static(path.resolve(__dirname, "..", "uploads")))
app.use(errorHandler)

app.listen(Number(process.env.PORT) || 3333)
