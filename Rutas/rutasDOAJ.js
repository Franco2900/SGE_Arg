const mysql = require('mysql')              // Módulo para trabajar con bases de datos mySQL

const conexion = mysql.createConnection({   // Creo la conexión a la base de datos de mysql
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'basenodejs'
})
  
conexion.connect(error =>                   // En caso de error al conectarse a la base de datos
{
    if (error) console.log('Problemas de conexion con mysql')
})


function crearTabla(respuesta) 
{
    // Con la función query introducimos los comandos SQL
    // Siempre que llamamos a query debemos pasarle, además del string con el comando SQL, un segundo parámetro que se trata de una función que se llama en caso de error

    // Si existe la tabla, la borro
    conexion.query('DROP TABLE IF EXISTS articulo', (error, resultado) => 
    {
      if (error) console.log(error)
    })

    // Creo la tabla
    conexion.query(
        `CREATE TABLE articulo 
        (
            codigo      INT PRIMARY KEY AUTO_INCREMENT,
            descripcion VARCHAR(50),
            precio      FLOAT
        )`
        , 
        (error, resultado) => 
        {
            if (error) 
            {
                console.log(error)
                return
            }
        }
    )

    // Muestro mensaje
    respuesta.writeHead(200, { 'Content-Type': 'text/html' })
    respuesta.write(
        `<!DOCTYPE html>
        <html>
            <head></head>
            <body>
                Se creo la tabla<br>
                <a href="index.html">Retornar</a>
            </body>
        </html>`)
    respuesta.end()
}
  
  
function altaArticulo(pedido, respuesta) 
{
    // Obtengo los datos del formulario
    let info = ''
    pedido.on('data', datosParciales => 
    {
      info += datosParciales;
    })
    
    pedido.on('end', () => 
    {
        // Separo los datos del formulario
        const formulario = new URLSearchParams(info)
        const registro = 
        {
            descripcion: formulario.get('descripcion'),
            precio:      formulario.get('precio')
        }
      
        // Los inserto en la tabla
        conexion.query('INSERT INTO articulo SET ?', registro, (error, resultado) => // Si bien en SQL no existe la palabra SET, la función query generará un comando insert válido.
        {
            if (error) 
            {
                console.log(error)
                return
            }
        })
      
        // Muestro mensaje
        respuesta.writeHead(200, { 'Content-Type': 'text/html' })
        respuesta.write(
            `<!DOCTYPE html>
            <html>
                <head></head>
                <body>
                    Se cargo el articulo<br>
                    <a href="index.html">Retornar</a>
                </body>
            </html>`)
        respuesta.end()
    })
}
  
  
function listadoArticulos(respuesta) 
{
    conexion.query('SELECT codigo, descripcion, precio FROM articulo', (error, filas) => //filas se refiere a las filas que devuelve la consulta
    {
      if (error) 
      {
        console.log('Error en el listado')
        return
      }

      // Obtengo los datos de la consulta
      respuesta.writeHead(200, { 'Content-Type': 'text/html' })
      let datos = ''
      for (let f = 0; f < filas.length; f++)  
      {
        datos += 'Codigo: '      + filas[f].codigo      + '<br>'
        datos += 'Descripcion: ' + filas[f].descripcion + '<br>'
        datos += 'Precio: '      + filas[f].precio      + '<hr>'
      }

      // Muestro la consulta
      respuesta.write('<!DOCTYPE html><html><head></head><body>')
      respuesta.write(datos)
      respuesta.write('<a href="index.html">Retornar</a>')
      respuesta.write('</body></html>')
      respuesta.end()
    })
}
  
  
function consultaPorCodigo(pedido, respuesta) 
{
    // Obtengo los datos del formulario
    let info = ''
    pedido.on('data', datosParciales => 
    {
      info += datosParciales
    })

    pedido.on('end', () => 
    {
        // Separo los datos del formulario
        const formulario = new URLSearchParams(info)
        const dato       = formulario.get('codigo')

        conexion.query('SELECT descripcion, precio FROM articulo WHERE codigo = ?', dato, (error, filas) => 
        {
            if (error) 
            {
                console.log('Error en la consulta')
                return
            }
            respuesta.writeHead(200, { 'Content-Type': 'text/html' })
            
            let datos = ''
            if (filas.length > 0) 
            {
                datos += 'Descripcion:' + filas[0].descripcion + '<br>'
                datos += 'Precio:'      + filas[0].precio      + '<hr>'
            } 
            else 
            {
                datos = 'No existe un artículo con dicho codigo.'
            }

            // Muestro la consulta
            respuesta.write('<!DOCTYPE html><html><head></head><body>')
            respuesta.write(datos)
            respuesta.write('<a href="index.html">Retornar</a>')
            respuesta.write('</body></html>')
            respuesta.end()
        })
    })
}


exports.crearTabla        = crearTabla
exports.altaArticulo      = altaArticulo
exports.listadoArticulos  = listadoArticulos
exports.consultaPorCodigo = consultaPorCodigo