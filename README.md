# dashboard-llm

Dashboard interattiva (HTML + JS) per visualizzare `dati.csv` con Chart.js.

L'analisi deriva dal progetto "Clusterizza e misura" (`https://github.com/Search-Foundry/aicategorizer`).

## Requisiti

- Qualsiasi browser moderno (Chrome/Edge/Firefox/Safari)
- Opzionale: un semplice server statico locale. È utile solo se vuoi l'auto-caricamento di `dati.csv` via `fetch`.

## Quick Start

1) Clona o scarica la repo.

2) Avvio rapido senza server (consigliato se vuoi solo visualizzare un CSV locale):

   - Apri il file `dashboard-gpt5.html` direttamente nel browser (doppio click).
   - Clicca su "Carica CSV" e seleziona `dati.csv` (o un tuo CSV con lo stesso schema).

   Oppure, se preferisci l'auto-caricamento di `dati.csv`:

   - Avvia un server statico nella cartella del progetto.
     - Con Python 3:

       ```bash
       cd dashboard_interattiva
       python3 -m http.server 8000
       ```

     - Oppure usa un'estensione tipo “Live Server” di VS Code.

   - Apri `http://localhost:8000/dashboard-gpt5.html`

3) La pagina mostra tre grafici con filtri per azienda/modello:

   - Matching (True/False) — barre orizzontali impilate
   - Potenziale vs Costo — scatter con legenda per azienda
   - Similarità media — barre orizzontali ordinate

## Aggiornare i dati

- Sostituisci il file `dati.csv` mantenendo l'intestazione di colonne attesa dalla pagina.
- Se l'auto-caricamento fallisce o non usi un server, usa il caricamento manuale: pulsante "Carica CSV".

## Formato dati (minimo indispensabile)

La dashboard si aspetta colonne con questi nomi:

- `azienda` — nome del vendor/azienda del modello
- `modello` — nome del modello
- `true`, `false` — conteggi per il grafico Matching
- `potenziale` — valore numerico per l'asse X dello scatter
- `costo_euro` — valore numerico per l'asse Y dello scatter
- `similarita_media` — percentuale (0–100) per il grafico di similarità

Nota: eventuali colonne extra vengono ignorate. Righe completamente vuote vengono scartate.

## Troubleshooting veloce

- Apri via `file://` e non vedi dati? Usa "Carica CSV" per selezionare il file.
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


