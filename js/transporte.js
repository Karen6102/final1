// Convierte texto "7,9,18" en [7, 9, 18]
function lista(texto) {
    return texto.split(",").map(x => parseInt(x));
}

// Convierte texto con filas y columnas en matriz [[...], [...]]
function matriz(texto) {
    return texto.trim().split("\n").map(fila => fila.split(",").map(x => parseInt(x)));
}

// Balancea oferta y demanda (agrega ficticia con costo 0 si hace falta)
function balancear(costos, oferta, demanda) {
    let sumaO = oferta.reduce((a, b) => a + b, 0);
    let sumaD = demanda.reduce((a, b) => a + b, 0);
    if (sumaO > sumaD) {
        demanda.push(sumaO - sumaD);
        costos.forEach(fila => fila.push(0));
    } else if (sumaD > sumaO) {
        oferta.push(sumaD - sumaO);
        costos.push(new Array(costos[0].length).fill(0));
    }
    return [costos, oferta, demanda];
}

// Esquina Noroeste: empieza arriba a la izquierda y va llenando
function esquina(costos, oferta, demanda) {
    let m = oferta.length, n = demanda.length;
    let asignacion = Array.from({ length: m }, () => Array(n).fill(0));
    let i = 0, j = 0;
    while (i < m && j < n) {
        let cant = Math.min(oferta[i], demanda[j]);
        if (cant > 0) {
            asignacion[i][j] = cant;
            oferta[i] -= cant;
            demanda[j] -= cant;
        }
        // avanzar si ya se agotó oferta o demanda
        if (oferta[i] === 0) i++;
        if (demanda[j] === 0) j++;
    }
    return asignacion;
}

// Costo Mínimo: busca siempre la celda más barata disponible
function minimo(costos, oferta, demanda) {
    let m = oferta.length, n = demanda.length;
    let asignacion = Array.from({ length: m }, () => Array(n).fill(0));
    let totalOferta = oferta.reduce((a, b) => a + b, 0);
    while (totalOferta > 0) {
        let min = 9999, fi = -1, co = -1;
        for (let i = 0; i < m; i++) {
            for (let j = 0; j < n; j++) {
                if (oferta[i] > 0 && demanda[j] > 0 && costos[i][j] < min) {
                    min = costos[i][j]; fi = i; co = j;
                }
            }
        }
        if (fi === -1 || co === -1) break;
        let cant = Math.min(oferta[fi], demanda[co]);
        asignacion[fi][co] = cant;
        oferta[fi] -= cant; demanda[co] -= cant;
        totalOferta -= cant;
    }
    return asignacion;
}

// VAM (Vogel): calcula penalizaciones en filas y columnas y asigna donde más conviene
function vam(costos, oferta, demanda) {
    const m = oferta.length, n = demanda.length;
    const asignacion = Array.from({ length: m }, () => Array(n).fill(0));
    const O = oferta.slice();
    const D = demanda.slice();

    function penalizacionFila(i) {
        const disponibles = [];
        for (let j = 0; j < n; j++) if (D[j] > 0) disponibles.push(costos[i][j]);
        disponibles.sort((a, b) => a - b);
        if (disponibles.length >= 2) return disponibles[1] - disponibles[0];
        if (disponibles.length === 1) return 0;
        return -1;
    }

    function penalizacionCol(j) {
        const disponibles = [];
        for (let i = 0; i < m; i++) if (O[i] > 0) disponibles.push(costos[i][j]);
        disponibles.sort((a, b) => a - b);
        if (disponibles.length >= 2) return disponibles[1] - disponibles[0];
        if (disponibles.length === 1) return 0;
        return -1;
    }

    while (O.reduce((a, b) => a + b, 0) > 0 && D.reduce((a, b) => a + b, 0) > 0) {
        let mejorTipo = null, mejorIdx = -1, mejorPen = -1;
        for (let i = 0; i < m; i++) {
            if (O[i] > 0) {
                const p = penalizacionFila(i);
                if (p > mejorPen) { mejorPen = p; mejorIdx = i; mejorTipo = 'fila'; }
            }
        }
        for (let j = 0; j < n; j++) {
            if (D[j] > 0) {
                const p = penalizacionCol(j);
                if (p > mejorPen) { mejorPen = p; mejorIdx = j; mejorTipo = 'col'; }
            }
        }
        if (mejorPen < 0) break;

        let iSel = -1, jSel = -1, minCosto = Infinity;
        if (mejorTipo === 'fila') {
            const i = mejorIdx;
            for (let j = 0; j < n; j++) {
                if (D[j] > 0 && costos[i][j] < minCosto) {
                    minCosto = costos[i][j]; iSel = i; jSel = j;
                }
            }
        } else {
            const j = mejorIdx;
            for (let i = 0; i < m; i++) {
                if (O[i] > 0 && costos[i][j] < minCosto) {
                    minCosto = costos[i][j]; iSel = i; jSel = j;
                }
            }
        }
        if (iSel === -1 || jSel === -1) break;

        const cant = Math.min(O[iSel], D[jSel]);
        asignacion[iSel][jSel] = cant;
        O[iSel] -= cant;
        D[jSel] -= cant;
    }
    return asignacion;
}

// Calcula el costo total
function costo(costos, asignacion) {
    let total = 0;
    for (let i = 0; i < costos.length; i++) {
        for (let j = 0; j < costos[0].length; j++) {
            total += asignacion[i][j] * costos[i][j];
        }
    }
    return total;
}

// Crea la tabla HTML
function tabla(asignacion, oferta, demanda) {
    let html = "<table border='1'>";
    html += "<tr><th>Oferta</th>";
    for (let j = 0; j < asignacion[0].length; j++) {
        html += "<th>D" + (j + 1) + "<br>(" + demanda[j] + ")</th>";
    }
    html += "</tr>";
    for (let i = 0; i < asignacion.length; i++) {
        html += "<tr>";
        html += "<th>O" + (i + 1) + "<br>(" + oferta[i] + ")</th>";
        for (let j = 0; j < asignacion[0].length; j++) {
            html += "<td>" + asignacion[i][j] + "</td>";
        }
        html += "</tr>";
    }
    html += "</table>";
    return html;
}

// Función principal
function calcular() {
    let oferta = lista(document.getElementById("oferta").value);
    let demanda = lista(document.getElementById("demanda").value);
    let costos = matriz(document.getElementById("costos").value);

    // Validación de dimensiones antes de balancear
    if (costos.length !== oferta.length || costos[0].length !== demanda.length) {
        document.getElementById("resultado").innerHTML =
            "<p style='color:red'><strong>Error:</strong> La matriz de costos debe tener " +
            oferta.length + " filas y " + demanda.length + " columnas.</p>";
        return;
    }

    [costos, oferta, demanda] = balancear(costos, oferta, demanda);

    let en = esquina(costos, oferta.slice(), demanda.slice());
    let cm = minimo(costos, oferta.slice(), demanda.slice());
    let v  = vam(costos, oferta.slice(), demanda.slice());

    document.getElementById("resultado").innerHTML =
        "<h3>Resultados:</h3>" +
        "<p><strong>Esquina Noroeste:</strong> Costo = " + costo(costos, en) + "</p>" + tabla(en, oferta, demanda) +
        "<p><strong>Costo Mínimo:</strong> Costo = " + costo(costos, cm) + "</p>" + tabla(cm, oferta, demanda) +
        "<p><strong>VAM:</strong> Costo = " + costo(costos, v) + "</p>" + tabla(v, oferta, demanda);
}

