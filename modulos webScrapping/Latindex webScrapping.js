// Busco cuantas páginas devuelve la consulta a Latindex (cada página tiene entre 1 y 20 revistas)
async function buscarCantidadPaginas(puppeteer, jsdom)
{
  try 
  {
    const browser  = await puppeteer.launch({headless: 'new'}); // inicio puppeter

    const page     = await browser.newPage();
    page.setDefaultNavigationTimeout(0);    // Quita el límite de tiempo para conectarse a un sitio web 
    const response = await page.goto(`https://www.latindex.org/latindex/bAvanzada/resultado?idMod=1&tema=0&subtema=0&region=0&pais=3&critCat=0&send=Buscar&page=1`); // URL del sitio web al que se le hace web scrapping
    const body     = await response.text(); // Guardo el HTML extraido en esta variable  
            
    const { window: { document } } = new jsdom.JSDOM(body); // inicio JSDOM y le paso el HTML extraido

    const filtroHTML      = document.querySelectorAll('nav ul li a');              // Hago un filtro al HTML extraido
    const cantidadPaginas = parseInt(filtroHTML[filtroHTML.length-2].textContent); // Extraigo la información que quiero del filtro

    await browser.close(); // cierro puppeter

    console.log("CANTIDAD DE PÁGINAS: " + cantidadPaginas);
    return cantidadPaginas;
  }
  catch (error) 
  {
    console.error(error);
  }
}


// Busco los enlaces de cada revista que devuelva la consulta a Latindex
async function buscarEnlacesARevistas(puppeteer, jsdom)
{  
  try 
  {
    const browser  = await puppeteer.launch({headless: 'new'}); 
    var paginaActual = 1;
    const cantidadPaginas = await buscarCantidadPaginas(puppeteer, jsdom);
    var enlaces = [];
    
    while(paginaActual <=  cantidadPaginas) 
    {
      console.log(`Obteniendo enlaces de la página ${paginaActual}`);
  
      const page     = await browser.newPage(); 
      page.setDefaultNavigationTimeout(0);
      const response = await page.goto(`https://www.latindex.org/latindex/bAvanzada/resultado?idMod=1&tema=0&subtema=0&region=0&pais=3&critCat=0&send=Buscar&page=${paginaActual}`); 
      const body     = await response.text();   
            
      const { window: { document } } = new jsdom.JSDOM(body); 
        
      const filtroHTML =document.querySelectorAll('div table tbody tr td div a');
      
      filtroHTML.forEach(element => 
      { 
        enlaces.push(element.getAttribute("href") );   
      });
  
      paginaActual++;
    }
  
    await browser.close();
    return enlaces;  
  }
  catch (error) 
  {
    console.error(error);
  }
}


// Extraigo la info de una revista
async function extraerInfoRevista(puppeteer, jsdom, enlace)
{  
  try 
  {
    const browser  = await puppeteer.launch({headless: 'new'}); 
  
    const page     = await browser.newPage(); 
    page.setDefaultNavigationTimeout(0);    
    const response = await page.goto(enlace); 
    const body     = await response.text();   
            
    const { window: { document } } = new jsdom.JSDOM(body); 
        
    var filtroHTML  = document.getElementById("rev-linea");
    var filtro2HTML = filtroHTML.getElementsByClassName("table-resultadosFicha")[0];
    const tabla1    = filtro2HTML.querySelectorAll("tbody tr td");
    const titulo    = tabla1[0].textContent;
    const issn      = tabla1[tabla1.length-1].textContent;

    filtroHTML      = document.getElementById("datos-comunes");
    const tabla2    = filtroHTML.querySelectorAll("div table tbody tr td");
    const tabla3    = filtroHTML.querySelectorAll("div table tbody tr th");

    var moverPosicion = 0;
    var organismoResponsable = null;
    if(tabla3[3].textContent == "Organismo responsable:") // No todas las revistas tienen esta variable
    {
      moverPosicion = 1;
      organismoResponsable = tabla2[3].textContent.trim().replaceAll(";", ",");
    }

    const idioma    = tabla2[0].textContent.trim().replaceAll(";", ",");
    const tema      = tabla2[1].textContent.trim().replaceAll(";", ",");
    const subtemas  = tabla2[2].textContent.trim().replaceAll(";", ",");
    const editorial = tabla2[3+moverPosicion].textContent.trim().replaceAll(";", ",");
    const ciudad    = tabla2[4+moverPosicion].textContent.trim().replaceAll(";", ",");
    const provincia = tabla2[5+moverPosicion].textContent.trim().replaceAll(";", ","); // En Latindex se llama Estado/Provincia/Departamento pero para hacerlo corto lo llamo directamente provincia
    const correo    = tabla2[6+moverPosicion].textContent.trim().replaceAll(";", ",");

    await browser.close();  
    
    console.log(`***********************************************************************************`);
    console.log(`Título: ${titulo}`);
    console.log(`ISSN: ${issn}`);
    console.log(`Idioma: ${idioma}`);
    console.log(`Tema: ${tema}`);
    console.log(`Subtemas: ${subtemas}`);
    console.log(`Organismo responsable: ${organismoResponsable}`);
    console.log(`Editorial: ${editorial}`);
    console.log(`Ciudad: ${ciudad}`);
    console.log(`Estado/Provincia/Departamento: ${provincia}`);
    console.log(`Correo: ${correo}`);
    console.log(`***********************************************************************************`);

    return `${titulo};${issn};${idioma};${tema};${subtemas};${organismoResponsable};${editorial};${ciudad};${provincia};${correo};` + `\n`;
  }
  catch (error) 
  {
    console.error(error);
  }
}


// Extraigo la info de todas las revistas de la consulta
async function extraerInfoLatindex(puppeteer, jsdom, fs)
{
  console.log("Comienza la extracción de datos de Latindex");

  const enlaces  =  await buscarEnlacesARevistas(puppeteer, jsdom);
  var info       = "Título;ISSN;Idioma;Tema;Subtemas;Organismo responsable;Editorial;Ciudad;Estado/Provincia/Departamento;Correo;" + "\n";

  console.log("CANTIDAD DE REVISTAS: " + enlaces.length);
  
  var i;
  for(i = 0; i < enlaces.length-1; i++){
    console.log(`REVISTA ${i}`);
    info += await extraerInfoRevista(puppeteer, jsdom, enlaces[i]);
  }


  // Escribimos la info de cada revista en el archivo excel. En caso de que ya exista el archivo, lo reescribe así tenemos siempre la información actualizada
  fs.writeFile('./Revistas/Latindex.xls', info, error => 
  { 
    if(error) console.log(error);
  })

  console.log("Termina la extracción de datos de Latindex");
}


exports.extraerInfoLatindex = extraerInfoLatindex;