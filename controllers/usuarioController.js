import { check, validationResult } from 'express-validator'
import bcrypt from 'bcrypt'
import Usuario from '../models/Usuario.js'
import db from '../config/db.js'
import { generarId, generarJWT } from '../helpers/tokens.js';
import { emailRegistro, emailOlvidePassword } from '../helpers/emails.js'

await db.sync();

const formularioLogin = (req, res) => {
    res.render('auth/login', {
        pagina: "Iniciar Sesión",
        csrfToken: req.csrfToken()
    })
}

const autenticar = async (req, res) => {
    //Validacion
    await check('email').isEmail().withMessage('El Email es obligatorio').run(req)
    await check('password').notEmpty().withMessage('El Password es obligatorio').run(req)

    let resultado = validationResult(req)

        //return res.json(resultado.array())

        //Verificar que el resultado este vacio
        if(!resultado.isEmpty()){
            //Errores
            return res.render('auth/login', {
                pagina: 'Iniciar Sesion',
                csrfToken : req.csrfToken(),
                errores: resultado.array()
                
            })
        }
        const {email, password} = req.body
        // Verificar si el usuario existe
        const usuario = await Usuario.findOne({where: {email}})
        if(!usuario){
            
            return res.render('auth/login', {
                pagina: 'Iniciar Sesion',
                csrfToken : req.csrfToken(),
                errores: [{msg: 'El usuario NO Existe'}]
            })
        }

        //Comprobar si el usuario está confirmado
        if(!usuario.confirmado){
                    return res.render('auth/login', {
                    pagina: 'Iniciar Sesion',
                    csrfToken : req.csrfToken(),
                    errores: [{msg: 'Tu cuenta NO a sido confirmada'}]
                    
                })
            
        }
        //Revisar el password
        if(!usuario.verificarPassword(password)){
            return res.render('auth/login', {
                pagina: 'Iniciar Sesion',
                csrfToken : req.csrfToken(),
                errores: [{msg: 'El Password es Incorrecto'}]
            })
        }
        //Autenticar al usuario
        const token = generarJWT({id: usuario.id, nombre: usuario.nombre})
        console.log(token)

        //Almacenar en un cookie

        return res.cookie('_token', token, {
            httpOnly: true,
            //secure: true,
            //sameSite: true
        }).redirect('/mis-propiedades')

}

const formularioRegistro = (req, res) => {
    res.render('auth/registro', {
        pagina: 'Crear Cuenta',
        csrfToken : req.csrfToken()
    })
}

const registrar = async (req, res) => {
        //Validacion
        await check('nombre').notEmpty().withMessage('El nombre no puede ir vacío').run(req)
        await check('email').isEmail().withMessage('El nombre no parece un Email').run(req)
        await check('password').isLength({min: 6}).withMessage('El Password debe ser de al menos de 6 caracteres').run(req)
        await check('repetir_password').equals(req.body.password).withMessage('Los Passwords no son iguales').run(req)



        let resultado = validationResult(req)

        //return res.json(resultado.array())

        //Verificar que el resultado este vacio
        if(!resultado.isEmpty()){
            //Errores
            return res.render('auth/registro', {
                pagina: 'Crear Cuenta',
                csrfToken : req.csrfToken(),
                errores: resultado.array(),
                usuario: {
                    nombre: req.body.nombre,
                    email: req.body.email
                }
            })
        }
        //Verificar que el usuario no esté duplicado
        const existeUsuario = await Usuario.findOne({
            where: {email: req.body.email}
        });
        if(existeUsuario) {
            return res.render('auth/registro', {
                pagina: 'Crear Cuenta',
                csrfToken : req.csrfToken(),
                errores: [{ msg: 'El correo electrónico ya está registrado' }],
                usuario: {
                    nombre: req.body.nombre,
                    email: req.body.email
                }
            });
        }

        
    // Crear el usuario
    //const usuario = await Usuario.create(req.body)
    //res.json(usuario)

    //Almacenar un Usuario
    const usuario = await Usuario.create({
        nombre: req.body.nombre,
        email: req.body.email,
        password: req.body.password,
        token: generarId()
    })

    // Envia email de confirmacion
    emailRegistro({
        nombre: usuario.nombre,
        email: usuario.email,
        token: usuario.token
    })

    //Mostrar mensaje de Confirmacion
    res.render('templates/mensaje', {
        pagina: 'Cuenta creada correctamente',
        mensaje: 'Hemos Enviado un Email de Confirmacion,  presiona en el enlace'
    })

}
//Funcion que comprueba una cuenta
const confirmar = async (req, res) => {
    
    const { token } = req.params;

    //Verificar si el token es válido
    const usuario = await Usuario.findOne({where : {token}})
    console.log(usuario)

    if(!usuario){
        return res.render('auth/confirmar-cuenta', {
            pagina: 'Error al confirmar tu cuenta',
            mensaje: 'Hubo un error al confirmar tu cuenta intenta de nuevo',
            error: true
        })
    }

    //Confirmar la cuenta
    usuario.token = null;
    usuario.confirmado = true;
    await usuario.save();

    res.render('auth/confirmar-cuenta', {
        pagina: 'Cuenta Confirmada',
        mensaje: 'La cuenta se confirmó correctamente'
        
    })
    
}

