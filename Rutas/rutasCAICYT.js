const archivoJSON = require('../Revistas/CAICYT.json')
// Se puede llamar directamente a un archivo JSON local. Este será automaticamente parseado por lo que se puede usar inmediatamente

function consultaCAICYT(respuesta)
{

    // Extraigo toda la info de las revistas que hay en el archivo JSON
    var revistas = "";
    var numeroRevista = 1;
    for(var i = 0; i < archivoJSON.length; i++)
    {
        if (archivoJSON[i].Título == "HUBO UN ERROR")
        {
            revistas += `Revista ${numeroRevista++} <br>
                        HUBO UN ERROR<br> <hr>`
        }
        else
        {
            revistas += `Revista ${numeroRevista++} <br>
                        Titulo: ${archivoJSON[i].Título} <br> 
                        ISSN impresa: ${archivoJSON[i]['ISSN impresa']} <br>
                        ISSN en linea: ${archivoJSON[i]['ISSN en linea']} <br>
                        Área: ${archivoJSON[i].Área} <br>
                        Institucion: ${archivoJSON[i].Instituto} <br>
                        <hr>`
        }
    }
    

    // Muestro mensaje
    respuesta.writeHead(200, { 'Content-Type': 'text/html' })
    respuesta.write(
        `<!DOCTYPE html>
        <html>
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Sistema de Gestión Editorial</title>
            </head>
            <body>
                <h1 align="center">CAICYT</h1>
                <p>Estas son las revistas argentinas que se encuentran en CAICYT</p>
                <p>Cantidad de revistas en CAICYT: ${archivoJSON.length}</p>
                ${revistas}
                <a href="CAICYT.html">Retornar</a>
            </body>
        </html>`)
    respuesta.end()
}

exports.consultaCAICYT = consultaCAICYT;