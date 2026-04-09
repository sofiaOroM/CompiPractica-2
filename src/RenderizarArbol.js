/**
 * RenderizadorArbol.js
 * Clase encargada de la visualización gráfica del Árbol de Derivación usando D3.js.
 */
export class RenderizadorArbol {
    constructor(selectorContenedor) {
        this.selector = selectorContenedor;
        this.width = 1000;
        this.height = 800;
    }

    _prepararDatos(nodo) {
        let out = {
            name: nodo.lexema ? `${nodo.valor}\n('${nodo.lexema}')` : nodo.valor
        };
        if (nodo.hijos && nodo.hijos.length > 0) {
            out.children = nodo.hijos.map(h => this._prepararDatos(h));
        }
        return out;
    }

    dibujar(nodoRaiz) {
        const data = this._prepararDatos(nodoRaiz);
        const container = d3.select(this.selector);
        container.selectAll("*").remove();

        // 1. CALCULAMOS DIMENSIONES DINÁMICAS
        // Contamos niveles para el alto y nodos hoja para el ancho
        const root = d3.hierarchy(data);
        const profundidad = root.height; // niveles del árbol
        const numHojas = root.leaves().length; // nodos terminales

        // Ajusta estos valores si quieres más o menos separación
        const anchoDinamico = Math.max(1000, numHojas * 100);
        const altoDinamico = Math.max(600, profundidad * 120);

        // 2. CREAMOS EL SVG CON EL TAMAÑO DINÁMICO
        const svg = container.append("svg")
            .attr("width", anchoDinamico)
            .attr("height", altoDinamico)
            .append("g")
            .attr("transform", "translate(0, 50)");

        // 3. SEPARACIÓN DE NODOS
        // El primer valor es el ancho disponible para repartir nodos
        const treeLayout = d3.tree().size([anchoDinamico - 100, altoDinamico - 150]);
        treeLayout(root);

        // 4. DIBUJAR LÍNEAS
        svg.selectAll(".link")
            .data(root.links())
            .enter().append("path")
            .attr("class", "link")
            .attr("d", d3.linkVertical()
                .x(d => d.x)
                .y(d => d.y))
            .attr("fill", "none")
            .attr("stroke", "#5bc0de")
            .attr("stroke-width", "1.5px");

        // 5. DIBUJAR NODOS
        const node = svg.selectAll(".node")
            .data(root.descendants())
            .enter().append("g")
            .attr("transform", d => `translate(${d.x},${d.y})`);

        node.append("circle")
            .attr("r", 5)
            .attr("fill", d => d.children ? "#2c3e50" : "#e74c3c");

        // 6. ETIQUETAS (Mejoradas)
        node.append("text")
            .attr("dy", "1.2em")
            .attr("y", d => d.children ? -15 : 10) // Si es padre, texto arriba; si es hijo, texto abajo
            .style("text-anchor", "middle")
            .text(d => d.data.name)
            .style("font-family", "monospace")
            .style("font-size", "10px")
            .style("font-weight", "bold")
            .style("pointer-events", "none")
            .style("background", "white"); // Ayuda a la legibilidad
    }
}