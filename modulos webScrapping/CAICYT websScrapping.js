const fs             = require('fs');        // Módulo para leer y escribir archivos
const puppeteer      = require('puppeteer'); // Módulo para web scrapping
const jsdom          = require('jsdom');     // Módulo para filtrar la información extraida con web scrapping
const csvtojson      = require('csvtojson');  // Módulo para pasar texto csv a json


// Busco los enlaces de todas las revistas
async function buscarEnlacesARevistas()
{
    try
    {
      const browser  = await puppeteer.launch({headless: 'false'}); // inicio puppeter
      // headless: true y headless: new permiten correr el navegador sin ninguna interfaz de usuario. Algunas sitios detectan esto y reconocen
      // que se trata de bots, como es el caso de CAICYT. Para evitar las medidas de seguridad, se corre el navegador en headless: false d
      const page     = await browser.newPage();
      page.setDefaultNavigationTimeout(120000);                    // Indico el tiempo limite para conectarse a un sitio web en milisegundos. Con cero quita el límite de tiempo (no es recomendable poner en 0 porque puede quedar en un bucle infinito en caso de error)
      const response = await page.goto(`http://www.caicyt-conicet.gov.ar/sitio/comunicacion-cientifica/nucleo-basico/revistas-integrantes/`); // URL del sitio web al que se le hace web scrapping
      const body     = await response.text();                     // Guardo el HTML extraido en esta variable  

      const { window: { document } } = new jsdom.JSDOM(body);     // inicio JSDOM y le paso el HTML extraido
        
      const filtroHTML  = document.getElementsByClassName("_self cvplbd"); // Hago un filtro al HTML extraido

      var enlaces = [];
      for(var i = 0; i < filtroHTML.length; i++)
      {
        enlaces.push(filtroHTML[i].getAttribute("href") );        // obtengo los enlaces de las revistas
      }
        
      await browser.close();                                      // cierro puppeter
      return enlaces;
    }
    catch(error)
    {
      console.log("@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@");
      console.log("HUBO UN ERROR CON LA CONEXIÓN DE PUPPETEER");
      console.error(error);
      console.log("@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@");
    }
}


