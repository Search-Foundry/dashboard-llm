import { state } from './state.js';
import { companyColorMap, companySymbolMap, ACCURACY_THRESHOLD, POTENZIALE_THRESHOLD, POTENZIALE_THRESHOLD_LABEL } from './config.js';
import { getCompany, getAccuracyPercentage, adjustColor } from './utils.js';

const potenzialeThresholdPlugin = {
    id: 'potenzialeThresholdLine',
    afterDatasetsDraw(chart, args, pluginOptions) {
        const options = pluginOptions || chart.options.plugins?.potenzialeThresholdLine;
        if (!options) return;
        const threshold = typeof options.value === 'number' ? options.value : POTENZIALE_THRESHOLD;
        const xScale = chart.scales?.x;
        if (!xScale || !chart.chartArea) return;
        const xPixel = xScale.getPixelForValue(threshold);
        if (!Number.isFinite(xPixel)) return;
        const { top, bottom, left, right } = chart.chartArea;
        if (xPixel < left || xPixel > right) return;

        const ctx = chart.ctx;
        ctx.save();
        ctx.strokeStyle = options.color || '#27ae60';
        ctx.lineWidth = options.lineWidth || 1.5;
        ctx.setLineDash(options.dash || [6, 4]);
        ctx.beginPath();
        ctx.moveTo(xPixel, top);
        ctx.lineTo(xPixel, bottom);
        ctx.stroke();
        ctx.setLineDash([]);

        const formattedThreshold = typeof threshold === 'number' && threshold.toLocaleString
            ? threshold.toLocaleString('en-US')
            : threshold;
        const label = options.label || `Potential ≥ ${formattedThreshold}`;
        ctx.fillStyle = options.color || '#27ae60';
        ctx.font = options.font || '12px sans-serif';
        ctx.textBaseline = 'top';
        ctx.textAlign = 'center';
        ctx.fillText(label, xPixel, top + 8);
        ctx.restore();
    }
};

// Register plugin
if (typeof Chart !== 'undefined') {
    Chart.register(potenzialeThresholdPlugin);
}

export function destroyCharts() {
    stopHighlightTimer();
    Object.keys(state.chartInstances).forEach(key => {
        if (state.chartInstances[key]) {
            state.chartInstances[key].destroy();
            state.chartInstances[key] = null;
        }
    });
    // Also clean up the custom legend
    state.dom.scatterLegendContainer.innerHTML = '';
}

import { stopHighlightTimer, ensureHighlightTimer, buildCustomLegend } from './ui.js';

export function buildCharts() {
    destroyCharts();
    const selectedModels = getSelectedModels();
    const filteredData = state.allData.filter(item => selectedModels.includes(item.modello));
    if (filteredData.length === 0) {
        console.warn('No model selected or filtered data is empty.');
        return;
    }
    buildMatchingChart(filteredData);
    buildPotenzialeCostoChart(filteredData);
    buildSimilaritaChart(filteredData);
    buildCandlestickChart(filteredData);
}

function getSelectedModels() {
    return Array.from(document.querySelectorAll('input.model-checkbox:checked')).map(cb => cb.value);
}

export function buildMatchingChart(data) {
    const sortedData = [...data].sort((a, b) => b.true - a.true);
    const labels = sortedData.map(item => item.modello);
    const trueData = sortedData.map(item => item.true);
    const falseData = sortedData.map(item => item.false);

    const barsCount = Math.max(labels.length, 1);
    const pixelsPerBar = 28;
    const minHeightPx = 350;
    const targetHeight = Math.max(minHeightPx, barsCount * pixelsPerBar);
    state.dom.ctxMatching.canvas.parentNode.style.height = `${targetHeight}px`;

    state.chartInstances.matching = new Chart(state.dom.ctxMatching, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [
                { label: 'True', data: trueData, backgroundColor: 'rgba(75, 192, 192, 0.7)', borderColor: 'rgba(75, 192, 192, 1)', borderWidth: 1 },
                { label: 'False', data: falseData, backgroundColor: 'rgba(255, 99, 132, 0.7)', borderColor: 'rgba(255, 99, 132, 1)', borderWidth: 1 }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            indexAxis: 'y',
            plugins: {
                title: { display: false },
                tooltip: { mode: 'index', intersect: false }
            },
            scales: {
                x: {
                    stacked: true,
                    beginAtZero: true,
                    title: { display: true, text: 'Number of Queries' }
                },
                y: {
                    stacked: true,
                    grid: { display: false },
                    ticks: { 
                        autoSkip: false, 
                        font: (ctx) => {
                            const model = ctx.tick.label;
                            const company = state.modelToCompanyMap.get(model);
                            const isHighlighted = state.highlightedCompanies.has(company);
                            return { 
                                size: 11,
                                weight: isHighlighted ? 'bold' : 'normal'
                            };
                        },
                        color: (ctx) => {
                            const model = ctx.tick.label;
                            const company = state.modelToCompanyMap.get(model);
                            const isHighlighted = state.highlightedCompanies.has(company);
                            if (!isHighlighted) return '#333';
                            const color = companyColorMap[company] || companyColorMap['Other'];
                            return state.highlightPulseState ? adjustColor(color, 35) : adjustColor(color, -35);
                        }
                    }
                }
            },
            animation: { duration: 300 }
        }
    });
}

