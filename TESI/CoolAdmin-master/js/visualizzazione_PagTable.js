// Chiamata tabella originale

let originalData;
let tabellaEspansa = true;

document.addEventListener('DOMContentLoaded', () => {
  espandiTabella(); 
  fetch('http://localhost:8000/tutte-sessioni')
    .then(response => response.json())
    .then(data => {
      originalData = data;
      creaTabella(data);
    })
    .catch(error => {
      console.error('Errore durante la richiesta al server:', error);
    });
});

// Chiamata tabella filtrata
function applicaFiltri() {
  const idFilter = document.getElementById('idFilter').value;
  const startFilterElement = document.getElementById('startFilter').value;
  const endFilterElement = document.getElementById('endFilter').value;
  const messageDiv = document.getElementById('message');
  let url = '';
  let startFilter = null;
  let endFilter = null;

  if (idFilter && !isNumber(idFilter)) {
    messageDiv.innerText = 'Inserire un valore numerico per ID Sessione';
    messageDiv.style.display = 'block';
    return;
  }

  if (startFilterElement) {
    startFilter = new Date(startFilterElement);
    if (!validDate(startFilter)) {
      messageDiv.innerText = 'Inserire una data di inizio valida dal calendario';
      messageDiv.style.display = 'block';
      return;
    }
  }

  if (endFilterElement) {
    endFilter = new Date(endFilterElement);
    if (!validDate(endFilter)) {
      messageDiv.innerText = 'Inserire una data di fine valida dal calendario';
      messageDiv.style.display = 'block';
      return;
    }
  }

  if (startFilter && endFilter && !validRange(startFilter, endFilter)) {
    messageDiv.innerText = 'La data di inizio deve essere precedente alla data di fine';
    messageDiv.style.display = 'block';
    return;
  }

  if (startFilter && endFilter && idFilter) {
    url = `http://localhost:8000/sessioni-filtrate?idFilter=${idFilter}&startFilter=${startFilter.toISOString()}&endFilter=${endFilter.toISOString()}`;
    chiamataFiltri(url);
  } else if (startFilter && !endFilter && !idFilter) {
    url = `http://localhost:8000/sessioni-filtrate?startFilter=${startFilter.toISOString()}`;
    chiamataFiltri(url);
  } else if (!startFilter && !endFilter && idFilter) {
    url = `http://localhost:8000/sessioni-filtrate?idFilter=${idFilter}`;
    chiamataFiltri(url);
  } else if (!startFilter && endFilter && !idFilter) {
    messageDiv.innerText = 'Inserire data inizio';
    messageDiv.style.display = 'block';
  } else if (startFilter && endFilter && !idFilter) {
    url = `http://localhost:8000/sessioni-filtrate?startFilter=${startFilter.toISOString()}&endFilter=${endFilter.toISOString()}`;
    chiamataFiltri(url);
  } else if (!startFilter && endFilter && idFilter) {
    messageDiv.innerText = 'Inserire data inizio';
    messageDiv.style.display = 'block';
  } else if (startFilter && !endFilter && idFilter) {
    url = `http://localhost:8000/sessioni-filtrate?idFilter=${idFilter}&startFilter=${startFilter.toISOString()}`;
    chiamataFiltri(url);
  } else if (!startFilter && !endFilter && !idFilter) {
    messageDiv.innerText = 'Inserire almeno un filtro';
    messageDiv.style.display = 'block';
  }
}

function chiamataFiltri(url) {
  console.log('URL della richiesta:', url);
  fetch(url, {
    method: 'GET',
    mode: 'cors',
    credentials: 'same-origin',
  })
    .then(response => {
      if (!response.ok) {
        throw new Error(`Errore durante la richiesta:${response.statusText}`);
      }
      return response.json();
    })
    .then(data => {
      if (data) {
        creaTabella(data);
      } else {
        console.error('Dati undefined o null ricevuti');
      }
    })
    .catch(error => {
      console.error('Errore durante la richiesta al server:', error);
    });
}

