const express = require('express');
const sequelize = require('./database.js');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const Pelicula = require('./models/pelicula.js');
const Usuario = require('./models/usuario.js');
const { verificarToken, SECRET_KEY } = require('./middleware/auth.js');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());


// FUNCIONES DE INICIALIZACIÓN

async function insertarPeliculas() {
    const cantidad = await Pelicula.count();
    if (cantidad === 0) {
        await Pelicula.bulkCreate([
            { titulo: 'Iron Man', anio: 2008, director: 'Jon Favreau' },
            { titulo: 'El Increible Hulk', anio: 2008, director: 'Louis Leterrier' },
            { titulo: 'Iron Man 2', anio: 2010, director: 'Jon Favreau' },
            { titulo: 'Thor', anio: 2011, director: 'Kenneth Branagh' },
            { titulo: 'Capitan America', anio: 2011, director: 'Joe Johnston' },
            { titulo: 'Los Vengadores', anio: 2012, director: 'Joss Whedon' }
        ]);
        console.log('Peliculas insertadas');
    }
}

async function crearUsuario() {
    const usuarioExiste = await Usuario.findOne({
        where: { username: 'admin' }
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


// ENDPOINTS
app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    const usuario = await Usuario.findOne({ where: { username } });
    if (!usuario) {
        return res.status(401).json({ mensaje: 'Usuario no encontrado' });
    }
    const passwordCorrecta = await bcrypt.compare(password, usuario.password);
    if (!passwordCorrecta) {
        return res.status(401).json({ mensaje: 'Contrasena incorrecta' });
    }
    const token = jwt.sign(
        { id: usuario.id, username: usuario.username },
        SECRET_KEY,
        { expiresIn: '1h' }
    );
    res.json({ mensaje: 'Login exitoso', token });
});

app.get('/peliculas', verificarToken, async (req, res) => {
    const peliculas = await Pelicula.findAll();
    res.json(peliculas);
});

app.get('/peliculas/:id', verificarToken, async (req, res) => {
    const pelicula = await Pelicula.findByPk(req.params.id);
    if (!pelicula) {
        return res.status(404).json({ mensaje: 'Pelicula no encontrada' });
    }
    res.json(pelicula);
});

app.post('/peliculas', verificarToken, async (req, res) => {
    const nuevaPelicula = await Pelicula.create(req.body);
    res.status(201).json(nuevaPelicula);
});

app.put('/peliculas/:id', verificarToken, async (req, res) => {
    const pelicula = await Pelicula.findByPk(req.params.id);
    if (!pelicula) {
        return res.status(404).json({ mensaje: 'Pelicula no encontrada' });
    }
    await pelicula.update(req.body);
    res.json(pelicula);
});

app.delete('/peliculas/:id', verificarToken, async (req, res) => {
    const pelicula = await Pelicula.findByPk(req.params.id);
    if (!pelicula) {
        return res.status(404).json({ mensaje: 'Pelicula no encontrada' });
    }
    await pelicula.destroy();
    res.json({ mensaje: 'Pelicula eliminada' });
});


// INICIAR SERVIDOR
async function iniciarServidor() {
    try {
        await sequelize.authenticate();
        console.log('Conexion con PostgreSQL establecida correctamente.');
        await sequelize.sync();
        console.log('Base de datos sincronizada.');
        await insertarPeliculas();
        await crearUsuario();
        app.listen(PORT, () => {
            console.log(`Servidor ejecutandose en el puerto ${PORT}`);
        });
    } catch (error) {
        console.error('Error al inicializar la base de datos:', error);
    }
}

iniciarServidor();