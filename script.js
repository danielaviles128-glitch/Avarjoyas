let productos = [];
let carrito = [];

// --- Cargar productos desde la base de datos (automático: local o producción) ---
async function cargarProductos() {
  try {
    const API_BASE_URL = window.location.hostname.includes("localhost")
      ? "http://localhost:3000"
      : "https://avarjoyas-api.onrender.com";

    const respuesta = await fetch(`${API_BASE_URL}/api/productos`);
    const data = await respuesta.json();

    // Asegurar que precio sea numérico
    productos = data.map(p => ({ ...p, precio: Number(p.precio) }));

    // Detectar si estamos en el index o en otra página
    const esIndex =
      window.location.pathname.includes("index.html") ||
      window.location.pathname === "/" ||
      window.location.pathname === "/index";

    let productosAMostrar;

    if (esIndex) {
      // Solo mostrar productos de nueva colección
      productosAMostrar = productos.filter(p => p.nueva_coleccion === true);
    } else {
      // En catálogo u otras páginas, mostrar todo
      productosAMostrar = productos;
    }

    mostrarCatalogo(productosAMostrar);
  } catch (error) {
    console.error("❌ Error al cargar productos:", error);
    document.getElementById("catalogo").innerHTML = `
      <p style="color:red; text-align:center;">No se pudo conectar con la base de datos</p>
    `;
  }
}

// --- Mostrar catálogo ---
function mostrarCatalogo(lista = productos) {
  const catalogoDiv = document.getElementById("catalogo");
  catalogoDiv.innerHTML = "";


  lista.forEach(prod => {
    const div = document.createElement("div");
    div.classList.add("producto");
    div.innerHTML = `
      <img src="${prod.imagen.split(',')[0].trim()}" alt="${prod.nombre}" onclick="abrirLightbox(${prod.id},0)">
      <h3>${prod.nombre}</h3>
      <p>$${prod.precio.toLocaleString('es-ES')}</p>
      <p>Stock: ${prod.stock}</p>
      <button onclick="agregarAlCarrito(${prod.id})" ${prod.stock === 0 ? "disabled" : ""}>
        ${prod.stock === 0 ? "Agotado" : "Agregar al carrito"}
      </button>
    `;

    // ✅ La animación debe ir dentro del forEach (donde sí existe div)
    setTimeout(() => {
      div.classList.add("visible");
    }, 100);

    catalogoDiv.appendChild(div);
  });
}

// --- Ejecutar la carga al inicio ---
// Solo carga los productos si existe la sección catálogo
if (document.getElementById("catalogo")) {
  cargarProductos();
  mostrarCatalogo();
}


// --- Carrito ---
function agregarAlCarrito(id) {
  let prod = productos.find(p => p.id === id);
  if (!prod || prod.stock <= 0) return;

  let enCarrito = carrito.find(p => p.id === id);
  if (enCarrito) {
    enCarrito.cantidad++;
  } else {
    carrito.push({ ...prod, cantidad: 1 });
  }
  prod.stock--;
  actualizarStockServidor(id, 1, "reducir-stock");

  mostrarCatalogo();
  actualizarCarrito();
}

function actualizarCarrito() {
  let carritoDiv = document.getElementById("itemsCarrito");
  carritoDiv.innerHTML = "";

  let total = 0;
  carrito.forEach((prod, index) => {
    total += prod.precio * prod.cantidad;

    let imagenPrincipal = prod.imagen.split(",")[0].trim(); // ✅ toma la primera imagen válida

    let li = document.createElement("li");
    li.classList.add("cart-item");
    li.innerHTML = `
      <img src="${imagenPrincipal}" alt="${prod.nombre}">
      <div class="item-info">
        <strong>${prod.nombre}</strong><br>
        x${prod.cantidad} — $${(prod.precio * prod.cantidad).toLocaleString('es-ES')}
      </div>
      <button class="remove-btn" onclick="eliminarDelCarrito(${index})">❌</button>
    `;
    carritoDiv.appendChild(li);
  });

  document.getElementById("totalCarrito").innerText = total.toLocaleString('es-ES');
  document.getElementById("contadorCarrito").innerText = carrito.length;
}

