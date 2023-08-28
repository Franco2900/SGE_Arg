// Se usan dos funciones para hacer el web scrapping:
// extraerInfoLatindex() hace web scrapping en la barra de búsqueda de Latindex
// extraerInfoRevista() hace web scrapping de cada revista en la barra de búsqueda

async function extraerInfoLatindex(puppeteer, jsdom, fs)
{
  console.log("INICIA EL WEB SCRAPPING");
  
  try 
  {
    const browser  = await puppeteer.launch({headless: 'new'}); // inicio puppeter
    var paginaActual = 1;
    var info = "";
    
    // Hago el web scrapping en la barra de búsqueda de Latindex
    while(paginaActual <= 23)  // ARREGLAR, ESTA HARDCODEADO, NO SERVIRIA SI HAY MÁS REVISTAS EN EL FUTURO
    {
      console.log(`PÁGINA ${paginaActual}`);
  
      const page     = await browser.newPage(); 
      const response = await page.goto(`https://www.latindex.org/latindex/bAvanzada/resultado?idMod=1&tema=0&subtema=0&region=0&pais=3&critCat=0&send=Buscar&page=${paginaActual}`); // URL del sitio web al que se le hace web scrapping
      const body     = await response.text(); // Extraigo todo el HTML extraido y lo guardo en esta variable  
            
      const { window: { document } } = new jsdom.JSDOM(body); // inicio JSDOM y le paso el HTML extraido
        
      document.querySelectorAll('div table tbody tr td div a').forEach(element => // Busqueda de la info que queremos. Con el querySelectorAll() hacemos filtro al HTML extraido
      { 
        info += "Título: " + element.textContent.trim() + "\n";   
        console.log("Título: " + element.textContent.trim() );
        //extraerInfoRevista(browser, jsdom, element.getAttribute("href") );
      });
  
      paginaActual++;
    }
  
    // Escribimos la info filtrada en el archivo excel. En caso de que ya exista el archivo, lo reescribe así tenemos siempre la información actualizada
    fs.writeFile('./Revistas/Latindex.xls', info, error => 
    { 
      if(error) console.log(error);
    })
  
    await browser.close();  // cierro puppeter
  }
  catch (error) 
  {
    console.error(error);
  }
  
  console.log("TERMINA EL WEB SCRAPPING"); 
}


// No ejecutar hasta encontrar la forma de que no cuelgue la pc o buscar otro modo de extraer la info de cada revista
async function extraerInfoRevista(browser, jsdom, URL){
  try 
  {    
    var info = "";
  
    const page     = await browser.newPage(); 
    const response = await page.goto(URL); 
    const body     = await response.text();
            
    const { window: { document } } = new jsdom.JSDOM(body);
        
    document.querySelectorAll("#rev-linea table tbody tr td").forEach(element => // FALTA PERFECCIONAR EL FILTRO
    { 
      //info += "ISSN: " + element.textContent.trim();  
      console.log("ISSN: " + element.textContent.trim() ); 
    });
     
  }
  catch (error) {
    console.error(error);
  }
}


exports.extraerInfoLatindex = extraerInfoLatindex;