export function buildPotenzialeCostoChart(data) {
    const scatterData = [];
    const companiesPresent = new Set();

    data.forEach(item => {
        const company = getCompany(item);
        const color = companyColorMap[company] || companyColorMap['Other'];
        const symbol = companySymbolMap[company] || companySymbolMap['Other'];
        const accuracy = getAccuracyPercentage(item);
        const baseRadius = accuracy !== null && accuracy >= ACCURACY_THRESHOLD ? 9 : 7;
        const baseBorderWidth = accuracy !== null && accuracy >= ACCURACY_THRESHOLD ? 2.5 : 1.5;
        const similarityValue = typeof item.similarita_media === 'number'
            ? item.similarita_media
            : parseFloat(item.similarita_media);
        scatterData.push({
            x: item.potenziale,
            y: item.costo_euro,
            label: item.modello,
            company: company,
            baseColor: color,
            baseBorderColor: adjustColor(color, -20),
            baseSymbol: symbol,
            accuracy: accuracy,
            similarity: Number.isFinite(similarityValue) ? similarityValue : null,
            baseRadius,
            baseBorderWidth
        });
        companiesPresent.add(company);
    });

    buildCustomLegend(companiesPresent);

    state.chartInstances.potenzialeCosto = new Chart(state.dom.ctxPotenzialeCosto, {
        type: 'scatter',
        data: {
            datasets: [{
                label: 'Modelli',
                data: scatterData,
                pointBackgroundColor: scatterData.map(point => point.baseColor),
                pointBorderColor: scatterData.map(point => point.baseBorderColor),
                pointBorderWidth: scatterData.map(point => point.baseBorderWidth),
                pointRadius: scatterData.map(point => point.baseRadius),
                pointHoverRadius: scatterData.map(point => point.baseRadius + 3),
                pointStyle: scatterData.map(point => point.baseSymbol)
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: { display: false },
                legend: { display: false },
                potenzialeThresholdLine: {
                    value: POTENZIALE_THRESHOLD,
                    label: `90% accuracy ≈ ${POTENZIALE_THRESHOLD_LABEL}`,
                    color: '#27ae60'
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const item = context.raw;
                            const accuracyText = typeof item.accuracy === 'number'
                                ? `, Acc: ${item.accuracy.toFixed(1)}%`
                                : '';
                            const similarityText = typeof item.similarity === 'number'
                                ? `, Sim: ${item.similarity.toFixed(1)}%`
                                : '';
                            return `${item.label} [${item.company}]: (Pot: ${item.x}, Cost: ${Number(item.y).toFixed(2)} €${accuracyText}${similarityText})`;
                        }
                    }
                }
            },
            scales: {
                x: { type: 'linear', position: 'bottom', title: { display: true, text: 'Potential' }, grid: { color: 'rgba(0,0,0,0.05)'} },
                y: {
                    beginAtZero: true,
                    title: { display: true, text: 'Cost (€)' },
                    grid: { color: 'rgba(0,0,0,0.05)'} ,
                    ticks: {
                        color: (ctx) => {
                            const chart = ctx.chart;
                            const dataset = chart.data.datasets?.[0];
                            if (!dataset) return '#000';
                            const label = ctx.tick.label;
                            const point = dataset.data.find(p => p.label === label);
                            if (!point) return '#000';
                            if (state.highlightedCompanies.has(point.company)) {
                                return state.highlightPulseState ? adjustColor(point.baseColor, 35) : adjustColor(point.baseColor, -35);
                            }
                            return '#000';
                        }
                    }
                }
            },
            animation: { duration: 300 }
        }
    });
    ensureHighlightTimer();
}