function eliminarDelCarrito(index) {
  // devolver stock al producto eliminado
  let eliminado = carrito[index];
  let prod = productos.find(p => p.id === eliminado.id);
  if (prod) prod.stock += eliminado.cantidad;
  actualizarStockServidor(eliminado.id, eliminado.cantidad, "aumentar-stock");

  carrito.splice(index, 1);
  mostrarCatalogo();
  actualizarCarrito();
}
// --- Lightbox (solo manual) ---
function abrirLightbox(id, index = 0) {
  const producto = productos.find(p => p.id === id);
  if (!producto) return;

  const imagenes = producto.imagen.split(",").map(img => img.trim());
  productoActual = id;
  indiceActual = index;
  
  document.getElementById("lightboxImg").src = imagenes[indiceActual];
  document.getElementById("lightbox").style.display = "flex";

  // Guarda temporalmente las imágenes del producto
  window.imagenesActuales = imagenes;
}

function cerrarLightbox() {
  document.getElementById("lightbox").style.display = "none";
}

function cambiarImagen(direccion) {
  if (!window.imagenesActuales) return;
  indiceActual += direccion;

  if (indiceActual < 0) indiceActual = window.imagenesActuales.length - 1;
  if (indiceActual >= window.imagenesActuales.length) indiceActual = 0;

  document.getElementById("lightboxImg").src = window.imagenesActuales[indiceActual];
}

// --- Modal del carrito ---
document.getElementById("carritoFlotante").addEventListener("click", function () {
  document.getElementById("modalCarrito").classList.add("activo");
});

function cerrarModal() {
  document.getElementById("modalCarrito").classList.remove("activo");
}

// --- Enviar pedido por WhatsApp ---
function enviarPedido() {
  if (carrito.length === 0) {
    alert("Tu carrito está vacío");
    return;
  }

  let mensaje = "Hola, quiero pedir:\n";
  carrito.forEach(p => {
    mensaje += `- ${p.nombre} x${p.cantidad} = $${(p.precio * p.cantidad).toLocaleString('es-ES')}\n`;
  });
  mensaje += `\nTotal: $${document.getElementById("totalCarrito").innerText}`;

  let url = `https://wa.me/573214069288?text=${encodeURIComponent(mensaje)}`;
  window.open(url, "_blank");
}

// --- scroll header ---

window.addEventListener("scroll", function() {
  const header = document.querySelector("header");
  if (window.scrollY > 50) {
    header.classList.add("scrolled");
  } else {
    header.classList.remove("scrolled");
  }
});


// --- FILTRO Y BÚSQUEDA ---
function filtrarProductos() {
  let texto = document.getElementById("buscador").value.toLowerCase();
  let categoria = document.getElementById("filtroCategoria").value;

  let filtrados = productos.filter(p => {
    let coincideTexto = p.nombre.toLowerCase().includes(texto);
    let coincideCategoria = categoria ? p.categoria === categoria : true;
    return coincideTexto && coincideCategoria;
  });

  mostrarCatalogo(filtrados);
}

const menuToggle = document.getElementById("menuToggle");
const nav = document.querySelector("nav");
const overlayMenu = document.getElementById("overlayMenu");

// Abrir / cerrar menú
menuToggle.addEventListener("click", () => {
  const isOpen = nav.classList.toggle("activo");
  overlayMenu.classList.toggle("activo");

  menuToggle.textContent = isOpen ? "✕" : "☰";
});

// Cerrar al hacer clic FUERA
overlayMenu.addEventListener("click", () => {
  nav.classList.remove("activo");
  overlayMenu.classList.remove("activo");
  menuToggle.textContent = "☰";
});

// Cerrar al hacer clic en un enlace del menú
document.querySelectorAll("nav a").forEach(link => {
  link.addEventListener("click", () => {
    nav.classList.remove("activo");
    overlayMenu.classList.remove("activo");
    menuToggle.textContent = "☰";
  });
});
const cerrarMenu = document.getElementById("cerrarMenu");