// Extraigo la info de una sola revista
async function extraerInfoRevista(enlace)
{  
  var respuesta;
  try 
  {
    const browser  = await puppeteer.launch({headless: 'false'});
    const page     = await browser.newPage();
    page.setDefaultNavigationTimeout(120000);           
    const response = await page.goto(enlace); 
    const body     = await response.text(); 
    
    const { window: { document } } = new jsdom.JSDOM(body);     

    try
    {
      const titulo      = document.getElementsByClassName("entry-title")[0].textContent.trim().replaceAll(";", ",");
      
      var issnImpresa = null;
      var issnEnLinea = null;
      // Algunas revistas solo tienen ISSN en linea, mientras que otras tienen ISSN en linea e impresa
      
      // Me fijo si la sección con la información tiene etiquetas <p> y <strong>
      const etiquetasP        = document.getElementsByClassName("siteorigin-widget-tinymce textwidget")[0].querySelectorAll("p");
      const etiquetasStrong   = document.getElementsByClassName("siteorigin-widget-tinymce textwidget")[0].querySelectorAll("strong");
      const etiquetasPyStrong = document.getElementsByClassName("siteorigin-widget-tinymce textwidget")[0].querySelectorAll("p strong");

      // Si no tiene etiquetas <p> y la revista solo tiene ISSN en linea
      if(typeof(etiquetasP[0]) == "undefined" && etiquetasStrong.length == 2)
      {
        issnEnLinea = etiquetasStrong[0].textContent.trim().replaceAll(";", ",").replaceAll("ISSN ", "");
      }
      // Si no tiene etiquetas <p> y la revista tiene ISSN en linea e ISSN impresa
      if(typeof(etiquetasP[0]) == "undefined" && etiquetasStrong.length > 2)
      {
        console.log("x" + etiquetasStrong[1].textContent + "x");

        issnImpresa = etiquetasStrong[0].textContent.trim().replaceAll(";", ",").replaceAll("ISSN ", "");
        issnEnLinea = etiquetasStrong[1].textContent.trim().replaceAll(";", ",").replaceAll("ISSN ", "");
      }
      // Si tiene etiquetas <p> y la revista solo tiene ISSN en linea
      if(typeof(etiquetasP[0]) != "undefined" && etiquetasPyStrong.length == 2)
      {
        issnEnLinea = etiquetasPyStrong[0].textContent.trim().replaceAll(";", ",").replaceAll("ISSN ", "");
      }
      // Si tiene etiquetas <p> y la revista tiene ISSN en linea e ISSN impresa
      if(typeof(etiquetasP[0]) != "undefined" && etiquetasPyStrong.length > 2) 
      {
    
        issnImpresa = etiquetasPyStrong[0].textContent.trim().replaceAll(";", ",").replaceAll("ISSN ", "");
        issnEnLinea = etiquetasPyStrong[2].textContent.trim().replaceAll(";", ",").replaceAll("ISSN ", "");

        // No todas las revistas tienen el ISSN en linea bien escrito
        if(issnEnLinea == "Ver publicación" || etiquetasPyStrong[2].textContent.replace(/(?:\r\n|\r|\n)/g, "").trim() == "")
        {
          issnEnLinea = etiquetasPyStrong[1].textContent.trim().replaceAll(";", ",").replaceAll("ISSN ", "");
        }

        // Algunos tienen las etiquetas para el ISSN en linea pero no tienen nada de texto dentro
        if(etiquetasPyStrong[1].textContent.replace(/(?:\r\n|\r|\n)/g, "").trim() == "" )
        {
          issnImpresa = null;
          issnEnLinea = etiquetasPyStrong[0].textContent.trim().replaceAll(";", ",").replaceAll("ISSN ", "");
        } 
      }

      

      var area = null;
      // Para chequear a que área corresponde cada revista reviso que imagen tienen en la clase "so-widget-image"
      const imagen = document.getElementsByClassName("so-widget-image")[0].getAttribute("src");
      switch(imagen)
      {
        case "http://www.caicyt-conicet.gov.ar/sitio/wp-content/uploads/2017/09/CIENCIAS-BIOLÓGICAS-Y-DE-LA-SALUD-00.jpg":
          area = "Ciencias biológicas y de la salud";
          break;

        case "http://www.caicyt-conicet.gov.ar/sitio/wp-content/uploads/2017/09/CIENCIAS-AGRARIAS-INGENIERÍA-Y-MATERIALES-00.jpg":
          area = "Ciencias agrarias, ingeniería y materiales";
          break;

        case "http://www.caicyt-conicet.gov.ar/sitio/wp-content/uploads/2017/09/CIENCIAS-EXACTAS-Y-NATURALES-00.jpg":
          area = "Ciencias exactas y naturales ";
          break;

        case "http://www.caicyt-conicet.gov.ar/sitio/wp-content/uploads/2017/09/CIENCIAS-SOCIALES-Y-HUMANIDADES-00.jpg":
          area = "Ciencias sociales y humanidades";
          break;

        default:
          area = "No hay area";
          break;
      }

      // Obtener la información de la institución es muy complicado porque todos tienen algo diferente
      // Elimino todo lo que no quiero hasta que solo me quede el nombre de la institución
      var instituto;
      if(typeof(etiquetasP[0]) == "undefined")  // Si no tiene etiquetas <p>
      {
        instituto = document.getElementsByClassName("siteorigin-widget-tinymce textwidget")[0].textContent.trim();
      }
      else // Si tiene etiquetas <p>
      {
        instituto = etiquetasP[0].textContent.trim();
      }

      if(instituto.includes(";"))                instituto = instituto.replaceAll(";", ",");
      if(instituto.includes("."))                instituto = instituto.replaceAll(".", "");
      if(instituto.includes("ISSN "))            instituto = instituto.replaceAll("ISSN ", "");
      if(instituto.includes(`${issnEnLinea}`))   instituto = instituto.replaceAll(`${issnEnLinea}`, "");
      if(instituto.includes(`${issnImpresa}`))   instituto = instituto.replaceAll(`${issnImpresa}`, "");
      if(instituto.includes("(Impresa)"))        instituto = instituto.replaceAll("(Impresa)", "");
      if(instituto.includes("(En línea)"))       instituto = instituto.replaceAll("(En línea)", "");
      if(instituto.includes("Ver publicación"))  instituto = instituto.replaceAll("Ver publicación", "");
      instituto = instituto.replace(/(?:\r\n|\r|\n)/g, ""); // Quita los saltos de línea
      instituto = instituto.trimStart(); // Quita los espacios en blanco que quedan al principio


      // Chequeo que el string que me quedo no este vacio
      var instituoVacio = true;  
      for(var i = 0; i < instituto.length; i++)
      {
        if(instituto[i] != " " ) instituoVacio = false;
      }

      if(instituoVacio) instituto = null;

      // Muestro en consola el resultado
      console.log(`***********************************************************************************`);
      console.log(`Título: ${titulo}`);
      console.log(`ISSN impresa: ${issnImpresa}`);
      console.log(`ISSN en linea: ${issnEnLinea}`);
      console.log(`Área: ${area}`);
      console.log(`Instituto: ${instituto}`);
      console.log(`***********************************************************************************`);

      respuesta = `${titulo};${issnImpresa};${issnEnLinea};${area};${instituto}` + '\n';
    }
    catch(error)
    {
      respuesta = "HUBO UN ERROR" + "\n";

      console.log("@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@");
      console.log("HUBO UN ERROR AL EXTRAER LOS DATOS");
      console.error(error);
      console.log("@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@");
    }

    await browser.close();
  }
  catch (error) 
  {
    respuesta = "HUBO UN ERROR" + "\n";

    console.log("@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@");
    console.log("HUBO UN ERROR CON LA CONEXIÓN DE PUPPETEER");
    console.error(error);
    console.log("@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@");
  }

  return respuesta;
}


