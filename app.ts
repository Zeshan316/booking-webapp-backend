import express, { Request, Response } from 'express'
const app = express()

import helmet from 'helmet'
import morgan from 'morgan'
import cors from 'cors'
import path, { join } from 'path'
import moment from 'moment-timezone'
import sessionAuthentication from './middleware/session'
import dotenv from 'dotenv'
dotenv.config()
import thinky from './config/db'
import { User, Password, UserRole, Role } from './models/All'
import bcrypt from 'bcrypt'

const { r } = thinky
// Routes
import authRoutes from './routes/authRoutes'
import userRoutes from './routes/userRoutes'

// Server to start on
const port = process.env.DEV_PORT || 5000

app.use(express.urlencoded({ extended: true }))
app.use(express.json())
app.use(helmet())
app.use(morgan('combined'))
app.use(cors())

console.log(
	moment
		.utc(new Date())
		.tz(process.env.TIMEZONE as string)
		.format()
)

// Check if roles are added already in system

//Setting static assests directory
app.use('/static', express.static(path.join(__dirname, 'public')))

// Setting view engined
// app.set('view engine', 'ejs')

//Initial url
app.get('/', (req, res) => res.send('Server is running 😊'))
app.get('/addRoles', async (req, res) => {
	const countRoles = await r.table(Role.getTableName()).count().run()

	if (countRoles) {
		res.send('Roles are added already')

		return
	}

	const allRoles = await r
		.table('Roles')
		.insert([
			{
				name: 'System Administrator',
				level: 0,
			},
			{
				name: 'App Administrator',
				level: 1,
			},
			{
				name: 'User',
				level: 2,
			},
			{
				name: 'Driver',
				level: 3,
			},
		])
		.run()

	console.log(allRoles)

	res.end('all roles added.')
})

app.get('/create', async (req: Request, res: Response) => {
	const user = new User({
		firstName: 'Zeshan',
		lastName: 'Ghafoor',
		email: 'ranazeshan30@gmail.com',
		phoneNumber: '123123132',
		profileImgUrl: 'asdasdasdasdasd',
	})
	const userResult = await user.save()

	const salt = bcrypt.genSaltSync()
	const hashedPassword = bcrypt.hashSync('123456', salt)

	await new Password({
		userId: userResult.id,
		password: hashedPassword,
	}).save()

	await new UserRole({
		userId: userResult.id,
		roleId: '8fbb3a2f-d568-4c25-a74e-ecca1bbe5bd1',
	}).save()

	res.end('create user and roles...')
})

app.get('/get', async (req: Request, res: Response) => {
	/* const d = await r
		.table(UserRole.getTableName())
		.eqJoin('userId', r.table(User.getTableName()))
		.zip()
		.eqJoin('roleId', r.table(Role.getTableName()))
		.zip()
		.run() */

	try {
		/* const d = await r
			.table(User.getTableName())
			.get('f0c825e2-e2c4-43b6-9e0f-aee7503869aa')
			.run() */

		// fetch user and its password
		/* const d = await r
			.table(User.getTableName())
			.filter(r.row('id').eq('d3d53a54-0e11-441b-8542-92381adab30c'))

			.eqJoin('id', r.table(UserRole.getTableName()), {
				index: 'roleId',
			})
			.run() */

		const S = await r
			.table(UserRole.getTableName())
			.filter(
				r.row('userId').eq('c0e6b5fa-c1c5-48fa-817c-a0fb6e842b7b')
			)
			.eqJoin('userId', r.table(User.getTableName()))
			.zip()
			.eqJoin('roleId', r.table(Role.getTableName()))
			.zip()
			.run()

		/* .eqJoin('id', r.table(Password.getTableName()), {
				index: 'userId',
			})
			.zip() */
		/* const d = await User.eqJoin(
			'id',
			r.table(Password.getTableName()),
			{ index: 'userId' }
		)
			.zip()
			.run() */

		console.log('d here', S)
	} catch (error) {
		console.log('error', error)
	}

	/* await Password.eqJoin('testing', 'index', 'userId')
		.run()
		.then((result: any) => {
			res.json({ data: result }).end()
		}) */
	/* await Password.get('ab65fd26-2bbf-41ab-9d73-dd8df219d70d')
		.run()
		.then((result: any) => result.delete()) */
})

// Routes
app.use('/api/auth', authRoutes)
app.use('/api/users', sessionAuthentication, userRoutes)

//404 page
app.use((req, res, next) => {
	console.log(req.path)
	return res.status(404).json({ message: 'Nothing found', data: [] })
})

app.listen(port)