// formatta data
function formattaStartEnd(dataOra) {
  const data = new Date(dataOra);

const giorno = data.getDate();
const mese = data.getMonth() + 1; 
const anno = data.getFullYear();

const ore = data.getHours();
const minuti = data.getMinutes();
const secondi = data.getSeconds();
const millisecondi = data.getMilliseconds();

const dataFormattata = `<span style="color: red;">DAY: </span>${aggiungiZero(giorno)}-${aggiungiZero(mese)}-${anno}`;
const oraFormattata = `<span style="color: red;">TIME:</span>${aggiungiZero(ore)}:${aggiungiZero(minuti)}:${aggiungiZero(secondi)}.${millisecondi}`;

return `${dataFormattata}<br>${oraFormattata}`;
}

function aggiungiZero(numero) {
return numero < 10 ? `0${numero}` : numero;
}

// Creazione tabella + messaggi
function creaTabella(sessioni) {
  const tableBody = document.getElementById('database-table');
  const messageDiv = document.getElementById('message');
  tableBody.innerHTML = '';


  if (sessioni && Array.isArray(sessioni) && sessioni.length > 0) {
    let sessionCount = sessioni.length;
    messageDiv.innerText = `${sessionCount} session${sessionCount === 1 ? 'e' : 'i'} visualizzat${sessionCount === 1 ? 'a' : 'e'}`;
    
    sessioni.forEach(sessione => {
      const row = document.createElement('tr');

      row.innerHTML =
        `<td>${sessione.idsessione}</td>
         <td>${formattaStartEnd(sessione.start)}</td>
         <td>${formattaStartEnd(sessione.end)}</td>
         <td>${sessione.sessionTime}</td>
         <td>${sessione.itemsEventi}</td>
         <td></td>
         <td></td>`
         

      tableBody.appendChild(row);
      const buttonCell = row.querySelector('td:nth-child(6)');
      const eventsContainer = document.createElement('div');
      buttonCell.appendChild(creaButton(sessione, eventsContainer));
      buttonCell.appendChild(eventsContainer);

      const timelineCell = row.querySelector('td:last-child');
      const timelineContainer = document.createElement('div');
      timelineCell.appendChild(creaButtonGRAFICI(sessione));
      timelineCell.appendChild(timelineContainer);
    });
    }else{
    messageDiv.innerText = 'Nessuna sessione trovata';
    messageDiv.style.display = 'block';

  }
  }

  
  

// Formattazione eventi
function formattaEventi(eventi) {
  if (eventi && Array.isArray(eventi) && eventi.length > 0) {
    return eventi.map((evento, index) => {
      return `<br><span style="color: red;"> ${index} : </span>{type: "${evento.type}",<br>&nbsp;&nbsp;xpath: "${evento.xpath}",<br>&nbsp;&nbsp;url: "${evento.url}",<br>&nbsp;&nbsp;time: "${evento.time}"}<br>`;
    }).join('');
  } else {
    return 'Nessun evento disponibile';
  }
}

// Validazione data
function validDate(filter) {
 const inputDate= new Date(filter)
 return !isNaN(inputDate.getTime()) && inputDate < new Date();
}

// Validazione intervallo di tempo
function validRange(startFilter, endFilter) {
  return startFilter <= endFilter; 
}

// Validazione ID sessione
function isNumber(idFilter) {
  return /^\d+$/.test(idFilter);
}

// Elimina filtri
function eliminaFilter() {
  document.getElementById('idFilter').value = '';
  document.getElementById('startFilter').value = '';
  document.getElementById('endFilter').value = '';
  creaTabella(originalData);
}

// Crea button log 
function creaButton(sessione, eventsContainer) {
  const button = document.createElement('button');
  button.innerText = 'LOG';
  button.classList.add('btn', 'btn-secondary', 'm-2');
  button.addEventListener('click', () => toggleEventi(sessione, eventsContainer, button));
  return button;
}

