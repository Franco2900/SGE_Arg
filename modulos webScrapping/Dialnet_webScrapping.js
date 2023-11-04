const fs = require("fs"); // Módulo para leer y escribir archivos
const puppeteer = require("puppeteer"); // Módulo para web scrapping
const jsdom = require("jsdom"); // Módulo para filtrar la información extraida con web scrapping

// Busco cuantas páginas devuelve la consulta a Latindex (cada página tiene entre 1 y 20 revistas)
async function generarUrls() {
  const alfabeto =["A", "B", "C","D", "E", "F","G", "H", "I","J", "K", "L","M", "N", "O","P", "Q", "R","S", "T", "U", "V", "W", "X", "Y", "Z", "OTROS"];
  //const alfabeto =["A"];  
  const urls = [];
  for(const letra of alfabeto){
  try {
    const browser = await puppeteer.launch({ headless: "new" });
    const page = await browser.newPage();
    page.setDefaultNavigationTimeout(0);
    await page.waitForTimeout(10000); 

    await page.goto("https://dialnet.unirioja.es/revistas/inicial/"+letra);

     // Obtener total de revistas
  const total = await page.evaluate(() => {
    const elemento = document.querySelector('p.numeroDeResultados');
    if (elemento) {
      const numeroConPunto = elemento.innerText.match(/\d+(\.\d+)?/)[0]; // Extrae el número con punto
      const numeroSinPunto = numeroConPunto.replace('.', ''); // Elimina el punto del número
      return numeroSinPunto;
    }
    return null;
  });   
    console.log("Total Revistas inicial "+letra+": "+total);
    await page.close();
    await browser.close();
    if (total){
      const url = "https://dialnet.unirioja.es/revistas/inicial/"+letra+"?registrosPorPagina=100&inicio=";
      var i =0;
      while((i*100)<total){
        if(i === 0){urls.push(url+1)}
        else{
        urls.push(url+((i*100)+1))}
        i++;
      }
    }
  } catch (error) {
    console.error("Error:", error);
    continue;
  }
} 
//console.log("URLs GENERADAS: "+urls);
return urls;
}

// Busco los enlaces de cada revista que devuelva la consulta a Latindex
async function buscarEnlacesARevistas(paths) {
  try {
    //const paths = await obtenerPaths();
    const browser = await puppeteer.launch({ headless: "new" });
    const page = await browser.newPage();
    page.setDefaultNavigationTimeout(5000); // Establece un tiempo de espera predeterminado

    const enlaces = [];

    for (const path of paths) {
      console.log("PATH:", path);
      try {
        await page.goto(path);
        await page.waitForSelector("a.registro.cboxElement", { timeout: 5000 }); // Espera a que aparezca el siguiente enlace

        const href = await page.evaluate(() => {
          const aElement = document.querySelector("a.registro.cboxElement");
          return aElement ? aElement.getAttribute("href") : null;
        });

        console.log("Href del siguiente enlace:", href);
        enlaces.push(href);
      } catch (error) {
        console.error("Error en page.goto para el path:", path, error.message);
        // Continúa con el siguiente path si hay un error de tiempo de espera
        continue;
      }
    }

    //console.log('ENLACES Cantidad obtenida:', enlaces.length);
    await browser.close();
    return enlaces;
  } catch (error) {
    console.error("Error obteniendo enlaces:", error);
    throw error;
  }
}
// Extraigo la info de una revista
async function extraerInfoRevista(enlaces) {
  const browser = await puppeteer.launch({ headless: "new" });
  const registros = [];

  for (const enlace of enlaces) {
    const page = await browser.newPage();
    try {
      console.log(`Procesando enlace: ${enlace}`);

      await page.goto(enlace);
      var revista = null;
      var issn = null;
      var issn_e = null;
      var pais = null;
      // Extraer el texto de la etiqueta <span class="titulo">Salud colectiva</span>
      await page.waitForSelector("span.titulo", { timeout: 1000 });
      revista = await page.evaluate(() => {
        const spanElement = document.querySelector("span.titulo");
        return spanElement ? spanElement.innerText : null;
      });

      // Extraer los elementos <li> del <ul id="informacionGeneral">
      await page.waitForSelector("ul#informacionGeneral", { timeout: 1000 });
      const listaItems = await page.evaluate(() => {
        const ulElement = document.getElementById("informacionGeneral");
        const liElements = ulElement ? ulElement.querySelectorAll("li") : [];
        const items = [];

        liElements.forEach((li) => {
          items.push(li.innerText);
        });

        return items;
      });
      // Extraer Psís,  ISSN y ISSN-e
      //console.log("Elementos de la lista:");
      listaItems.forEach((item, index) => {
        //console.log(`${index + 1}. ${item}`);
        if(item.split(":")[0].trim() ==="ISSN")issn = item.split(":")[1].trim();
        if(item.split(":")[0].trim() ==="ISSN-e")issn_e = item.split(":")[1].trim();
        if(item.split(":")[0].trim() ==="País")pais = item.split(":")[1].trim();        
      });      
      //console.log("REGISTROS");
      //console.log("REVISTA: "+revista);
      //console.log("ISSN:", issn);
      //console.log("ISSN-e:", issn_e);
      //console.log("País:", pais);      
      if (revista === "Argentina") registros.push({ revista, issn,issn_e, pais });
    } catch (error) {
      console.error(`Error al procesar enlace: ${enlace}`);
      console.error(error);
      // Continúa con el siguiente path si hay un error de tiempo de espera
      continue;
    } finally {
      await page.close();
    }
  }
  await browser.close();
  return registros;
}

// Extraigo la info de todas las revistas de la consulta
async function extraerInfoDialnet() {
  console.log("Comienza la extracción de datos de Dialnet");
  const urls = await generarUrls();
// const enlaces = await buscarEnlacesARevistas(urls);
// //const enlaces = ['https://dialnet.unirioja.es/servlet/revista?codigo=11091'];
// const registros = await extraerInfoRevista(enlaces);
//
 console.log("CANTIDAD DE URLs: " + urls.length);
// console.log("REVISTAS CONSULTADAS: " + enlaces.length);
// console.log("REGISTROS OBTENIDOS: " + registros.length);
//
// // Crear archivo JSON
// const jsonFilePath = "./Revistas/Dialnet.json";
// fs.writeFileSync(jsonFilePath, JSON.stringify(registros, null, 3));
// console.log(`Archivo JSON creado: ${jsonFilePath}`);
//
// // Crear archivo CSV
// const csvData = registros
//   .map((registro) => `${registro.revista};${registro.issn};${registro.pais}`)
//   .join("\n");
// const csvFilePath = "./Revistas/Dialnet.csv";
// fs.writeFileSync(csvFilePath, `Título;ISSN;Pais\n${csvData}`);
// console.log(`Archivo CSV creado: ${csvFilePath}`);
//
// console.log("Termina la extracción de datos de Biblat");
}

exports.extraerInfoDialnet = extraerInfoDialnet;
