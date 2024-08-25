const express = require('express');
const Pokedex = require('pokedex-promise-v2');
const session = require('express-session');

const P = new Pokedex();

const app = express();
const port = 3000;

app.use(express.json())

app.use(session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false } // Set to true if using HTTPS
}))


app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}/`);
})

app.get('/', (req, res) => {
    res.send("Hello World")
})

app.get('/pokemon/:name', async (req, res) => {
    const name = req.params.name

    const monster = await P.getPokemonByName(name.toLowerCase())
    // console.log(result)
    res.json(
        {
            id: monster.id,
            name: monster.name,
            height: monster.height,
            weight: monster.weight,
            types: monster.types.map(typeInfo => typeInfo.type.name),
            sprites: monster.sprites.front_default
        }
    )
})

app.post('/catch', async (req, res) => {
    const { pokemonName } = req.body;
    const sessionId = req.sessionID

    if (!pokemonName) {
        return res.status(400).json({
            message: "Pokemon name is required",
            sessionId: sessionId
        })
    }

    if (req.session.monster == undefined) {
        req.session.monster = []
    }

    try {

        const monster = await P.getPokemonByName(pokemonName.toLowerCase())

        if (monster == undefined){
            return res.status(404).jason({
                message : "No monster found. Please input you monster name again.",
                sessionId : sessionId
            })
        }

        const monster_data = {
            id: monster.id,
            name: monster.name,
            weight: monster.weight,
            height: monster.height,
            types: monster.types.map(typeInfo => typeInfo.type.name),
            sprites: monster.sprites.front_default
        }

        const alreadyCatch = req.session.monster.find(e => e.id === monster.id)

        if (alreadyCatch) {
            return res.status(200).json({
                message: `Pokemon catched ---> ${pokemonName}`,
                sessionId: sessionId
            })
        }

        req.session.monster.push(monster_data)

        console.log(pokemonName)
        return res.status(200).json({
            message: `You caught ${pokemonName}`,
            sessionId: sessionId,
            monster_caught: monster_data
        })
    }
    catch (error) {
        return res.status(500).json({ error: error.message })
    }


})

app.get('/my-monsters', async (req, res) => {
    const sessionId = req.sessionID

    try {

        if (!req.session || !req.session.monster) {
            return res.status(200).json
                ({
                    message: "No catched monster !!",
                    sessionId: sessionId
                })
        }
        return res.status(200).json({
            length: req.session.monster.length,
            monsters: req.session.monster,
            sessionId: sessionId
        })
    }
    catch (error){
        return res.status(500).json({ error: error.message })
    }
})

