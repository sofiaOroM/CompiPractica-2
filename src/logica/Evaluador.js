/**
 * Evaluador.js
 * Motor de análisis sintáctico por pila que genera el Árbol de Derivación.
 */
export class NodoArbol {
    constructor(valor, lexema = null) {
        this.valor = valor;    // El nombre del símbolo (ej. %_E o $_NUMERO)
        this.lexema = lexema;  // El valor real capturado (ej. "10")
        this.hijos = [];
    }

    agregarHijo(nodo) {
        this.hijos.push(nodo);
    }

    toD3JSON() {
        let out = {
            name: this.lexema ? `${this.valor} ('${this.lexema}')` : this.valor
        };
        if (this.hijos.length > 0) {
            out.children = this.hijos.map(h => h.toD3JSON());
        }
        return out;
    }
}

export class Evaluador {
    constructor(tabla, simboloInicial, terminales, lexConfig) {
        this.tabla = tabla;
        this.simboloInicial = simboloInicial;
        this.terminales = terminales;
        this.lexConfig = lexConfig;
    }
    
    /**
     * @param {Array} tokensEntrada - IDs de los tokens (ej. ["$_NUMERO", "$_Mas"])
     * @param {Array} dataDetallada - Objetos completos del Escáner (ej. [{lexema: "10", linea: 3, columna: 5}, ...])
     */
    analizar(tokensEntrada, dataDetallada) {
        let pila = [
            { simbolo: '$', nodo: new NodoArbol('$') },
            { simbolo: this.simboloInicial, nodo: new NodoArbol(this.simboloInicial) }
        ];

        let raiz = pila[1].nodo;
        let i = 0;

        while (pila.length > 0) {
            let cima = pila[pila.length - 1];
            let tokenActual = tokensEntrada[i];

            // Extraemos la información del objeto detallado
            // Agregamos un fallback por si es el token de fin '$'
            let infoActual = dataDetallada[i] || { lexema: '$', linea: 'fin', columna: 'fin' };
            let lexemaActual = infoActual.lexema;

            if (cima.simbolo === tokenActual) {
                cima.nodo.lexema = lexemaActual;
                pila.pop();
                i++;
            }
            else if (this.terminales.includes(cima.simbolo) || cima.simbolo === '$') {
                // ERROR CON LÍNEA Y COLUMNA
                throw new Error(`Error Sintáctico: Se esperaba '${cima.simbolo}' pero se encontró '${lexemaActual}' en la línea ${infoActual.linea}, columna ${infoActual.columna}`);
            }
            else {
                let produccion = this.tabla[cima.simbolo] ? this.tabla[cima.simbolo][tokenActual] : null;

                if (produccion) {
                    pila.pop();
                    if (produccion[0] === 'epsilon' || produccion[0] === 'EPSILON') {
                        cima.nodo.agregarHijo(new NodoArbol('ε'));
                    } else {
                        let hijosNodos = produccion.map(s => new NodoArbol(s));
                        hijosNodos.forEach(hijo => cima.nodo.agregarHijo(hijo));
                        for (let j = hijosNodos.length - 1; j >= 0; j--) {
                            pila.push({ simbolo: produccion[j], nodo: hijosNodos[j] });
                        }
                    }
                } else {
                    // ERROR CON LÍNEA Y COLUMNA PARA REGLAS FALTANTES
                    throw new Error(`Error: No existe regla para [${cima.simbolo}, ${tokenActual}] con el valor '${lexemaActual}' (Línea: ${infoActual.linea}, Col: ${infoActual.columna})`);
                }
            }
        }
        return raiz;
    }
}