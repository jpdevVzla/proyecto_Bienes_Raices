
const admin = (req, res) => {
    res.render('propiedades/admin', {
        pagina: 'Mis Propiedades',
        barra: true
    })
}

//Formulario para crear una nueva propiedad
const crear = (req, res) => {
    res.render('propiedades/crear', {
        pagina: 'Crear Propiedad',
        barra: true
    })
}

export {
    admin,
    crear
}