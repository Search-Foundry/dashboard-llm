export const state = {
    allData: [],
    modelToCompanyMap: new Map(),
    chartInstances: {},
    highlightedCompanies: new Set(),
    highlightIntervalId: null,
    highlightPulseState: false,
    filtersChangeBound: false,
    
    // DOM Elements
    dom: {
        filtersContainer: null,
        tabs: null,
        tabContents: null,
        ctxMatching: null,
        ctxPotenzialeCosto: null,
        ctxSimilarita: null,
        ctxCandlestick: null,
        scatterLegendContainer: null,
        manualUploadSection: null,
        jsonFileInput: null,
        sortOrderSelect: null
    }
};
