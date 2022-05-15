const ApiError = require("../error/ApiError");
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const {User, Basket} = require('../models/models')


const generateJwt = (id, email, role) => {
    return jwt.sign(
        {id, email, role},
        process.env.SECRET_KEY,
        {expiresIn: '24h'} //сколько живет токен
    )
}

class UserController{

    //регистрация
    async registration(req, res){
        const {email, password, role } = req.body;

        if(!email || !password){
            return next(ApiError.badRequest('Некорректный email или password'))
        }

        const candidate = await User.findOne({where: {email}})
        if (candidate) {
            return next(ApiError.badRequest('Пользователь с таким email уже существует'))
        }

        const hashPassword = await bcrypt.hash(password, 5) //хэширование пароля
        const user = await User.create({email, role, password: hashPassword})
        const basket = await Basket.create({userId: user.id}) //личный кабинет
        const token = generateJwt(user.id, user.email, user.role)
        return res.json({token})
    }

    //авторизация
    async login(req, res, next){
        const {email, password} = req.body


        //поиск такого юзера в БД
        const user = await User.findOne({where: {email}})
        if(!user){
            return next(ApiError.internal('Пользователь не найден'))
        }

        let comparePassword = bcrypt.compareSync(password, user.password) //bcrypt - расшифровывает пароль, compareSync - сравнивает закодированный пароль и нормальный 
        //если пароли не совпадают 
        if (!comparePassword) {
            return next(ApiError.internal('Указан неверный пароль'))
        }
        const token = generateJwt(user.id, user.email, user.role) //генерируем токен
        return res.json({token})
    }

    //генерация нового токена
    async check(req, res, next) {
        const token = generateJwt(req.user.id, req.user.email, req.user.role)
        return res.json({token})
    } 
}


module.exports = new UserController();