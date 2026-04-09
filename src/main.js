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

        // --- ESTA ES LA PARTE QUE FALTABA ---
        // 4. Mostrar la tabla visualmente
        const T = data.lex.map(t => t.id);
        const N = data.syntax.no_terminales;
        generarTablaHTML(analizadorActual.tabla, [...T, '$'], N);
        // -------------------------------------

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

        // 1. Extraemos la configuración léxica expandida del analizador
        // Esta es la que contiene las macros ya procesadas.
        const configLexica = analizadorActual.lexConfig;

        // 2. Verificamos que sea un arreglo antes de pasarlo al Escaner
        if (!Array.isArray(configLexica)) {
            console.error("Error: lexConfig no es un arreglo", configLexica);
            throw new Error("La configuración léxica no se procesó correctamente.");
        }

        // 3. Obtenemos los tokens y los lexemas
        const tokens = Escaner.obtenerTokens(texto, configLexica);
        const lexemasReales = texto.trim().split(/\s+/).filter(l => l.length > 0);

        const dataParaTabla = Escaner.generarDataTabla(texto, configLexica);
        renderizadorTabla.renderizar(dataParaTabla);        // 4. Ejecutamos el análisis sintáctico
        const arbol = analizadorActual.analizar(tokens, lexemasReales);

        // 5. Mostramos resultados
        //UI.tree.innerText = renderizarArbolManual(arbol);
        motorGrafico.dibujar(arbol);
        /*UI.tree.innerText = renderizarArbolManual(arbol);*/
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