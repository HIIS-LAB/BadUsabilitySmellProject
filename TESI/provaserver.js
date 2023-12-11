const express= require('express');
const cors= require ('cors')
const bodyParser = require('body-parser');
const server = express();
const cookieParser= require('cookie-parser'); 
const port = 8000;
const moment = require('moment');
const parseString  = require('xml2js').parseString;
const fs = require('fs');


const {MongoClient}= require ('mongodb'); 


server.use(bodyParser.json());
server.use(express.static('public'));
server.use(cookieParser()); 

const corsOptions = {
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
};
server.use(cors(corsOptions))

//server.use(cors());


/*server.get('/', (req, res) => {
  res.sendFile(__dirname + '/nuovaprova.html');
  console.log("nuovo utente collegato")
});

server.get ('/pagina2.html', (req,res) => {
  const filePath= path.join (__dirname, 'pagina2.html');
  res.sendFile(filePath);
}

const path= require ('path'); //

server.get ('/nuovaprova.html', (req,res) => {
  console.log ('utente collegato')
  const filePath= path.join (__dirname, 'nuovaprova.html');
  res.sendFile(filePath);
})
*/

server.get('/provajson.js', (req, res) => {
  res.sendFile(__dirname + '/provajson.js');
}); 

const url='mongodb://127.0.0.1:27017/logs'
let db;
let collezione; 

MongoClient.connect(url)
.then ((client) => {
  db= client;
  collezione= db.db('logs').collection('ottobre2023');
  console.log('connessione al database')
})  
.catch((err) => {
  console.error ('Errore nella connessione al database:', err);
});



server.post('/eventi', async(req, res) => {
  try {
  const body = req.body;
  if (body.start) {
    body.start= new Date(body.start);
  }
  body.end= new Date (body.end);
  console.log('Dati ricevuti:', body);

  if (!body.idsessione){ 
    const idsessione= await assegnaID(body);
    //res.cookie('id_sessione', idsessione, { maxAge: 900000, httpOnly: true }); //IMPOSTAZIONE COOKIES
    res.json({ sessionID: idsessione, message: 'Richiesta elaborata con successo'})
  
  } else {
    
    const existingSession = await collezione.findOne({ idsessione: parseInt(body.idsessione) });
  
      if (!body.eventi) {
        console.log ('entro in if con idsessione+end SENZA eventi')
        await aggiornaEnd (existingSession,body)   
    }else {
      console.log('entro in else con idsessione + eventi + end')
      existingSession.eventi= existingSession.eventi.concat(body.eventi); 
      await aggiornaEventiEnd (existingSession,body)
    }
    res.json ({ message: 'Richiesta elaborata con successo'})
}}
 catch (error) {
  console.error('Errore durante elaborazione della richiesta:', error);
  res.status(500).json({ error: 'Internal Server Error' });
}
});



async function assegnaID(body) {
  const idsessione = Math.floor(Math.random() * 10000);
  body['idsessione'] = idsessione;
  await controlloID(body);
  return idsessione; 
}

async function controlloID(body) {
  console.log('Entro in controllo');
 const sessioneControllo = await collezione.findOne({ idsessione: body.idsessione });
  if (sessioneControllo) {
    console.log('Entro in existing del controllo');
    await assegnaID(body);
  } else {
  await salva(body,body.start,body.end);
  }
}

async function salva(sessione,start,end) {
  console.log('Entro in salva');
  sessione.start= start; 
  sessione.end= end; 

  let durataSessione= end - start; 
  const durataFormattata= formattaDurata(durataSessione); 
  sessione['sessionTime']= durataFormattata; 

    await collezione.insertOne(sessione);
}


function formattaDurata (durataSessione) {
  let millisecondi = durataSessione % 1000;
  let secondi = Math.floor((durataSessione / 1000) % 60);
  let minuti = Math.floor((durataSessione / (1000 * 60)));

  return minuti*60+secondi+millisecondi/1000;
  
}



async function aggiornaEventiEnd(sessione,body) {
  console.log ('entro in aggiorna eventi e end');
  let nuovoitems= sessione.eventi.length; 
  let durataSessione= body.end - sessione.start; 
  const durataFormattata= formattaDurata(durataSessione);

  const filtro= { idsessione: sessione.idsessione};
  const update = {$set: {eventi: sessione.eventi, end:body.end, itemsEventi: nuovoitems, sessionTime: durataFormattata}}

  await collezione.updateOne (filtro,update); 
}



async function aggiornaEnd(sessione,body) {
  console.log ('entro in aggiorna solo end ');
  let durataSessione= body.end - sessione.start; 
  const durataFormattata= formattaDurata(durataSessione);

  const filtro= { idsessione:sessione.idsessione};
  const update= { $set: {end:body.end, sessionTime: durataFormattata}};
await collezione.updateOne (filtro,update); 
}


// NUMERO SESSIONI TOTALI PER VISUALIZZAZIONE 
server.get ("/get-session", async(req,res) => {
  let result=await collezione.countDocuments ();
  res.json({sessionCount:result});
})

