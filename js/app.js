document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    state.dom.filtersContainer = document.getElementById('filters');
    state.dom.tabs = document.querySelectorAll('.tab');
    state.dom.tabContents = document.querySelectorAll('.tab-content');
    state.dom.ctxMatching = document.getElementById('chartMatching').getContext('2d');
    state.dom.ctxPotenzialeCosto = document.getElementById('chartPotenzialeCosto').getContext('2d');
    state.dom.ctxSimilarita = document.getElementById('chartSimilarita').getContext('2d');
    state.dom.ctxCandlestick = document.getElementById('chartCandlestick').getContext('2d');
    state.dom.scatterLegendContainer = document.getElementById('scatterLegend');
    state.dom.manualUploadSection = document.getElementById('manualUploadSection');
    state.dom.jsonFileInput = document.getElementById('jsonFileInput');
    state.dom.sortOrderSelect = document.getElementById('sortOrderSelect');

    // --- Initialization ---
    try {
        preloadLogos().then(() => {
            loadData();
        });
        state.dom.jsonFileInput.addEventListener('change', handleManualUpload);
    } catch (error) {
        console.error("Error during initialization:", error);
        alert("Unable to load data or initialize the dashboard.");
    }
});

async function preloadLogos() {
    const promises = Object.entries(companyLogoMap).map(([company, url]) => {
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => {
                // Create a small canvas to force the size to 16x16
                const size = 16;
                const canvas = document.createElement('canvas');
                canvas.width = size;
                canvas.height = size;
                const ctx = canvas.getContext('2d');
                
                // Draw the image resized to 16x16
                ctx.drawImage(img, 0, 0, size, size);
                state.images[company] = canvas;

                // Create an inverted version for the highlight flash
                // We make it slightly larger (20x20) and add a background 
                // to make it visible even with transparency
                const invSize = 20;
                const invCanvas = document.createElement('canvas');
                invCanvas.width = invSize;
                invCanvas.height = invSize;
                const invCtx = invCanvas.getContext('2d');
                
                // Add a white background circle to make the "negative" effect pop
                invCtx.fillStyle = 'white';
                invCtx.beginPath();
                invCtx.arc(invSize/2, invSize/2, invSize/2, 0, Math.PI * 2);
                invCtx.fill();
                
                invCtx.filter = 'invert(1)';
                // Center the 16x16 logo in the 20x20 canvas
                invCtx.drawImage(img, (invSize - size) / 2, (invSize - size) / 2, size, size);
                state.imagesInverted[company] = invCanvas;

                resolve();
            };
            img.onerror = () => {
                console.warn(`Unable to load logo for ${company}: ${url}`);
                resolve();
            };
            img.src = url;
        });
    });
    return Promise.all(promises);
}

async function loadData() {
    try {
        const response = await fetch('dati.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        validateAndSetData(data);
    } catch (error) {
        console.warn("Unable to load dati.json automatically. Enabling manual upload.", error);
        state.dom.manualUploadSection.style.display = 'block';
    }
}

function handleManualUpload() {
    const file = state.dom.jsonFileInput.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const data = JSON.parse(e.target.result);
                validateAndSetData(data);
                state.dom.manualUploadSection.style.display = 'none';
            } catch (err) {
                console.error("Error parsing JSON:", err);
                alert("Error parsing JSON file. Check the format.");
            }
        };
        reader.onerror = function() {
            alert("Error reading file.");
        };
        reader.readAsText(file);
    } else {
        alert("Select a JSON file before loading.");
    }
}

function validateAndSetData(data) {
    if (!Array.isArray(data) || data.length === 0) {
        alert("The JSON file is empty or contains no valid data.");
        state.dom.manualUploadSection.style.display = 'block';
        return;
    }
    state.allData = data.filter(row => Object.values(row).some(x => x !== null && x !== ''));
    
    // Build the model to company mapping
    state.modelToCompanyMap.clear();
    state.allData.forEach(item => {
        if (item.modello) {
            state.modelToCompanyMap.set(item.modello, getCompany(item));
        }
    });

    if (state.allData.length === 0) {
        alert("The JSON file is empty or contains no valid data.");
        state.dom.manualUploadSection.style.display = 'block';
        return;
    }
    initializeDashboard();
}

function initializeDashboard() {
    resetHighlights();
    buildFilters();
    setupTabs();
    buildCharts(); // Build initial charts
    
    if (!state.filtersChangeBound) {
        state.dom.filtersContainer.addEventListener('change', () => {
            buildCharts();
        });
        state.dom.sortOrderSelect.addEventListener('change', () => {
            buildCharts();
        });
        state.filtersChangeBound = true;
    }
}
