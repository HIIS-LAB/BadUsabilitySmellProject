const express= require('express');
const cors= require ('cors')
const bodyParser = require('body-parser');
const server = express();
const cookieParser= require('cookie-parser'); 
const port = 8000;
const moment = require('moment');
const { Parser } = require('xml2js');
const fs = require('fs');


//const path= require ('path'); 
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
})

server.get ('/nuovaprova.html', (req,res) => {
  const filePath= path.join (__dirname, 'nuovaprova.html');
  res.sendFile(filePath);
})*/



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
        // Se c'è solo la data di inizio, cerca le sessioni di quel giorno specifico
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


//confronto pattern 
server.get ('/confrontaPattern', (req,res) => {
  const eventi= JSON.parse (req.query.eventi);
  const xmlData = fs.readFileSync('patternsDefinition.xml', 'utf-8');


  Parser(xmlData, (err, result) => {
    if (err) {
        console.error('Errore durante l\'analisi del file XML:', err);
        res.status(500).send('Errore durante l\'analisi del file XML.');
        return;
    }

    const patterns = result.patternsContainer.pattern;
    const risultati= [];

    patterns.forEach(pattern => {
      const patternName= pattern.patternName; 
      const eventsInPattern= pattern.event; 


      let patternTrovato= true; 

      eventsInPattern.forEach(xmlEvent => {
        const eventTitle = xmlEvent.eventTitle[0];
        const direction = xmlEvent.direction[0];
        const repnumber = xmlEvent.repnumber[0];
        const interval = xmlEvent.interval[0];

        const eventTrovato= verificaPattern(eventi, {eventTitle, direction, repnumber,interval})

        if(!eventTrovato) {
          patternTrovato= false; 
          return;
        }
    })

    if (patternTrovato) {
      risultati.push(`Pattern "${patternName}" rilevato`);
    } else {
      risultati.push(`Pattern "${patternName}" non rilevato`);
    }
});
res.status(200).json({ risultati });
});
})


function verificaPattern (eventi, xmlPattern) {
  const eventTitleXML = xmlPattern.eventTitle;
  const directionXML = xmlPattern.direction;
  const repnumberXML = xmlPattern.repnumber;
  const intervalloTempoXML = parseDuration(xmlPattern.interval);

  let eventoTrovato = false;
  let count=0; 

  eventi.forEach(evento =>{
    if (directionXML !== '$') {
      const typeDirection = eventTitleXML + directionXML;
      if (evento.type === typeDirection) {
        eventoTrovato= true; 
        return;
      }
    } else {
      if (evento.type !== eventTitleXML) {
        return; 
      }
    }
  
    if (repnumberXML !== '*') {
      const numeroRepEventi = contaRep (eventi,evento,eventTitleXML);
      if (parseInt (repnumberXML, 10) !== numeroRepEventi) {
        return 
      }
    }

    const index= eventi.indexOf(evento);
    if (index > 0) {
      const tempoPrecedente= moment (eventi[index-1].time);
      const tempoCorrente= moment (evento.time);
      const intervalloTempoAttuale= tempoCorrente.diff(tempoPrecedente);

      if (intervalloTempoAttuale !== intervalloTempoXML) {
        return;
      }
    }
    eventoTrovato=true; 
  });
  return eventoTrovato;
}


function contaRep (eventi,eventoCorrente,type) {
  let count = 0; 
  const index= eventi.indexOf(eventoCorrente);

  for (let i = index - 1; i >= 0; i--) {
    if (eventi[i].type === type) {
      count++;
    } else {
      break; 
    }
  }
  for (let i = index + 1; i < eventi.length; i++) {
    if (eventi[i].type === type) {
      count++;
    } else {
      break; 
    }
  }
  return count;
}





server.listen(port, () => {
  console.log(`Server in ascolto sulla porta ${port}`);
});
