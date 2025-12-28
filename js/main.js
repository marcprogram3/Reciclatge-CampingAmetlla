// Funcions bàsiques
function searchWaste() {
  const query = $("#searchInput").val();
  if (!query) return;

  $.ajax({
    url: `http://localhost:3000/grok-search?s=${encodeURIComponent(query)}`,
    method: "GET",
    success: function(data) {
      $("#searchResults").html(`
        <div>
          <h3>Resultat de la cerca:</h3>
          <p>${data.message || 'No hi ha informació disponible per aquest residu.'}</p>
        </div>
      `);
    },
    error: function(xhr, status, error) {
      console.error("Error AJAX:", status, error);
      $("#searchResults").html(`
        <div>
          <p>Error: ${status === 404 ? 'Ruta no trobada' : 'Error intern del servidor'}. Intenta de nou o contacta suport.</p>
        </div>
      `);
    }
  });
}

function showSuggestions() {
  const input = $("#searchInput").val().toLowerCase();
  const suggestionsDiv = $("#searchSuggestions");
  suggestionsDiv.html("");
  suggestionsDiv.css("display", input ? "block" : "none");

  if (input) {
    const suggestions = ["ampolla de plàstic", "piles", "paper", "vidre", "orgànics"];
    const filtered = suggestions.filter(s => s.includes(input)).slice(0, 5);
    filtered.forEach(item => {
      const div = $("<div>").text(item).css({
        "cursor": "pointer",
        "transition": "background-color 0.3s ease"
      }).hover(
        function() { $(this).css("background-color", "#E0F7FA"); },
        function() { $(this).css("background-color", ""); }
      ).click(function() {
        $("#searchInput").val(item);
        suggestionsDiv.css("display", "none");
        searchWaste();
      });
      suggestionsDiv.append(div);
    });
  }
}

// Funció per inicialitzar el mapa
// Funció per inicialitzar el mapa (sense zoom, només pan dins dels límits)
function initMap() {
  console.log("Inicialitzant mapa...");
  const map = L.map('map', {
    crs: L.CRS.Simple,
    minZoom: 0,          // Zoom mínim fix
    maxZoom: 0,          // Zoom màxim fix (desactiva el zoom completament)
    zoomControl: false,  // Amaga els botons + / -
    scrollWheelZoom: false, // Desactiva zoom amb la roda del ratolí
    doubleClickZoom: false, // Desactiva zoom amb doble clic
    touchZoom: false,    // Desactiva zoom tàctil
    boxZoom: false,      // Desactiva zoom amb caixa
    keyboard: false,     // Desactiva navegació amb teclat (opcional)
    dragging: true       // Permet el desplaçament (pan)
  }).setView([682, 928], 0);

  const imageUrl = 'assets/mapa-camping-ametlla.jpg';
  const imageBounds = [[0, 0], [1365, 1857]];
  L.imageOverlay(imageUrl, imageBounds).addTo(map);

  // Límits estrictes: no es pot sortir de la imatge
  map.setMaxBounds(imageBounds);
  map.on('drag', function() {
    map.panInsideBounds(imageBounds, { animate: false });
  });

  // Marcadors (containers i seccions) – sense canvis
  const containers = [
    { lat: 565.60, lng: 634.16, image: 'assets/zona-reciclatge-1.jpg', desc: 'Zona de reciclatge 1' },
    { lat: 559.60, lng: 1536.28, image: 'assets/zona-reciclatge-2.jpg', desc: 'Zona de reciclatge 2' }
  ];

  containers.forEach(container => {
    const marker = L.marker([container.lat, container.lng]).addTo(map);
    marker.bindPopup(`
      <div class="bg-[#E8F5E9] p-3 rounded-lg shadow-md text-center">
        <h3 class="text-md font-semibold text-[#1B5E20] mb-1">${container.desc}</h3>
        <div class="flex justify-center items-center mt-1">
          <img src="${container.image}" alt="Contenidor de reciclatge" class="w-32 h-32 object-cover rounded-md shadow-md">
        </div>
      </div>
    `).on('click', function() { this.openPopup(); });
  });

  const seccions = [
    { letter: 'A', lat: 637.60, lng: 1304.25 },
    { letter: 'B', lat: 459.60, lng: 1478.28 },
    { letter: 'C', lat: 437.60, lng: 1384.26 },
    { letter: 'D', lat: 347.60, lng: 1462.27 },
    { letter: 'E', lat: 321.60, lng: 1402.26 },
    { letter: 'F', lat: 317.60, lng: 1344.26 },
    { letter: 'G', lat: 295.60, lng: 1288.25 },
    { letter: 'H', lat: 221.60, lng: 1106.22 },
    { letter: 'I', lat: 359.60, lng: 1580.29 },
    { letter: 'J', lat: 453.60, lng: 1566.29 },
    { letter: 'K', lat: 497.60, lng: 1632.30 },
    { letter: 'L', lat: 557.60, lng: 1682.30 },
    { letter: 'M', lat: 945.60, lng: 1620.29 },
    { letter: 'N', lat: 955.60, lng: 1338.26 },
    { letter: 'P', lat: 897.60, lng: 1002.21 },
    { letter: 'R', lat: 627.60, lng: 1088.22 }
  ];

  seccions.forEach(punt => {
    const marker = L.marker([punt.lat, punt.lng]).addTo(map);
    marker.bindPopup(`
      <div class="bg-[#E8F5E9] p-3 rounded-lg shadow-md text-center">
        <h3 class="text-md font-semibold text-[#1B5E20] mb-1">Secció ${punt.letter}</h3>
        <div class="flex justify-center items-center mt-1">
          <img src="assets/contenidors-bungalows.jpg" alt="Contenidors dels bungalows" class="w-32 h-32 object-cover rounded-md shadow-md">
        </div>
      </div>
    `).on('click', function() { this.openPopup(); });
  });
}

// Funcions per al modal d'imatges
function openModal(imageSrc, caption) {
  console.log("Obrint modal amb imatge:", imageSrc);
  const modal = document.getElementById('imageModal');
  const modalImage = document.getElementById('modalImage');
  const modalCaption = document.getElementById('modalCaption');
  if (modal && modalImage && modalCaption) {
    modalImage.src = imageSrc;
    modalImage.style.opacity = '0';
    modalCaption.textContent = caption;
    modal.classList.add('show');
    document.getElementById('map').style.display = 'none';
    modalImage.onload = function() {
      modalImage.style.opacity = '1';
    };
  } else {
    console.error("Elements del modal no trobats en el DOM");
  }
}

function closeModal(event) {
  console.log("Tancant modal:", event);
  event = event || window.event;
  if (event) event.stopPropagation();
  const modal = document.getElementById('imageModal');
  if (modal) {
    modal.classList.remove('show');
    document.getElementById('map').style.display = 'block';
  }
}

// Canvi d'idioma de la guia (executat després de carregar la secció)
function initLanguageSelector() {
  const select = document.getElementById('language-select');
  if (select) {
    select.addEventListener('change', function() {
      const selected = this.value;
      const imageMap = {
        catalan: 'assets/recycling-guide-catalan.jpg',
        castellano: 'assets/recycling-guide-castellano.jpg',
        english: 'assets/recycling-guide-english.jpg',
        french: 'assets/recycling-guide-french.jpg'
      };
      document.getElementById('guide-image').src = imageMap[selected];
    });
  }
}