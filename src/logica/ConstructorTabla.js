/**
 * ConstructorTabla.js
 * Genera la matriz de predicción para el análisis sintáctico descendente.
 */
export class ConstructorTabla {
    constructor(terminales, noTerminales, producciones, primeros, siguientes) {
        this.terminales = terminales;
        this.noTerminales = noTerminales;
        this.producciones = producciones;
        this.primeros = primeros;
        this.siguientes = siguientes;
        this.tabla = {};
        this.conflictosDetectados = false;
    }

    generar() {
        this.conflictosDetectados = false;
        // 1. Inicializamos la tabla para cada No Terminal
        this.noTerminales.forEach(nt => { this.tabla[nt] = {}; });

        for (let nt in this.producciones) {
            for (let cuerpo of this.producciones[nt]) {
                let primerosCuerpo = this.obtenerPrimeroDeCadena(cuerpo);

                // REGLA 1: Para cada terminal 'a' en PRIMEROS(cuerpo), añadir A -> cuerpo a Tabla[A, a]
                for (let a of primerosCuerpo) {
                    if (a !== 'epsilon' && a !== 'EPSILON') {
                        if (this.tabla[nt][a] && JSON.stringify(this.tabla[nt][a]) !== JSON.stringify(cuerpo)) {
                            console.error(`Conflicto LL(1) en [${nt}, ${a}]:`, this.tabla[nt][a], " vs ", cuerpo);
                            this.conflictosDetectados = true;
                        }
                        this.tabla[nt][a] = cuerpo;
                    }
                }

                // REGLA 2: Si epsilon está en PRIMEROS(cuerpo), para cada terminal 'b' en SIGUIENTES(A),
                // añadir A -> cuerpo a Tabla[A, b]
                if (primerosCuerpo.has('epsilon') || primerosCuerpo.has('EPSILON')) {
                    // Aseguramos que sigs sea un array (en caso de que el procesador lo devuelva como Set)
                    let sigs = Array.from(this.siguientes[nt] || []);

                    sigs.forEach(b => {
                        if (this.tabla[nt][b] && JSON.stringify(this.tabla[nt][b]) !== JSON.stringify(cuerpo)) {
                            console.error(`Conflicto LL(1) (vía Epsilon) en [${nt}, ${b}]:`, this.tabla[nt][b], " vs ", cuerpo);
                            this.conflictosDetectados = true;
                        }
                        // Solo añadimos si la celda está vacía o si es la misma producción
                        // Esto evita que el epsilon de la lista "borre" reglas de sentencias
                        if (!this.tabla[nt][b]) {
                            this.tabla[nt][b] = cuerpo;
                        }
                    });
                }
            }
        }
        return this.tabla;
    }
    
    tieneConflictos() {
        return this.conflictosDetectados;
    }

    obtenerPrimeroDeCadena(cadena) {
        let res = new Set();
        if (cadena.length === 0 || cadena[0] === 'epsilon') { res.add('epsilon'); return res; }
        for (let s of cadena) {
            if (this.terminales.includes(s)) { res.add(s); return res; }
            let prims = new Set(this.primeros[s] || []);
            let tieneEps = false;
            prims.forEach(p => {
                if (p === 'epsilon' || p === 'EPSILON') tieneEps = true;
                else res.add(p);
            });
            if (!tieneEps) return res;
        }
        res.add('epsilon');
        return res;
    }
}