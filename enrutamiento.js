const fs    = require('fs');
const mime  = require('mime');

const rutasDOAJ     = require('./Rutas/rutasDOAJ.js');
const rutasCAICYT   = require('./Rutas/rutasCAICYT.js');
const rutasLatindex = require('./Rutas/rutasLatindex.js');

function enrutar(pedido, respuesta, ruta) 
{
    switch (ruta) // Con este switch se controla que archivos o funciones llama cada ruta. Con los case llamo a funciones y con el default llamo a archivos
    {
        
        case "static/consultaDOAJ":
        {
            rutasDOAJ.consultaDOAJ(respuesta);
            break;
        }

        case "static/consultaCAICYT":
        {
            rutasCAICYT.consultaCAICYT(respuesta);
            break;
        }

        case "static/consultaLatindex":
        {
            rutasLatindex.consultaLatindex(respuesta);
            break;
        }

        default: // En caso de que la ruta no llame a una función, sino a un archivo
        {  
            // Mediante el módulo fs verificamos si existe el archivo HTML. 
            // El método stat tiene como primer parámetro el nombre del archivo junto con toda la ruta y el segundo parámetro es una función anónima que actua distinto dependiendo si hubo o no un error con el archivo
            fs.stat(ruta, error => 
            { 
                if (!error) // Si no hubo ningún error, el archivo existe
                { 
                    fs.readFile(ruta, (error, contenido) => 
                    {
                        if (error) // Si hubo un problema al leer el archivo
                        { 
                            respuesta.writeHead(500, { 'Content-Type': 'text/plain' }) // writeHead: indicamos la cabecera de la petición HTTP (en esta caso con el código 500 indicamos que paso un Internal Server Error) y la propiedad Content-Type (en esta caso indicamos que retornaremos una corriente de datos de texto plano)
                            respuesta.write('Error interno')                           // write:     indicamos todos los datos a devolver al cliente
                            respuesta.end()                                            // end:       finalizamos la corriente de datos (podemos llamar varias veces a la función write pero solo una vez a la función end)
                        } 
                        else       // Si no hubo ningún problema al leer el archivo
                        {       
                            const tipo = mime.getType(ruta)                            // Obtengo de que tipo es el archivo que se quiere leer, para indicar después de que tipo es la corriente de datos
                            respuesta.writeHead(200, { 'Content-Type': tipo })
                            respuesta.write(contenido)
                            respuesta.end()
                        }
                    })

                }  
                else       // Si no existe el archivo a leer
                {  
                    respuesta.writeHead(404, { 'Content-Type': 'text/html' })
                    respuesta.write('<!DOCTYPE html><html><head></head><body>Recurso inexistente</body></html>')
                    respuesta.end()
                }
            })
        }

    }
}

exports.enrutar = enrutar