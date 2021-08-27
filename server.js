/************************************/
/*** Import des modules nécessaires */
const express = require('express')
const cors = require('cors')
const checkTokenMiddleware = require('./jsonwebtoken/check')

const swaggerJsDoc = require('swagger-jsdoc')
const swaggerUi = require('swagger-ui-express')

/************************************/
/*** Import de la connexion à la DB */
let DB = require('./db.config')

/*****************************/
/*** Initialisation de l'API */
const app = express()

app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

/********************************************/
/*** Mise en place de swagger et du routage */
const swaggerOptions = {
    definition: {
        openapi: "3.0.0",
        info: {
            version: "1.0.0",
            title: "Cocktail API",
            description: "Cocktail API informations",
            contact: { name: "La chaine Faisons Le Point"}
        },
        servers: [
            { url: `http://172.17.206.157:${process.env.SERVER_PORT}`}
        ],
        components:{
            securitySchemes:{
                bearerAuth:{
                    type: 'http',
                    scheme :'bearer',
                    bearerFormat: 'JWT'
                }
            }
        },
        security: [{
            bearerAuth: []
        }]
    },
    
    apis: ["./routes/*.js"]
}

const swaggerDoc = swaggerJsDoc(swaggerOptions)
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDoc))

/***********************************/
/*** Import des modules de routage */
const user_router = require('./routes/users')
const cocktail_router = require('./routes/cocktails')

const auth_router = require('./routes/auth')

/******************************/
/*** Mise en place du routage */
app.get('/', (req, res) => res.send(`I'm online. All is OK !`))

app.use('/users', checkTokenMiddleware, user_router)
app.use('/cocktails', cocktail_router)

app.use('/auth', auth_router)

app.get('*', (req, res) => res.status(501).send('What the hell are you doing !?!'))

/********************************/
/*** Start serveur avec test DB */
DB.authenticate()
    .then(() => console.log('Database connection OK'))
    .then(() => {
        app.listen(process.env.SERVER_PORT, () => {
            console.log(`This server is running on port ${process.env.SERVER_PORT}. Have fun !`)
        })
    })
    .catch(err => console.log('Database Error', err))