//NUMERO EVENTI TOTALI PER VISUALIZZAZIONE
server.get ("/get-itemsEventi", async (req,res) => {
  const cursor = await collezione.find({});
  let totalItemsEventi = 0;

  await cursor.forEach(doc => {
    if (doc.itemsEventi) {
      totalItemsEventi += doc.itemsEventi;
    }
  });
  res.json({ totalItemsEventi });
})

//NUMERO EVENTI MEDIA PER VISUALIZZAZIONE 
server.get ("/get-MEDIA-itemsEventi", async (req,res) => {
  let result=await collezione.countDocuments ();
  const cursor = await collezione.find({});
  let totalItemsEventi = 0;

  await cursor.forEach(doc => {
    if (doc.itemsEventi) {
      totalItemsEventi += doc.itemsEventi;
    }
  });

  let mediaItems= totalItemsEventi / result; 
  res.json({ mediaItems });
})




//TOTALE TEMPO UTILIZZO PER VISUALIZZAZIONE
server.get ("/get-Time",async (req,res) => {
  const cursor = await collezione.find({});
  let totalTIME = 0;

  await cursor.forEach(doc => {
    if (doc.sessionTime) {
      totalTIME += doc.sessionTime;
    }
  });

  res.json({ totalTIME });
})


//MEDIA TEMPO UTILIZZO PER VISUALIZZAZIONE
server.get ("/get-media-Time",async (req,res) => {
  let result=await collezione.countDocuments ();
  const cursor = await collezione.find({});
  let totalTIME = 0;

  await cursor.forEach(doc => {
    if (doc.sessionTime) {
      totalTIME += doc.sessionTime;
    }
  });
  let mediaTime= totalTIME/result; 
  res.json({ mediaTime });
})


//DATI GRAFICO A TORTA GENERICO
server.get ("/get-DatiTorta",async (req,res) => {
  const pageCounts={}
  const cursor = await collezione.find({});

  await cursor.forEach(sessione => {
    if (sessione.eventi && Array.isArray(sessione.eventi)) {
      const eventi = sessione.eventi;

      eventi.forEach(evento => {
        if (evento && evento.url) {
        const url = evento.url;
        if (pageCounts[url]) {
          pageCounts[url]++;
        } else {
          pageCounts[url] = 1;
        }}
        });
        }});

  const totalCount = Object.values(pageCounts).reduce((acc, count) => acc + count, 0);

  const pagePercentages = {};
  for (const url in pageCounts) {
    const count = pageCounts[url];
    const percentage = (count / totalCount) * 100;
    pagePercentages[url] = percentage;
  }

  res.json(pagePercentages);
});


//numero sessioni in base ai giorni 
server.get("/get-barchart", async (req,res) => {
  const result= await collezione.aggregate ([
               {$match: { start:{ $type:'date'}}},
               {$project: { dataSessione: {$dateToString: { format: "%Y-%m-%d", date: "$start" }}}}, 
               {$group: { _id: "$dataSessione", count: {$sum:1}}}, 
               {$sort: { _id: 1}}
                ]). toArray(); 

  const datiBarChart= result.map (entry => ({
    giorno:entry._id,
    numeroSessioni: entry.count, 
  }));
  res.json (datiBarChart); 

})


//Ultime 10 sessioni tabella 
/*server.get("/10-sessioni", async (req, res) => {
  const ultimeSessioni = await collezione.find({}).sort({ start: -1 }).limit(10).toArray();
  res.json(ultimeSessioni);
});*/

//tutte le sessioni visualizzazione
server.get("/tutte-sessioni", async (req, res) => {
  const tutteSessioni = await collezione.find({}).sort({start:-1}).toArray();
  res.json(tutteSessioni);
});

//sessioni filtrate 
server.get("/sessioni-filtrate", async (req, res) => {
  try {
    let filtro = {};

    if (req.query.idFilter) {
      filtro.idsessione = parseInt(req.query.idFilter);
    }

    if (req.query.startFilter) {
      const startFilter = moment(req.query.startFilter, 'YYYY-MM-DD').startOf('day').toDate();

      if (req.query.endFilter) {
        const endFilter = moment(req.query.endFilter, 'YYYY-MM-DD').endOf('day').toDate();
        filtro.start = {
          $gte: startFilter,
          $lte: endFilter,
        };
      } else {
        // solo data inizio
        const nextDay = moment(req.query.startFilter, 'YYYY-MM-DD').add(1, 'day').startOf('day').toDate();
        filtro.start = {
          $gte: startFilter,
          $lt: nextDay,
        };
      }
    }

    console.log("Parametri della query:", req.query);
    const sessioniFiltrate = await collezione.find(filtro).sort({ start: -1 }).toArray();
    res.json(sessioniFiltrate);
  } catch (error) {
    console.error('Errore durante il recupero delle sessioni filtrate:', error);
    res.status(500).json({ error: 'Errore interno del server' });
  }
});


