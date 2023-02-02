import express, { IRouter } from 'express'
const userRouter: IRouter = express.Router()

import {
	getUsers,
	getUser,
	createUser,
	updateUser,
	deleteUser,
	uploadProfile,
} from '../controllers/usersController'

userRouter.get('/', getUsers)
userRouter.get('/:id', getUser)
userRouter.post('/', createUser)
userRouter.post('/uploadAvtar/:id', uploadProfile)
userRouter.patch('/:id', updateUser)
userRouter.delete('/:id', deleteUser)

export default userRouter
