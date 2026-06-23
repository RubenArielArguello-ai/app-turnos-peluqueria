// ============================================================
// CONFIGURACIÓN — CAMBIÁ SOLO ESTE NÚMERO
// Formato internacional SIN el +, SIN espacios, SIN guiones
// Argentina: si tu número es +54 9 11 1234-5678, escribís: 5491112345678
// ============================================================
const NUMERO_WHATSAPP = "5491138706608";

// ============================================================
// FUNCIÓN HELPER: abrirWhatsApp(numero, mensaje)
// Crea un link <a> y lo clickea — evita el bloqueo de popups
// que ocurre con window.open() desde formularios.
// ============================================================
function abrirWhatsApp(numero, mensaje) {
  const texto = mensaje.replace(/%0A/g, '\n');
  const url = `https://wa.me/${numero}?text=${encodeURIComponent(texto)}`;
  const link = document.createElement("a");
  link.href = url;
  link.target = "_blank";
  link.rel = "noopener";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// ============================================================
// REFERENCIA AL FORMULARIO
// ============================================================
const formulario = document.getElementById("formulario-turno");

// ============================================================
// ESCUCHAR EL ENVÍO DEL FORMULARIO
// ============================================================
formulario.addEventListener("submit", function(evento) {
  evento.preventDefault();
  

  // Leer valores
  const nombre   = document.getElementById("nombre").value.trim();
  const telefono = document.getElementById("telefono").value.trim();
  const servicio = document.getElementById("servicio").value;
  const fecha    = document.getElementById("fecha").value;
  const hora     = document.getElementById("hora").value;
  const notas    = document.getElementById("notas").value.trim();

  // Formatear fecha
  const [anio, mes, dia] = fecha.split("-");
  const fechaFormateada = `${dia}/${mes}/${anio}`;

  // Armar mensaje
  const mensaje =
    `✂️ *Nueva reserva de turno*%0A` +
    `%0A` +
    `👤 *Nombre:* ${nombre}%0A` +
    `💈 *Servicio:* ${servicio}%0A` +
    `📅 *Fecha:* ${fechaFormateada}%0A` +
    `🕐 *Hora:* ${hora}%0A` +
    (telefono ? `📞 *Teléfono:* ${telefono}%0A` : "") +
    (notas    ? `📝 *Notas:* ${notas}%0A`        : "") +
    `%0A_Reservado desde la app de la peluquería_ 🙌`;

  // Guardar en localStorage
  const turnosGuardados = JSON.parse(localStorage.getItem("turnos") || "[]");
  const turnoNuevo = {
    id: Date.now(),
    nombre,
    telefono,
    servicio,
    fecha,
    hora,
    notas,
    fechaReserva: new Date().toLocaleDateString("es-AR")
  };
  turnosGuardados.push(turnoNuevo);
  localStorage.setItem("turnos", JSON.stringify(turnosGuardados));

  // --- ENVÍO A GOOGLE SHEETS ---
        const URL_GOOGLE_WEBAPP = "https://script.google.com/macros/s/AKfycbwuT8hgxjSUNkJuC1bK9Hw_l4zB8DOQgv0ZJixvFoheoNig0jFNyoaYIkCkFc3SVE9J6w/exec"; 

        const datosParaGoogle = {
            nombre: turnoNuevo.nombre,
            servicio: turnoNuevo.servicio,
            fecha: turnoNuevo.fecha,
            hora: turnoNuevo.hora,
            telefono: turnoNuevo.telefono
        };

        fetch(URL_GOOGLE_WEBAPP, {
            method: 'POST',
            mode: 'no-cors', 
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(datosParaGoogle)
        })
        .then(() => console.log('¡Sincronizado con Google Sheets con éxito!'))
        .catch(error => console.error('Error al sincronizar con Google:', error));
        // ---------------------------------

  // Actualizar lista en pantalla
  mostrarTurnos();

  // Abrir WhatsApp (sin bloqueo de popup)
  abrirWhatsApp(NUMERO_WHATSAPP, mensaje);

  // Limpiar formulario
  formulario.reset();
});

// ============================================================
// FUNCIÓN: mostrarTurnos()
// ============================================================
function mostrarTurnos() {
  const contenedor = document.getElementById("lista-turnos");
  const contador   = document.getElementById("contador-turnos");
  const turnos = JSON.parse(localStorage.getItem("turnos") || "[]");
  // Verificar si ya existe un turno en esa fecha y hora
 const turnoExistente = turnos.find(
  t => t.fecha === fecha && t.hora === hora
);
if (turnoExistente) {
  alert(`⚠️ Ya hay un turno a las ${hora} el ${fechaFormateada}. Elegí otro horario.`);
  return; // corta el submit, no guarda ni abre WhatsApp
} 

  if (turnos.length === 0) {
    contador.textContent = "No hay turnos reservados todavía.";
    contenedor.innerHTML = "";
    return;

      
  }

  contador.textContent = `Total de turnos: ${turnos.length}`;

  turnos.sort((a, b) => {
    const fechaHoraA = `${a.fecha} ${a.hora}`;
    const fechaHoraB = `${b.fecha} ${b.hora}`;
    return fechaHoraA.localeCompare(fechaHoraB);
  });

  contenedor.innerHTML = turnos.map(turno => {
    const [anio, mes, dia] = turno.fecha.split("-");
    const fechaMostrar = `${dia}/${mes}/${anio}`;
    return `
      <div class="tarjeta-turno" data-id="${turno.id}">
        <div class="tarjeta-info">
          <strong>👤 ${turno.nombre}</strong>
          <span>💈 ${turno.servicio}</span>
          <span>📅 ${fechaMostrar} &nbsp; 🕐 ${turno.hora}</span>
          ${turno.telefono ? `<span>📞 ${turno.telefono}</span>` : ""}
          ${turno.notas    ? `<span>📝 ${turno.notas}</span>`    : ""}
          <small>Reservado el: ${turno.fechaReserva}</small>
        </div>
        <div class="tarjeta-acciones">
          <button class="btn-whatsapp" onclick="recordatorioWhatsApp(${turno.id})">
            📲 Recordatorio
          </button>
          <button class="btn-eliminar" onclick="eliminarTurno(${turno.id})">
            🗑️ Eliminar
          </button>
        </div>
      </div>
    `;
  }).join("");
}

// ============================================================
// FUNCIÓN: eliminarTurno(id)
// ============================================================
function eliminarTurno(id) {
  if (!confirm("¿Seguro que querés eliminar este turno?")) return;
  let turnos = JSON.parse(localStorage.getItem("turnos") || "[]");
  turnos = turnos.filter(turno => turno.id !== id);
  localStorage.setItem("turnos", JSON.stringify(turnos));
  mostrarTurnos();
}

// ============================================================
// FUNCIÓN: recordatorioWhatsApp(id)
// ============================================================
function recordatorioWhatsApp(id) {
  const turnos = JSON.parse(localStorage.getItem("turnos") || "[]");
  const turno  = turnos.find(t => t.id === id);
  if (!turno) return;

  const [anio, mes, dia] = turno.fecha.split("-");
  const fechaFormateada  = `${dia}/${mes}/${anio}`;

  const mensaje =
    `⏰ *Recordatorio de turno*%0A` +
    `%0A` +
    `Hola ${turno.nombre}! Te recordamos tu turno:%0A` +
    `💈 *Servicio:* ${turno.servicio}%0A` +
    `📅 *Fecha:* ${fechaFormateada}%0A` +
    `🕐 *Hora:* ${turno.hora}%0A` +
    `%0A_¡Te esperamos! ✂️_`;

  abrirWhatsApp(NUMERO_WHATSAPP, mensaje);
}

// ============================================================
// FILTROS EN TIEMPO REAL
// ============================================================
document.getElementById("filtro-nombre").addEventListener("input", filtrarTurnos);
document.getElementById("filtro-fecha").addEventListener("input", filtrarTurnos);

function filtrarTurnos() {
  const buscarNombre = document.getElementById("filtro-nombre").value.toLowerCase().trim();
  const buscarFecha  = document.getElementById("filtro-fecha").value;
  let turnos = JSON.parse(localStorage.getItem("turnos") || "[]");

  const filtrados = turnos.filter(turno => {
    const coincideNombre = turno.nombre.toLowerCase().includes(buscarNombre);
    const coincideFecha  = buscarFecha ? turno.fecha === buscarFecha : true;
    return coincideNombre && coincideFecha;
  });

  const contenedor = document.getElementById("lista-turnos");
  const contador   = document.getElementById("contador-turnos");

  if (filtrados.length === 0) {
    contador.textContent = "No se encontraron turnos con ese filtro.";
    contenedor.innerHTML = "";
    return;
  }

  contador.textContent = `Mostrando ${filtrados.length} turno(s)`;

  contenedor.innerHTML = filtrados.map(turno => {
    const [anio, mes, dia] = turno.fecha.split("-");
    const fechaMostrar = `${dia}/${mes}/${anio}`;
    return `
      <div class="tarjeta-turno" data-id="${turno.id}">
        <div class="tarjeta-info">
          <strong>👤 ${turno.nombre}</strong>
          <span>💈 ${turno.servicio}</span>
          <span>📅 ${fechaMostrar} &nbsp; 🕐 ${turno.hora}</span>
          ${turno.telefono ? `<span>📞 ${turno.telefono}</span>` : ""}
          ${turno.notas    ? `<span>📝 ${turno.notas}</span>`    : ""}
          <small>Reservado el: ${turno.fechaReserva}</small>
        </div>
        <div class="tarjeta-acciones">
          <button class="btn-whatsapp" onclick="recordatorioWhatsApp(${turno.id})">
            📲 Recordatorio
          </button>
          <button class="btn-eliminar" onclick="eliminarTurno(${turno.id})">
            🗑️ Eliminar
          </button>
        </div>
      </div>
    `;
  }).join("");
}

// ============================================================
// INICIALIZACIÓN
// ============================================================
mostrarTurnos();