cerrarMenu.addEventListener("click", () => {
  nav.classList.remove("activo");
  overlayMenu.classList.remove("activo");
  menuToggle.textContent = "☰";
});



document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("form-suscripcion");
  const input = form?.querySelector("input[type='email']");
  const mensaje = document.getElementById("mensaje-suscripcion");

  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = input.value.trim();

    if (!email) {
      mensaje.textContent = "Por favor ingresa un correo válido.";
      mensaje.style.color = "red";
      return;
    }

    try {
      const response = await fetch("https://avarjoyas-api.onrender.com/api/suscribirse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      mensaje.textContent = data.message || data.error;
      mensaje.style.color = data.error ? "red" : "#4B3C33";

      if (!data.error) form.reset();
    } catch (err) {
      console.error("Error al enviar suscripción:", err);
      mensaje.textContent = "Hubo un error al registrar tu correo.";
      mensaje.style.color = "red";
    }
  });
});

// === SLIDER DE TEXTO HORIZONTAL CON PUNTOS ===
document.addEventListener("DOMContentLoaded", () => {
  const slides = document.querySelectorAll(".inicio-slider .text-slide");
  const wrapper = document.querySelector(".slider-text-wrapper");
  const dotsContainer = document.querySelector(".slider-dots");
  let index = 0;
  let intervalo;

  if (!slides.length || !wrapper) return; // evita errores si no existe el slider

  // Crear puntos dinámicos
  slides.forEach((_, i) => {
    const dot = document.createElement("button");
    if (i === 0) dot.classList.add("active");
    dot.addEventListener("click", () => {
      index = i;
      actualizarSlider();
      reiniciarSlider();
    });
    dotsContainer.appendChild(dot);
  });

  const dots = dotsContainer.querySelectorAll("button");

  function actualizarSlider() {
    wrapper.style.transform = `translateX(-${index * 100}%)`;
    slides.forEach((slide, i) => {
      slide.classList.toggle("active", i === index);
    });
    dots.forEach((dot, i) => {
      dot.classList.toggle("active", i === index);
    });
  }

  function siguienteSlide() {
    index = (index + 1) % slides.length;
    actualizarSlider();
  }

  function iniciarSlider() {
    intervalo = setInterval(siguienteSlide, 5000);
  }

  function reiniciarSlider() {
    clearInterval(intervalo);
    iniciarSlider();
  }

  actualizarSlider();
  iniciarSlider();
});

const formContacto = document.getElementById("form-contacto");

if (formContacto) {
  formContacto.addEventListener("submit", async (e) => {
    e.preventDefault();

    const nombre = document.getElementById("nombre").value.trim();
    const email = document.getElementById("correo").value.trim();
    const mensaje = document.getElementById("mensaje").value.trim();
    const estado = document.getElementById("estado-mensaje");

    estado.textContent = "Enviando mensaje... ⏳";
    estado.style.color = "#d4a017";

    try {
      const respuesta = await fetch("https://avarjoyas-api.onrender.com/api/contacto", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre, email, mensaje }),
      });

      const data = await respuesta.json();

      if (respuesta.ok) {
        estado.textContent = "✅ ¡Mensaje enviado correctamente!";
        estado.style.color = "green";
        formContacto.reset();
      } else {
        estado.textContent = `❌ ${data.error || "Error al enviar el mensaje."}`;
        estado.style.color = "red";
      }
    } catch (error) {
      estado.textContent = "⚠️ Error de conexión con el servidor.";
      estado.style.color = "red";
    }
  });
}
async function actualizarStockServidor(id, cantidad, accion) {
  const API_BASE_URL = window.location.hostname.includes("localhost")
    ? "http://localhost:3000"
    : "https://avarjoyas-api.onrender.com";

  try {
    const respuesta = await fetch(`${API_BASE_URL}/api/productos/${id}/${accion}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cantidad })
    });

    const data = await respuesta.json();
    console.log("Stock actualizado en servidor:", data);

  } catch (error) {
    console.error("❌ Error actualizando stock en servidor:", error);
  }
}