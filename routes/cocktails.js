/***********************************/
/*** Import des module nécessaires */
const express = require('express')
const bcrypt = require('bcrypt')
const checkTokenMiddleware = require('../jsonwebtoken/check')

const Cocktail = require('../models/cocktail')

/***************************************/
/*** Récupération du routeur d'express */
let router = express.Router()

/*********************************************/
/*** Middleware pour logger dates de requete */
router.use( (req, res, next) => {
    const event = new Date()
    console.log('Cocktail Time:', event.toString())
    next()
})

/**************************************/
/*** Routage de la ressource Cocktail */

/********************************************/
/*** Définition su schema Cocktail pour swagger */
/**
 * @swagger
 * components:
 *  schemas:
 *      Cocktail:
 *          type: object
 *          required:
 *              - user_id
 *              - nom
 *              - description
 *              - recette
 *          properties:
 *              id:
 *                  type: integer
 *                  description: Auto Inc pour id cocktail
 *              user_id:
 *                  type: integer
 *                  description: Id utilisateur créateur du cocktail
 *              nom:
 *                  type: string
 *                  description: Le nom du cocktail
 *              description:
 *                  type: string
 *                  description: Description du cocktail
 *              recette:
 *                  type: string
 *                  description: La recette du cocktail
 */
/**
 * @swagger
 * tags:
 *  name: Cocktails
 *  description: Gestion des cocktails
 */

/***********************************/
/*** Routage de la ressource cocktails */

/**
 * @swagger
 * /cocktails:
 *  get:
 *      summary: Liste de tous les cocktails
 *      description: Récup tous les cocktais
 *      tags: [Cocktails]
 *      responses:
 *          200:
 *              description: Tout ce passe bien
 *              content:
 *                  application/json:
 *                      schema:
 *                          type: array
 *                          item:
 *                              $ref: '#/components/schemas/Cocktail'
 *          401:
 *              description: Non authentifié
 *          500:
 *              description: Internal Error (database)
 */
router.get('', (req, res) => {
    Cocktail.findAll()
        .then(cocktails => res.json({ data: cocktails }))
        .catch(err => res.status(500).json({ message: 'Database Error', error: err }))
})

/**
 * @swagger
 * /cocktails/{id}:
 *  get:
 *      summary: Get cocktail by Id
 *      tags: [Cocktails]
 *      parameters:
 *          - in : path
 *            name: id
 *            schema:
 *              type: string
 *            required: true
 *            description: A cocktail Id
 *      responses:
 *          200:
 *              description: Cocktail by id
 *              content:
 *                  application/json:
 *                      schema:
 *                          $ref: '#/components/schemas/Cocktail'
 *          401:
 *              description: Non authentifié
 *          404:
 *              description: Utilisateur non trouvé
 *          500:
 *              description: Internal Error (database)
 * 
 */
router.get('/:id', (req, res) => {
    let cocktailId = parseInt(req.params.id)

    // Vérification si le champ id est présent et cohérent
    if (!cocktailId) {
        return res.json(400).json({ message: 'Missing Parameter' })
    }

    // Récupération du cocktail
    Cocktail.findOne({ where: { id: cocktailId }, raw: true })
        .then(cocktail => {
            if (cocktail === null) {
                return res.status(404).json({ message: 'This cocktail does not exist !' })
            }

            // Cocktail trouvé
            return res.json({ data: cocktail })
        })
        .catch(err => res.status(500).json({ message: 'Database Error', error: err }))
})

/**
 * @swagger
 * /cocktails:
 *  put:
 *      summary: Pour créer un cocktail
 *      tags: [Cocktails]
 *      requestBody:
 *          required: true
 *          content: 
 *              application/json:
 *                  schema:
 *                      $ref: '#/components/schemas/Cocktail'
 *      responses:
 *          200:
 *              description: un qui qu'est pas la avant
 *              content:
 *                  application/json:
 *                      schema:
 *                          $ref: '#/components/schemas/Cocktail'
 *          400:
 *               description: Manque des données
 *          401:
 *              description: non authentifié
 *          409:
 *              description: Cocktail existe dajà
 *          500:
 *              description: Internal Error (Database)
 */
router.put('', checkTokenMiddleware, (req, res) => {
    const { user_id, nom, description, recette } = req.body

    // Validation des données reçues
    if (!user_id || !nom || !description || !recette) {
        return res.status(400).json({ message: 'Missing Data' })
    }

    Cocktail.findOne({ where: { nom: nom }, raw: true })
        .then(cocktail => {
            // Vérification si le cocktail existe déjà
            if (cocktail !== null) {
                return res.status(409).json({ message: `The cocktail ${nom} already exists !` })
            }

            // Céation du cocktail
            Cocktail.create(req.body)
                .then(cocktail => res.json({ message: 'Cocktail Created', data: cocktail }))
                .catch(err => res.status(500).json({ message: 'Database Error', error: err }))

        })
        .catch(err => res.status(500).json({ message: 'Database Error', error: err }))
})

