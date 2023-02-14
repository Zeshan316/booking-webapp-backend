import { Request, Response, NextFunction } from 'express'
import { User } from '../models/All'
import thinky from '../config/db'
import jwt from 'jsonwebtoken'

const { r } = thinky

const sessionAuthentication = async (
	req: Request,
	res: Response,
	next: NextFunction
) => {
	try {
		const bearerToken = req.headers?.authorization as string

		if (!bearerToken) {
			res.status(401).json({ message: 'Invalid token' })
			return
		}

		const [, token] = bearerToken.split(' ')

		jwt.verify(
			token,
			process.env.JWT_SECRET as string,
			async (err, decoded: any) => {
				if (err) {
					console.log(err)
					res.status(401).json({ message: err?.message })
					res.end()
					return
				}

				// fetch user status
				const user = await r
					.table(User.getTableName())
					.filter(r.row('id').eq(decoded?.user?.id))
					.run()

				const reqMethods = ['patch', 'put', 'delete', 'post']
				if (
					user?.length &&
					!user[0]['isActive'] &&
					reqMethods.includes(req.method.toLocaleLowerCase())
				) {
					res.status(400).json({ message: 'Inactive user' })
					return
				}

				if (decoded?.user?.id) {
					req.userId = decoded?.user?.id
					req.userRole = decoded?.user?.role
					next()
				}
			}
		)
	} catch (error) {
		res.status(401).json({ message: 'Token is invalid' })
	}
}

export default sessionAuthentication