// Toggle 
function toggleEventi(sessione, eventsContainer, button) {
  const eventsVisible = eventsContainer.innerHTML.trim() !== '';


  if (eventsVisible) {
    nascondiEventi(eventsContainer, button);
  } else {
    visualizzaEventi(sessione.eventi, eventsContainer, button);
  }
}

// Visualizza eventi
function visualizzaEventi(eventi, eventsContainer, button) {
  const formattedEvents = formattaEventi(eventi);
  eventsContainer.innerHTML = `<strong>Eventi:</strong><br>${formattedEvents}<br>`;
 
  if (button) {
    button.innerText = 'Close';
  }
}

// Nascondi eventi
function nascondiEventi(eventsContainer, button) {
  eventsContainer.innerHTML = '';
 
  if (button) {
    button.innerText = 'LOG';
  }
}

//espandi-riduci tabella 
function espandiTabella() {
  const tableRows = document.querySelectorAll('#database-table tr');
  const button = document.getElementById('buttonEspandi');

  if (tabellaEspansa) {
    tableRows.forEach(row => {
      row.style.display = 'table-row';
    });
    button.innerText = 'Riduci tabella';
  } else {
    tableRows.forEach((row, index) => {
      row.style.display = index < 5 ? 'table-row' : 'none';
    });
    button.innerText = 'Espandi tabella';
  }

  tabellaEspansa = !tabellaEspansa;
}



//creazione button "analisi sessione"
function creaButtonGRAFICI(sessione) {
  const button = document.createElement('button');
  button.innerText = 'Analisi sessione';
  button.classList.add('btn', 'btn-primary', 'm-2');
  button.addEventListener('click', (event) => {
    const existingDiv = document.getElementById('graphContainer_' + sessione.idsessione);

    if (existingDiv) {
      existingDiv.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } else {
      creaDiv(sessione, event);
    }
    
  });
  return button;
}


//crea DIV (riepilogo + smell)
function creaDiv (sessione,event) {
  const existingDiv = document.getElementById('graphContainer_' + sessione.idsessione);

  if (existingDiv) {
    
    existingDiv.scrollIntoView({ behavior: 'smooth', block: 'start' });
    return existingDiv;
  }

  const newDiv = document.createElement('div');
  newDiv.id = 'graphContainer_' + sessione.idsessione;
  newDiv.style.backgroundColor= "white"
  newDiv.style.marginLeft='5%'
  newDiv.style.width = '90%'; 
  newDiv.style.height = 'auto'; 
  
  //newDiv.style.margin = '5% auto'; 

  
  newDiv.classList.add('graph-container');
  Chiudi(newDiv)

/*const divSMELL= document.createElement('div');
divSMELL.style.marginLeft= '50%';
newDiv.appendChild(divSMELL);

const buttonSMELL= document.createElement('button');
buttonSMELL.innerText = 'Usability bad smell detector';
buttonSMELL.classList.add('btn', 'btn-primary', 'm-2');
buttonSMELL.addEventListener('click', (event) => {

divSMELL.innerHTML= ` USABILITY BAD SMELL N.1: "Too Close Element"`

});
divSMELL.appendChild(buttonSMELL);*/

  const riepilogo = document.createElement('div');
  
  riepilogo.innerHTML = `
    <h3>RIEPILOGO SESSIONE</h3>
    <p>Session ID: ${sessione.idsessione}</p>
    <p>Data inizio: ${sessione.start}</p>
    <p>Data fine: ${sessione.end}</p>
    <p>Durata: ${sessione.sessionTime} minuti</p>
    <p>Numero eventi: ${sessione.itemsEventi}</p>
  `;
  riepilogo.style.backgroundColor= 'lightblue';
  riepilogo.style.width='30%'
  riepilogo.style.border='solid'
  
  riepilogo.style.paddingTop='1%'
  riepilogo.style.paddingBottom='1%'
  riepilogo.style.paddingRight='1%'
  riepilogo.style.paddingLeft='1%'

  newDiv.appendChild(riepilogo);

  document.body.appendChild(newDiv); 

  
  creaTimeline(sessione,event, newDiv);
  creaDonut(sessione,event,newDiv);
  creaBarre(sessione,event,newDiv); 
  creaMap(sessione,event,newDiv); 
  
  newDiv.scrollIntoView({ behavior: 'smooth', block: 'start' });
  return newDiv;

}

