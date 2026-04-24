# dashboard-llm

🌐 **Lingua:** [English](README.md) | Italiano

---

Dashboard interattiva (HTML + JS) per visualizzare `dati.json` con Chart.js.

L'analisi deriva dal progetto "Clusterizza e misura" (`https://github.com/Search-Foundry/aicategorizer`).

## Requisiti

- Qualsiasi browser moderno (Chrome/Edge/Firefox/Safari)
- Opzionale: un semplice server statico locale. È utile solo se vuoi l'auto-caricamento di `dati.json` via `fetch`.

## Preview

la visualizzazione con i dati è disponibile a questa url:
https://search-foundry.github.io/dashboard-llm/



## Quick Start

1) Clona o scarica la repo.

2) Avvio rapido senza server (consigliato se vuoi solo visualizzare un JSON locale):

   - Apri il file `index.html` direttamente nel browser (doppio click).
   - Clicca su "Carica JSON" e seleziona `dati.json` (o un tuo JSON con lo stesso schema).

   Oppure, se preferisci l'auto-caricamento di `dati.json`:

   - Avvia un server statico nella cartella del progetto.
     - Con Python 3:

       ```bash
       cd dashboard_interattiva
       python3 -m http.server 8000
       ```

     - Oppure usa un'estensione tipo "Live Server" di VS Code.

   - Apri `http://localhost:8000/index.html`

3) La pagina mostra tre grafici con filtri per azienda/modello:

   - Matching (True/False) — barre orizzontali impilate
   - Potenziale vs Costo — scatter con legenda per azienda
   - Similarità media — barre orizzontali ordinate

## Aggiornare i dati

- Sostituisci il file `dati.json` mantenendo la struttura attesa dalla pagina.
- Se l'auto-caricamento fallisce o non usi un server, usa il caricamento manuale: pulsante "Carica JSON".

## Formato dati (minimo indispensabile)

La dashboard si aspetta oggetti con questi campi:

- `modello` — nome del modello
- `azienda` — vendor/azienda del modello
- `costo_euro` — costo in euro (usato come asse Y nello scatter)
- `true` — conteggio risposte corrette/positive
- `false` — conteggio risposte errate/negative
- `total_query` — numero totale di query
- `percent_true` — percentuale di `true` su `total_query`
- `similarita_media` — similarità media (0–100)
- `deviazione_std` — deviazione standard della similarità
- `potenziale` — punteggio potenziale (usato come asse X nello scatter)

Nota: eventuali colonne extra vengono ignorate. Righe completamente vuote vengono scartate.

## Troubleshooting veloce

- Apri via `file://` e non vedi dati? Usa "Carica JSON" per selezionare il file.
- Vuoi evitare di selezionare manualmente il file ad ogni avvio? Usa un server locale come indicato sopra.
- Etichette che non si vedono? I grafici gestiscono l'altezza dinamicamente e non saltano più i tick; assicurati che il container non sia limitato da CSS esterno.

## ✍️ Crediti

![Search Foundry](screenshots/SearchFoundryLogo.svg)

- A cura di [Andrea Scarpetta](https://www.andreascarpetta.it), parte del collettivo [Search Foundry](https://www.searchfoundry.pro)

## Licenza

Questo progetto è distribuito con licenza [MIT](LICENSE).

---
© 2025 Andrea Scarpetta - Founding member of Search Foundry

Made with ❤️ and 🤖

Questo progetto è rilasciato a scopo didattico e sperimentale.

Se ti è stato utile, lascia una ⭐️ su GitHub!
