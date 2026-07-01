const Express = require('express')
const publicRoutes = require('./publicRoutes')
const routes = require('./routes')
const connectDB = require('./infra/mongoose/mongooseConect');
require('./infra/mongoose/modelos');
const app = new Express()
const swaggerUi = require('swagger-ui-express');
const swaggerDocs =  require('./swagger')
const UserController = require('./controller/User')
const cors = require('cors')

app.use(Express.json())

app.use(cors({
    origin: '*'
}))

app.use(publicRoutes)
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));
app.use((req, res, next) => {
    if (req.url.includes('/docs')) {
        return next();
    }
    const [_, token] = req.headers['authorization']?.split(' ') || []
    const user = UserController.getToken(token)
    if (!user) return res.status(401).json({ message: 'Token inválido' })
    req.user = user
    next()
})
app.use(routes)

const serverPromise = connectDB().then(() => {
    if (process.env.NODE_ENV !== 'test') {
        const port = process.env.PORT || 4000;
        app.listen(port, () => {
            console.log(`Servidor rodando na porta ${port}`);
        });
    }
});


module.exports = app
module.exports.ready = serverPromise