//RIEPILOGO
function riepilogo(){
  
}

//Chiudi DIV
function Chiudi(newDiv) {
const closeButton = document.createElement('button');
closeButton.innerText = 'Chiudi';
//closeButton.classList.add('btn', 'btn-secondary', 'm-2');
  closeButton.innerText = 'Chiudi';
  closeButton.style.color='black';
  closeButton.style.float="right";
  closeButton.style.top='-20px'

  //closeButton.style.marginLeft='90%'
  //closeButton.style.marginTop='-110%'
  
  closeButton.addEventListener('click', () => {
    newDiv.remove();
  });

  newDiv.appendChild(closeButton);
}

//TIMELINE prepara + crea
function preparaDatiTimeline(eventi) {
  const datasets = [];
  const labelsMap = new Map();
  const colori = {};

  if (eventi && Array.isArray(eventi)) {
  eventi.forEach((evento) => {

    if (evento && evento.type && evento.time) {
      const tipoEvento = evento.type;
      const data = evento.time ? new Date(evento.time) : null;

    if (tipoEvento !== null && data !== null) {
      if (!colori[tipoEvento]) {
        colori[tipoEvento] = getRandomColor();
      }

    const labelKey = `${tipoEvento} (${getItemsCount(eventi, tipoEvento)} items)`;

    if (!labelsMap.has(labelKey)) {
      labelsMap.set(labelKey, tipoEvento);

      datasets.push({
        label: labelKey,
        data: [{ x: data, y: labelKey }],
        backgroundColor: colori[tipoEvento],
        borderColor: colori[tipoEvento],
      });
    } else {
      const existingDataset = datasets.find((dataset) => dataset.label === labelKey);
      existingDataset.data.push({ x: data, y: labelKey });
    }
  }
  }
  });
}

  return {
    labels: Array.from(labelsMap.keys()),
    datasets: datasets
  };
}


/////
function creaTimeline(sessione, event,wrapper) {
  const canvas = document.createElement('canvas');
  canvas.id = 'timelineCanvas';
  wrapper.appendChild(canvas);

  
  const datiTimeline = preparaDatiTimeline(sessione.eventi);

  if (!datiTimeline || !datiTimeline.datasets) {
    console.error('Dati della timeline non validi.');
    return;
  }

  const ctx = canvas.getContext('2d');
  new Chart(ctx, {
    type: 'scatter',
    data: datiTimeline,
    options: {
      responsive: true,
      maintainAspectRatio: true,
      aspectRatio: 2,
    layout: {
        padding: {
          top:0, 
        },
      },
      scales: {
        x: {
          type: 'linear',
          position: 'bottom',
          ticks: {
            stepSize: 5000,
            callback: function (value) {
              const timeString = new Date(value).toLocaleTimeString();
              return timeString;
            },
          },
        },
        y: {
          type: 'category',
          position: 'left',
          labels: datiTimeline.labels,
        },
      },
      elements: {
        point: {
          radius: 3,
        },
      },
      plugins: {
        legend: {
          display: true,
          labels: {
            generateLabels: function (chart) {
              const datasets = chart.data.datasets;
              const legendItems = [];
              const existingLabels = [];

              datasets.forEach((dataset) => {
                const label = dataset.label;

                if (!existingLabels.includes(label)) {
                  const item = {
                    text: label,
                    fillStyle: dataset.backgroundColor,
                    hidden: false,
                    lineCap: 'round',
                    lineDash: [],
                    lineDashOffset: 0,
                    lineJoin: 'round',
                    lineWidth: 1,
                    strokeStyle: dataset.borderColor,
                  };

                  legendItems.push(item);
                  existingLabels.push(label);
                }
              });

              return legendItems;
            },
          },
        },
      },
    },
  });
}



