/***********************************/
/*** Import des module nécessaires */
const express = require('express')
const bcrypt = require('bcrypt')

const User = require('../models/user')

/***************************************/
/*** Récupération du routeur d'express */
let router = express.Router()

/*********************************************/
/*** Middleware pour logger dates de requete */
router.use( (req, res, next) => {
    const event = new Date()
    console.log('User Time:', event.toString())
    next()
})

/********************************************/
/*** Définition du schéma User pour swagger */
/**
 * @swagger
 * components:
 *  schemas:
 *      User:
 *          type: object
 *          required:
 *              - nom
 *              - prenom
 *              - pseudo
 *              - email
 *              - password
 *          properties:
 *              id:
 *                  type: integer
 *                  description: Auto Inc pour id user
 *              nom:
 *                  type: string
 *                  description: Le nom de l'utilisateur
 *              prenom:
 *                  type: string
 *                  description: Le prenom de l'utilisateur
 *              pseudo:
 *                  type: string
 *                  description: Le pseudo de l'utilisateur
 *              email:
 *                  type: string
 *                  description: Fait office de login
 *              password:
 *                  type: string
 *                  description: Faut-il que je te face un dessin
 */

/**
 * @swagger
 * tags:
 *  name: Users
 *  description: Gestion des utilisateurs
 */

/**********************************/
/*** Routage de la ressource User */

/**
 * @swagger
 * /users:
 *  get:
 *      summary: Liste des utilisateurs
 *      description: Récup tous les utilisateurs
 *      tags: [Users]
 *      responses:
 *          200:
 *              description: Tout se passe bien
 *              content:
 *                  application/json:
 *                      schema:
 *                          type: array
 *                          item:
 *                              $ref: '#/components/schemas/User'
 *          401:
 *              description: Non authentifié
 *          500:
 *              description: Internal Error (database)
 */
router.get('', (req, res) => {
    User.findAll()
        .then(users => res.json({ data: users }))
        .catch(err => res.status(500).json({ message: 'Database Error', error: err }))
})

/**
 * @swagger
 * /users/{id}:
 *  get:
 *      summary: Get user by ID
 *      tags: [Users]
 *      parameters:
 *          - in : path
 *            name: id
 *            schema:
 *              type: string
 *            required: true
 *            description: An user ID
 *      responses:
 *          200:
 *              description: User by id
 *              content:
 *                  application/json:
 *                      schema:
 *                          $ref: '#/components/schemas/User'
 *          401:
 *              description: Non authentifié
 *          404:
 *              description: Utilisateur non trouvé
 *          500:
 *              description: Internal Error (database)
 * 
 */
router.get('/:id', (req, res) => {
    let userId = parseInt(req.params.id)

    // Vérification si le champ id est présent et cohérent
    if (!userId) {
        return res.json(400).json({ message: 'Missing Parameter' })
    }

    // Récupération de l'utilisateur
    User.findOne({ where: { id: userId }, raw: true })
        .then(user => {
            if (user === null) {
                return res.status(404).json({ message: 'This user does not exist !' })
            }

            // Utilisateur trouvé
            return res.json({ data: user })
        })
        .catch(err => res.status(500).json({ message: 'Database Error', error: err }))
})

/**
 * @swagger
 * /users:
 *  put:
 *      summary: Pour créer un utilisateur
 *      tags: [Users]
 *      requestBody:
 *          required: true
 *          content:
 *              application/json:
 *                  schema:
 *                      $ref: '#/components/schemas/User'
 *      responses:
 *          200:
 *              description: Utilisateur créé
 *              content:
 *                  application/json:
 *                      schema:
 *                          $ref: '#/components/schemas/User'
 *          400:
 *              description: Manque de données
 *          401:
 *              description: Non authentifié
 *          409:
 *              description: Utilisateur existe déjà
 *          500:
 *              description: Internal Error (database)
 * 
 */
router.put('', (req, res) => {
    const { nom, prenom, pseudo, email, password } = req.body

    // Validation des données reçues
    if (!nom || !prenom || !pseudo || !email || !password) {
        return res.status(400).json({ message: 'Missing Data' })
    }

    User.findOne({ where: { email: email }, raw: true })
        .then(user => {
            // Vérification si l'utilisateur existe déjà
            if (user !== null) {
                return res.status(409).json({ message: `The user ${nom} already exists !` })
            }

            // Hashage du mot de passe utilisateur
            bcrypt.hash(password, parseInt(process.env.BCRYPT_SALT_ROUND))
                .then(hash => {
                    req.body.password = hash

                    // Céation de l'utilisateur
                    User.create(req.body)
                        .then(user => res.json({ message: 'User Created', data: user }))
                        .catch(err => res.status(500).json({ message: 'Database Error', error: err }))
                })
                .catch(err => res.status(500).json({ message: 'Hash Process Error', error: err }))
        })
        .catch(err => res.status(500).json({ message: 'Database Error', error: err }))
})

