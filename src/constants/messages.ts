// src/constants/messages.js

export const BodyMessages = {
    unexpectedError: {
        title: "Error inesperado",
        description: "Intenta de nuevo.",
        instructions: "Refresca la página o contacta con soporte técnico.",
    },
    cancelledAction: {
        title: "Acción cancelada",
        description: "Puedes volver a intentarlo.",
        instructions: "",
    },
    verificationSuccess: {
        title: "Procesando",
        description: "Gracias por completar la solicitud",
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
    instructions: {
        title: "Pasarás por un proceso de verificación facial para demostrar que eres una persona real.",
        description: "Sigue las Instrucciones para completar la verificación",
        instructions: [
            { title: '1. DNI', description: 'Coloca tu DNI frente a la cámara' },
            { title: '2. Documento', description: 'Verifica / lee tu documento y presiona Firmar' },
            { title: '3. Prueba de vida y Firma', description: 'Coloca tu rostro frente a la cámara y espera a que se procese la firma biométrica' },
        ]
    },
    footer: {
        defaultContent: "DANAconnect Corp. Todos los derechos reservados.",
    },
    docs: {
        signed: "Este es el detalle de tu Firma",
        unsigned: "Por favor Firma estos documentos"
    },
    buttons: {
        back: "Regresar",
        process: "Procesando...",
        manualProcess: "Reintentar",
        sing: "Firmar",
        continue: "Continuar"
    },
    camera: {
        upload: "Muestra tu DNI a la cámara",
        dniError: "DNI inválido, vuelve a intentarlo",
        successCapture: "Imagen capturada.",
        requestError: "Hubo un error al procesar tu solicitud. Por favor intenta nuevamente",
        capture: "Capturando en ",
        permissionError: "Error: Permiso de cámara denegado. Habilítelo en la configuración del navegador.",
        imagenError: "Error: No se pudo capturar la imagen."
    },
    documentViewer: {
        livenessResults: "Resultados de Liveness",
        geolocation: "Geolocalización"
    },
    accions: {
        loading: "Cargando..."
    }
};