export function buildSimilaritaChart(data) {
    const sortedData = [...data].sort((a, b) => b.similarita_media - a.similarita_media);
    const labels = sortedData.map(item => item.modello);
    const similaritaData = sortedData.map(item => item.similarita_media);

    const barsCount = Math.max(labels.length, 1);
    const pixelsPerBar = 28;
    const minHeightPx = 350;
    const targetHeight = Math.max(minHeightPx, barsCount * pixelsPerBar);
    state.dom.ctxSimilarita.canvas.parentNode.style.height = `${targetHeight}px`;

    state.chartInstances.similarita = new Chart(state.dom.ctxSimilarita, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Average Similarity (%)', data: similaritaData,
                backgroundColor: 'rgba(255, 159, 64, 0.7)', borderColor: 'rgba(255, 159, 64, 1)', borderWidth: 1
            }]
        },
        options: {
            responsive: true, maintainAspectRatio: false, indexAxis: 'y',
            plugins: { title: { display: false }, legend: { display: false } },
            scales: {
                x: { beginAtZero: true, title: { display: true, text: 'Average Similarity (%)' } },
                y: {
                    grid: { display: false },
                    ticks: {
                        autoSkip: false,
                        font: (ctx) => {
                            const model = ctx.tick.label;
                            const company = state.modelToCompanyMap.get(model);
                            const isHighlighted = state.highlightedCompanies.has(company);
                            return { 
                                size: 11,
                                weight: isHighlighted ? 'bold' : 'normal'
                            };
                        },
                        color: (ctx) => {
                            const model = ctx.tick.label;
                            const company = state.modelToCompanyMap.get(model);
                            const isHighlighted = state.highlightedCompanies.has(company);
                            if (!isHighlighted) return '#333';
                            const color = companyColorMap[company] || companyColorMap['Other'];
                            return state.highlightPulseState ? adjustColor(color, 35) : adjustColor(color, -35);
                        }
                    }
                }
            },
            animation: { duration: 300 }
        }
    });
}

export function buildCandlestickChart(data) {
    const sortOrder = state.dom.sortOrderSelect.value;

    const allDeviazioni = state.allData
        .map(d => typeof d.deviazione_std === 'number' ? d.deviazione_std : parseFloat(d.deviazione_std))
        .filter(d => Number.isFinite(d));
    const maxDev = Math.max(...allDeviazioni);

    const sortedData = [...data].sort((a, b) => {
        const potA = typeof a.potenziale === 'number' ? a.potenziale : parseFloat(a.potenziale);
        const potB = typeof b.potenziale === 'number' ? b.potenziale : parseFloat(b.potenziale);
        const devA = typeof a.deviazione_std === 'number' ? a.deviazione_std : parseFloat(a.deviazione_std);
        const devB = typeof b.deviazione_std === 'number' ? b.deviazione_std : parseFloat(b.deviazione_std);

        switch (sortOrder) {
            case 'potenziale_desc':
                return potB - potA;
            case 'deviazione_asc':
                return devA - devB;
            case 'deviazione_desc':
                return devB - devA;
            case 'potenziale_asc':
            default:
                return potA - potB;
        }
    });

    const chartTitle = document.getElementById('candlestickChartTitle');
    const titleMap = {
        'potenziale_asc': 'Normalized Variation (Std Dev) - Sorted by Potential Ascending',
        'potenziale_desc': 'Normalized Variation (Std Dev) - Sorted by Potential Descending',
        'deviazione_asc': 'Normalized Variation (Std Dev) - Sorted by Std Deviation Ascending',
        'deviazione_desc': 'Normalized Variation (Std Dev) - Sorted by Std Deviation Descending'
    };
    chartTitle.textContent = titleMap[sortOrder] || 'Normalized Variation (Std Dev)';

    const labels = sortedData.map(item => item.modello);
    const floatingBarData = [];

    sortedData.forEach(item => {
        const potenziale = typeof item.potenziale === 'number' ? item.potenziale : parseFloat(item.potenziale);
        const deviazioneStd = typeof item.deviazione_std === 'number' ? item.deviazione_std : parseFloat(item.deviazione_std);

        if (!Number.isFinite(potenziale) || !Number.isFinite(deviazioneStd)) {
            return;
        }

        const deviazioneNorm = maxDev > 0 ? (deviazioneStd / maxDev) * 45 : 0;
        const company = getCompany(item);
        const color = companyColorMap[company] || companyColorMap['Other'];

        floatingBarData.push({
            x: [50 - deviazioneNorm, 50 + deviazioneNorm],
            y: item.modello,
            company: company,
            color: color,
            potenzialeOriginal: potenziale,
            deviazioneStdOriginal: deviazioneStd,
            centroGrafico: 50
        });
    });

    if (floatingBarData.length === 0) {
        console.warn('No valid data for floating bar chart.');
        return;
    }

    const barsCount = Math.max(labels.length, 1);
    const pixelsPerBar = 28;
    const minHeightPx = 400;
    const targetHeight = Math.max(minHeightPx, barsCount * pixelsPerBar);
    state.dom.ctxCandlestick.canvas.parentNode.style.height = `${targetHeight}px`;

    state.chartInstances.candlestick = new Chart(state.dom.ctxCandlestick, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Normalized Variation (Std Dev)',
                data: floatingBarData.map(d => d.x),
                backgroundColor: floatingBarData.map(d => d.color),
                borderColor: floatingBarData.map(d => adjustColor(d.color, -30)),
                borderWidth: 1,
                barPercentage: 0.6,
                categoryPercentage: 0.8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            indexAxis: 'y',
            plugins: {
                title: { display: false },
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const index = context.dataIndex;
                            const dataPoint = floatingBarData[index];
                            if (!dataPoint) return '';
                            return [
                                `Company: ${dataPoint.company}`,
                                `Potential (Original): ${dataPoint.potenzialeOriginal.toLocaleString('en-US')}`,
                                `Std Dev (Original): ${dataPoint.deviazioneStdOriginal.toFixed(2)}`
                            ];
                        }
                    }
                }
            },
            scales: {
                x: {
                    min: 0,
                    max: 100,
                    title: { display: true, text: 'Normalized Variation (based on Std Dev)' },
                    grid: { color: 'rgba(0,0,0,0.05)' }
                },
                y: {
                    grid: { display: false },
                    ticks: {
                        autoSkip: false,
                        font: (ctx) => {
                            const model = ctx.tick.label;
                            const company = state.modelToCompanyMap.get(model);
                            const isHighlighted = state.highlightedCompanies.has(company);
                            return { 
                                size: 11,
                                weight: isHighlighted ? 'bold' : 'normal'
                            };
                        },
                        color: (ctx) => {
                            const model = ctx.tick.label;
                            const company = state.modelToCompanyMap.get(model);
                            const isHighlighted = state.highlightedCompanies.has(company);
                            if (!isHighlighted) return '#333';
                            const color = companyColorMap[company] || companyColorMap['Other'];
                            return state.highlightPulseState ? adjustColor(color, 35) : adjustColor(color, -35);
                        }
                    }
                }
            },
            animation: { duration: 300 }
        },
        plugins: [{
            id: 'medianLine',
            afterDatasetsDraw(chart) {
                const ctx = chart.ctx;
                const meta = chart.getDatasetMeta(0);
                const xScale = chart.scales.x;

                meta.data.forEach((bar, index) => {
                    const dataPoint = floatingBarData[index];
                    if (!dataPoint) return;

                    const medianX = xScale.getPixelForValue(dataPoint.centroGrafico);
                    if (!Number.isFinite(medianX)) return;

                    ctx.save();
                    ctx.strokeStyle = 'rgba(0, 0, 0, 0.4)';
                    ctx.lineWidth = 1.5;
                    ctx.beginPath();
                    ctx.moveTo(medianX, bar.y - bar.height / 2);
                    ctx.lineTo(medianX, bar.y + bar.height / 2);
                    ctx.stroke();
                    ctx.restore();
                });
            }
        }]
    });
}

