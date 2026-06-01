const express = require('express');
const { Sequelize } = require('sequelize');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const app = express();
const PORT = 3000;

app.use(express.json());


// CONEXIÓN SQLITE
const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: 'database.sqlite'
});


// MODELOS
const PeliculaModel = require('./models/pelicula');
const UsuarioModel = require('./models/usuario');

const Pelicula = PeliculaModel(sequelize);
const Usuario = UsuarioModel(sequelize);


// JWT
const { verificarToken, SECRET_KEY } = require('./middleware/auth');



// INSERTAR PELÍCULAS
async function insertarPeliculas() {

    const cantidad = await Pelicula.count();

    if (cantidad === 0) {

        await Pelicula.bulkCreate([

            {
                titulo: 'Iron Man',
                anio: 2008,
                director: 'Jon Favreau'
            },

            {
                titulo: 'Thor',
                anio: 2011,
                director: 'Kenneth Branagh'
            },

            {
                titulo: 'Los Vengadores',
                anio: 2012,
                director: 'Joss Whedon'
            }

        ]);

        console.log('Películas insertadas');
    }
}



// CREAR USUARIO
async function crearUsuario() {

    const usuarioExiste = await Usuario.findOne({
        where: {
            username: 'admin'
        }
    });

    if (!usuarioExiste) {

        const passwordHash = await bcrypt.hash('123456', 10);

        await Usuario.create({
            username: 'admin',
            password: passwordHash
        });

        console.log('Usuario admin creado');
    }
}



// LOGIN
app.post('/login', async (req, res) => {

    const { username, password } = req.body;

    const usuario = await Usuario.findOne({
        where: {
            username
        }
    });

    if (!usuario) {

        return res.status(401).json({
            mensaje: 'Usuario no encontrado'
        });
    }

    const passwordCorrecta = await bcrypt.compare(
        password,
        usuario.password
    );

    if (!passwordCorrecta) {

        return res.status(401).json({
            mensaje: 'Contraseña incorrecta'
        });
    }

    const token = jwt.sign(

        {
            id: usuario.id,
            username: usuario.username
        },

        SECRET_KEY,

        {
            expiresIn: '1h'
        }

    );

    res.json({
        mensaje: 'Login exitoso',
        token
    });

});



// GET TODAS
app.get('/peliculas', verificarToken, async (req, res) => {

    const peliculas = await Pelicula.findAll();

    res.json(peliculas);

});



// GET POR ID
app.get('/peliculas/:id', verificarToken, async (req, res) => {

    const pelicula = await Pelicula.findByPk(req.params.id);

    if (!pelicula) {

        return res.status(404).json({
            mensaje: 'Película no encontrada'
        });
    }

    res.json(pelicula);

});



// POST
app.post('/peliculas', verificarToken, async (req, res) => {

    const nuevaPelicula = await Pelicula.create(req.body);

    res.status(201).json(nuevaPelicula);

});



// PUT
app.put('/peliculas/:id', verificarToken, async (req, res) => {

    const pelicula = await Pelicula.findByPk(req.params.id);

    if (!pelicula) {

        return res.status(404).json({
            mensaje: 'Película no encontrada'
        });
    }

    await pelicula.update(req.body);

    res.json(pelicula);

});



// DELETE
app.delete('/peliculas/:id', verificarToken, async (req, res) => {

    const pelicula = await Pelicula.findByPk(req.params.id);

    if (!pelicula) {

        return res.status(404).json({
            mensaje: 'Película no encontrada'
        });
    }

    await pelicula.destroy();

    res.json({
        mensaje: 'Película eliminada'
    });

});



// INICIAR SERVIDOR
sequelize.sync().then(async () => {

    console.log('Base de datos conectada');

    await insertarPeliculas();

    await crearUsuario();

    app.listen(PORT, () => {

        console.log(`Servidor ejecutándose en http://localhost:${PORT}`);

    });

}).catch(error => {

    console.log(error);

});