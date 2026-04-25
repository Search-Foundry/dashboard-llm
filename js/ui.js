function setupTabs() {
    state.dom.tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            state.dom.tabs.forEach(t => t.classList.remove('active'));
            state.dom.tabContents.forEach(tc => tc.classList.remove('active'));
            tab.classList.add('active');
            const targetContent = document.querySelector(tab.dataset.target);
            if (targetContent) {
                targetContent.classList.add('active');
            }
            Object.values(state.chartInstances).forEach(chart => {
                if (chart && typeof chart.resize === 'function') {
                    setTimeout(() => chart.resize(), 0);
                }
            });
        });
    });
}

function buildFilters() {
    state.dom.filtersContainer.innerHTML = '';
    const byCompany = groupBy(state.allData, item => getCompany(item));
    const companyNames = Object.keys(byCompany).sort((a,b) => a.localeCompare(b));

    companyNames.forEach(company => {
        const models = byCompany[company].map(d => d.modello).sort((a,b) => a.localeCompare(b));

        const group = document.createElement('div');
        group.className = 'company-group';

        const header = document.createElement('div');
        header.className = 'company-header';
        
        const headerLeft = document.createElement('div');
        headerLeft.className = 'company-header-left';
        
        const collapseToggle = document.createElement('span');
        collapseToggle.className = 'collapse-toggle';
        collapseToggle.textContent = '▾';
        collapseToggle.setAttribute('aria-label', 'Expand/Collapse');
        
        const headerLabel = document.createElement('label');
        const companyCheckbox = document.createElement('input');
        companyCheckbox.type = 'checkbox';
        companyCheckbox.className = 'company-checkbox';
        companyCheckbox.dataset.company = company;
        companyCheckbox.checked = true;
        headerLabel.appendChild(companyCheckbox);
        const headerText = document.createTextNode(' ' + company);
        headerLabel.appendChild(headerText);
        
        headerLeft.appendChild(collapseToggle);
        headerLeft.appendChild(headerLabel);
        header.appendChild(headerLeft);

        const highlightButton = document.createElement('button');
        highlightButton.type = 'button';
        highlightButton.className = 'highlight-toggle';
        highlightButton.dataset.company = company;
        highlightButton.textContent = 'Highlight';
        highlightButton.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleCompanyHighlight(company, highlightButton);
        });
        updateHighlightButtonState(highlightButton, company);
        header.appendChild(highlightButton);
        
        header.addEventListener('click', (e) => {
            if (e.target === companyCheckbox || e.target === highlightButton || e.target.closest('.highlight-toggle')) {
                return;
            }
            group.classList.toggle('collapsed');
        });
        
        group.appendChild(header);

        const list = document.createElement('div');
        list.className = 'model-list';
        models.forEach(model => {
            const item = document.createElement('label');
            item.className = 'model-item';
            const cb = document.createElement('input');
            cb.type = 'checkbox';
            cb.className = 'model-checkbox';
            cb.value = model;
            cb.dataset.company = company;
            const modelData = state.allData.find(d => d.modello === model);
            const isDisabled = modelData && modelData.disabled === 1;
            cb.checked = !isDisabled;
            item.appendChild(cb);
            item.appendChild(document.createTextNode(model));
            list.appendChild(item);
        });
        group.appendChild(list);

        companyCheckbox.addEventListener('change', (e) => {
            const checked = e.target.checked;
            list.querySelectorAll('input.model-checkbox').forEach(cb => {
                cb.checked = checked;
            });
            state.dom.filtersContainer.dispatchEvent(new Event('change'));
        });

        const updateCompanyCheckboxState = () => {
            const cbs = Array.from(list.querySelectorAll('input.model-checkbox'));
            const numChecked = cbs.filter(cb => cb.checked).length;
            companyCheckbox.indeterminate = numChecked > 0 && numChecked < cbs.length;
            companyCheckbox.checked = numChecked === cbs.length;
        };
        list.addEventListener('change', updateCompanyCheckboxState);
        updateCompanyCheckboxState();

        state.dom.filtersContainer.appendChild(group);
    });
}

