import express, { IRouter, Router } from 'express'
const userRouter: IRouter = express.Router()

import {
	test,
	getUsers,
	getUser,
	createUser,
	updateUser,
	deleteUser,
} from '../controllers/userController'

userRouter.post('/test', test)
userRouter.get('/', getUsers) // /users?order=ASC|DESC&from=0&to=100&field=value - get array of users matching query parameters
userRouter.get('/:id', getUser) // get user details using user_id
userRouter.post('/', createUser) //create new user
userRouter.patch('/:id', updateUser) //updates user with id using request body fields
userRouter.delete('/:id', deleteUser) // removes user

export default userRouter