export function updateAllHighlights() {
    const scatterChart = state.chartInstances.potenzialeCosto;
    let hasHighlightedPoint = false;
    if (scatterChart) {
        const dataset = scatterChart.data.datasets?.[0];
        if (dataset && Array.isArray(dataset.data)) {
            dataset.pointRadius = dataset.data.map(point => {
                const isHighlighted = state.highlightedCompanies.has(point.company);
                if (isHighlighted) hasHighlightedPoint = true;
                if (!isHighlighted) return point.baseRadius;
                const pulseOffset = state.highlightPulseState ? 3 : 1;
                return point.baseRadius + pulseOffset;
            });
            dataset.pointBackgroundColor = dataset.data.map(point => {
                if (!state.highlightedCompanies.has(point.company)) return point.baseColor;
                return state.highlightPulseState ? adjustColor(point.baseColor, 35) : adjustColor(point.baseColor, -35);
            });
            dataset.pointBorderColor = dataset.data.map(point => {
                if (!state.highlightedCompanies.has(point.company)) return point.baseBorderColor;
                return state.highlightPulseState ? adjustColor(point.baseBorderColor, 35) : adjustColor(point.baseBorderColor, -35);
            });
            dataset.pointBorderWidth = dataset.data.map(point => {
                if (!state.highlightedCompanies.has(point.company)) return point.baseBorderWidth;
                return state.highlightPulseState ? point.baseBorderWidth + 1 : point.baseBorderWidth + 0.5;
            });
            scatterChart.update('none');
        }
    }

    if (state.chartInstances.matching) state.chartInstances.matching.update('none');
    if (state.chartInstances.similarita) state.chartInstances.similarita.update('none');
    if (state.chartInstances.candlestick) state.chartInstances.candlestick.update('none');

    return hasHighlightedPoint;
}