function buildCustomLegend(companies) {
    state.dom.scatterLegendContainer.innerHTML = '';
    const sortedCompanies = Array.from(companies).sort();
    sortedCompanies.forEach(company => {
        const color = companyColorMap[company] || companyColorMap['Other'];
        const logo = state.images[company];
        const symbol = companySymbolMap[company] || companySymbolMap['Other'];
        const li = document.createElement('li');
        li.dataset.company = company;
        
        if (logo) {
            // Since it's a canvas, we create a new small one and draw the stored one into it
            // or just use a small style on a copy
            const iconCanvas = document.createElement('canvas');
            iconCanvas.width = 16;
            iconCanvas.height = 16;
            iconCanvas.style.width = '12px'; // Visual size in legend
            iconCanvas.style.height = '12px';
            iconCanvas.style.marginRight = '5px';
            iconCanvas.style.verticalAlign = 'middle';
            const ictx = iconCanvas.getContext('2d');
            ictx.drawImage(logo, 0, 0, 16, 16);
            li.appendChild(iconCanvas);
        } else {
            const symbolCanvas = createSymbolCanvas(symbol, color, 12);
            symbolCanvas.style.marginRight = '5px';
            symbolCanvas.style.verticalAlign = 'middle';
            li.appendChild(symbolCanvas);
        }
        
        const textNode = document.createTextNode(' ' + company);
        li.appendChild(textNode);
        
        li.addEventListener('click', () => {
            const highlightButton = document.querySelector(`.highlight-toggle[data-company="${company}"]`);
            if (highlightButton) {
                toggleCompanyHighlight(company, highlightButton);
                updateLegendItemState(li, company);
            }
        });
        
        updateLegendItemState(li, company);
        state.dom.scatterLegendContainer.appendChild(li);
    });
}

function toggleCompanyHighlight(company, button) {
    if (state.highlightedCompanies.has(company)) {
        state.highlightedCompanies.delete(company);
    } else {
        state.highlightedCompanies.add(company);
    }
    updateHighlightButtonState(button, company);
    refreshLegendItems();
    ensureHighlightTimer();
}

function updateHighlightButtonState(button, company) {
    const isActive = state.highlightedCompanies.has(company);
    button.classList.toggle('active', isActive);
    button.setAttribute('aria-pressed', isActive ? 'true' : 'false');
}

function refreshHighlightButtons() {
    document.querySelectorAll('.highlight-toggle').forEach(button => {
        const company = button.dataset.company;
        updateHighlightButtonState(button, company);
    });
}

function resetHighlights() {
    state.highlightedCompanies.clear();
    stopHighlightTimer();
    refreshHighlightButtons();
    refreshLegendItems();
    updateAllHighlights();
}

function ensureHighlightTimer() {
    const hasHighlightedPoints = updateAllHighlights();
    if (state.highlightedCompanies.size === 0 || !hasHighlightedPoints) {
        stopHighlightTimer();
        return;
    }
    if (!state.highlightIntervalId) {
        state.highlightIntervalId = setInterval(() => {
            state.highlightPulseState = !state.highlightPulseState;
            updateAllHighlights();
        }, 500);
    }
}

function stopHighlightTimer({ resetPulse = true } = {}) {
    if (state.highlightIntervalId) {
        clearInterval(state.highlightIntervalId);
        state.highlightIntervalId = null;
    }
    if (resetPulse) {
        state.highlightPulseState = false;
    }
}

function refreshLegendItems() {
    document.querySelectorAll('#scatterLegend li').forEach(li => {
        const company = li.dataset.company;
        if (company) {
            updateLegendItemState(li, company);
        }
    });
}

function updateLegendItemState(legendItem, company) {
    const isActive = state.highlightedCompanies.has(company);
    legendItem.classList.toggle('active', isActive);
}