/**
 * @swagger
 * /cocktails/{id}:
 *  patch:
 *      summary: Update cocktail
 *      tags: [Cocktails]
 *      parameters:
 *          - in : path
 *            name: id
 *            schema:
 *              type: string
 *            required: true
 *            description: An user Id
 *      requestBody:
 *          required: true
 *          content: 
 *              application/json:
 *                  schema:
 *                      $ref: '#/components/schemas/Cocktail'
 *      responses:
 *          200:
 *              description: un qui qu'est pas la avant
 *              content:
 *                  application/json:
 *                      schema:
 *                          $ref: '#/components/schemas/Cocktail'
 *          400:
 *               description: Manque des données
 *          401:
 *              description: non authentifié
 *          409:
 *              description: Cocktail existe dajà
 *          500:
 *              description: Internal Error (Database)
 * 
 */
router.patch('/:id', checkTokenMiddleware, (req, res) => {
    let cocktailId = parseInt(req.params.id)

    // Vérification si le champ id est présent et cohérent
    if (!cocktailId) {
        return res.status(400).json({ message: 'Missing parameter' })
    }

    // Recherche du cocktail
    Cocktail.findOne({ where: { id: cocktailId }, raw: true })
        .then(cocktail => {
            // Vérifier si le cocktail existe
            if (cocktail === null) {
                return res.status(404).json({ message: 'This cocktail does not exist !' })
            }

            // Mise à jour du cocktail
            Cocktail.update(req.body, { where: { id: cocktailId } })
                .then(cocktail => res.json({ message: 'Cocktail Updated' }))
                .catch(err => res.status(500).json({ message: 'Database Error', error: err }))
        })
        .catch(err => res.status(500).json({ message: 'Database Error', error: err }))
})

/**
 * @swagger
 * /cocktails/untrash/{id}:
 *  post:
 *      summary: Unstrash cocktail
 *      tags: [Cocktails]
 *      parameters:
 *          - in : path
 *            name: id
 *            schema:
 *              type: string
 *            required: true
 *            description: A cocktail Id
 *      responses:
 *          204:
 *              description: Cocktail was deleted
 *          401:
 *              description: Non authentifié
 *          500:
 *              description: Internal Error (Database)
 * 
 */
router.post('/untrash/:id', checkTokenMiddleware, (req, res) => {
    let cocktailId = parseInt(req.params.id)

    // Vérification si le champ id est présent et cohérent
    if (!cocktailId) {
        return res.status(400).json({ message: 'Missing parameter' })
    }

    Cocktail.restore({ where: { id: cocktailId } })
        .then(() => res.status(204).json({}))
        .catch(err => res.status(500).json({ message: 'Database Error', error: err }))
})

/**
 * @swagger
 * /cocktails/trash{id}:
 *  delete:
 *      summary: Soft Delete cocktail
 *      tags: [Cocktails]
 *      parameters:
 *          - in : path
 *            name: id
 *            schema:
 *              type: string
 *            required: true
 *            description: A cocktail Id
 *      responses:
 *          204:
 *              description: Cocktail was deleted
 *          401:
 *              description: Non authentifié
 *          500:
 *              description: Internal Error (Database)
 * 
 */
router.delete('/trash/:id', checkTokenMiddleware, (req, res) => {
    let cocktailId = parseInt(req.params.id)

    // Vérification si le champ id est présent et cohérent
    if (!cocktailId) {
        return res.status(400).json({ message: 'Missing parameter' })
    }

    // Suppression du cocktail
    Cocktail.destroy({ where: { id: cocktailId } })
        .then(() => res.status(204).json({}))
        .catch(err => res.status(500).json({ message: 'Database Error', error: err }))
})

/**
 * @swagger
 * /cocktails/{id}:
 *  delete:
 *      summary: Remove cocktail
 *      tags: [Cocktails]
 *      parameters:
 *          - in : path
 *            name: id
 *            schema:
 *              type: string
 *            required: true
 *            description: A cocktail Id
 *      responses:
 *          204:
 *              description: Cocktail was deleted
 *          401:
 *              description: Non authentifié
 *          500:
 *              description: Internal Error (Database)
 * 
 */
router.delete('/:id', checkTokenMiddleware, (req, res) => {
    let cocktailId = parseInt(req.params.id)

    // Vérification si le champ id est présent et cohérent
    if (!cocktailId) {
        return res.status(400).json({ message: 'Missing parameter' })
    }

    // Suppression du cocktail
    Cocktail.destroy({ where: { id: cocktailId }, force: true })
        .then(() => res.status(204).json({}))
        .catch(err => res.status(500).json({ message: 'Database Error', error: err }))
})

module.exports = router