//BAD SMELL
server.post('/confrontaPattern', express.json(), async (req, res) => {
  try {
    const eventi = req.body.eventi;
    const risultati= await verificaPattern(eventi);
    res.json(risultati);
    console.log ('risultati inviati')
  } catch (error) {
        console.error('Errore:', error);
        res.status(500).send('Errore durante l\'analisi dei pattern.');
      }
    });


// aggiorna array eventi sessione 
async function verificaPattern (eventi) {
  try {
    const xml = fs.readFileSync('patternsDefinition.xml', 'utf-8');
    const patternObject = await creaXmlObject(xml);
    
    const eventiAggiornati = eventi.map(event => ({
      ...event,
      interval: creaInterval(eventi, event),
      repnumber: getRepnumber(eventi, eventi.indexOf(event))
    }));

    eventiAggiornati.forEach(evento => {
      delete evento.xpath;
      delete evento.url;
      delete evento.time;
    });

    //console.log(eventiAggiornati);
    const risultati = confrontaPattern(eventiAggiornati, patternObject);
    return risultati;
  } catch (error) {
    console.error('Errore durante l\'analisi del file XML:', error);
    throw new Error('Errore durante l\'analisi del file XML.');
  }
}

// xml array eventi 
function creaXmlObject(xml) {
  return new Promise((resolve, reject) => {
    parseString(xml, (err, result) => {
      if (err) {
        reject(err);
      } else {
        try {
          const patternsContainer = result.patternsContainer;
          if (!patternsContainer || !patternsContainer.pattern) {
            throw new Error('Invalid structure: patternsContainer or pattern not found');
          }
          const patterns = Array.isArray(patternsContainer.pattern) ? patternsContainer.pattern : [patternsContainer.pattern];
          const patternObject = {};

          patterns.forEach(xmlPattern => {
            if (!xmlPattern.event) {
              throw new Error('Invalid structure: event not found in pattern');
            }

            const events = Array.isArray(xmlPattern.event) ? xmlPattern.event : [xmlPattern.event];

            const patternEvents = events.map(xmlEvent => {
              if (!xmlEvent.eventTitle || !xmlEvent.direction || !xmlEvent.repnumber || !xmlEvent.interval) {
                throw new Error('Invalid structure: missing event properties');
              }
              return {
                type: xmlEvent.eventTitle[0],
                direction: xmlEvent.direction[0],
                repnumber: xmlEvent.repnumber[0],
                interval: xmlEvent.interval[0],
              };
            });
            patternObject[xmlPattern.patternName[0]] = patternEvents;
          });

          resolve(patternObject);
          //console.log (patternObject)
        } catch (error) {
          reject(error);
        }
      }
    });
  });
}



// INTERVAL
function creaInterval(eventi, evento) {
  const index = eventi.indexOf(evento);
  if (index > 0) {
    const timeCurrent = new Date(evento.time).getTime();
    const timePrecedente = new Date(eventi[index - 1].time).getTime();
    const intervalInMilliseconds = timeCurrent - timePrecedente;
    const intervalInSeconds = intervalInMilliseconds / 1000;
    const intervalInISO8601 = `PT${intervalInSeconds}S`;
    return intervalInISO8601;
  }
  return 'PT0S';
}

// REPNUMBER
function getRepnumber(eventi, index) {
  const typeCurrent = eventi[index].type;
  const directionCurrent = eventi[index].direction;
  const repNumberPattern = '*'; 
  const repNumberCurrent = eventi[index].repnumber;
  const isWildcardRepnumber = repNumberPattern === '*' || repNumberPattern === '$';
  if (isWildcardRepnumber || repNumberCurrent === repNumberPattern) {

    // prima
    let repNumber = 1;
    for (let i = index - 1; i >= Math.max(0, index - 4); i--) {
      const typePrecedente = eventi[i].type;
      const directionPrecedente = eventi[i].direction;

      if (typeCurrent === typePrecedente && directionCurrent === directionPrecedente) {
        repNumber++;
      } else {
        break;
      }
    }

    // dopo
    for (let i = index + 1; i <= Math.min(index + 4, eventi.length - 1); i++) {
      const typeSuccessivo = eventi[i].type;
      const directionSuccessivo = eventi[i].direction;
      if (typeCurrent === typeSuccessivo && directionCurrent === directionSuccessivo) {
        repNumber++;
      } else {
        break;
      }
    }
    return repNumber;
  }
  return 0; 
}

//confronto
function confrontaPattern(eventi, patternObject) {
  const risultati = {};

  Object.keys(patternObject).forEach(patternName => {
    const eventsInPattern = patternObject[patternName];
    const patternTrovato = eventsInPattern.every(xmlEvent => {
      return eventi.some(evento => {
        const repnumberMatch =
          xmlEvent.repnumber === '*' || evento.repnumber == parseInt(xmlEvent.repnumber);
        return (
          evento.type === xmlEvent.type &&
          (xmlEvent.direction === '$' || evento.direction === evento.direction) &&
          repnumberMatch &&
          (xmlEvent.interval <= evento.interval)
        );
      });
    });
    risultati[patternName] = patternTrovato;
  });
  return risultati;
}


server.listen(port, () => {
  console.log(`Server in ascolto sulla porta ${port}`);
});
