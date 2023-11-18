// Chiamata tabella originale
let originalData;
document.addEventListener('DOMContentLoaded', () => {
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
function tabellaFiltrata() {
  const idFilter = document.getElementById('idFilter').value;
  const startFilter = document.getElementById('startFilter').value;
  const endFilter = document.getElementById('endFilter').value;
  const messageDiv = document.getElementById('message');

  if (idFilter && !isNumber(idFilter)) {
    messageDiv.innerText = 'Inserire un valore numerico per ID Sessione';
    messageDiv.style.display = 'block';
    return;
  }

  if (startFilter || endFilter) {
    const isoStartFilter = startFilter ? new Date(startFilter).toISOString() : '';
    const isoEndFilter = endFilter ? new Date(endFilter).toISOString() : '';

    // Modifica della chiamata al server per gestire startFilter senza endFilter
    fetch(`http://localhost:8000/sessioni-filtrate?idFilter=${idFilter}&startFilter=${isoStartFilter}${isoEndFilter ? `&endFilter=${isoEndFilter}` : ''}`)
      .then(response => {
        if (!response.ok) {
          throw new Error(`Errore durante la richiesta:${response.statusText}`);
        }
        return response.json();
      })
      .then(data => {
        if (data) {
          console.log(data);
          creaTabella(data);
        } else {
          console.error('Dati undefined o null ricevuti');
        }
      })
      .catch(error => {
        console.error('Errore durante la richiesta al server:', error);
      });
  } else {
    messageDiv.innerText = 'Inserire almeno un filtro di data';
    messageDiv.style.display = 'block';
  }
}

// Creazione tabella + messaggi
function creaTabella(sessioni) {
  const tableBody = document.getElementById('database-table');
  const messageDiv = document.getElementById('message');
  messageDiv.style.display = 'none';
  tableBody.innerHTML = '';


  if (sessioni.length === 0) {
    showMessage('Nessuna sessione trovata');
  } else {
    let sessionCount = sessioni.length;
    showMessage(`${sessionCount} session${sessionCount === 1 ? 'e' : 'i'} visualizzat${sessionCount === 1 ? 'a' : 'e'}`);

    sessioni.forEach(sessione => {
      const row = document.createElement('tr');

      row.innerHTML =
        `<td>${sessione.idsessione}</td>
         <td>${sessione.start}</td>
         <td>${sessione.end}</td>
         <td>${sessione.sessionTime}</td>
         <td>${sessione.itemsEventi}</td>
         <td></td>`;

      tableBody.appendChild(row);
      const buttonCell = row.querySelector('td:last-child');
      const eventsContainer = document.createElement('div');
      buttonCell.appendChild(creaButton(sessione, eventsContainer));
      buttonCell.appendChild(eventsContainer);
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
  const messageDiv = document.getElementById('message');
  const currentDate = new Date();
  currentDate.setHours(0, 0, 0, 0);

  if (endDateString && !startDateString) {
    messageDiv.style.display = 'block';
    messageDiv.innerText = 'Impostare data inizio';
    return false;
  }

  // Converte manualmente la stringa della data in un oggetto Data
  const dateParts = filter.split('/');
  const date = new Date(`${dateParts[2]}-${dateParts[1]}-${dateParts[0]}`);

  if (!isNaN(date.getTime()) && date <= currentDate) {
    return true;
  } else {
    messageDiv.style.display = 'block';
    messageDiv.innerText = 'Inserire una data valida dal calendario e successiva alla data corrente.';
    return false;
  }
}

// Validazione intervallo di tempo
function validRange(startDateString, endDateString) {
  const startDate = new Date(startDateString);
  const endDate = new Date(endDateString);

  if (!validDate(startDateString) || !validDate(endDateString)) {
    showMessage('Inserire date valide dal calendario');
    return;
  }

  if (startDate > endDate) {
    showMessage('La data di inizio deve essere precedente alla data di fine.');
  }
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
  button.addEventListener('click', () => toggleEventi(sessione, eventsContainer, button));
  return button;
}

// Toggle tra visualizzazione e nascondi eventi
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

// Nascondi o visualizza
function nascondiEVisualizza(sessione, eventsContainer, button) {
  nascondiEventi(eventsContainer, button);
  const newButton = creaButton(sessione, eventsContainer);
  if (button.parentNode) {
    button.parentNode.replaceChild(newButton, button);
  }
}

// Mostra messaggio
function showMessage(message) {
  const messageDiv = document.getElementById('message');
  messageDiv.style.display = 'block';
  messageDiv.innerText = message;
}
