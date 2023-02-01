import express, { NextFunction, Request, Response } from 'express'
const app = express()

import helmet from 'helmet'
import cors from 'cors'
import path, { join } from 'path'
import sessionAuthentication from './middleware/session'
import dotenv from 'dotenv'
dotenv.config()
import { logger } from './middleware/logging'
import thinky from './config/db'

const { r } = thinky
// Routes
import authRoutes from './routes/authRoutes'
import userRoutes from './routes/userRoutes'

// Server to start on
const port = process.env.DEV_PORT || 4000
// Setting default timezone
process.env.TZ = 'Asia/Manila'

app.use(express.urlencoded({ extended: true }))
app.use(express.json())
app.use(helmet())
app.use(cors())

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

//404 page
app.use((req, res, next) => {
	return res.status(404).json({ message: 'Nothing found', data: [] })
})

app.listen(port)
