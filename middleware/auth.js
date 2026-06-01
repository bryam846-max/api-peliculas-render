const jwt = require('jsonwebtoken');

const SECRET_KEY = 'mi_clave_secreta';



function verificarToken(req, res, next) {

    const authHeader = req.headers['authorization'];

    if (!authHeader) {

        return res.status(401).json({
            mensaje: 'Token requerido'
        });

    }

    const token = authHeader.split(' ')[1];

    if (!token) {

        return res.status(401).json({
            mensaje: 'Token inválido'
        });

    }

    jwt.verify(token, SECRET_KEY, (error, usuario) => {

        if (error) {

            return res.status(403).json({
                mensaje: 'Token inválido o expirado'
            });

        }

        req.usuario = usuario;

        next();

    });

}



module.exports = {
    verificarToken,
    SECRET_KEY
};