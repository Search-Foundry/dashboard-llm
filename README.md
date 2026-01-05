# dashboard-llm

🌐 **Language:** English | [Italiano](readme.it.md)

---

Interactive dashboard (HTML + JS) to visualize `dati.csv` with Chart.js.

The analysis comes from the "Clusterizza e misura" project (`https://github.com/Search-Foundry/aicategorizer`).

## Requirements

- Any modern browser (Chrome/Edge/Firefox/Safari)
- Optional: a simple local static server. Only useful if you want auto-loading of `dati.csv` via `fetch`.

## Preview

The visualization with data is available at this URL:
https://search-foundry.github.io/dashboard-llm/

## Quick Start

1) Clone or download the repo.

2) Quick start without a server (recommended if you just want to view a local CSV):

   - Open the `index.html` file directly in the browser (double click).
   - Click on "Load CSV" and select `dati.csv` (or your own CSV with the same schema).

   Alternatively, if you prefer auto-loading of `dati.csv`:

   - Start a static server in the project folder.
     - With Python 3:

       ```bash
       cd dashboard_interattiva
       python3 -m http.server 8000
       ```

     - Or use an extension like "Live Server" in VS Code.

   - Open `http://localhost:8000/index.html`

3) The page shows three charts with filters for company/model:

   - Matching (True/False) — stacked horizontal bars
   - Potential vs Cost — scatter with legend by company
   - Average Similarity — sorted horizontal bars

## Updating the data

- Replace the `dati.csv` file while keeping the column headers expected by the page.
- If auto-loading fails or you're not using a server, use manual upload: "Load CSV" button.

## Data format (minimum required)

The dashboard expects columns with these names:

- `modello` — model name
- `azienda` — model vendor/company
- `costo_euro` — cost in euros (used as Y axis in scatter)
- `true` — count of correct/positive responses
- `false` — count of wrong/negative responses
- `total_query` — total number of queries
- `percent_true` — percentage of `true` over `total_query`
- `similarita_media` — average similarity (0–100)
- `deviazione_std` — standard deviation of similarity
- `potenziale` — potential score (used as X axis in scatter)

Note: extra columns are ignored. Completely empty rows are discarded.

## Quick Troubleshooting

- Opening via `file://` and not seeing data? Use "Load CSV" to select the file.
- Want to avoid manually selecting the file at each startup? Use a local server as indicated above.
- Labels not visible? Charts dynamically manage height and no longer skip ticks; make sure the container is not limited by external CSS.

## ✍️ Credits

![Search Foundry](screenshots/SearchFoundryLogo.svg)

- Curated by [Andrea Scarpetta](https://www.andreascarpetta.it), part of the [Search Foundry](https://www.searchfoundry.pro) collective

## License

This project is distributed under the [MIT](LICENSE) license.

---
© 2025 Andrea Scarpetta - Founding member of Search Foundry

Made with ❤️ and 🤖

This project is released for educational and experimental purposes.

If you found it useful, leave a ⭐️ on GitHub!
