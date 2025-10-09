// --- Inventario de productos ---
let productos = [
  { id: 1, nombre: "Set Collar Trebol Blanco (Collar + Aretes)", precio: 30000, categoria: "collar", stock: 1, imagen: "img/Collartrebolblanco_1.jpeg" },
  { id: 5, nombre: "Collar de corazón y huella perrito (Collar + Aretes)", precio: 30000, categoria: "collar", stock: 1, imagen: "img/Huellaperrito.jpeg" },
  { id: 6, nombre: "Collar y Aretes Corazón Punzante", precio: 21000, categoria: "collar", stock: 1, imagen: "img/Corazoespada.jpeg" },
  { id: 9, nombre: "Pulsera Mariposa Zirconia Rosa", precio: 18000, categoria: "pulseras", stock: 1, imagen: "img/Pulseramariposa2.jpeg" },
  { id: 10, nombre: "Pulsera Dúo Mágico", precio: 25000, categoria: "pulseras", stock: 1, imagen: "img/Pandora3.jpeg" },
  { id: 11, nombre: "Pulsera Armonía Dual", precio: 20000, categoria: "pulseras", stock: 1, imagen: "img/Pulserayinyang.jpeg" },
  { id: 14, nombre: "Pulsera unisex Dúo Nocturno", precio: 15000, categoria: "pulseras", stock: 2, imagen: "img/pulserahombre.jpeg" },
  { id: 15, nombre: "Argollas Coral", precio: 15000, categoria: "aretes", stock: 1, imagen: "img/aretesrojos.jpeg" },
  { id: 16, nombre: "Anillo Color Block", precio: 15000, categoria: "anillos", stock: 1, imagen: "img/anillo.jpeg" },
];

// --- Imágenes adicionales para el lightbox ---
let imagenesProducto = {
  1: ["img/Collartrebolblanco_1.jpeg", "img/Collartrebolblanco_2.jpeg", "img/Collartrebolblanco_3.jpeg"],
  5: ["img/Huellaperrito.jpeg", "img/huellaperrito1.jpeg"],
  6: ["img/Corazoespada.jpeg", "img/Corazoespada1.jpeg"],
  9: ["img/Pulseramariposa2.jpeg", "img/Pulseramariposa1.jpeg", "img/Pulseramariposa.jpeg"],
  10: ["img/Pandora3.jpeg", "img/Pandora1.jpeg", "img/Pandora2.jpeg", "img/Pandora.jpeg"],
  11: ["img/Pulserayinyang.jpeg", "img/Pulserayinyang1.jpeg", "img/Pulserayinyang2.jpeg"],
  14: ["img/pulserahombre.jpeg", "img/Avar.jpeg"],
  15: ["img/aretesrojos.jpeg", "img/aretesrojos1.jpeg"],
  16: ["img/anillo.jpeg", "img/anillo1.jpeg", "img/anillo2.jpeg"],
};

// --- Variables globales ---
let carrito = [];
let indiceActual = 0;
let productoActual = 0;

// --- Mostrar catálogo ---
function mostrarCatalogo(lista = productos) {
  let catalogoDiv = document.getElementById("catalogo");
  catalogoDiv.innerHTML = "";

  lista.forEach(prod => {
    let div = document.createElement("div");
    div.classList.add("producto");
    div.innerHTML = `
      <img src="${prod.imagen}" alt="${prod.nombre}" onclick="abrirLightbox(${prod.id},0)">
      <h3>${prod.nombre}</h3>
      <p>$${prod.precio.toLocaleString()}</p>
      <p>Stock: ${prod.stock}</p>
      <button onclick="agregarAlCarrito(${prod.id})" ${prod.stock === 0 ? "disabled" : ""}>
        ${prod.stock === 0 ? "Agotado" : "Agregar al carrito"}
      </button>
    `;
    catalogoDiv.appendChild(div);

    // Animación de aparición
    setTimeout(() => {
      div.classList.add("visible");
    }, 100);
  });
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
        x${prod.cantidad} - $${(prod.precio * prod.cantidad).toLocaleString()}
      </div>
      <button class="remove-btn" onclick="eliminarDelCarrito(${index})">❌</button>
    `;
    carritoDiv.appendChild(li);
  });

  document.getElementById("totalCarrito").innerText = total.toLocaleString();
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
  productoActual = id;
  indiceActual = index;
  document.getElementById("lightboxImg").src = imagenesProducto[id][index];
  document.getElementById("lightbox").style.display = "flex";
}

function cerrarLightbox() {
  document.getElementById("lightbox").style.display = "none";
}

function cambiarImagen(direccion) {
  indiceActual += direccion;
  let imgs = imagenesProducto[productoActual];
  if (indiceActual < 0) indiceActual = imgs.length - 1;
  if (indiceActual >= imgs.length) indiceActual = 0;
  document.getElementById("lightboxImg").src = imgs[indiceActual];
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
    mensaje += `- ${p.nombre} x${p.cantidad} = $${(p.precio * p.cantidad).toLocaleString()}\n`;
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