///////////////////////////////COLORE GRAFICI
function getRandomColor() {
  return '#' + Math.floor(Math.random() * 16777215).toString(16);
}
////////////////////////////ITEMS 
function getItemsCount(eventi, tipoEvento) {
  return eventi.filter((evento) => evento.type === tipoEvento).length;
}


//DONUT prepara + crea 
function preparaDatiDonut(eventi) {
  const labels = [];
  const data = [];
  const colori = [];

  
  const urlCount = {};
  eventi.forEach((evento) => {

    if (evento && evento.url) {
    const url = evento.url ?? 'N/A';
    
    if (!urlCount[url]) {
      urlCount[url] = 1;
      colori[url] = getRandomColor();
    } else {
      urlCount[url]++;
    }
  }
  });

  
  Object.keys(urlCount).forEach((url) => {

    if (url) {
      labels.push(url);
      data.push(urlCount[url]);
    }
  });

  return {
    labels: labels,
    datasets: [{
      data: data,
      backgroundColor: Object.values(colori),
    }],
  };
}

//////
function creaDonut(sessione, event, wrapper) {
  const canvas = document.createElement('canvas');
  canvas.style.width = '80%';
  canvas.style.height = 'auto';
  canvas.id = 'donutChart';
  wrapper.appendChild(canvas);

  const datiDonut = preparaDatiDonut(sessione.eventi);

  if (!datiDonut || !datiDonut.labels || datiDonut.labels.length === 0) {
    console.error('Dati del donut non validi o vuoti.');
    return;
  }

  const ctx = canvas.getContext('2d');
  new Chart(ctx, {
    type: 'doughnut',
    data: datiDonut,
    options: {
      responsive: true,
      maintainAspectRatio: true,
      aspectRatio: 2,
    layout: {
        padding: {
          top: 0,
        }, 
      },
      plugins: {
        legend: {
          display: true,
          position: 'top',
          labels: {
            generateLabels: function (chart) {
              if (chart && chart.config && chart.config.data && chart.config.data.datasets) {
                const labels = Chart.defaults.plugins.legend.labels.generateLabels(chart);

                labels.forEach((label,index) => {
                  const dataset = chart.config.data.datasets[0].data;
                  const total = dataset.reduce((acc, value) => acc + value, 0);
                  const percentage = ((dataset[index] / total) * 100).toFixed(2);
                  label.text= `${chart.config.data.labels[index]}: (${percentage}%)`;
                });

                return labels;
              }

              return [];
            },
          },
        },
      },
      
      cutout: '50%',
      tooltips: {
        callbacks: {
          label: function (context) {
            const label = context.label || '';
            const value = context.parsed || 0;
            const dataset = context.dataset.data;
            const total = dataset.reduce((acc, value) => acc + value, 0);
            const percentage = ((value / total) * 100).toFixed(2);
            return `${label}: ${percentage}%`;
          },
        },
      },
    },
  });
}


////BARRE prepara + crea 
function preparaDatiBarre(eventi) {
  const labels = [];
  const data = {};

  eventi.forEach((evento) => {
    if (evento && evento.type) {
      const tipoEvento = evento.type;

      if (!data[tipoEvento]) {
        data[tipoEvento] = 1;
      } else {
        data[tipoEvento]++;
      }
    }
  });

  Object.keys(data).forEach((tipoEvento) => {
    labels.push(tipoEvento);
  });

  const datasets = [{
    data: Object.values(data),
    backgroundColor: labels.map(() => getRandomColor()),
  }];

  return {
    labels: labels,
    datasets: datasets,
  };
}

