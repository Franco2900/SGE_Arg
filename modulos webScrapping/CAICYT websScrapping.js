// Busco los enlaces de todas las revistas
async function buscarEnlacesARevistas(puppeteer, jsdom)
{
    try
    {
      const browser  = await puppeteer.launch({headless: 'false'}); // inicio puppeter
      // headless: true y headless: new permiten correr el navegador sin ninguna interfaz de usuario. Algunas sitios detectan esto y reconocen
      // que se trata de bots, como es el caso de CAICYT. Para evitar las medidas de seguridad, se corre el navegador en headless: false d
      const page     = await browser.newPage();
      page.setDefaultNavigationTimeout(0);                        // Quita el límite de tiempo para conectarse a un sitio web 
      const response = await page.goto(`http://www.caicyt-conicet.gov.ar/sitio/comunicacion-cientifica/nucleo-basico/revistas-integrantes/`); // URL del sitio web al que se le hace web scrapping
      const body     = await response.text();                     // Guardo el HTML extraido en esta variable  

      const { window: { document } } = new jsdom.JSDOM(body);     // inicio JSDOM y le paso el HTML extraido
        
      const filtroHTML  = document.getElementsByClassName("_self cvplbd"); // Hago un filtro al HTML extraido

      var enlaces = [];
      var i;
      for(i = 0; i < filtroHTML.length-1; i++)
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
      console.log("@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@");
      console.error(error);
    }
}


// Extraigo la info de una sola revista
async function extraerInfoRevista(puppeteer, jsdom, enlace)
{  
  try 
  {
    const browser  = await puppeteer.launch({headless: 'false'});
    const page     = await browser.newPage();
    page.setDefaultNavigationTimeout(0);           
    const response = await page.goto(enlace); 
    const body     = await response.text(); 
    
    const { window: { document } } = new jsdom.JSDOM(body);     

    var respuesta;
    try
      {
      const titulo      = document.getElementsByClassName("entry-title")[0].textContent.trim().replaceAll(";", ",");
      
      var issnImpresa = null;
      var issnEnLinea = null;
      // Algunas revistas solo tienen ISSN en linea mientras que otras tienen ISSN en linea e impresa. Verifico que ISSN tiene cada revista
      // Si la revista solo tiene ISSN en linea
      if(typeof(document.getElementsByClassName("siteorigin-widget-tinymce textwidget")[0].querySelectorAll("p strong")[2]) == "undefined")
      {
        issnEnLinea = document.getElementsByClassName("siteorigin-widget-tinymce textwidget")[0].querySelectorAll("p strong")[0].textContent.trim().replaceAll(";", ",").replaceAll("ISSN ", "");
      }
      else // Si la revista tiene ISSN en linea e impresa
      {
        issnImpresa = document.getElementsByClassName("siteorigin-widget-tinymce textwidget")[0].querySelectorAll("p strong")[0].textContent.trim().replaceAll(";", ",").replaceAll("ISSN ", "");
        issnEnLinea = document.getElementsByClassName("siteorigin-widget-tinymce textwidget")[0].querySelectorAll("p strong")[2].textContent.trim().replaceAll(";", ",").replaceAll("ISSN ", "");

        // No todas las revistas tienen el ISSN en linea bien escrito
        if(issnEnLinea == "Ver publicación")
        {
          issnEnLinea = document.getElementsByClassName("siteorigin-widget-tinymce textwidget")[0].querySelectorAll("p strong")[1].textContent.trim().replaceAll(";", ",").replaceAll("ISSN ", "");
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
      }

      // Obtener la información de la institución es muy complicado porque todos tienen algo diferente o no lo tienen.
      // Elimino todo lo que no quiero hasta que solo me quede el nombre de la institución
      var instituto = document.getElementsByClassName("siteorigin-widget-tinymce textwidget")[0].querySelectorAll("p")[0].textContent.trim();
      if(instituto.includes(";"))                instituto = instituto.replaceAll(";", ",");
      if(instituto.includes("."))                instituto = instituto.replaceAll(".", "");
      if(instituto.includes("ISSN "))            instituto = instituto.replaceAll("ISSN ", "");
      if(instituto.includes(`${issnEnLinea}`))   instituto = instituto.replaceAll(`${issnEnLinea}`, "");
      if(instituto.includes(`${issnImpresa}`))   instituto = instituto.replaceAll(`${issnImpresa}`, "");
      if(instituto.includes("(Impresa)"))        instituto = instituto.replaceAll("(Impresa)", "");
      if(instituto.includes("(En línea)"))       instituto = instituto.replaceAll("(En línea)", "");
      instituto = instituto.replace(/(?:\r\n|\r|\n)/g, ""); // Quita los saltos de línea

      // Chequeo que el string que me quedo no este vacio
      var vacio = true;  
      var i;
      for(i = 0; i < instituto.length-1; i++)
      {
        if(instituto[i] != " " ) vacio = false;
      }

      if(vacio) instituto = null;

      // Muestro en consola el resultado
      console.log(`***********************************************************************************`);
      console.log(`Título: ${titulo}`);
      console.log(`ISSN impresa: ${issnImpresa}`);
      console.log(`ISSN en linea: ${issnEnLinea}`);
      console.log(`Área: ${area}`);
      console.log(`Instituto: ${instituto}`);
      console.log(`***********************************************************************************`);

      respuesta = `${titulo};${issnImpresa};${issnEnLinea};${area};${instituto};`;
    }
    catch(error)
    {
      respuesta = "HUBO UN ERROR AL EXTRAER LOS DATOS";

      console.log("@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@");
      console.log("HUBO UN ERROR AL EXTRAER LOS DATOS");
      console.error(error);
      console.log("@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@");
    }

    await browser.close();
    return respuesta;
  }
  catch (error) 
  {
    console.log("@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@");
    console.log("HUBO UN ERROR CON LA CONEXIÓN DE PUPPETEER");
    console.log("@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@");
    console.error(error);
  }
}


// Extraigo la info de todas las revistas
async function extraerInfoCAICYT(puppeteer, jsdom, fs)
{
  console.log("Comienza la extracción de datos de CAICYT");

  const enlaces = await buscarEnlacesARevistas(puppeteer, jsdom);
  console.log(`CANTIDAD DE REVISTAS ${enlaces.length}`);

  // Recorro todos los enlaces y obtengo la info de cada revista una por una
  var info = `Título;ISSN impresa;ISSN en linea;Área;`;
  var i = 0;
  var revista = 1;
  for(i = 0; i < enlaces.length; i++)
  {
    console.log(`REVISTA ${revista}`);
    revista++;
    info += await extraerInfoRevista(puppeteer, jsdom, enlaces[i]);
  }

  // Escribimos la info de cada revista en el archivo excel. En caso de que ya exista el archivo, lo reescribe así tenemos siempre la información actualizada
  fs.writeFile('./Revistas/CAICYT.xls', info, error => 
  { 
    if(error) console.log(error);
  })

  console.log("Termina la extracción de datos de CAICYT");
}


exports.extraerInfoCAICYT = extraerInfoCAICYT;