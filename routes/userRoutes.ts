import express, { IRouter } from 'express'
const userRouter: IRouter = express.Router()

import {
	getUsers,
	getUser,
	createUser,
	updateUser,
	deleteUser,
} from '../controllers/usersController'

userRouter.get('/', getUsers)
userRouter.get('/:id', getUser)
userRouter.post('/', createUser)
userRouter.patch('/:id', updateUser)
userRouter.delete('/:id', deleteUser)

export default userRouter