////
function creaBarre (sessione,event,wrapper) {
  const canvas = document.createElement('canvas');
  canvas.style.width = '80%';
  canvas.style.height = 'auto';
  canvas.id = 'barChart';
  wrapper.appendChild(canvas);

  const datiBarre = preparaDatiBarre(sessione.eventi);

  if (!datiBarre || !datiBarre.labels || datiBarre.labels.length === 0) {
    console.error('Dati del grafico a barre non validi o vuoti.');
    return;
  }

  const ctx = canvas.getContext('2d');
  new Chart(ctx, {
    type: 'bar',
    data: datiBarre,
    options: {
      responsive: true,
      maintainAspectRatio: true,
      aspectRatio: 2,
      layout: {
        padding: {
          top: 0,
        },
      },
      scales: {
        x: {
          type: 'category',
          position: 'bottom',
          labels: datiBarre.labels,
        },
        y: {
          type: 'linear',
          position: 'left',
        },
      },
      plugins: {
        legend: {
          display: false,
        },
      },
    },
  });
}


////MAPPA
function getCoordinates(xpath) {
  var match = xpath.match(/\(([^,]+),\s([^)]+)\)/);

  if (match) {
    var x = match[1].trim();
    var y = match[2].trim();

    if (x !== 'undefined' && y !== 'undefined' && !isNaN(x) && !isNaN(y)) {
      return { x: parseFloat(x), y: parseFloat(y) };
    }
  } 
/// no 00 ma escludi 
  return { x: 0, y: 0 };
}



//
function creaMap(sessione, event, wrapper) {
  const urlData = {};

  sessione.eventi.forEach(evento => {
    if (evento.xpath && evento.xpath.includes('(') && evento.xpath.includes(')')) {
      var coordinates = getCoordinates(evento.xpath);
      console.log(`Coordinate originali: x=${coordinates.x}, y=${coordinates.y}`);

      const key = evento.url;
      if (!urlData[key]) {
        urlData[key] = { data: {}, count: 0 };
      }

      const data = urlData[key].data;

      const coordsKey = `${coordinates.x}_${coordinates.y}`;
      if (data[coordsKey]) {
        data[coordsKey].count++;
        data[coordsKey].events.push(evento.type);
      } else {
        data[coordsKey] = {
          x: coordinates.x,
          y: coordinates.y,
          count: 1,
          events: [evento.type],
        };
      }

      urlData[key].count++;
    }
  });

  Object.keys(urlData).forEach(url => {
    const canvas = document.createElement('canvas');
    canvas.style.width = '80%';
    canvas.style.height = 'auto';
    canvas.id = `maps_${url.replace(/\W/g, '_')}`;
    wrapper.appendChild(canvas);

    const ctx = canvas.getContext('2d');
    const data = urlData[url].data;

    const bubbleData = Object.values(data).map(item => {
      return {
        x: item.x,
        y: item.y,
        r: Math.min(item.count * 5, 30),
        backgroundColor: getRandomColor(),
        events: item.events,
      };
    });

    const image = new Image(); // Creare un oggetto immagine
    image.src = 'sfondobubble.png';

    image.onload = function () {
      new Chart(ctx, {
        type: 'scatter',
        data: {
          datasets: [{
            label: `Eventi - \n ${url} \n(${urlData[url].count} eventi)`,
            data: bubbleData,
            pointBackgroundColor: bubbleData.map(item => item.backgroundColor),
            pointRadius: bubbleData.map(item => item.r),
          }]
        },
        options: {
          scales: {
            x: {
              type: 'linear',
              position: 'bottom',
              min: 0,
            },
            y: {
              type: 'linear',
              position: 'top',
              reverse: true,
            }
          },
          plugins: {
            beforeDraw: chart => {
              ctx.drawImage(image, chart.chartArea.left * 1.3, chart.chartArea.top * 1.3, chart.chartArea.width, chart.chartArea.height);
            },
            tooltip: {
              callbacks: {
                label: (context) => {
                  const eventInfo = data[`${context.parsed.x}_${context.parsed.y}`];
                  const eventCount = eventInfo.count;
                  const eventTypes = eventInfo.events.join(', ');

                  return `Eventi: ${eventCount}\nTipo:${eventTypes.replace(/, /g, '\n')}`;
                }
              }
            },
          }
        }
      });
    };
  });
}
