export const DateFormatter = {
    toArgentina: (dateString) => {
        if (!dateString) return "---";
        
        // El 'T00:00:00' asegura que se use la fecha exacta sin desfases de zona horaria
        const date = new Date(dateString + 'T00:00:00');
        
        if (isNaN(date.getTime())) return dateString;

        return new Intl.DateTimeFormat('es-AR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        }).format(date);
    }
};

export const agruparPorSemana = (plan) => {
    const semanas = {};
    plan.forEach(item => {
        const fecha = new Date(item.fecha + "T00:00:00");
        // Calcular el lunes de esa semana
        const diaSemana = fecha.getDay(); // 0 es domingo
        const diff = fecha.getDate() - diaSemana + (diaSemana === 0 ? -6 : 1);
        const lunes = new Date(fecha.setDate(diff));
        const semanaKey = lunes.toISOString().split('T')[0];
    
        if (!semanas[semanaKey]) semanas[semanaKey] = [];
        semanas[semanaKey].push(item);
    });
    return semanas;
};