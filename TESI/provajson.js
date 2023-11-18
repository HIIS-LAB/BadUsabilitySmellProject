
var settings = {
     "events": "blur focus focusin focusout load resize scroll unload beforeunload click dblclick mousedown mouseover mouseout mouseenter mouseleave change select submit keypress keydown keyup error popstate",
    "touchevents": "touchstart touchend touchcancel gesturestart gesturechange gestureend touchmove pinchout pan tap"
};

let eventiCorrenti= []; 

let primoEvento= false; 
let timeout= null; // riguarda l'intervallo finale 
let timeEvent= null; // ogni tot tempo invia eventi
let fineSessione= false; 
let cookiesCancellati= false; 

var start;
var end; 
var cookie=""; 

let idsessione=null; 
let datiRisposta; 
 
async function DatiPost(url, data) {
    try {
       const response= await fetch(url, {
       method: 'POST',
       headers: {   
          'Content-Type': 'application/json',
       },
       body: JSON.stringify(data), 
   })
   if (response.ok) {
    datiRisposta = await response.json();
    if (datiRisposta.sessionID) {
   idsessione = datiRisposta.sessionID; 
   console.log ("IDsessione dal server", idsessione)
   document.cookie= "id_sessione=" + idsessione+ "SameSite=Strict"; 
    }
    if (datiRisposta.message){
        console.log (datiRisposta.message)
    }
   }else {
    const errorData = await response.json();
    console.error("Errore nella richiesta POST:", errorData);
   }
   
} catch (error) {
    console.error("Errore durante la richiesta POST", error)
}
}

// sessionID= numero idsessione= variabile 

function getCookieValue (name) {
    return (document.cookie.match(`(^| )${name}=([^;]+)`) || [])[2] || null;
}

async function inviaRichiesta () {
    end= getTimestamp(); 
    idsessione= getCookieValue("id_sessione"); 

  if (eventiCorrenti.length > 0) {
       if (localStorage.getItem ('eventiSalvati') !==null && localStorage.getItem ('start') !== null) {
           
            let eventiSalvati= JSON.parse(localStorage.getItem('eventiSalvati'));
            start= JSON.parse(localStorage.getItem('start'));
            let eventi= eventiSalvati.concat(eventiCorrenti);
            let itemsEventi= eventi.length;  
            
            if (idsessione!= null) {
                DatiPost ('http://127.0.0.1:8000/eventi', {start, end, eventi,idsessione,itemsEventi}) 
            } else {
                    DatiPost ('http://127.0.0.1:8000/eventi', {start, end, eventi,itemsEventi})
                }
        } else {
            let eventi= eventiCorrenti; 
            let itemsEventi= eventi.length; 

            if (idsessione!= null) {
            DatiPost ('http://127.0.0.1:8000/eventi', {start, end, eventi,idsessione,itemsEventi}) 
            } else {
                DatiPost ('http://127.0.0.1:8000/eventi', {start, end, eventi,itemsEventi}) 
            }
        }
        timeEvent=null; 
        //clearInterval(timeEvent); 
        sendEvent () 
        eventiCorrenti=[];
        localStorage.clear();
  
        } else {
          if (fineSessione == false) {
          DatiPost ('http://127.0.0.1:8000/eventi', {end,idsessione})
          fineSessione= true; 
          scadenzaCookie('id_sessione');
          itemsEventi=0;
          }
        }
}


function scadenzaCookie( id_sessione){
    if (!cookiesCancellati) {
document.cookie= id_sessione + '=; expires= Thu, 01 Jan 1970 00:00:00 UTC;'
console.log('Ho cancellato i cookies'); 
cookiesCancellati=true; 
}}

// DUE intervalli di tempo 
function sendEnd () {
    if (!timeout) {
        timeout = setInterval(async function () {
          inviaRichiesta(); 
        }, 120000);     
    }
   
}

function sendEvent () {
    if (!timeEvent) {
        timeEvent = setInterval(function () {
          inviaRichiesta();
        }, 60000); 
    }

}

//timestamp
function getTimestamp() {
    return new Date ().toISOString(); 
  }
 

//eventi
settings.events.split(" ").forEach(function(evento) {
    window.addEventListener(evento, function(event) {
        console.log("Evento rilevato: " + event.type);

        var elemento= event.target;
        var xpath= getXPath(elemento); 
        aggiungiEvento (event.type,xpath); 
        gestisciEventi (event); 
    });
});


//eventi touch 
settings.touchevents.split(" ").forEach(function(evento) {
    window.addEventListener(evento, function(event) {
        console.log("Evento touch rilevato: " + event.type);
        var elemento= event.target;
        var xpath= getXPath(elemento); 

        aggiungiEvento(event.type,xpath); 
        gestisciEventi (event); 
    });
}); 


function gestisciEventi (event) {
    if (!primoEvento) {
        primoEvento = true;
        sendEnd ()
        sendEvent () 
        start= getTimestamp(); 
    }else {
        //clearInterval(timeout); 
        timeout=null; 
        sendEnd()
    }
        if (event.type === "click" && event.target.tagName === "A") {
        const hrefAncora = event.target.href;
        const dominioAncora = new URL(hrefAncora).hostname;
        const dominioCorrente = window.location.hostname;
        if (dominioAncora === dominioCorrente) {
            if (localStorage.getItem ('eventiSalvati') !==null && localStorage.getItem ('start') !== null) {
                eventiSalvati= JSON.parse(localStorage.getItem('eventiSalvati'));
                console.log ("prima", eventiSalvati)
                eventiSalvati= [...eventiSalvati,...eventiCorrenti];
                console.log ("dopo", eventiSalvati)
                localStorage.setItem('eventiSalvati', JSON.stringify(eventiSalvati));
                eventiCorrenti=[];
            }else {
            localStorage.setItem('eventiSalvati', JSON.stringify(eventiCorrenti));
            localStorage.setItem('start', JSON.stringify(start));
            eventiCorrenti = [];
        } }
        else {
            inviaRichiesta();
        } } 

        /*if (event.type === "popstate") {
            if (localStorage.getItem ('eventiSalvati') !==null && localStorage.getItem ('start') !== null) {
                eventiSalvati= JSON.parse(localStorage.getItem('eventiSalvati'));
                eventiSalvati= [...eventiSalvati,...eventiCorrenti];
                localStorage.setItem('eventiSalvati', JSON.stringify(eventiSalvati));
                eventiCorrenti=[];
            }else {
            localStorage.setItem('eventiSalvati', JSON.stringify(eventiCorrenti));
            localStorage.setItem('start', JSON.stringify(start));
            eventiCorrenti = [];
        }
        }*/
        
    }


function getXPath(element) {
    if (!element) {
        return "element is not defined";
    } else if (element.id) {
       return `#${element.id}`
    } else {  
        const parent = element.parentNode;

        if (!parent) {
            return '/html';
        } else {
            const children = parent.children;
            const index = children ? [...children].indexOf(element) : -1;
            const nodeName= element.nodeName.toLowerCase();
            if (index>=0 && index < children.length) {
            return `${getXPath(parent)}/${nodeName}[${index + 1}]`;
        } else {
            return `${getXPath(parent)}/${nodeName}`
        }
    }}}
        
          
function aggiungiEvento (event,xpath) {
    eventiCorrenti.push({
        type:event,
        xpath:xpath,
        url: window.location.href,
        time: getTimestamp()
});
}