// Extraigo la info de todas las revistas
async function extraerInfoCAICYT()
{
  console.log("Comienza la extracción de datos de CAICYT");

  const enlaces = await buscarEnlacesARevistas();
  console.log(`CANTIDAD DE REVISTAS ${enlaces.length}`);

  // Recorro todos los enlaces y obtengo la info de cada revista una por una
  var info = "Título;ISSN impresa;ISSN en linea;Área;Instituto" + "\n"; // No usar las tildes inclinadas (` `) acá porque al ser la línea cabecera genera error al crear el archivo csv
  var revista = 0;
  for(var i = 0; i < enlaces.length; i++)
  {
    console.log(`REVISTA ${++revista}`);
    info += await extraerInfoRevista(enlaces[i]);
  }

  // Escribo la info en formato csv. En caso de que ya exista el archivo, lo reescribe así tenemos siempre la información actualizada
  fs.writeFile('./Revistas/CAICYT.csv', info, error => 
  { 
    if(error) console.log(error);
  })

  // Parseo de CSV a JSON
  csvtojson({delimiter: [";"],}).fromFile('./Revistas/CAICYT.csv').then((json) => // La propiedad delimiter indica porque caracter debe separar
  { 
      fs.writeFile('./Revistas/CAICYT.json', JSON.stringify(json), error => 
      { 
          if(error) console.log(error);
      })
  })

  console.log("Termina la extracción de datos de CAICYT");
}


async function sanarDatos()
{
  console.log("Saneando datos corrompidos");
  
  // Busco los archivos para sanear
  var archivoCSV;
  fs.readFile(`./Revistas/CAICYT.csv`, (error, datos) => 
  { 
    if(error) console.log(error);
    else      archivoCSV = datos.toString();
  })

  const archivoJSON = require(`../Revistas/CAICYT.json`); // Uso el archivoJSON para saber que revistas no se pudieron extraer bien
  const enlaces     = await buscarEnlacesARevistas();
  

  // Vuelvo a extraer los datos de las revistas que tienen errores
  var numeroRevista = 0;
  var infoSaneada = [];
  for(var i = 0; i < archivoJSON.length; i++)
  {
    if (archivoJSON[i].Título == "HUBO UN ERROR")
    {
      console.log(`REVISTA ${++numeroRevista}`);
      infoSaneada.push(await extraerInfoRevista(enlaces[i]) );
    }
  }


  // Añado la información saneada al archivo
  for(var i = 0; i < infoSaneada.length; i++)
  {
    var aux = infoSaneada[i].replace("\n", "");
    archivoCSV = archivoCSV.replace("HUBO UN ERROR", aux);
  }

  // Vuelvo a escribir los archivos pero ya saneados
  fs.writeFile('./Revistas/CAICYT.csv', archivoCSV, error => 
  { 
    if(error) console.log(error);
  })

  csvtojson({delimiter: [";"],}).fromFile('./Revistas/CAICYT.csv').then((json) =>
  { 
      fs.writeFile('./Revistas/CAICYT.json', JSON.stringify(json), error => 
      { 
          if(error) console.log(error);
      })
  })

  console.log("Saneamiento completo");
}


exports.extraerInfoCAICYT = extraerInfoCAICYT;
exports.sanarDatos        = sanarDatos;