/**
 * GestorHistorial.js
 * Maneja el almacenamiento local de las configuraciones Wison.
 */
export class GestorHistorial {
    constructor(idSelect) {
        this.select = document.getElementById(idSelect);
        this.key = "wison_historial_analisis";
        this.cargarSelect();
    }

    guardar(nombre, contenido) {
        if (!nombre) nombre = `Analisis_${new Date().toLocaleString()}`;
        let historial = this.obtenerTodo();
        historial[nombre] = contenido;
        localStorage.setItem(this.key, JSON.stringify(historial));
        this.cargarSelect();
        return nombre;
    }

    obtenerTodo() {
        const data = localStorage.getItem(this.key);
        return data ? JSON.parse(data) : {};
    }

    eliminar(nombre) {
        let historial = this.obtenerTodo();
        delete historial[nombre];
        localStorage.setItem(this.key, JSON.stringify(historial));
        this.cargarSelect();
    }

    cargarSelect() {
        const historial = this.obtenerTodo();
        this.select.innerHTML = '<option value="">-- Seleccionar un análisis guardado --</option>';
        Object.keys(historial).forEach(nombre => {
            const option = document.createElement('option');
            option.value = nombre;
            option.textContent = nombre;
            this.select.appendChild(option);
        });
    }
}