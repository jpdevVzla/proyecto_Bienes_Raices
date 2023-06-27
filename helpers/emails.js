import nodemailer from 'nodemailer'

const emailRegistro = async (datos) => {
    const transport = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT,
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        }
    });

    const { email, nombre, token } = datos;

    // Verificar si se proporciona un valor válido para token
    if (!token) {
        throw new Error("No se proporcionó un valor válido para el token.");
    }
    //console.log("Valor del token: ", token)

    // Enviar el correo electrónico
    await transport.sendMail({
        from: 'BienesRaices.com',
        to: email,
        subject: 'Confirma tu Cuenta en BienesRaices.com',
        text: 'Confirma tu cuenta en BienesRaices.com',
        html: `
            <p>Hola ${nombre}, comprueba tu cuenta en bienesRaices.com</p>
            <p>Tu cuenta ya está lista, solo debes confirmarla en el siguiente enlace: <a href="${process.env.BACKEND_URL}:${process.env.PORT ?? 3000}/auth/confirmar/${token}">Confirmar Cuenta</a></p>
            <p>Si no creaste esta cuenta, puedes ignorar el mensaje.</p>
        `
    });
};

const emailOlvidePassword = async (datos) => {
    const transport = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT,
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        }
    });

    const { email, nombre, token } = datos;

    // Verificar si se proporciona un valor válido para token
    if (!token) {
        throw new Error("No se proporcionó un valor válido para el token.");
    }
    //console.log("Valor del token: ", token)

    // Enviar el correo electrónico
    await transport.sendMail({
        from: 'BienesRaices.com',
        to: email,
        subject: 'Reestablece tu Password en BienesRaices.com',
        text: 'Reestablece tu Password en BienesRaices.com',
        html: `
            <p>Hola ${nombre}, haz solicitado Reestablecer tu Password en bienesRaices.com</p>
            <p>Siguel el siguiente enlace para generar un password: <a href="${process.env.BACKEND_URL}:${process.env.PORT ?? 3000}/auth/olvide-password/${token}">Reestablecer Password</a></p>
            <p>Si no solicitaste el cambio de password, puedes ignorar el mensaje.</p>
        `
    });
};

export { 
    emailRegistro,
    emailOlvidePassword 
};
