// dashboard/ui/components.js

export const Components = {
    /**
     * Genera las filas de la Planilla S-13 con el estilo corporativo
     */
    createS13Rows(data) {
        return data.map(terr => {
            const historial = terr.historial || [];
            let rowHtml = `
                <tr style="border-bottom: 1.5px solid #000; height: 42px;">
                    <td style="border-right: 1.5px solid #000; font-weight: bold; background: #f9fafb;">
                        ${String(terr.numero || terr.id).padStart(2, '0')}
                    </td>
                    <td style="border-right: 1.5px solid #000; font-size: 10px;">
                        ${terr.ultima_fecha_anterior || '—'}
                    </td>
            `;

            // Forzamos las 5 columnas de historial para mantener la estructura profesional
            for (let i = 0; i < 5; i++) {
                const reg = historial[i];
                const borderStyle = (i === 4) ? '' : 'border-right: 1.5px solid #000;';
                
                if (reg) {
                    rowHtml += `
                        <td style="border-right: 1px solid #000; font-size: 9px; text-align: left; padding: 2px 4px;">
                            <strong style="display:block;">${reg.conductor}</strong>
                            <span style="color:#666">${reg.fecha_asignado}</span>
                        </td>
                        <td style="${borderStyle} font-size: 9px;">${reg.fecha_completado || ''}</td>`;
                } else {
                    rowHtml += `<td style="border-right: 1px solid #000;"></td><td style="${borderStyle}"></td>`;
                }
            }
            rowHtml += `</tr>`;
            return rowHtml;
        }).join('');
    }
};