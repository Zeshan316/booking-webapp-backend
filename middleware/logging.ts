import { Request, Response, NextFunction } from 'express'
import chalk from 'chalk'
import moment from 'moment'

export const logger = (
	req: Request,
	res: Response,
	next: NextFunction
): void => {
	console.log(
		chalk.blue(
			`[${moment().format('MMMM Do YYYY, h:mm:ss a')}] "${
				req.protocol
			} ${req.method} ${req.hostname} ${req.path}" from ${req.ip}`
		)
	)

	next()
}
