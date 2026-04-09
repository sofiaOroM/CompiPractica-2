/**
 * ProcesadorGramatica.js
 * Se encarga de la lógica de conjuntos para gramáticas LL(1).
 */
export class ProcesadorGramatica {
    constructor(terminales, noTerminales, producciones, simboloInicial) {
        // Aseguramos que terminales incluya el fin de cadena y no duplicados
        this.terminales = Array.from(new Set([...terminales, '$']));
        this.noTerminales = noTerminales;
        this.producciones = producciones;
        this.simboloInicial = simboloInicial;
        this.primeros = {};
        this.siguientes = {};

        this.noTerminales.forEach(nt => {
            this.primeros[nt] = new Set();
            this.siguientes[nt] = new Set();
        });
    }

    ejecutar() {
        this.calcularPrimeros();
        this.calcularSiguientes();

        const resP = {}; const resS = {};
        for (let k in this.primeros) resP[k] = Array.from(this.primeros[k]);
        for (let k in this.siguientes) resS[k] = Array.from(this.siguientes[k]);

        return { primeros: resP, siguientes: resS };
    }

    calcularPrimeros() {
        let huboCambio = true;
        let iteracion = 0;

        while (huboCambio) {
            huboCambio = false;
            iteracion++;

            for (let nt in this.producciones) {
                for (let cuerpo of this.producciones[nt]) {
                    let antes = this.primeros[nt].size;

                    if (cuerpo.length === 0 || (cuerpo.length === 1 && (cuerpo[0] === 'epsilon' || cuerpo[0] === 'EPSILON'))) {
                        this.primeros[nt].add('epsilon');
                    } else {
                        let i = 0;
                        let continuarBuscando = true;

                        while (i < cuerpo.length && continuarBuscando) {
                            let simbolo = cuerpo[i];

                            if (this.terminales.includes(simbolo)) {
                                this.primeros[nt].add(simbolo);
                                continuarBuscando = false; 
                            } else if (this.noTerminales.includes(simbolo)) {
                                let primsDelHijo = this.primeros[simbolo];
                                let hijoTieneEpsilon = false;

                                for (let p of primsDelHijo) {
                                    if (p === 'epsilon' || p === 'EPSILON') hijoTieneEpsilon = true;
                                    else this.primeros[nt].add(p);
                                }

                                if (!hijoTieneEpsilon) continuarBuscando = false;
                            } else {
                                console.warn(`Símbolo extraño en gramática: "${simbolo}". Revisa si le falta el % o $`);
                                continuarBuscando = false;
                            }
                            i++;
                        }

                        if (continuarBuscando) {
                            this.primeros[nt].add('epsilon');
                        }
                    }

                    if (this.primeros[nt].size > antes) huboCambio = true;
                }
            }
            // Seguridad: evitar bucles infinitos en gramáticas mal formadas
            if (iteracion > 100) break; 
        }
    }

    // El método obtenerPrimeroDeCadena DEBE usar los sets actuales
    obtenerPrimeroDeCadena(cadena) {
        let res = new Set();
        if (cadena.length === 0 || (cadena.length === 1 && (cadena[0] === 'epsilon' || cadena[0] === 'EPSILON'))) {
            res.add('epsilon');
            return res;
        }
        for (let s of cadena) {
            if (this.terminales.includes(s)) {
                res.add(s);
                return res;
            }
            let primsS = this.primeros[s] || new Set();
            let tieneEps = false;
            primsS.forEach(p => {
                if (p === 'epsilon' || p === 'EPSILON') tieneEps = true;
                else res.add(p);
            });
            if (!tieneEps) return res;
        }
        res.add('epsilon');
        return res;
    }

    calcularSiguientes() {
        this.siguientes[this.simboloInicial].add('$');
        let huboCambio = true;
        while (huboCambio) {
            huboCambio = false;
            for (let nt in this.producciones) {
                for (let cuerpo of this.producciones[nt]) {
                    for (let i = 0; i < cuerpo.length; i++) {
                        let B = cuerpo[i];
                        if (this.noTerminales.includes(B)) {
                            let antes = this.siguientes[B].size;
                            let resto = cuerpo.slice(i + 1);
                            
                            // Caso: A -> α B β
                            let primResto = this.obtenerPrimeroDeCadena(resto);
                            for (let p of primResto) {
                                if (p !== 'epsilon' && p !== 'EPSILON') {
                                    this.siguientes[B].add(p);
                                }
                            }

                            // Caso: A -> α B  ó  A -> α B β (donde β deriva en epsilon)
                            if (primResto.has('epsilon')) {
                                for (let s of this.siguientes[nt]) {
                                    this.siguientes[B].add(s);
                                }
                            }
                            
                            if (this.siguientes[B].size > antes) huboCambio = true;
                        }
                    }
                }
            }
        }
    }
}