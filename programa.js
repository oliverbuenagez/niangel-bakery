import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-app.js";
import {
  getFirestore,
  collection,
  doc,
  addDoc,
  setDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/11.0.0/firebase-firestore.js";

const app = initializeApp({
  apiKey: "AIzaSyARYT5Jk3OqmkPOUuLHRsQJfYrx9J8i9uQ",
  authDomain: "niangel2812.firebaseapp.com",
  projectId: "niangel2812",
  storageBucket: "niangel2812.firebasestorage.app",
  messagingSenderId: "136583322326",
  appId: "1:136583322326:web:58133846dcfdab2c0fc777",
});
const db = getFirestore(app);

let ingredientes = [];
let recetas = [];
let historial = [];
let clientes = [];

// SYNC
function syncOk() {
  document.getElementById("sync-dot").className = "ok";
  document.getElementById("sync-txt").textContent = "En la nube";
}
function syncSync() {
  document.getElementById("sync-dot").className = "syncing";
  document.getElementById("sync-txt").textContent = "Guardando...";
}
function syncErr() {
  document.getElementById("sync-dot").className = "err";
  document.getElementById("sync-txt").textContent = "Sin conexion";
}

// TOAST
function toast(msg) {
  const t = document.getElementById("toast");
  t.textContent = msg;
  t.classList.add("v");
  setTimeout(function () {
    t.classList.remove("v");
  }, 2600);
}

// FECHA
function fechaHoy() {
  return new Date().toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

// MISMA FECHA
function esMismaFecha(ts, rango) {
  var d = ts && ts.toDate ? ts.toDate() : new Date(ts);
  var hoy = new Date();
  if (rango === "hoy") return d.toDateString() === hoy.toDateString();
  if (rango === "semana") {
    var h7 = new Date();
    h7.setDate(hoy.getDate() - 7);
    return d >= h7;
  }
  if (rango === "mes")
    return (
      d.getMonth() === hoy.getMonth() && d.getFullYear() === hoy.getFullYear()
    );
  return true;
}

// NAVEGACION
window.irTab = function (tab, btn) {
  document.querySelectorAll(".seccion").forEach(function (s) {
    s.classList.remove("activa");
  });
  document.querySelectorAll(".nav-btn").forEach(function (b) {
    b.classList.remove("active");
  });
  document.getElementById("tab-" + tab).classList.add("activa");
  btn.classList.add("active");
  if (tab === "recetas") dibujarRecs();
  if (tab === "produccion") cargarSelRec();
  if (tab === "historial") dibujarHist("hoy");
  if (tab === "estadisticas") dibujarStats();
  if (tab === "clientes") dibujarClis();
};

// ══ INGREDIENTES ══
window.agregarIng = async function () {
  var nombre = document.getElementById("ing-nom").value.trim();
  var cantidad = parseFloat(document.getElementById("ing-cant").value);
  var unidad = document.getElementById("ing-uni").value.trim();
  var precio = parseFloat(document.getElementById("ing-pre").value);
  if (!nombre) {
    toast("Escribe el nombre");
    return;
  }
  if (isNaN(cantidad)) {
    toast("Escribe la cantidad");
    return;
  }
  if (!unidad) {
    toast("Escribe la unidad");
    return;
  }
  if (isNaN(precio)) {
    toast("Escribe el precio");
    return;
  }
  syncSync();
  try {
    await addDoc(collection(db, "ingredientes"), {
      nombre,
      cantidad,
      unidad,
      precio,
      creadoEn: serverTimestamp(),
    });
    document.getElementById("ing-nom").value = "";
    document.getElementById("ing-cant").value = "";
    document.getElementById("ing-uni").value = "";
    document.getElementById("ing-pre").value = "";
    toast("Ingrediente guardado en la nube");
    syncOk();
  } catch (e) {
    syncErr();
    toast("Error al guardar");
  }
};

window.eliminarIng = async function (id) {
  if (!confirm("Eliminar este ingrediente?")) return;
  syncSync();
  try {
    await deleteDoc(doc(db, "ingredientes", id));
    toast("Eliminado");
    syncOk();
  } catch (e) {
    syncErr();
    toast("Error");
  }
};

window.editarPrecioIng = async function (id) {
  var ing = ingredientes.find(function (i) {
    return i.id === id;
  });
  var nv = prompt("Nuevo precio para " + ing.nombre + ":", ing.precio);
  if (nv === null) return;
  var val = parseFloat(nv);
  if (isNaN(val) || val < 0) {
    toast("Precio invalido");
    return;
  }
  syncSync();
  try {
    await setDoc(doc(db, "ingredientes", id), { precio: val }, { merge: true });
    toast("Precio actualizado");
    syncOk();
  } catch (e) {
    syncErr();
    toast("Error");
  }
};

function dibujarIngs() {
  document.getElementById("ing-cnt").textContent = ingredientes.length;
  var c = document.getElementById("ing-lista");
  if (!ingredientes.length) {
    c.innerHTML =
      '<div class="vacio"><div class="ei">🫙</div><p>La bodega esta vacia.</p></div>';
    return;
  }
  var html = '<div class="lista">';
  ingredientes.forEach(function (ing) {
    var ppu = (ing.precio / ing.cantidad).toFixed(4);
    html += '<div class="item">';
    html += '<div class="info"><strong>' + ing.nombre + "</strong>";
    html +=
      "<span>" +
      ing.cantidad +
      " " +
      ing.unidad +
      " - $" +
      ing.precio.toFixed(2) +
      " - $" +
      ppu +
      "/" +
      ing.unidad +
      "</span></div>";
    html += '<div class="acc">';
    html +=
      '<button class="btn btn-sm btn-ep" onclick="editarPrecioIng(\'' +
      ing.id +
      "')\">Precio</button>";
    html +=
      '<button class="btn btn-sm btn-el" onclick="eliminarIng(\'' +
      ing.id +
      "')\">X</button>";
    html += "</div></div>";
  });
  html += "</div>";
  c.innerHTML = html;
}

onSnapshot(
  query(collection(db, "ingredientes"), orderBy("creadoEn", "asc")),
  function (snap) {
    ingredientes = snap.docs.map(function (d) {
      return Object.assign({ id: d.id }, d.data());
    });
    dibujarIngs();
    syncOk();
  },
  function () {
    syncErr();
  },
);

// ══ RECETAS ══
window.crearRec = async function () {
  var nombre = document.getElementById("rec-nom").value.trim();
  var rinde = parseInt(document.getElementById("rec-rinde").value);
  if (!nombre) {
    toast("Escribe el nombre del pan");
    return;
  }
  if (!rinde || rinde < 1) {
    toast("¿Cuántos panes rinde la receta?");
    return;
  }
  syncSync();
  try {
    await addDoc(collection(db, "recetas"), {
      nombre: nombre,
      rinde: rinde,
      ings: [],
      creadoEn: serverTimestamp(),
    });
    document.getElementById("rec-nom").value = "";
    document.getElementById("rec-rinde").value = "";
    toast("Receta creada");
    syncOk();
  } catch (e) {
    syncErr();
    toast("Error");
  }
};

window.eliminarRec = async function (id) {
  if (!confirm("Eliminar esta receta?")) return;
  syncSync();
  try {
    await deleteDoc(doc(db, "recetas", id));
    toast("Receta eliminada");
    syncOk();
  } catch (e) {
    syncErr();
    toast("Error");
  }
};

window.toggleRec = function (id) {
  document.getElementById("rc-" + id).classList.toggle("ab");
  document.getElementById("rh-" + id).classList.toggle("ab");
};

window.agregarIngRec = async function (recId) {
  var ingId = document.getElementById("rai-s-" + recId).value;
  var cantidad = parseFloat(document.getElementById("rai-c-" + recId).value);
  if (!ingId || isNaN(cantidad) || cantidad <= 0) {
    toast("Selecciona ingrediente y cantidad");
    return;
  }
  var rec = recetas.find(function (r) {
    return r.id === recId;
  });
  if (
    rec.ings.find(function (i) {
      return i.ingId === ingId;
    })
  ) {
    toast("Ya esta en la receta");
    return;
  }
  var nuevosIngs = rec.ings.concat([{ ingId: ingId, cantidad: cantidad }]);
  syncSync();
  try {
    await setDoc(
      doc(db, "recetas", recId),
      { ings: nuevosIngs },
      { merge: true },
    );
    toast("Ingrediente agregado");
    syncOk();
  } catch (e) {
    syncErr();
    toast("Error");
  }
};

window.quitarIngRec = async function (recId, ingId) {
  var rec = recetas.find(function (r) {
    return r.id === recId;
  });
  var nuevosIngs = rec.ings.filter(function (i) {
    return i.ingId !== ingId;
  });
  syncSync();
  try {
    await setDoc(
      doc(db, "recetas", recId),
      { ings: nuevosIngs },
      { merge: true },
    );
    syncOk();
  } catch (e) {
    syncErr();
  }
};

window.editarRinde = async function (recId, actual) {
  var nv = prompt(
    "¿Cuántos panes rinde esta receta? (actual: " + actual + ")",
    actual,
  );
  if (nv === null) return;
  var val = parseInt(nv);
  if (isNaN(val) || val < 1) {
    toast("Número inválido");
    return;
  }
  syncSync();
  try {
    await setDoc(doc(db, "recetas", recId), { rinde: val }, { merge: true });
    toast("Rinde actualizado");
    syncOk();
  } catch (e) {
    syncErr();
    toast("Error");
  }
};

function costoRec(rec) {
  return rec.ings.reduce(function (t, ri) {
    var ing = ingredientes.find(function (i) {
      return i.id === ri.ingId;
    });
    return ing ? t + (ing.precio / ing.cantidad) * ri.cantidad : t;
  }, 0);
}

function dibujarRecs() {
  document.getElementById("rec-cnt").textContent = recetas.length;
  var c = document.getElementById("rec-lista");
  if (!recetas.length) {
    c.innerHTML =
      '<div class="vacio"><div class="ei">📋</div><p>No hay recetas aun.</p></div>';
    return;
  }
  var opts = "";
  ingredientes.forEach(function (i) {
    opts +=
      '<option value="' +
      i.id +
      '">' +
      i.nombre +
      " (" +
      i.unidad +
      ")</option>";
  });

  var html = "";
  recetas.forEach(function (rec) {
    var costo = costoRec(rec);
    var filas = "";
    rec.ings.forEach(function (ri) {
      var ing = ingredientes.find(function (i) {
        return i.id === ri.ingId;
      });
      if (!ing) return;
      var co = (ing.precio / ing.cantidad) * ri.cantidad;
      filas += '<div class="if2">';
      filas += '<span class="in2">' + ing.nombre + "</span>";
      filas +=
        '<span class="id3">' + ri.cantidad + " " + ing.unidad + "</span>";
      filas += '<span class="ic2">$' + co.toFixed(2) + "</span>";
      filas +=
        '<button class="btn btn-sm btn-el" onclick="quitarIngRec(\'' +
        rec.id +
        "','" +
        ri.ingId +
        "')\">X</button>";
      filas += "</div>";
    });

    var formIng = "";
    if (!ingredientes.length) {
      formIng =
        '<p style="font-size:.81rem;color:var(--texto-s)">Primero agrega ingredientes en Ingredientes</p>';
    } else {
      formIng = '<div class="aif">';
      formIng +=
        '<div class="sw" style="flex:1;min-width:100px"><select id="rai-s-' +
        rec.id +
        '"><option value="">Selecciona</option>' +
        opts +
        "</select></div>";
      formIng +=
        '<input type="number" id="rai-c-' +
        rec.id +
        '" placeholder="Cantidad" step="0.1" min="0" style="max-width:100px">';
      formIng +=
        '<button class="btn btn-o btn-sm" style="width:auto" onclick="agregarIngRec(\'' +
        rec.id +
        "')\">+ Agregar</button>";
      formIng += "</div>";
    }

    html += '<div class="rc">';
    html +=
      '<div class="rh" id="rh-' +
      rec.id +
      '" onclick="toggleRec(\'' +
      rec.id +
      "')\">";
    html += "<div><h3>Pan: " + rec.nombre + "</h3>";
    html +=
      '<div class="rm">' +
      rec.ings.length +
      " ingrediente(s) — Rinde: <strong>" +
      (rec.rinde || 1) +
      " panes</strong> — Costo base: $" +
      costo.toFixed(2) +
      " — Por pan: $" +
      (costo / (rec.rinde || 1)).toFixed(3) +
      "</div></div>";
    html += '<div style="display:flex;gap:6px;align-items:center">';
    html +=
      '<button class="btn btn-sm btn-el" onclick="event.stopPropagation();eliminarRec(\'' +
      rec.id +
      "')\">X</button>";
    html += '<span style="color:var(--cafe-claro)">v</span>';
    html += "</div></div>";
    html += '<div class="rb2" id="rc-' + rec.id + '">';
    html +=
      '<div style="display:flex;align-items:center;gap:10px;margin-bottom:12px;background:var(--crema-o);padding:10px 12px;border-radius:10px;flex-wrap:wrap">';
    html +=
      '<span style="font-size:.78rem;font-weight:600;color:var(--cafe-mid);text-transform:uppercase;letter-spacing:.5px">Rinde por receta:</span>';
    html +=
      '<strong style="color:var(--cafe-rico)">' +
      (rec.rinde || 1) +
      " panes</strong>";
    html +=
      '<button class="btn btn-sm btn-ep" onclick="editarRinde(\'' +
      rec.id +
      "'," +
      (rec.rinde || 1) +
      ')">✏️ Editar</button>';
    html += "</div>";
    html += filas.length
      ? filas
      : '<p style="font-size:.82rem;color:var(--texto-s);margin-bottom:10px">Sin ingredientes aun.</p>';
    html += '<div class="div"></div>';
    html +=
      '<p style="font-size:.7rem;font-weight:600;color:var(--cafe-mid);text-transform:uppercase;margin-bottom:10px">Agregar ingrediente</p>';
    html += formIng;
    html += "</div></div>";
  });
  c.innerHTML = html;
}

onSnapshot(
  query(collection(db, "recetas"), orderBy("creadoEn", "asc")),
  function (snap) {
    recetas = snap.docs.map(function (d) {
      return Object.assign({ id: d.id }, d.data());
    });
    dibujarRecs();
    syncOk();
  },
  function () {
    syncErr();
  },
);

// ══ PRODUCCION ══
window.cargarSelRec = function () {
  var sel = document.getElementById("prod-rec");
  var prev = sel.value;
  var opts = '<option value="">Selecciona un pan</option>';
  recetas.forEach(function (r) {
    opts +=
      '<option value="' +
      r.id +
      '"' +
      (r.id === prev ? " selected" : "") +
      ">" +
      r.nombre +
      "</option>";
  });
  sel.innerHTML = opts;
  if (prev) verIngRec();
};

window.verIngRec = function () {
  var recId = document.getElementById("prod-rec").value;
  var panes = parseInt(document.getElementById("prod-pan").value) || 0;
  var c = document.getElementById("prod-det");
  if (!recId) {
    c.innerHTML =
      '<div class="vacio"><div class="ei">👆</div><p>Selecciona un pan.</p></div>';
    return;
  }
  var rec = recetas.find(function (r) {
    return r.id === recId;
  });
  if (!rec || !rec.ings.length) {
    c.innerHTML =
      '<div class="vacio"><div class="ei">⚠️</div><p>Esta receta no tiene ingredientes.</p></div>';
    return;
  }

  var rinde = rec.rinde || 1;
  var factor = panes > 0 ? panes / rinde : 1;
  var costoBase = costoRec(rec);
  var costoEscalado = costoBase * factor;

  var html = "";
  if (panes > 0) {
    var vecesTexto = Number.isInteger(factor)
      ? factor + "x exactas"
      : factor.toFixed(2) + "x (≈" + Math.ceil(factor) + " preparaciones)";
    html +=
      '<div style="background:rgba(201,153,58,0.1);border:1px solid rgba(201,153,58,0.3);border-radius:10px;padding:10px 12px;margin-bottom:12px;font-size:.81rem">';
    html +=
      "🧮 <strong>" +
      panes +
      " panes</strong> ÷ rinde <strong>" +
      rinde +
      "</strong> = repetir receta <strong>" +
      vecesTexto +
      "</strong>";
    html += "</div>";
  }

  html += '<div class="lista">';
  rec.ings.forEach(function (ri) {
    var ing = ingredientes.find(function (i) {
      return i.id === ri.ingId;
    });
    if (!ing) return;
    var cantEscalada = ri.cantidad * factor;
    var coEscalado = (ing.precio / ing.cantidad) * cantEscalada;
    var extras = "";
    if (ing.unidad === "g" || ing.unidad === "gr") {
      extras =
        " = " +
        (cantEscalada / 1000).toFixed(3) +
        " kg / " +
        (cantEscalada / 453.592).toFixed(2) +
        " lb";
    } else if (ing.unidad === "ml") {
      extras = " = " + (cantEscalada / 1000).toFixed(3) + " L";
    }
    html +=
      '<div class="item"><div class="info"><strong>' + ing.nombre + "</strong>";
    html +=
      "<span>" +
      cantEscalada.toFixed(2) +
      " " +
      ing.unidad +
      extras +
      " — $" +
      coEscalado.toFixed(2) +
      "</span></div></div>";
  });
  html += '</div><div class="div"></div>';
  html +=
    '<p style="text-align:center;font-size:.81rem;color:var(--texto-s)">Costo total: <strong>$' +
    costoEscalado.toFixed(2) +
    "</strong>" +
    (panes > 0
      ? " | Por pan: <strong>$" +
        (costoEscalado / panes).toFixed(3) +
        "</strong>"
      : "") +
    "</p>";
  c.innerHTML = html;
};

window.calcularProd = async function () {
  var recId = document.getElementById("prod-rec").value;
  var panes = parseInt(document.getElementById("prod-pan").value);
  var precio = parseFloat(document.getElementById("prod-pre").value);
  if (!recId) {
    toast("Selecciona un tipo de pan");
    return;
  }
  if (!panes || panes < 1) {
    toast("Ingresa cuántos panes vas a producir");
    return;
  }
  if (!precio || precio <= 0) {
    toast("Ingresa el precio de venta");
    return;
  }
  var rec = recetas.find(function (r) {
    return r.id === recId;
  });
  if (!rec.ings.length) {
    toast("La receta no tiene ingredientes");
    return;
  }

  // *** LÓGICA CLAVE: escalar según rinde ***
  var rinde = rec.rinde || 1;
  var factor = panes / rinde; // Ej: 300 panes ÷ 15 rinde = 20 veces receta
  var costoBase = costoRec(rec); // costo de 1 receta base
  var costoTotal = costoBase * factor; // costo real para producir los panes pedidos
  var totalVenta = panes * precio;
  var ganancia = totalVenta - costoTotal;
  var costoPorPan = costoTotal / panes;
  var gananciaPan = precio - costoPorPan;

  syncSync();
  try {
    await addDoc(collection(db, "historial"), {
      fecha: serverTimestamp(),
      fechaTexto: fechaHoy(),
      recetaId: rec.id,
      recetaNombre: rec.nombre,
      panes: panes,
      precio: precio,
      rinde: rinde,
      factor: factor,
      costoTotal: costoTotal,
      totalVenta: totalVenta,
      ganancia: ganancia,
      costoPorPan: costoPorPan,
      gananciaPan: gananciaPan,
    });
    syncOk();
  } catch (e) {
    syncErr();
  }

  var s = ganancia >= 0 ? "+" : "";
  var cg = ganancia >= 0 ? "var(--verde)" : "var(--rojo)";

  // Tabla con ingredientes escalados
  var filas = "";
  rec.ings.forEach(function (ri) {
    var ing = ingredientes.find(function (i) {
      return i.id === ri.ingId;
    });
    if (!ing) return;
    var cantEscalada = ri.cantidad * factor;
    var co = (ing.precio / ing.cantidad) * cantEscalada;
    var extras = "";
    if (ing.unidad === "g" || ing.unidad === "gr") {
      extras =
        ' <span style="opacity:.6;font-size:.85em">= ' +
        (cantEscalada / 1000).toFixed(2) +
        "kg / " +
        (cantEscalada / 453.592).toFixed(2) +
        "lb</span>";
    }
    filas +=
      "<tr><td>" +
      ing.nombre +
      "</td><td>" +
      cantEscalada.toFixed(2) +
      " " +
      ing.unidad +
      extras +
      '</td><td style="text-align:right;font-weight:600">$' +
      co.toFixed(2) +
      "</td></tr>";
  });

  var vecesTexto = Number.isInteger(factor)
    ? factor + "x"
    : factor.toFixed(2) + "x (≈" + Math.ceil(factor) + " completas)";

  var res = document.getElementById("prod-res");
  res.style.display = "block";
  res.innerHTML =
    '<div class="card" style="border-color:var(--dorado);box-shadow:var(--sombra-d)">' +
    '<div class="ct">Guardado en la nube — ' +
    rec.nombre +
    ' <span class="badge">' +
    panes +
    " panes — " +
    fechaHoy() +
    "</span></div>" +
    '<div style="background:rgba(201,153,58,0.1);border:1px solid rgba(201,153,58,0.3);border-radius:10px;padding:10px 12px;margin-bottom:16px;font-size:.83rem">' +
    "🧮 Receta rinde <strong>" +
    rinde +
    "</strong> panes → para <strong>" +
    panes +
    "</strong> panes = preparar receta <strong>" +
    vecesTexto +
    "</strong>" +
    "</div>" +
    '<div class="rg">' +
    '<div class="rb3 r1"><div class="rl">Inversión</div><div class="rv">$' +
    costoTotal.toFixed(2) +
    "</div></div>" +
    '<div class="rb3 r2"><div class="rl">Venta total</div><div class="rv">$' +
    totalVenta.toFixed(2) +
    "</div></div>" +
    '<div class="rb3 r3"><div class="rl">Costo/pan</div><div class="rv">$' +
    costoPorPan.toFixed(3) +
    "</div></div>" +
    '<div class="rb3 r4"><div class="rl">Ganancia</div><div class="rv">' +
    s +
    "$" +
    ganancia.toFixed(2) +
    "</div></div>" +
    "</div>" +
    '<p style="text-align:center;font-size:.82rem;color:var(--texto-s);margin-bottom:18px">Ganancia por pan: <strong style="color:' +
    cg +
    '">' +
    s +
    "$" +
    gananciaPan.toFixed(3) +
    "</strong></p>" +
    '<table class="td"><thead><tr><th>Ingrediente</th><th>Total a usar</th><th style="text-align:right">Costo</th></tr></thead>' +
    "<tbody>" +
    filas +
    '<tr class="ft"><td colspan="2">TOTAL INVERTIDO</td><td style="text-align:right">$' +
    costoTotal.toFixed(2) +
    "</td></tr>" +
    "</tbody></table>" +
    '<div class="div"></div>' +
    "<button class=\"btn btn-g\" onclick=\"document.getElementById('prod-res').style.display='none'\">Nueva produccion</button>" +
    "</div>";

  document.getElementById("prod-rec").value = "";
  document.getElementById("prod-pan").value = "";
  document.getElementById("prod-pre").value = "";
  document.getElementById("prod-det").innerHTML =
    '<div class="vacio"><div class="ei">👆</div><p>Selecciona un pan.</p></div>';
  toast("Produccion guardada en la nube");
};

// ══ HISTORIAL ══
window.filtrarH = function (rango, btn) {
  document.querySelectorAll(".fb").forEach(function (b) {
    b.classList.remove("ac");
  });
  btn.classList.add("ac");
  dibujarHist(rango);
};

window.eliminarHist = async function (id) {
  if (!confirm("Eliminar este registro?")) return;
  syncSync();
  try {
    await deleteDoc(doc(db, "historial", id));
    toast("Registro eliminado");
    syncOk();
  } catch (e) {
    syncErr();
    toast("Error");
  }
};

function dibujarHist(rango) {
  var filtrados = historial
    .filter(function (h) {
      return esMismaFecha(h.fecha, rango);
    })
    .reverse();
  var rt = document.getElementById("hist-rt");
  var c = document.getElementById("hist-lista");
  if (!filtrados.length) {
    rt.innerHTML = "";
    c.innerHTML =
      '<div class="vacio"><div class="ei">📅</div><p>No hay registros en este periodo.</p></div>';
    return;
  }
  var tI = filtrados.reduce(function (t, h) {
    return t + h.costoTotal;
  }, 0);
  var tV = filtrados.reduce(function (t, h) {
    return t + h.totalVenta;
  }, 0);
  var tG = filtrados.reduce(function (t, h) {
    return t + h.ganancia;
  }, 0);
  rt.innerHTML =
    '<div class="rt">' +
    '<div class="rtb"><div class="rtl">Inversion</div><div class="rtv">$' +
    tI.toFixed(2) +
    "</div></div>" +
    '<div class="rtb"><div class="rtl">Ventas</div><div class="rtv">$' +
    tV.toFixed(2) +
    "</div></div>" +
    '<div class="rtb"><div class="rtl">Ganancia</div><div class="rtv">$' +
    tG.toFixed(2) +
    "</div></div>" +
    "</div>";
  var html = "";
  filtrados.forEach(function (h) {
    var s = h.ganancia >= 0 ? "+" : "";
    html +=
      '<div class="hi">' +
      '<div><div class="hfe">' +
      (h.fechaTexto || "Sin fecha") +
      "</div>" +
      '<div class="hp">' +
      h.recetaNombre +
      "</div>" +
      '<div class="hinfo">' +
      h.panes +
      " panes - $" +
      (h.precio || 0).toFixed(2) +
      "/pan</div></div>" +
      '<div style="display:flex;align-items:center;gap:10px">' +
      '<div class="hg ' +
      (h.ganancia >= 0 ? "pos" : "neg") +
      '">' +
      s +
      "$" +
      (h.ganancia || 0).toFixed(2) +
      "</div>" +
      '<button class="btn btn-sm btn-el" onclick="eliminarHist(\'' +
      h.id +
      "')\">X</button>" +
      "</div></div>";
  });
  c.innerHTML = html;
}

onSnapshot(
  query(collection(db, "historial"), orderBy("fecha", "asc")),
  function (snap) {
    historial = snap.docs.map(function (d) {
      return Object.assign({ id: d.id }, d.data());
    });
    var btnAc = document.querySelector(".fb.ac");
    var rango = "hoy";
    if (btnAc) {
      var t = btnAc.textContent;
      if (t.includes("sem")) rango = "semana";
      else if (t.includes("mes")) rango = "mes";
      else if (t.includes("Todo")) rango = "todo";
    }
    dibujarHist(rango);
    syncOk();
  },
  function () {
    syncErr();
  },
);

// ══ ESTADISTICAS ══
function dibujarStats() {
  var c = document.getElementById("stats-con");
  if (!historial.length) {
    c.innerHTML =
      '<div class="vacio"><div class="ei">📊</div><p>Necesitas al menos una produccion.</p></div>';
    return;
  }
  var tG = historial.reduce(function (t, h) {
    return t + h.ganancia;
  }, 0);
  var tV = historial.reduce(function (t, h) {
    return t + h.totalVenta;
  }, 0);
  var tP = historial.reduce(function (t, h) {
    return t + h.panes;
  }, 0);
  var porPan = {};
  historial.forEach(function (h) {
    if (!porPan[h.recetaNombre])
      porPan[h.recetaNombre] = { ganancia: 0, veces: 0, panes: 0 };
    porPan[h.recetaNombre].ganancia += h.ganancia;
    porPan[h.recetaNombre].veces++;
    porPan[h.recetaNombre].panes += h.panes;
  });
  var ranking = Object.entries(porPan).sort(function (a, b) {
    return b[1].ganancia - a[1].ganancia;
  });
  var html =
    '<div class="sg">' +
    '<div class="sb s1"><div class="sl">Ganancia total</div><div class="sv">$' +
    tG.toFixed(2) +
    "</div></div>" +
    '<div class="sb s2"><div class="sl">Total vendido</div><div class="sv">$' +
    tV.toFixed(2) +
    "</div></div>" +
    '<div class="sb s3"><div class="sl">Panes</div><div class="sv">' +
    tP +
    "</div></div>" +
    '<div class="sb s4"><div class="sl">Producciones</div><div class="sv">' +
    historial.length +
    "</div></div>" +
    '</div><div class="card"><div class="ct">Pan mas rentable</div>';
  ranking.forEach(function (entry, i) {
    var nom = entry[0];
    var data = entry[1];
    html +=
      '<div class="ri">' +
      '<div class="rn ' +
      (i === 0 ? "oro" : "") +
      '">' +
      (i + 1) +
      "</div>" +
      '<div class="ri-inf"><div class="ri-nom">' +
      nom +
      "</div>" +
      '<div class="ri-det">' +
      data.veces +
      " produccion(es) - " +
      data.panes +
      " panes</div></div>" +
      '<div class="ri-tot">$' +
      data.ganancia.toFixed(2) +
      "</div></div>";
  });
  html += "</div>";
  c.innerHTML = html;
}
window.dibujarStats = dibujarStats;

// ══ CLIENTES ══
var tE = {
  tienda: "Tienda",
  restaurante: "Restaurante",
  vecino: "Vecino",
  otro: "Otro",
};

window.agregarCli = async function () {
  var nombre = document.getElementById("cli-nom").value.trim();
  var tipo = document.getElementById("cli-tip").value;
  var tel = document.getElementById("cli-tel").value.trim();
  if (!nombre) {
    toast("Escribe el nombre");
    return;
  }
  syncSync();
  try {
    await addDoc(collection(db, "clientes"), {
      nombre,
      tipo,
      tel,
      deudas: [],
      creadoEn: serverTimestamp(),
    });
    document.getElementById("cli-nom").value = "";
    document.getElementById("cli-tel").value = "";
    toast("Cliente agregado");
    syncOk();
  } catch (e) {
    syncErr();
    toast("Error");
  }
};

window.eliminarCli = async function (id) {
  if (!confirm("Eliminar este cliente?")) return;
  syncSync();
  try {
    await deleteDoc(doc(db, "clientes", id));
    toast("Cliente eliminado");
    syncOk();
  } catch (e) {
    syncErr();
    toast("Error");
  }
};

window.toggleCli = function (id) {
  document.getElementById("cc-" + id).classList.toggle("ab");
  document.getElementById("cch-" + id).classList.toggle("ab");
};

window.agregarDeuda = async function (cliId) {
  var desc = document.getElementById("deu-d-" + cliId).value.trim();
  var monto = parseFloat(document.getElementById("deu-m-" + cliId).value);
  if (!desc || isNaN(monto) || monto <= 0) {
    toast("Completa descripcion y monto");
    return;
  }
  var cli = clientes.find(function (c) {
    return c.id === cliId;
  });
  var nuevasDeudas = (cli.deudas || []).concat([
    { id: Date.now(), desc, monto, fecha: fechaHoy() },
  ]);
  syncSync();
  try {
    await setDoc(
      doc(db, "clientes", cliId),
      { deudas: nuevasDeudas },
      { merge: true },
    );
    toast("Deuda registrada");
    syncOk();
  } catch (e) {
    syncErr();
    toast("Error");
  }
};

window.pagarDeuda = async function (cliId, deuId) {
  if (!confirm("Marcar como pagada?")) return;
  var cli = clientes.find(function (c) {
    return c.id === cliId;
  });
  var nuevasDeudas = (cli.deudas || []).filter(function (d) {
    return d.id !== deuId;
  });
  syncSync();
  try {
    await setDoc(
      doc(db, "clientes", cliId),
      { deudas: nuevasDeudas },
      { merge: true },
    );
    toast("Deuda pagada");
    syncOk();
  } catch (e) {
    syncErr();
    toast("Error");
  }
};

function dibujarClis() {
  document.getElementById("cli-cnt").textContent = clientes.length;
  var c = document.getElementById("cli-lista");
  if (!clientes.length) {
    c.innerHTML =
      '<div class="vacio"><div class="ei">👥</div><p>No hay clientes aun.</p></div>';
    return;
  }
  var html = "";
  clientes.forEach(function (cli) {
    var td = (cli.deudas || []).reduce(function (t, d) {
      return t + d.monto;
    }, 0);
    var df = "";
    (cli.deudas || []).forEach(function (d) {
      df +=
        '<div class="di">' +
        '<div><div class="dd2">' +
        d.desc +
        '</div><div class="df2">' +
        d.fecha +
        "</div></div>" +
        '<div style="display:flex;align-items:center;gap:8px">' +
        '<div class="dm">$' +
        d.monto.toFixed(2) +
        "</div>" +
        '<button class="btn btn-sm btn-vd" onclick="pagarDeuda(\'' +
        cli.id +
        "'," +
        d.id +
        ')">Pagado</button>' +
        "</div></div>";
    });
    html +=
      '<div class="cc">' +
      '<div class="cch" id="cch-' +
      cli.id +
      '" onclick="toggleCli(\'' +
      cli.id +
      "')\">" +
      '<div style="display:flex;align-items:center">' +
      '<div class="cav">👤</div>' +
      '<div><div class="cnm">' +
      cli.nombre +
      "</div>" +
      '<div class="ctp">' +
      tE[cli.tipo] +
      (cli.tel ? " - " + cli.tel : "") +
      "</div></div></div>" +
      '<div style="display:flex;align-items:center;gap:8px">' +
      '<span class="db ' +
      (td > 0 ? "cd" : "sd") +
      '">' +
      (td > 0 ? "Debe $" + td.toFixed(2) : "Al dia") +
      "</span>" +
      '<button class="btn btn-sm btn-el" onclick="event.stopPropagation();eliminarCli(\'' +
      cli.id +
      "')\">X</button>" +
      '<span style="color:var(--cafe-claro)">v</span>' +
      "</div></div>" +
      '<div class="ccb" id="cc-' +
      cli.id +
      '">' +
      (cli.deudas && cli.deudas.length
        ? df
        : '<p style="font-size:.82rem;color:var(--texto-s);margin-bottom:12px">Sin deudas pendientes</p>') +
      '<div class="div"></div>' +
      '<p style="font-size:.7rem;font-weight:600;color:var(--cafe-mid);text-transform:uppercase;margin-bottom:10px">Registrar deuda</p>' +
      '<div style="display:flex;gap:8px;flex-wrap:wrap">' +
      '<input type="text" id="deu-d-' +
      cli.id +
      '" placeholder="Ej: 10 panes de queso" style="flex:1;min-width:130px">' +
      '<input type="number" id="deu-m-' +
      cli.id +
      '" placeholder="Monto $" step="0.01" min="0" style="max-width:100px">' +
      '<button class="btn btn-o btn-sm" style="width:auto" onclick="agregarDeuda(\'' +
      cli.id +
      "')\">+ Deuda</button>" +
      "</div></div></div>";
  });
  c.innerHTML = html;
}
window.dibujarClis = dibujarClis;

onSnapshot(
  query(collection(db, "clientes"), orderBy("creadoEn", "asc")),
  function (snap) {
    clientes = snap.docs.map(function (d) {
      return Object.assign({ id: d.id }, d.data());
    });
    dibujarClis();
    syncOk();
  },
  function () {
    syncErr();
  },
);
