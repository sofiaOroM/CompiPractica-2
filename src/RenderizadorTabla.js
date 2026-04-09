/**
 * RenderizadorTabla.js
 * Se encarga de la visualización de los tokens en la interfaz.
 */
export class RenderizadorTabla {
    constructor(idContenedor) {
        // Guardamos el ID, no el elemento, para buscarlo cada vez que renderizamos
        this.idContenedor = idContenedor;
    }

    renderizar(simbolos) {
        const cuerpoTabla = document.getElementById(this.idContenedor);
        if (!cuerpoTabla) {
            console.error("No se encontró el contenedor: " + this.idContenedor);
            return;
        }

        let html = "";
        if (simbolos.length === 0) {
            html = '<tr><td colspan="5" class="text-center">No hay tokens</td></tr>';
        } else {
            simbolos.forEach((s, index) => {
                const esError = s.tipo === "ERROR_LEXICO";
                html += `
                    <tr class="${esError ? 'table-danger' : ''}">
                        <td>${index + 1}</td>
                        <td><span class="badge ${esError ? 'bg-danger' : 'bg-info text-dark'}">${s.tipo}</span></td>
                        <td><code>${s.lexema}</code></td>
                        <td>${s.linea}</td>
                        <td>${s.columna}</td>
                    </tr>`;
            });
        }
        cuerpoTabla.innerHTML = html;
    }
}