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
     * @param {Array} valoresReales - Texto original (ej. ["10", "+"])
     */
    analizar(tokensEntrada, valoresReales) {
        let pila = [
            { simbolo: '$', nodo: new NodoArbol('$') },
            { simbolo: this.simboloInicial, nodo: new NodoArbol(this.simboloInicial) }
        ];

        let raiz = pila[1].nodo;
        let i = 0;

        while (pila.length > 0) {
            let cima = pila[pila.length - 1];
            let tokenActual = tokensEntrada[i];
            let lexemaActual = valoresReales[i]; // Extraemos el texto real del input

            // 1. Coincidencia de Terminales
            if (cima.simbolo === tokenActual) {
                // GUARDAMOS EL LEXEMA REAL EN EL NODO
                cima.nodo.lexema = lexemaActual;

                pila.pop();
                i++;
            }
            // 2. Errores...
            else if (this.terminales.includes(cima.simbolo) || cima.simbolo === '$') {
                throw new Error(`Error Sintáctico: Se esperaba '${cima.simbolo}' pero se encontró '${lexemaActual}'`);
            }
            // 3. Expansión de No Terminales (Reglas)
            else {
                let produccion = this.tabla[cima.simbolo] ? this.tabla[cima.simbolo][tokenActual] : null;

                if (produccion) {
                    pila.pop();
                    // SI LA PRODUCCIÓN ES EPSILON
                    if (produccion[0] === 'epsilon' || produccion[0] === 'EPSILON') {
                        cima.nodo.agregarHijo(new NodoArbol('ε')); // Nodo visual de epsilon
                        // No agregamos nada a la pila porque no consume tokens
                    } else {
                        // Creamos los nodos para la regla aplicada
                        let hijosNodos = produccion.map(s => new NodoArbol(s));

                        // IMPORTANTE: En LL(1) los hijos se agregan en el orden de la producción
                        hijosNodos.forEach(hijo => cima.nodo.agregarHijo(hijo));

                        // Pila: Inverso para procesar de izquierda a derecha
                        for (let j = hijosNodos.length - 1; j >= 0; j--) {
                            pila.push({
                                simbolo: produccion[j],
                                nodo: hijosNodos[j]
                            });
                        }
                    }
                } else {
                    throw new Error(`Error: No existe regla para [${cima.simbolo}, ${tokenActual}]`);
                }
            }
        }
        return raiz;
    }
}