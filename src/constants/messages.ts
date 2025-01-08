// src/constants/messages.js

export const Messages = {
    unexpectedError: {
        title: "Error inesperado",
        description: "Intenta de nuevo.",
        instructions: "Refresca la página o contacta con soporte técnico.",
    },
    cancelledAction: {
        title: "Acción cancelada por el Usuario",
        description: "Puedes volver a intentarlo.",
        instructions: "",
    },
    verificationSuccess: {
        title: "Verificación exitosa",
        description: "Llamo a la API",
        instructions: "",
    },
    notLive: {
        title: "No es una persona",
        description: "La cámara no reconoce una persona. Es posible que no hayas seguido las instrucciones.",
        instructions: "Por favor, regresa, ponte de frente a la cámara y sigue las instrucciones.",
    },
    dataError: {
        title: "Error en Información",
        description: "Se ha producido un error al cargar la información de su cuenta.",
        instructions: "Vuelva a abrir el email original que le enviamos y haga clic en el enlace para generar el token nuevamente.",
    },
    footer: {
        defaultContent: "DANAconnect Corp. Todos los derechos reservados.",
    },
    docs: {
        signed: "Estos son tus documentos firmados",
        unsigned: "Por favor Firma estos documentos"
    },
    buttons: {
        back: "Regresar",
    },
    camera: {
        upload: "Sube tu DNI",
        dniError: "DNI inválido, vuelve a intentarlo",
        successCapture: "Imagen capturada. Listo para procesar.",
        requestError: "Hubo un error al procesar tu solicitud. Por favor intenta nuevamente"
    }

};