const formularioOlvidePassword = (req, res) => {
    res.render('auth/olvide-password', {
        pagina: 'Recupera tu acceso a bienes raices',
        csrfToken : req.csrfToken(),
    })
}

const resetPassword = async (req, res) => {
            await check('email').isEmail().withMessage('El nombre no parece un Email').run(req)
        
       
            let resultado = validationResult(req)

        

        //Verificar que el resultado este vacio
        if(!resultado.isEmpty()){
            //Errores
            return res.render('auth/olvide-password', {
                pagina: 'Recupera tu acceso a Bienes Raices',
                csrfToken : req.csrfToken(),
                errores : resultado.array()
            })
        }

        //Buscar el usuario
        const {email} = req.body

        const usuario = await Usuario.findOne({where: {email}} )
        if(!usuario){
            return res.render('auth/olvide-password', {
                pagina: 'Recupera tu acceso a Bienes Raices',
                csrfToken : req.csrfToken(),
                errores : [{msg: 'El Email no pertenece a ningun usuario'}]
            })
        }

        //Generar un token y enviar el email
        usuario.token = generarId();
        await usuario.save();

        //Enviar un email
        emailOlvidePassword({
            email,
            nombre: usuario.nombre,
            token: usuario.token
        })

        //Renderizar un mensaje
        res.render('templates/mensaje', {
            pagina: 'Reestablece tu Password',
            mensaje: 'Hemos enviado un email con las instrucciones'
        })
        
}

const comprobarToken = async(req, res ) => {
    
    const { token} = req.params;

    const usuario = await Usuario.findOne({where: {token}})
    if(!usuario){
        return res.render('auth/confirmar-cuenta', {
            pagina: 'Reestablece tu Password',
            mensaje: 'Hubo un error al validar tu informacion, intenta de nuevo',
            error: true
        })
    }
    //Mostrar Formulario para modificar el password
    res.render('auth/reset-password', {
        pagina: 'Reestablece tu password',
        csrfToken: req.csrfToken()
    })
    
}
const nuevoPassword = async (req, res) => {
    //Validar el password
    await check('password').isLength({min: 6}).withMessage('El Password debe ser de al menos de 6 caracteres').run(req)

    let resultado = validationResult(req)

        //Verificar que el resultado este vacio
        if(!resultado.isEmpty()){
            //Errores
            return res.render('auth/reset-password', {
                pagina: 'Reestablece tu Password',
                csrfToken : req.csrfToken(),
                errores: resultado.array(),
                usuario: {
                    nombre: req.body.nombre,
                    email: req.body.email
                }
            })
        }


        const {token} = req.params
        const {password} = req.body

    //Identrificar quien hace el cambio
    const usuario = await Usuario.findOne({where: {token}})
    

    //Hashear el nuevo password
    const salt = await bcrypt.genSalt(10)
    usuario.password = await bcrypt.hash(password, salt);
    usuario.token = null;

    await usuario.save();
    res.render('auth/confirmar-cuenta', {
        pagina: 'Password Reestablecido',
        mensaje: 'El Password se guardó correctamente'
    })
}

export {
    formularioLogin,
    formularioRegistro,
    autenticar,
    registrar,
    confirmar,
    formularioOlvidePassword,
    resetPassword,
    comprobarToken,
    nuevoPassword
}