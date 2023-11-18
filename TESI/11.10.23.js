let idsessione;
 let sessione;
 sessione = {
  idsessione: 0,
  movimenti: [],
  start: new Date (),
  end: new Date ()
 }

function assegnaID(body) {
  idsessione= Math.floor(Math.random () * 10000);
  body['idsessione']=idsessione;
  controlloID(body,collezione,sessione);
 }

 

 function controlloID(body,sessione, collezione) {
  console.log('Entro in controllo');
    for (let sessione in collezione) {
      if (sessione.idsessione === body.idsessione) {
        assegnaID(body,collezione)
      } else {
        salva(sessione,collezione)
      }
    }
  }


function salva(sessione){
  console.log ("entro in salva")
  collezione= collezione + sessione;
  console.log ("Sessione salvata")
  }
 

server.listen(port, () => {
  console.log(`Server in ascolto sulla porta ${port}`);
});




/////////// PROVA DEL 17 OTTOBRE////

window.addEventListener ('click', function(event) {
  //console.log("entro nel listener del click")
  let dominioAncora;
  let dominioCorrente; 
 
if (event.target.tagName ==='A') {
  const hrefAncora= event.target.href;
  dominioAncora= new URL(hrefAncora).hostname;
  dominioCorrente= window.location.hostname; 
}
if (dominioAncora === dominioCorrente) {
  accessoPag2=true
  localStorage.setItem ('movimenti_home',JSON.stringify(movimenti)); 
  localStorage.setItem ('start', JSON.stringify(start));
  console.log('localStorage - movimenti_home:', localStorage.getItem('movimenti_home'));
  movimenti= [];
  console.log (movimenti.lenght)

} else {
  inviaRichiesta();
}
});