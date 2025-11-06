let productos = [];
let carrito = [];

// --- Cargar productos desde la base de datos (automático: local o producción) ---
async function cargarProductos() {
  try {
    // Detecta si estás en localhost o en producción
    const API_BASE_URL = window.location.hostname.includes("localhost")
      ? "http://localhost:3000" // cuando pruebas en tu PC
      : "https://avarjoyas-api.onrender.com"; // cuando tu web está en línea

    const respuesta = await fetch(`${API_BASE_URL}/api/productos`);
    const data = await respuesta.json();

    // asegurar que precio sea Number y no string
    productos = data.map(p => ({ ...p, precio: Number(p.precio) }));

    // Muestra el catálogo con la lista recibida
    mostrarCatalogo(productos);
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
cargarProductos();

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

  mostrarCatalogo();
  actualizarCarrito();
}

function actualizarCarrito() {
  let carritoDiv = document.getElementById("itemsCarrito");
  carritoDiv.innerHTML = "";

  let total = 0;
  carrito.forEach((prod, index) => {
    total += prod.precio * prod.cantidad;

    let li = document.createElement("li");
    li.innerHTML = `
      <img src="${prod.imagen}" alt="${prod.nombre}">
      <div class="item-info">
        <strong>${prod.nombre}</strong><br>
        x${prod.cantidad} - $${(prod.precio * prod.cantidad).toLocaleString('es-ES')}
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

// --- Cargar catálogo inicial ---
mostrarCatalogo();

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
// --- Menú hamburguesa ---
const menuToggle = document.getElementById("menuToggle");
const nav = document.querySelector("nav");

menuToggle.addEventListener("click", () => {
  nav.classList.toggle("activo");
});

// Cerrar el menú al hacer clic en un enlace
document.querySelectorAll("nav a").forEach(link => {
  link.addEventListener("click", () => {
    nav.classList.remove("activo");
  });
});
