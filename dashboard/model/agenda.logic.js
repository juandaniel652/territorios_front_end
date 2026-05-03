// dashboard/service/agenda.logic.js

export const AgendaLogic = {
    /**
     * Calcula los días de la quincena asegurando que llegue hasta el Sábado
     */
    generarDiasQuincena(fechaInicio) {
        const dias = [];
        const base = new Date(fechaInicio + 'T00:00:00');

        // Recorremos 14 días (quincena completa)
        for (let i = 0; i < 14; i++) {
            const fecha = new Date(base);
            fecha.setDate(base.getDate() + i);
            
            const numeroDia = fecha.getDay(); 
            // 0=Dom, 1=Lun... 6=Sab. 
            // Si queremos Lunes a Sábado, solo ignoramos los Domingos (0)
            if (numeroDia !== 0) {
                dias.push(fecha);
            }
        }
        return dias; // Este array ahora sí tiene los viernes y sábados
    }
};