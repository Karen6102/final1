// Esta función agarra un texto con números separados por comas
// y lo convierte en una lista de números (ejemplo: "7,9,18" → [7,9,18])
function lista(texto) {
    return texto.split(",").map(x => parseInt(x));
}

// Esta función convierte un texto en forma de filas y columnas
// en una matriz de números (ejemplo: "1,2\n3,4" → [[1,2],[3,4]])
function matriz(texto) {
    return texto.trim().split("\n").map(fila => fila.split(",").map(x => parseInt(x)));
}

// Aquí balanceamos oferta y demanda para que sean iguales
// Si sobra oferta, agregamos una demanda ficticia con costo 0
// Si sobra demanda, agregamos una oferta ficticia con costo 0
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

// Método de la esquina noroeste
// Empieza en la primera celda (arriba a la izquierda) y va llenando
// hasta que se acaben la oferta y la demanda
function esquina(costos, oferta, demanda) {
    let m = oferta.length, n = demanda.length;
    let asignacion = Array.from({ length: m }, () => Array(n).fill(0));
    let i = 0, j = 0;
    while (i < m && j < n) {
        let cant = Math.min(oferta[i], demanda[j]);
        if (cant <= 0) break; // seguridad para no trabarse
        asignacion[i][j] = cant;
        oferta[i] -= cant; demanda[j] -= cant;
        if (oferta[i] === 0) i++;
        if (demanda[j] === 0) j++;
    }
    return asignacion;
}

// Método de costo mínimo
// Busca siempre la celda con menor costo y asigna lo máximo posible
function minimo(costos, oferta, demanda) {
    let m = oferta.length, n = demanda.length;
    let asignacion = Array.from({ length: m }, () => Array(n).fill(0));
    let totalOferta = oferta.reduce((a, b) => a + b, 0);
    while (totalOferta > 0) {
        let min = 9999, fi = -1, co = -1;
        // Buscar la celda más barata
        for (let i = 0; i < m; i++) {
            for (let j = 0; j < n; j++) {
                if (oferta[i] > 0 && demanda[j] > 0 && costos[i][j] < min) {
                    min = costos[i][j]; fi = i; co = j;
                }
            }
        }
        if (fi === -1 || co === -1) break; // seguridad
        let cant = Math.min(oferta[fi], demanda[co]);
        if (cant <= 0) break; // seguridad
        asignacion[fi][co] = cant;
        oferta[fi] -= cant; demanda[co] -= cant;
        totalOferta -= cant;
    }
    return asignacion;
}

// Método VAM (Vogel Approximation Method)
// Calcula penalizaciones y elige la mejor fila para asignar
function vam(costos, oferta, demanda) {
    let m = oferta.length, n = demanda.length;
    let asignacion = Array.from({ length: m }, () => Array(n).fill(0));
    let totalOferta = oferta.reduce((a, b) => a + b, 0);
    while (totalOferta > 0) {
        let mejorFila = -1, mejorPen = -1;
        // Calcular penalización por fila
        for (let i = 0; i < m; i++) {
            if (oferta[i] > 0) {
                let filaCostos = [];
                for (let j = 0; j < n; j++) {
                    if (demanda[j] > 0) filaCostos.push(costos[i][j]);
                }
                filaCostos.sort((a, b) => a - b);
                if (filaCostos.length >= 2) {
                    let pen = filaCostos[1] - filaCostos[0];
                    if (pen > mejorPen) { mejorPen = pen; mejorFila = i; }
                }
            }
        }
        if (mejorFila === -1) break; // seguridad

        // Buscar la columna más barata en esa fila
        let j = -1, minVal = Infinity;
        for (let col = 0; col < n; col++) {
            if (demanda[col] > 0 && costos[mejorFila][col] < minVal) {
                minVal = costos[mejorFila][col];
                j = col;
            }
        }
        if (j === -1) break; // seguridad

        let cant = Math.min(oferta[mejorFila], demanda[j]);
        if (cant <= 0) break; // seguridad
        asignacion[mejorFila][j] = cant;
        oferta[mejorFila] -= cant; demanda[j] -= cant;
        totalOferta -= cant;
    }
    return asignacion;
}

// Calcula el costo total de una asignación
// Multiplica cada cantidad asignada por su costo y lo suma
function costo(costos, asignacion) {
    let total = 0;
    for (let i = 0; i < costos.length; i++) {
        for (let j = 0; j < costos[0].length; j++) {
            total += asignacion[i][j] * costos[i][j];
        }
    }
    return total;
}

function tabla(asignacion, oferta, demanda) {
    let html = "<table>";

    // Encabezado: primero Oferta, luego las demandas
    html += "<tr><th>Oferta</th>";
    for (let j = 0; j < asignacion[0].length; j++) {
        html += "<th>D" + (j + 1) + "<br>(" + demanda[j] + ")</th>";
    }
    html += "</tr>";

    // Filas con oferta al inicio
    for (let i = 0; i < asignacion.length; i++) {
        html += "<tr>";
        html += "<th>O" + (i + 1) + "<br>(" + oferta[i] + ")</th>"; // aquí va la oferta
        for (let j = 0; j < asignacion[0].length; j++) {
            html += "<td>" + asignacion[i][j] + "</td>";
        }
        html += "</tr>";
    }

    html += "</table>";
    return html;
}


// Función principal que se ejecuta al dar clic en el botón
// Aquí juntamos todo: leemos datos, balanceamos, aplicamos métodos y mostramos resultados
function calcular() {
    let oferta = lista(document.getElementById("oferta").value);
    let demanda = lista(document.getElementById("demanda").value);
    let costos = matriz(document.getElementById("costos").value);

    [costos, oferta, demanda] = balancear(costos, oferta, demanda);

    let en = esquina(costos, oferta.slice(), demanda.slice());
    let cm = minimo(costos, oferta.slice(), demanda.slice());
    let v = vam(costos, oferta.slice(), demanda.slice());

    document.getElementById("resultado").innerHTML =
        "<h3>Resultados:</h3>" +
        "<p><strong>Esquina Noroeste:</strong> Costo = " + costo(costos, en) + "</p>" + tabla(en, oferta, demanda) +
        "<p><strong>Costo Mínimo:</strong> Costo = " + costo(costos, cm) + "</p>" + tabla(cm, oferta, demanda) +
        "<p><strong>VAM:</strong> Costo = " + costo(costos, v) + "</p>" + tabla(v, oferta, demanda);
}
