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


// Creazione tabella + messaggi
function creaTabella(sessioni) {
  const tableBody = document.getElementById('database-table');
  const messageDiv = document.getElementById('message');
  tableBody.innerHTML = '';


  if (sessioni.length === 0) {
    messageDiv.innerText = 'Nessuna sessione trovata';
    messageDiv.style.display = 'block';
  } else {
    let sessionCount = sessioni.length;
    messageDiv.innerText = `${sessionCount} session${sessionCount === 1 ? 'e' : 'i'} visualizzat${sessionCount === 1 ? 'a' : 'e'}`;
    messageDiv.style.display = 'block';
    
    sessioni.forEach(sessione => {
      const row = document.createElement('tr');

      row.innerHTML =
        `<td>${sessione.idsessione}</td>
         <td>${sessione.start}</td>
         <td>${sessione.end}</td>
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
      timelineCell.appendChild(creaButtonTimeline(sessione));
      timelineCell.appendChild(timelineContainer);
    });
  }
}

// Formattazione eventi
function formattaEventi(eventi) {
  return eventi.map((evento, index) => {
    return `<br><span style="color: red;"> ${index} : </span>{type: "${evento.type}",<br>&nbsp;&nbsp;xpath: "${evento.xpath}",<br>&nbsp;&nbsp;url: "${evento.url}",<br>&nbsp;&nbsp;time: "${evento.time}"}<br>`;
  }).join('');
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

// Crea pulsante
function creaButton(sessione, eventsContainer) {
  const button = document.createElement('button');
  button.innerText = 'Visualizza eventi';
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
    button.innerText = 'Nascondi eventi';
  }
}

// Nascondi eventi
function nascondiEventi(eventsContainer, button) {
  eventsContainer.innerHTML = '';
 
  if (button) {
    button.innerText = 'Visualizza eventi';
  }
}

//espandi tabella 
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

//Timeline
function creaButtonTimeline(sessione) {
  const button = document.createElement('button');
  button.innerText = 'Visualizza timeline';
  button.classList.add('btn', 'btn-primary', 'm-2');
  button.addEventListener('click', (event) => creaTimeline(sessione,event));
  return button;
}

function creaTimeline(sessione,event) {
  const wrapper = document.getElementById('timelineWrapper');
  wrapper.innerHTML = '';

  const canvas = document.createElement('canvas');
  canvas.width = 200; 
  canvas.height = 200;
  canvas.id= 'timelineCanvas'; 
  wrapper.appendChild(canvas);

 const closeButton= document.createElement ('button');
 closeButton.innerText= 'Chiudi'; 
 closeButton.addEventListener('click', () => { wrapper.innerHTML=''}); 
 wrapper.appendChild(closeButton); 
  
  const datiTimeline = preparaDatiTimeline(sessione.eventi);
  console.log(datiTimeline);
  if (!datiTimeline || !datiTimeline.datasets) {
    console.error('Dati della timeline non validi.');
    return;
  }

  const ctx = canvas.getContext('2d');
  new Chart(ctx, {
    type: 'scatter',
    data: datiTimeline,
    options: {
      scales: {
        x: {
          type: 'linear',
          position: 'bottom',
          ticks: {
            stepSize: 5000, 
            callback:function (value) {
              return new Date(value).toLocaleString(); 
            }
          }
          },
          y: {
            type: 'category',
            position:'left',
            labels: datiTimeline.labels,//datiTimeline.datasets.map((dataset) => dataset.label),
            ticks : {
              callback: function (value) {
                return value || '';
              }
            }
          }
        },
        elements: {
          point: { radius: 5}, 
        }
      }
  })
}

function preparaDatiTimeline(eventi) {
  const datasets = [];
  const labels = [];

  eventi.forEach((evento) => {
    if (evento.type && !labels.includes(evento.type)) {
      labels.push(evento.type);
    }

    const index = labels.indexOf(evento.type);
    if (index === -1) {
      console.error('Errore durante la preparazione dei dati.');
      return;
    }

    if (!datasets[index]) {
      datasets[index] = {
        label: evento.type,
        data: [],
        borderColor: getRandomColor(),
        fill: false,
      };
    }

    const timestamp = new Date(evento.time).getTime();
    datasets[index].data.push({ x: timestamp, y: index });
  });

  // Filtra eventuali elementi vuoti in datasets
  const filteredDatasets = datasets.filter((dataset) => dataset !== undefined);

  return {
    labels,
    datasets: filteredDatasets,
  };
}



function getRandomColor() {
  const letters = '0123456789ABCDEF';
  let color = '#';
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
}


