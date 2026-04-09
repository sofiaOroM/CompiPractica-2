export class Escaner {
    static obtenerTokens(input, terminalesConfig) {
        if (!terminalesConfig || !Array.isArray(terminalesConfig)) {
            throw new Error("terminalesConfig no es un arreglo válido en el Escaner.");
        }

        let lexemas = input.trim().split(/\s+/).filter(l => l.length > 0);
        let tokensMapeados = [];

        console.log("--- INICIO DE ESCANEO ---");

        lexemas.forEach(lexema => {
            let encontrado = null;

            for (let t of terminalesConfig) {
                let pattern = this.aplanarRegex(t.expresion);

                try {
                    const regex = new RegExp("^" + pattern + "$");

                    // Log de depuración para ver la regex final construida
                    console.log(` Probando "${lexema}" con ${t.id}: /${pattern}/`);

                    if (regex.test(lexema)) {
                        console.log(`  ✅ MATCH con ${t.id}`);
                        encontrado = t;
                        break;
                    }
                } catch (e) {
                    console.error(`  ❌ Error en regex para ${t.id}: ${e.message}`);
                }
            }

            if (!encontrado) {
                throw new Error(`Error Léxico: '${lexema}' no reconocido.`);
            }

            tokensMapeados.push(encontrado.id);
        });

        console.log("--- ESCANEO FINALIZADO ---");
        tokensMapeados.push('$');
        return tokensMapeados;
    }

    static aplanarRegex(item) {
        if (!item) return "";

        // 1. Manejo de concatenación (Arreglos)
        if (Array.isArray(item)) {
            return item.map(i => this.aplanarRegex(i)).join('');
        }

        // 2. Manejo de literales
        if (typeof item === 'string') {
            let val = item.replace(/^'|'$/g, '');
            if (['+', '*', '?', '.', '(', ')', '{', '}', '^', '$'].includes(val)) {
                return "\\" + val;
            }
            return val;
        }

        // 3. Manejo de Unión (Operador OR | )
        // Si el objeto tiene izq/der o es de tipo union, insertamos el pipe |
        if (item.tipo === 'union' || (item.izq && item.der)) {
            return `(${this.aplanarRegex(item.izq)}|${this.aplanarRegex(item.der)})`;
        }

        // 4. Manejo de tipos base y cuantificadores
        let contenido = this.aplanarRegex(item.valor);

        switch (item.tipo) {
            case 'atomo': return contenido;
            case 'kleene': return `(${contenido})*`;
            case 'positivo': return `(${contenido})+`;
            case 'opcional': return `(${contenido})?`;
            case 'agrupacion': return `(${contenido})`;
            default: return contenido;
        }
    }
    static generarDataTabla(input, terminalesConfig) {
        let simbolos = [];
        let lineas = input.split('\n');

        // Usamos tu lógica actual de split para mantener la consistencia de detección
        lineas.forEach((textoLinea, i) => {
            let nLinea = i + 1;
            let palabras = textoLinea.split(/\s+/);
            let columnaAcumulada = 1;

            palabras.forEach(lexema => {
                if (lexema.length === 0) return;

                // Buscamos la posición real del lexema en la línea original para la columna
                let posColumna = textoLinea.indexOf(lexema, columnaAcumulada - 1);
                let columnaReal = posColumna + 1;
                columnaAcumulada = columnaReal + lexema.length;

                let tokenAsignado = "ERROR_LEXICO";

                // Reutilizamos tu lógica de aplanarRegex para encontrar el ID
                for (let t of terminalesConfig) {
                    let pattern = this.aplanarRegex(t.expresion);
                    const regex = new RegExp("^" + pattern + "$");
                    if (regex.test(lexema)) {
                        tokenAsignado = t.id;
                        break;
                    }
                }

                simbolos.push({
                    tipo: tokenAsignado,
                    lexema: lexema,
                    linea: nLinea,
                    columna: columnaReal
                });
            });
        });
        return simbolos;
    }
}