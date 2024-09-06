const express = require('express');             // import express
const Pokedex = require('pokedex-promise-v2');  // import pokedex promis api
const session = require('express-session');     // import express session

const P = new Pokedex(); //create pokedex with p

const app = express();  //create express to app
const port = 3000;   //set port = 3000

app.use(express.json())

app.use(session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false } // Set to true if using HTTPS
}))


app.listen(port, () => {       //Run server with port 3000
    console.log(`Server running at http://localhost:${port}/`);
})

app.get('/', (req, res) => {
    res.send("Hello World")
})

// get pokemon by name

app.get('/pokemon/:name', async (req, res) => {    // :name is param
    const name = req.params.name                   // get param's name value

    const monster = await P.getPokemonByName(name.toLowerCase())   //get pokemon detail from pokedex
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

// record pokemon
app.post('/catch', async (req, res) => {
    const { pokemonName } = req.body;   // get pokemon name by body
    const sessionId = req.sessionID // Check get or create sessionID (if not found --> create)(if found ---> use)

    if (!pokemonName) {  //check body value
        return res.status(400).json({
            message: "Pokemon name is required",
            sessionId: sessionId
        })
    }

    if (req.session.monster == undefined) { // check if user enter undefine monster
        req.session.monster = [] // initialise list value to record monster
    }

    try {

        const monster = await P.getPokemonByName(pokemonName.toLowerCase()) // Check pokemon data by pokedex's pokemon name

        if (monster == undefined){   // not found
            return res.status(404).jason({
                message : "No monster found. Please input you monster name again.",
                sessionId : sessionId
            })
        }

        const monster_data = {  // user monster data
            id: monster.id,
            name: monster.name,
            weight: monster.weight,
            height: monster.height,
            types: monster.types.map(typeInfo => typeInfo.type.name),
            sprites: monster.sprites.front_default
        }

        const alreadyCatch = req.session.monster.find(e => e.id === monster.id) // create filter to check for catched pokemon

        if (alreadyCatch) { // if alreadycatched ---> return message not recorded
            return res.status(200).json({
                message: `Pokemon catched ---> ${pokemonName}`,
                sessionId: sessionId
            })
        }

        req.session.monster.push(monster_data)  // record pokemon to monster list

        console.log(pokemonName)
        return res.status(200).json({        // return sattus 200 (success!)
            message: `You caught ${pokemonName}`,
            sessionId: sessionId,
            monster_caught: monster_data
        })
    }
    catch (error) {  // if error
        return res.status(500).json({ error: error.message }) // return sattus 500 (error!)
    }


})

// get recorded monster

app.get('/my-monsters', async (req, res) => {
    const sessionId = req.sessionID // get or create sessionID

    try {

        if (!req.session || !req.session.monster) {   // check if no catched monster
            return res.status(200).json
                ({
                    message: "No catched monster !!",
                    sessionId: sessionId
                })
        }
        return res.status(200).json({        // return monsters recorded list
            length: req.session.monster.length,
            monsters: req.session.monster,
            sessionId: sessionId
        })
    }
    catch (error){   // return sattus 500 (error!)
        return res.status(500).json({ error: error.message })
    }
})

