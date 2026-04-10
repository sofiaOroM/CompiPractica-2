import { GeneradorAnalizador } from './logica/GeneradorAnalizador.js';
import { Escaner } from './logica/Escaner.js';
import { RenderizadorArbol } from './RenderizarArbol.js';
import { RenderizadorTabla } from './RenderizadorTabla.js';
import { GestorHistorial } from './logica/GestorHistorial.js';

let analizadorActual = null;
let dataLexica = null;
const motorGrafico = new RenderizadorArbol('#tree-canvas');
const renderizadorTabla = new RenderizadorTabla('tabla-simbolos-body');
const historial = new GestorHistorial('select-historial');

const UI = {
    console: document.getElementById('console'),
    tree: document.getElementById('tree-output'),
    btnEvaluar: document.getElementById('btn-evaluar'),
    wisonEditor: document.getElementById('wison-editor'),
    inputEditor: document.getElementById('input-editor'),
    tablaContainer: document.getElementById('tabla-prediccion-container')
};

function setCargando(estaCargando) {
    if (estaCargando) {
        UI.btnEvaluar.disabled = true;
        UI.btnText.innerHTML = `
            <span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
            Analizando cadena...
        `;
    } else {
        UI.btnEvaluar.disabled = false;
        UI.btnText.innerHTML = "EVALUAR CADENA";
    }
}

function crearAnalizador() {
    console.log("Iniciando generación del analizador...");
    try {
        // 1. Validar que haya texto
        const code = UI.wisonEditor.value;
        if (!code.trim()) throw new Error("El editor de configuración está vacío.");

        // 2. Llamar al parser de Jison (objeto global 'analizador')
        const data = analizador.parse(code);
        dataLexica = data.lex;

        // 3. Procesar gramática y generar Tabla LL(1)
        analizadorActual = GeneradorAnalizador.preparar(data);
        console.log("TABLA RESULTANTE:", analizadorActual.tabla);

        // 4. Mostrar la tabla visualmente
        const T = data.lex.map(t => t.id);
        const N = data.syntax.no_terminales;
        generarTablaHTML(analizadorActual.tabla, [...T, '$'], N);

        UI.console.innerHTML = " Analizador y Tabla generados con éxito.";
        UI.console.className = "alert alert-success error-log";
        UI.btnEvaluar.disabled = false;

        console.log("Analizador generado correctamente.");
    } catch (e) {
        console.error(e);
        UI.console.innerHTML = " Error: " + e.message;
        UI.console.className = "alert alert-danger error-log";
        UI.btnEvaluar.disabled = true;
    }
}

function generarTablaHTML(tabla, terminales, noTerminales) {
    let html = `<table class="table table-bordered table-hover table-sm">
                <thead class="table-dark"><tr><th>NT / T</th>`;

    terminales.forEach(t => { html += `<th>${t}</th>`; });
    html += `</tr></thead><tbody>`;

    noTerminales.forEach(nt => {
        html += `<tr><td class="table-secondary"><strong>${nt}</strong></td>`;
        terminales.forEach(t => {
            const prod = tabla[nt] ? tabla[nt][t] : null;
            html += `<td>${prod ? prod.join(' ') : ''}</td>`;
        });
        html += `</tr>`;
    });

    html += `</tbody></table>`;
    UI.tablaContainer.innerHTML = html;
}

function evaluarCadena() {
    try {
        const texto = UI.inputEditor.value;
        if (!texto.trim()) return;

        const configLexica = analizadorActual.lexConfig;

        // 1. Generamos la data
        const dataDetallada = Escaner.generarDataTabla(texto, configLexica);
        const tokensIds = dataDetallada.map(d => d.tipo);

        // 2. Siempre mostrar la tabla de símbolos
        renderizadorTabla.renderizar(dataDetallada);

        // 3. Si hay un error léxico, nos detenemos antes de ir al Parser
        if (tokensIds.includes("ERROR_LEXICO")) {
            throw new Error("Se encontraron caracteres no reconocidos. Revisa la tabla de símbolos.");
        }

        // 4. Análisis Sintáctico
        const arbol = analizadorActual.analizar([...tokensIds, '$'], dataDetallada);

        // 5. Éxito
        motorGrafico.dibujar(arbol);
        UI.console.innerHTML = " Cadena aceptada correctamente.";
        UI.console.className = "alert alert-success error-log";

    } catch (e) {
        console.error(e);
        UI.console.innerHTML = " Error: " + e.message;
        UI.console.className = "alert alert-danger error-log";
    }
}

function renderizarArbolManual(nodo, prefix = "", isLast = true) {
    let texto = nodo.lexema ? `${nodo.valor} ('${nodo.lexema}')` : nodo.valor;
    let result = prefix + (isLast ? "└── " : "├── ") + texto + "\n";
    if (nodo.hijos) {
        nodo.hijos.forEach((hijo, i) => {
            result += renderizarArbolManual(hijo, prefix + (isLast ? "    " : "│   "), i === nodo.hijos.length - 1);
        });
    }
    return result;
}

// Listeners de botones
document.addEventListener("DOMContentLoaded", () => {
    const btnGenerar = document.getElementById("btn-generar");

    if (btnGenerar) {
        btnGenerar.addEventListener("click", () => {
            console.log("Botón Generar presionado");
            crearAnalizador();
        });
    } else {
        console.error("No se encontró el botón btn-generar en el DOM");
    }

    UI.btnEvaluar.addEventListener("click", evaluarCadena);

    document.getElementById('btn-guardar-local').addEventListener('click', () => {
        const contenido = UI.wisonEditor.value;
        if (!contenido.trim()) return alert("El editor está vacío");
        const nombre = prompt("Nombre para este análisis:", `Analizador_${new Date().toLocaleTimeString()}`);
        if (nombre) {
            historial.guardar(nombre, contenido);
            UI.console.innerHTML = ` Análisis "${nombre}" guardado.`;
        }
    });

    document.getElementById('select-historial').addEventListener('change', (e) => {
        const nombre = e.target.value;
        if (!nombre) return;
        const todos = historial.obtenerTodo();
        UI.wisonEditor.value = todos[nombre];
        crearAnalizador();
    });

    document.getElementById('btn-eliminar-local').addEventListener('click', () => {
        const nombre = document.getElementById('select-historial').value;
        if (!nombre) return alert("Selecciona un análisis para eliminar");
        if (confirm(`¿Estás seguro de eliminar "${nombre}"?`)) {
            historial.eliminar(nombre);
            UI.wisonEditor.value = "";
        }
    });
});