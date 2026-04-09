import { ProcesadorGramatica } from './ProcesadorGramatica.js';
import { ConstructorTabla } from './ConstructorTabla.js';
import { Evaluador } from './Evaluador.js';

export class GeneradorAnalizador {
    static preparar(data) {
        // 1. Clonamos la data léxica
        let lexConfig = JSON.parse(JSON.stringify(data.lex));

        // 2. EXPANSIÓN RECURSIVA DE MACROS
        // Esta función navega por el árbol de la expresión y sustituye IDs por su contenido real
        const expandirMacros = (item, todasLasMacros) => {
            if (!item) return item;
            if (Array.isArray(item)) return item.map(i => expandirMacros(i, todasLasMacros));

            if (typeof item === 'object') {
                // Si el valor es un string y coincide con un ID de otra macro
                if (typeof item.valor === 'string') {
                    const macro = todasLasMacros.find(m => m.id === item.valor);
                    if (macro) {
                        item.valor = JSON.parse(JSON.stringify(macro.expresion));
                    }
                } else if (item.valor) {
                    item.valor = expandirMacros(item.valor, todasLasMacros);
                }

                // Expandir ramas de unión (operador |)
                if (item.izq) item.izq = expandirMacros(item.izq, todasLasMacros);
                if (item.der) item.der = expandirMacros(item.der, todasLasMacros);
            }
            return item;
        };

        // Aplicamos la expansión 3 veces para soportar anidamiento profundo
        for (let i = 0; i < 3; i++) {
            lexConfig.forEach(t => {
                t.expresion = expandirMacros(t.expresion, lexConfig);
            });
        }
        // 3. Mapeo de Símbolos y Sintaxis
const T = data.lex.map(t => t.id); 
const N = data.syntax.no_terminales; 
const S = data.syntax.inicial;

const P_mapeadas = {};

data.syntax.reglas.forEach(regla => {
    const nt = regla.no_terminal; 
    
    // Si es la primera vez que vemos este No Terminal, creamos el array
    if (!P_mapeadas[nt]) {
        P_mapeadas[nt] = [];
    }

    // Recorremos las opciones y las AGREGAMOS (no sustituimos)
    regla.opciones.forEach(opcion => {
        const cuerpoLimpio = opcion.map(simbolo => simbolo.id);
        P_mapeadas[nt].push(cuerpoLimpio);
    });
});

console.log("Producciones mapeadas correctamente:", P_mapeadas);
        /*
                // 3. Mapeo de Símbolos y Sintaxis
                const T = data.lex.map(t => t.id);
                const N = data.syntax.no_terminales;
                const S = data.syntax.inicial;
        
                const P_mapeadas = {};
                data.syntax.reglas.forEach(regla => {
                    const nt = regla.no_terminal;
                    const opciones = regla.opciones.map(opcion => 
                        opcion.map(simbolo => simbolo.id)
                    );
                    P_mapeadas[nt] = opciones;
                });
                console.log("Terminales:", T); 
                console.log("NoTerminales:", N); 
                console.log("Producciones mapeadas:", P_mapeadas); 
            
        */
        // 4. Generación de Tabla LL(1)
        const proc = new ProcesadorGramatica(T, N, P_mapeadas, S);
        const conjuntos = proc.ejecutar();
        const builder = new ConstructorTabla(T, N, P_mapeadas, conjuntos.primeros, conjuntos.siguientes);
        const tabla = builder.generar();
        console.log("PRIMEROS:", Object.fromEntries(Object.entries(conjuntos.primeros).map(([k, v]) => [k, Array.from(v)])));
        console.log("SIGUIENTES:", Object.fromEntries(Object.entries(conjuntos.siguientes).map(([k, v]) => [k, Array.from(v)])));
        console.log("FIRST(%_Sent):", Array.from(conjuntos.primeros['%_Sent'] || [])); console.log("FIRST(%_Lista):", Array.from(conjuntos.primeros['%_Lista'] || []));

        // IMPORTANTE: Retornamos el Evaluador con la configuración léxica expandida
        return new Evaluador(tabla, S, T, lexConfig);
    }
}