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
