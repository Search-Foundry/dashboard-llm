function getCompany(item) {
    return (item.azienda && String(item.azienda).trim()) || 'Other';
}

function getAccuracyPercentage(item) {
    if (typeof item.percent_true === 'number') {
        return item.percent_true;
    }
    const parsed = parseFloat(item.percent_true);
    if (!Number.isNaN(parsed)) {
        return parsed;
    }
    if (typeof item.true === 'number' && typeof item.total_query === 'number' && item.total_query) {
        return (item.true / item.total_query) * 100;
    }
    return null;
}

function groupBy(array, keyGetter) {
    const map = {};
    array.forEach((item) => {
        const key = keyGetter(item) || 'Other';
        if (!map[key]) map[key] = [];
        map[key].push(item);
    });
    return map;
}

function adjustColor(color, amount) {
    return '#' + color.replace(/^#/, '').replace(/../g, c => ('0'+Math.min(255, Math.max(0, parseInt(c, 16) + amount)).toString(16)).substr(-2));
}

function createSymbolCanvas(symbol, color, size = 12) {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = color;
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    
    const centerX = size / 2;
    const centerY = size / 2;
    const radius = size / 2 - 2;
    
    switch(symbol) {
        case 'circle':
            ctx.beginPath();
            ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
            ctx.fill();
            break;
        case 'cross':
            ctx.beginPath();
            ctx.moveTo(centerX, 2);
            ctx.lineTo(centerX, size - 2);
            ctx.moveTo(2, centerY);
            ctx.lineTo(size - 2, centerY);
            ctx.stroke();
            break;
        case 'crossRot':
            ctx.save();
            ctx.translate(centerX, centerY);
            ctx.rotate(Math.PI / 4);
            ctx.beginPath();
            ctx.moveTo(0, -radius);
            ctx.lineTo(0, radius);
            ctx.moveTo(-radius, 0);
            ctx.lineTo(radius, 0);
            ctx.stroke();
            ctx.restore();
            break;
        case 'triangle':
            ctx.beginPath();
            ctx.moveTo(centerX, 2);
            ctx.lineTo(2, size - 2);
            ctx.lineTo(size - 2, size - 2);
            ctx.closePath();
            ctx.fill();
            break;
        case 'star':
            const spikes = 5;
            const outerRadius = radius;
            const innerRadius = radius * 0.5;
            ctx.beginPath();
            for (let i = 0; i < spikes * 2; i++) {
                const radius = i % 2 === 0 ? outerRadius : innerRadius;
                const angle = (i * Math.PI) / spikes - Math.PI / 2;
                const x = centerX + radius * Math.cos(angle);
                const y = centerY + radius * Math.sin(angle);
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.closePath();
            ctx.fill();
            break;
        case 'rect':
            ctx.fillRect(2, 2, size - 4, size - 4);
            break;
        case 'rectRounded':
            const cornerRadius = 2;
            ctx.beginPath();
            ctx.moveTo(2 + cornerRadius, 2);
            ctx.lineTo(size - 2 - cornerRadius, 2);
            ctx.quadraticCurveTo(size - 2, 2, size - 2, 2 + cornerRadius);
            ctx.lineTo(size - 2, size - 2 - cornerRadius);
            ctx.quadraticCurveTo(size - 2, size - 2, size - 2 - cornerRadius, size - 2);
            ctx.lineTo(2 + cornerRadius, size - 2);
            ctx.quadraticCurveTo(2, size - 2, 2, size - 2 - cornerRadius);
            ctx.lineTo(2, 2 + cornerRadius);
            ctx.quadraticCurveTo(2, 2, 2 + cornerRadius, 2);
            ctx.closePath();
            ctx.fill();
            break;
        default:
            ctx.beginPath();
            ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
            ctx.fill();
    }
    
    return canvas;
}
