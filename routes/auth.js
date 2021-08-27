/***********************************/
/*** Import des module nécessaires */
const express = require('express')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')

const User = require('../models/user')

/***************************************/
/*** Récupération du routeur d'express */
let router = express.Router()

/*********************************************/
/*** Middleware pour logger dates de requete */
router.use( (req, res, next) => {
    const event = new Date()
    console.log('AUTH Time:', event.toString())
    next()
})

/********************************************/
/*** Définition du schema Cocktail pour swagger */
/**
 * @swagger
 * components:
 *  schemas:
 *      Auth:
 *          type: object
 *          required:
 *              - email
 *              - password
 *          properties:
 *              email:
 *                  type: string
 *                  description: Login de l'utilisateur
 *              password:
 *                  type: string
 *                  description: Mot de passe
 */
/**
 * @swagger
 * tags:
 *  name: Auth
 *  description: Système d'authentification
 */

/**********************************/
/*** Routage de la ressource Auth */

/**
 * @swagger
 * /auth/login:
 *  post:
 *      summary: Connexion
 *      tags: [Auth]
 *      requestBody:
 *          required: true
 *          content: 
 *              application/json:
 *                  schema:
 *                      $ref: '#/components/schemas/Auth'
 *      responses:
 *          200:
 *              description: utilisateur authentifié
 *              content:
 *                  application/json:
 *                      schema:
 *                          type: object
 *                          properties:
 *                              access_token:
 *                                  type: string
 *                                  description: Json Web Token
 *          400:
 *               description: Manque des données
 *          500:
 *              description: Internal Error (Database)
 */
router.post('/login', (req, res) => {
    const { email, password } = req.body

    // Validation des données reçues
    if(!email || !password){
        return res.status(400).json({ message: 'Bad email or password'})
    }

    User.findOne({ where: {email: email}, raw: true})
        .then(user => {
            // Vérification si l'utilisateur existe
            if(user === null){
                return res.status(401).json({ message: 'This account does not exists !'})
            }

            // Vérification du mot de passe
            bcrypt.compare(password, user.password)
                .then(test => {
                    if(!test){
                        return res.status(401).json({ message: 'Wrong password'})
                    }

                    // Génération du token
                    const token = jwt.sign({
                        id: user.id,
                        nom: user.nom,
                        prenom: user.prenom,
                        email: user.email
                    }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_DURING})

                    return res.json({access_token: token})
                    
                })
                .catch(err => res.status(500).json({ message: 'Login process failed', error: err}))
        })
        .catch(err => res.status(500).json({ message: 'Database Error', error: err }))
})

module.exports = router