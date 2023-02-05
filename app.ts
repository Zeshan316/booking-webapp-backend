import express, { NextFunction, Request, Response } from 'express'
const app = express()

import helmet from 'helmet'
import cors from 'cors'
import path from 'path'
import fileUpload from 'express-fileupload'
import dotenv from 'dotenv'
dotenv.config()
import sessionAuthentication from './middleware/session'
import { logger } from './middleware/logging'
import thinky from './config/db'
import { insertDefaultUser } from './controllers/usersController'

const { r } = thinky
// Routes
import authRoutes from './routes/authRoutes'
import userRoutes from './routes/userRoutes'
import roleRoutes from './routes/roleRoutes'

// Server to start on
const port = process.env.DEV_PORT || 4000
// Setting default timezone
process.env.TZ = 'Asia/Manila'

app.use(express.urlencoded({ extended: true }))
app.use(express.json())
app.use(helmet())
app.use(cors())
app.use(
	fileUpload({
		createParentPath: true,
		limits: { fileSize: 50 * 1024 * 1024 },
	})
)
insertDefaultUser()

// Logger middleware
app.use((req: Request, res: Response, next: NextFunction) => {
	logger(req, res, next)
})

//Setting static assests directory
app.use('/static', express.static(path.join(__dirname, 'public')))

// Check if roles are added already in system

// Routes
app.get('/', (req, res) => res.send('Server is running 😊'))
app.use('/api/auth', authRoutes)
app.use('/api/users', sessionAuthentication, userRoutes)
app.use('/api/roles', sessionAuthentication, roleRoutes)

//404 page
app.use((req, res, next) => {
	return res.status(404).json({ message: 'Nothing found', data: [] })
})

app.listen(port)
