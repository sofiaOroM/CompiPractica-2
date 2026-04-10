export class Escaner {
    static obtenerTokens(input, terminalesConfig) {
        let tokensMapeados = [];
        let i = 0;

        while (i < input.length) {
            let char = input[i];

            // 1. Ignorar espacios
            if (/\s/.test(char)) { i++; continue; }

            let mejorLexema = "";
            let mejorTokenId = null;

            // 2. BUSCAR COINCIDENCIA
            for (let j = i + 1; j <= input.length && j <= i + 100; j++) {
                let candidato = input.substring(i, j);
                let halladoEnEstaLongitud = null;

                for (let t of terminalesConfig) {
                    if (this.validarLexema(candidato, t.expresion)) {
                        // Guardamos el token que coincide con esta longitud
                        halladoEnEstaLongitud = { id: t.id, lexema: candidato };
                    }
                }

                // Si hallamos algo, lo registramos como "el mejor hasta ahora" (Maximal Munch)
                if (halladoEnEstaLongitud) {
                    mejorLexema = halladoEnEstaLongitud.lexema;
                    mejorTokenId = halladoEnEstaLongitud.id;
                } else if (mejorTokenId) {
                    // SI YA TENÍAMOS UN TOKEN y en esta nueva longitud ya NO coincide nada,
                    // significa que ya encontramos el punto de corte óptimo.
                    break;
                }
            }

            // 3. RESULTADO
            if (mejorTokenId) {
                tokensMapeados.push(mejorTokenId);
                i += mejorLexema.length; // Avanza justo el tamaño del token (ej. 1 para '(')
            } else {
                // Si después de probar todas las longitudes nada coincidió:
                console.error(`Error léxico en: ${input[i]}`);
                tokensMapeados.push("ERROR_LEXICO");
                i++;
            }
        }
        tokensMapeados.push('$');
        return tokensMapeados;
    }

    /**
     * Motor de validación recursiva
     */
    static validarLexema(cadena, nodo) {
        if (typeof nodo === 'string') {
            let literal = nodo.replace(/^'|'$/g, '');
            return cadena === literal;
        }

        if (Array.isArray(nodo)) {
            return this.validarConcatenacion(cadena, nodo);
        }

        switch (nodo.tipo) {
            case 'atomo': return this.validarLexema(cadena, nodo.valor);
            case 'union':
                return this.validarLexema(cadena, nodo.izq) || this.validarLexema(cadena, nodo.der);
            case 'positivo': return this.validarRepeticion(cadena, nodo.valor, 1, 50);
            case 'kleene': return this.validarRepeticion(cadena, nodo.valor, 0, 50);
            case 'opcional': return this.validarRepeticion(cadena, nodo.valor, 0, 1);
            case 'agrupacion': return this.validarLexema(cadena, nodo.valor);
        }
        return false;
    }

    static validarRepeticion(cadena, subNodo, min, max) {
        if (cadena === "" && min === 0) return true;

        // Manejo de rangos [a-z] rápido
        if (typeof subNodo === 'string' && subNodo.includes('-')) {
            return this.validarRango(cadena, subNodo) && (min <= 1);
        }

        let resto = cadena;
        let cuenta = 0;

        while (resto.length > 0 && cuenta < max) {
            let matchLargo = "";
            for (let i = resto.length; i > 0; i--) {
                let sub = resto.substring(0, i);
                if (this.validarLexema(sub, subNodo)) {
                    matchLargo = sub;
                    break;
                }
            }
            if (matchLargo === "") break;
            resto = resto.substring(matchLargo.length);
            cuenta++;
        }

        return resto.length === 0 && cuenta >= min;
    }

    static validarRango(cadena, rangoStr) {
        let limpio = rangoStr.replace(/[\[\]]/g, '');
        let partes = limpio.split('-');
        let inicio = partes[0].charCodeAt(0);
        let fin = partes[1].charCodeAt(0);

        for (let i = 0; i < cadena.length; i++) {
            let code = cadena.charCodeAt(i);
            if (code < inicio || code > fin) return false;
        }
        return true;
    }

    static validarConcatenacion(cadena, nodos) {
        if (nodos.length === 0) return cadena === "";
        if (nodos.length === 1) return this.validarLexema(cadena, nodos[0]);

        // Intentamos cortes de manera lineal
        for (let i = 0; i <= cadena.length; i++) {
            let prefijo = cadena.substring(0, i);
            if (this.validarLexema(prefijo, nodos[0])) {
                let sufijo = cadena.substring(i);
                if (this.validarConcatenacion(sufijo, nodos.slice(1))) {
                    return true;
                }
            }
        }
        return false;
    }

    // Mantener para la UI
    static generarDataTabla(input, terminalesConfig) {
        let simbolos = [];
        let i = 0;
        let lineaActual = 1;
        let columnaActual = 1;

        while (i < input.length) {
            let char = input[i];

            // Manejo de saltos de línea y espacios
            if (char === '\n') {
                lineaActual++;
                columnaActual = 1;
                i++;
                continue;
            }
            if (/\s/.test(char)) {
                columnaActual++;
                i++;
                continue;
            }

            let mejorLexema = "";
            let mejorTokenId = null;
            let inicioColumna = columnaActual;

            for (let j = i + 1; j <= input.length && j <= i + 100; j++) {
                let candidato = input.substring(i, j);
                let halladoLongitud = null;

                for (let t of terminalesConfig) {
                    if (this.validarLexema(candidato, t.expresion)) {
                        halladoLongitud = { id: t.id, lexema: candidato };
                    }
                }

                if (halladoLongitud) {
                    mejorLexema = halladoLongitud.lexema;
                    mejorTokenId = halladoLongitud.id;
                } else if (mejorTokenId) {
                    break;
                }
            }

            if (mejorTokenId) {
                simbolos.push({
                    tipo: mejorTokenId,
                    lexema: mejorLexema,
                    linea: lineaActual,
                    columna: inicioColumna
                });
                i += mejorLexema.length;
                columnaActual += mejorLexema.length;
            } else {
                simbolos.push({
                    tipo: "ERROR_LEXICO",
                    lexema: input[i],
                    linea: lineaActual,
                    columna: inicioColumna
                });
                i++;
                columnaActual++;
            }
        }
        return simbolos;
    }
}