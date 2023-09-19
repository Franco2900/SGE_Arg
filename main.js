const http         = require('http');             // Módulo para hacer la navegación web
const enrutamiento = require('./enrutamiento.js') // Módulo para enrutar las solicitudes

//xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx//
// EXPLICACIÓN DE COMO FUNCIONA HTTP
//xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx//
// HTTP (HyperText Transfer Protocol / Protocolo de transferencia de hipertexto) es un protocolo que permite la transferencia de datos entre un servidor web y normalmente un navegador.
// Cuando escribimos una dirección web, o mejor dicho, una URL (Uniform Resource Locators / Localizador de recursos uniforme) estas tienen la forma de:

// http://host[:puerto][/ruta y archivo][?parámetros]

// http              (es el protocolo que utilizamos para conectarnos con un servidor web)
// host              (es el nombre del dominio, por ejemplo: google.com.ar)
// puerto            (es un número que generalmente no lo disponemos, ya que por defecto el protocolo http utiliza el nro 80, salvo que nuestro servidor escuche peticiones en otro puerto, que ya en este caso si debemos indicarlo)
// [/ruta y archivo] (indica donde se encuentra el archivo en el servidor y cual es el archivo)
// ?parámetros       (datos que se pueden enviar desde el cliente para una mayor identificación del recurso que solicitamos)

// Ejemplo:            https://www.tutorialesprogramacionya.com/javascriptya/nodejsya/detalleconcepto.php?punto=5&codigo=5&inicio=0
// El host es:         www.tutorialesprogramacionya.com
// El puerto es:       80
// La ruta es:         javascriptya/nodejsya/
// El archivo es:      detalleconcepto.php
// Los párametros son: punto=5, codigo=5, inicio=0

// Cuando ingresamos una URL, el navegador hace una solicitud al servidor y el servidor responde a dicha solicitud
//xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx//


// Cuando trabajamos con Node.js debemos codificar nosotros el servidor web (muy distinto a como se trabaja con PHP en donde disponemos en forma paralela un servidor web como puede ser el Apache)
// Configuración del servidor de Node.js
const servidor = http.createServer((pedido, respuesta) => 
{
  // createServer() crea un servidor con el protocolo HTTP y su párametro es una función que se dispara cada vez que le llega una solicitud del navegador
  // pedido tiene varios datos, entre ellos: el nombre del archivo que solicitamos, la URL, la información del navegador que hizo la petición, etc.
  // respuesta es la respuesta del servidor al navegador

  const url  = new URL('http://localhost:8888' + pedido.url); // Creo una URL para obtener la ruta facilmente
  let ruta   = 'static' + url.pathname;                       // A la carpeta que contiene todos los archivos HTML le concatenao la ruta y el nombre del archivo HTML solicitado
  
  if (ruta == 'static/') ruta = 'static/index.html';          // Si en la URL no viene indicada ninguna ruta, redirigimos la ruta al archivo index.html
  enrutamiento.enrutar(pedido, respuesta, ruta)               // Si hay una ruta, redigirimos a donde corresponde
})

servidor.listen(8888);                                   // Puerto en el que el servidor se va a quedar escuchando peticiones (puede ser cualquiera mientras no sea 80)
console.log('Servidor web iniciado en el puerto 8888');  // Cuando lo ejecutamos en la consola se muestra el mensaje y no se cierra. Esto es porque el programa se queda escuchando peticiones en el puerto indicado
// Para ver como funciona el sitio web, en el navegador hay que escribir localhost:8888


// NOTA PARA LOS QUE SIGAN CON ESTE PROYECTO
// En caso de que no sepan como usar Node.js, les dejamos la guía que usamos para aprender a usarlo
// https://www.tutorialesprogramacionya.com/javascriptya/nodejsya/