/**
 * @swagger
 * /users/{id}:
 *  patch:
 *      summary: Pour modifier un utilisateur
 *      tags: [Users]
 *      parameters:
 *          - in : path
 *            name: id
 *            schema:
 *              type: string
 *            required: true
 *            description: An user ID
 *      requestBody:
 *          required: true
 *          content:
 *              application/json:
 *                  schema:
 *                      $ref: '#/components/schemas/User'
 *      responses:
 *          200:
 *              description: Utilisateur modifié
 *              content:
 *                  application/json:
 *                      schema:
 *                          $ref: '#/components/schemas/User'
 *          400:
 *              description: Manque de données
 *          401:
 *              description: Non authentifié
 *          409:
 *              description: Utilisateur existe déjà
 *          500:
 *              description: Internal Error (database)
 * 
 */
router.patch('/:id', (req, res) => {
    let userId = parseInt(req.params.id)

    // Vérification si le champ id est présent et cohérent
    if (!userId) {
        return res.status(400).json({ message: 'Missing parameter' })
    }

    // Recherche de l'utilisateur
    User.findOne({ where: {id: userId}, raw: true})
        .then(user => {
            // Vérifier si l'utilisateur existe
            if(user === null){
                return res.status(404).json({ message: 'This user does not exist !'})
            }

            // Mise à jour de l'utilisateur
            User.update(req.body, { where: {id: userId}})
                .then(user => res.json({ message: 'User Updated'}))
                .catch(err => res.status(500).json({ message: 'Database Error', error: err }))
        })
        .catch(err => res.status(500).json({ message: 'Database Error', error: err }))
})

/**
 * @swagger
 * /users/untrash/{id}:
 *  post:
 *      summary: Untrash user
 *      tags: [Users]
 *      parameters:
 *          - in : path
 *            name: id
 *            schema:
 *              type: string
 *            required: true
 *            description: An user ID
 *      responses:
 *          204:
 *              description: Utilisateur restauré
 *          400:
 *              description: Il manque l'ID dans l'url
 *          401:
 *              description: Non authentifié
 *          500:
 *              description: Internal Error (database)
 * 
 */
router.post('/untrash/:id', (req, res) => {
    let userId = parseInt(req.params.id)

    // Vérification si le champ id est présent et cohérent
    if (!userId) {
        return res.status(400).json({ message: 'Missing parameter' })
    }
    
    User.restore({ where: {id: userId}})
        .then(() => res.status(204).json({}))
        .catch(err => res.status(500).json({ message: 'Database Error', error: err }))
})

/**
 * @swagger
 * /users/trash/{id}:
 *  delete:
 *      summary: Soft Delete user
 *      tags: [Users]
 *      parameters:
 *          - in : path
 *            name: id
 *            schema:
 *              type: string
 *            required: true
 *            description: An user ID
 *      responses:
 *          204:
 *              description: Utilisateur en corbeille
 *          400:
 *              description: Il manque l'ID dans l'url
 *          401:
 *              description: Non authentifié
 *          500:
 *              description: Internal Error (database)
 * 
 */
router.delete('/trash/:id', (req, res) => {
    let userId = parseInt(req.params.id)

    // Vérification si le champ id est présent et cohérent
    if (!userId) {
        return res.status(400).json({ message: 'Missing parameter' })
    }

    // Suppression de l'utilisateur
    User.destroy({ where: {id: userId}})
        .then(() => res.status(204).json({}))
        .catch(err => res.status(500).json({ message: 'Database Error', error: err }))
})

/**
 * @swagger
 * /users/{id}:
 *  delete:
 *      summary: Hard delete user
 *      tags: [Users]
 *      parameters:
 *          - in : path
 *            name: id
 *            schema:
 *              type: string
 *            required: true
 *            description: An user ID
 *      responses:
 *          204:
 *              description: Utilisateur supprimé
 *          401:
 *              description: Non authentifié
 *          500:
 *              description: Internal Error (database)
 * 
 */
router.delete('/:id', (req, res) => {
    let userId = parseInt(req.params.id)

    // Vérification si le champ id est présent et cohérent
    if (!userId) {
        return res.status(400).json({ message: 'Missing parameter' })
    }

    // Suppression de l'utilisateur
    User.destroy({ where: {id: userId}, force: true})
        .then(() => res.status(204).json({}))
        .catch(err => res.status(500).json({ message: 'Database Error', error: err }))
})

module.exports = router