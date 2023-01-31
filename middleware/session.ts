import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'

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
			(err, decoded: any) => {
				if (err) {
					console.log(err)
					res.status(401).json({ message: err?.message })
					res.end()
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
