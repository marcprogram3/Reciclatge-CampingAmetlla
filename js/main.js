// =====================================================================
// MAIN.JS - Camping Ametlla Reciclatge
// Versió professional amb missatges nets (sense referències tècniques)
// =====================================================================

// ==================== BLOQUEIG DE RECÀRREGUES ====================
(function() {
    console.log("🛡️ Activant sistema anti-recàrrega...");
    
    document.addEventListener('submit', function(e) {
        e.preventDefault();
        e.stopPropagation();
        return false;
    }, true);
    
    document.addEventListener('click', function(e) {
        const target = e.target;
        if (target.tagName === 'A' && target.getAttribute('href') === '#') {
            e.preventDefault();
            e.stopPropagation();
            return false;
        }
    }, true);
    
    if (window.location.reload) {
        const originalReload = window.location.reload;
        window.location.reload = function() {
            console.error("🚫 window.location.reload() bloquejat!");
            return false;
        };
    }
})();

// ==================== CERCA DE RESIDUS ====================
window.searchWaste = function() {
    console.log("🔍 Executant searchWaste()");
    
    const query = document.getElementById('searchInput')?.value.trim();
    
    if (!query) {
        const resultsDiv = document.getElementById('searchResults');
        if (resultsDiv) {
            resultsDiv.innerHTML = `
                <div class="bg-yellow-100 border-l-4 border-yellow-500 p-4 rounded mt-4">
                    <p class="font-bold text-yellow-800">✏️ Escriu alguna cosa per cercar</p>
                    <p class="text-yellow-700">Ex: ampolla, piles, paper, vidre...</p>
                </div>
            `;
        }
        return false;
    }

    // Mostrar loading
    const resultsDiv = document.getElementById('searchResults');
    if (resultsDiv) {
        resultsDiv.innerHTML = `
            <div class="text-center py-4">
                <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
                <p class="mt-2">Cercant "${query}"...</p>
            </div>
        `;
    }

    // Fer petició AJAX
    fetch(`http://localhost:5050/search?s=${encodeURIComponent(query)}`)
        .then(response => {
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            return response.json();
        })
        .then(data => {
            console.log("✅ Resposta rebuda");
            
            // ✅ NOMÉS mostrem el missatge net (sense capçalera tècnica)
            let html = '';
            
            if (data.message) {
                // Convertir salt de línia a <br> i preservar negretes
                const formattedMessage = data.message
                    .replace(/\n/g, '<br>')
                    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
                
                html = `
                    <div class="bg-white border-l-4 border-green-600 p-5 rounded-lg shadow-md mt-4">
                        <div class="prose max-w-none text-gray-800" style="font-family: inherit; line-height: 1.6;">
                            ${formattedMessage}
                        </div>
                    </div>
                `;
            } else {
                html = `
                    <div class="bg-red-100 border-l-4 border-red-600 p-4 rounded mt-4">
                        <p class="text-red-700">No s'ha pogut obtenir informació per aquest residu.</p>
                        <p class="text-sm text-red-600 mt-2">Prova amb un altre terme o consulta el punt d'informació del càmping.</p>
                    </div>
                `;
            }
            
            if (resultsDiv) resultsDiv.innerHTML = html;
            
            // Amagar suggeriments
            const suggestionsDiv = document.getElementById('searchSuggestions');
            if (suggestionsDiv) suggestionsDiv.style.display = 'none';
        })
        .catch(error => {
            console.error("❌ Error:", error);
            if (resultsDiv) {
                resultsDiv.innerHTML = `
                    <div class="bg-red-100 border-l-4 border-red-600 p-4 rounded mt-4">
                        <p class="font-bold text-red-800">❌ Error en la cerca</p>
                        <p class="text-red-700">No s'ha pogut connectar amb el servidor.</p>
                        <p class="text-sm mt-2">Si el problema persisteix, consulta a recepció.</p>
                    </div>
                `;
            }
        });
    
    return false;
};

// ==================== CONNECTAR EVENTS DE CERCA ====================
window.connectSearchEvents = function() {
    console.log("🔌 Connectant events de cerca...");
    
    const searchButton = document.getElementById('searchButton');
    const searchInput = document.getElementById('searchInput');
    
    if (searchButton) {
        // Eliminar event listeners antics clonant
        const newButton = searchButton.cloneNode(true);
        searchButton.parentNode.replaceChild(newButton, searchButton);
        
        newButton.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log("🔘 Botó de cerca clicat");
            window.searchWaste();
        });
    }
    
    if (searchInput) {
        // Eliminar event listeners antics clonant
        const newInput = searchInput.cloneNode(true);
        searchInput.parentNode.replaceChild(newInput, searchInput);
        
        newInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                e.stopPropagation();
                console.log("⌨️ Enter pressionat");
                window.searchWaste();
            }
        });
        
        newInput.addEventListener('input', function() {
            window.showSuggestions();
        });
    }
    
    console.log("✅ Events de cerca connectats");
};

// ==================== SUGGERIMENTS DE CERCA ====================
window.showSuggestions = function() {
    const input = document.getElementById('searchInput');
    const suggestionsDiv = document.getElementById('searchSuggestions');
    
    if (!input || !suggestionsDiv) return;
    
    const query = input.value.toLowerCase().trim();
    suggestionsDiv.innerHTML = '';
    
    if (query) {
        const suggestions = [
            "ampolla de vidre",
            "ampolla de plàstic",
            "llauna",
            "piles",
            "paper",
            "cartró",
            "diari",
            "revista",
            "vidre",
            "orgànic",
            "restes de menjar",
            "brick de llet",
            "brick de suc",
            "tap de suro",
            "roba",
            "oli de cuina",
            "bombetes",
            "pila botó",
            "taps de plàstic",
            "envasos de iogurt"
        ];
        
        const filtered = suggestions.filter(s => s.includes(query)).slice(0, 6);
        
        if (filtered.length > 0) {
            suggestionsDiv.style.display = 'block';
            filtered.forEach(item => {
                const div = document.createElement('div');
                div.textContent = item;
                div.className = 'suggestion-item';
                div.style.cssText = 'padding: 10px 15px; cursor: pointer; border-bottom: 1px solid #e5e7eb; background: white; transition: background 0.2s;';
                div.onmouseenter = () => div.style.backgroundColor = '#E0F7FA';
                div.onmouseleave = () => div.style.backgroundColor = 'white';
                div.onclick = () => {
                    input.value = item;
                    suggestionsDiv.style.display = 'none';
                    window.searchWaste();
                };
                suggestionsDiv.appendChild(div);
            });
        } else {
            suggestionsDiv.style.display = 'none';
        }
    } else {
        suggestionsDiv.style.display = 'none';
    }
};

// ==================== MAPA INTERACTIU (VERSIÓ FINAL AMB CANVIS SOL·LICITATS) ====================
window.initMap = function() {
    console.log("🗺️ Inicialitzant mapa millorat...");
    
    setTimeout(function() {
        if (typeof L === 'undefined') {
            console.error("Leaflet no està carregat");
            return;
        }
        
        const mapContainer = document.getElementById('map');
        if (!mapContainer) {
            console.error("Element #map no trobat");
            return;
        }
        
        if (mapContainer._leaflet_id) {
            console.log("Mapa ja inicialitzat");
            return;
        }
        
        const map = L.map('map', {
            crs: L.CRS.Simple,
            minZoom: 0,
            maxZoom: 0,
            zoomControl: false,
            scrollWheelZoom: false,
            doubleClickZoom: false,
            touchZoom: false,
            boxZoom: false,
            keyboard: false,
            dragging: true
        }).setView([682, 928], 0);
        
        const imageUrl = 'assets/mapa-camping-ametlla.jpg';
        const imageBounds = [[0, 0], [1365, 1857]];
        
        L.imageOverlay(imageUrl, imageBounds).addTo(map);
        map.setMaxBounds(imageBounds);
        
        map.on('drag', function() {
            map.panInsideBounds(imageBounds, { animate: false });
        });
        
        // ==================== ESTILS PERSONALITZATS PER ALS POPUPS ====================
        if (!document.getElementById('popup-styles')) {
            const popupStyles = document.createElement('style');
            popupStyles.id = 'popup-styles';
            popupStyles.textContent = `
                .custom-popup .leaflet-popup-content-wrapper {
                    background: white;
                    border-radius: 16px;
                    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
                    padding: 0;
                    overflow: hidden;
                    max-width: 380px;
                    min-width: 320px;
                }
                
                .custom-popup .leaflet-popup-content {
                    margin: 0;
                    padding: 0;
                    width: 100% !important;
                }
                
                .custom-popup .leaflet-popup-tip {
                    background: white;
                    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
                }
                
                .popup-container {
                    font-family: 'Barlow', sans-serif;
                }
                
                .popup-header {
                    background: linear-gradient(135deg, #1B5E20, #2E7D32);
                    padding: 16px 20px;
                    text-align: center;
                }
                
                .popup-header h3 {
                    color: white;
                    margin: 0;
                    font-size: 1.25rem;
                    font-weight: 600;
                }
                
                .popup-header p {
                    color: rgba(255, 255, 255, 0.9);
                    margin: 5px 0 0;
                    font-size: 0.85rem;
                }
                
                .popup-image {
                    padding: 20px;
                    background: #f8f9fa;
                    text-align: center;
                    border-bottom: 1px solid #e9ecef;
                }
                
                .popup-image img {
                    width: 100%;
                    max-width: 280px;
                    height: 180px;
                    object-fit: cover;
                    border-radius: 12px;
                    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
                    cursor: pointer;
                    transition: all 0.3s ease;
                }
                
                .popup-image img:hover {
                    transform: scale(1.02);
                    box-shadow: 0 12px 28px rgba(0, 0, 0, 0.2);
                }
                
                .popup-info {
                    padding: 16px 20px;
                    background: white;
                }
                
                .popup-info p {
                    margin: 0 0 8px 0;
                    font-size: 0.95rem;
                    line-height: 1.5;
                    color: #2d3748;
                }
                
                .popup-info .icon {
                    display: inline-block;
                    width: 24px;
                    margin-right: 8px;
                    font-size: 1.1rem;
                }
                
                .popup-footer {
                    background: #f8f9fa;
                    padding: 12px 20px;
                    text-align: center;
                    border-top: 1px solid #e9ecef;
                }
                
                .popup-footer button {
                    background: linear-gradient(135deg, #1B5E20, #2E7D32);
                    color: white;
                    border: none;
                    padding: 8px 20px;
                    border-radius: 25px;
                    font-size: 0.9rem;
                    font-weight: 500;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    font-family: 'Barlow', sans-serif;
                }
                
                .popup-footer button:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 4px 12px rgba(27, 94, 32, 0.3);
                }
                
                .expand-link {
                    display: inline-block;
                    margin-top: 8px;
                    font-size: 0.8rem;
                    color: #2E7D32;
                    text-decoration: none;
                    cursor: pointer;
                    font-weight: 500;
                }
                
                .expand-link:hover {
                    text-decoration: underline;
                }
            `;
            document.head.appendChild(popupStyles);
        }
        
        function createProfessionalPopup(title, subtitle, imageSrc, description, extraInfo, modalTitle) {
            return `
                <div class="popup-container">
                    <div class="popup-header">
                        <h3>${title}</h3>
                        ${subtitle ? `<p>${subtitle}</p>` : ''}
                    </div>
                    <div class="popup-image">
                        <img src="${imageSrc}" alt="${title}" onclick="window.openModal('${imageSrc}', '${modalTitle || title}')">
                        <a class="expand-link" onclick="window.openModal('${imageSrc}', '${modalTitle || title}')">🔍 Ampliar imatge</a>
                    </div>
                    <div class="popup-info">
                        ${description ? `<p><span class="icon">📍</span> ${description}</p>` : ''}
                        ${extraInfo ? `<p><span class="icon">♻️</span> ${extraInfo}</p>` : ''}
                    </div>
                    <div class="popup-footer">
                        <button onclick="window.openModal('${imageSrc}', '${modalTitle || title}')">Veure detall</button>
                    </div>
                </div>
            `;
        }
        
        // ==================== PUNTS DE RECICLATGE PRINCIPALS ====================
        const containers = [
            { 
                lat: 565.60, 
                lng: 634.16, 
                image: 'assets/zona-reciclatge-1.jpg', 
                title: 'Zona de Reciclatge 1',
                subtitle: 'Punt verd principal',
                description: 'Punt de reciclatge amb contenidors per a tots els tipus de residus.',
                extraInfo: 'Contenidors: envasos (groc), paper/cartró (blau) i vidre (verd).'
            },
            { 
                lat: 559.60, 
                lng: 1536.28, 
                image: 'assets/zona-reciclatge-2.jpg', 
                title: 'Zona de Reciclatge 2',
                subtitle: 'Punt verd secundari',
                description: 'Punt de reciclatge addicional per a la comoditat dels visitants.',
                extraInfo: 'Contenidors: envasos (groc), paper/cartró (blau) i vidre (verd).'
            }
        ];
        
        containers.forEach(container => {
            const popupContent = createProfessionalPopup(
                container.title,
                container.subtitle,
                container.image,
                container.description,
                container.extraInfo,
                container.title
            );
            
            L.marker([container.lat, container.lng])
                .addTo(map)
                .bindPopup(popupContent, { className: 'custom-popup', maxWidth: 380 })
                .on('click', function() { this.openPopup(); });
        });
        
        // ==================== SECCIONS DEL CÀMPING ====================
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
            const popupContent = createProfessionalPopup(
                `Secció ${punt.letter}`,
                'Punt de reciclatge de proximitat',
                'assets/contenidors-bungalows.jpg',
                `Punt de reciclatge ubicat a la Secció ${punt.letter}.`,
                'Contenidors: envasos (groc), paper/cartró (blau) i vidre (verd).',
                `Contenidors Secció ${punt.letter}`
            );
            
            L.marker([punt.lat, punt.lng])
                .addTo(map)
                .bindPopup(popupContent, { className: 'custom-popup', maxWidth: 380 })
                .on('click', function() { this.openPopup(); });
        });
        
        console.log("✅ Mapa inicialitzat correctament amb " + (containers.length + seccions.length) + " marcadors");
        
    }, 200);
};

// ==================== SELECTOR D'IDIOMA ====================
window.initLanguageSelector = function() {
    console.log("🌐 Inicialitzant selector d'idioma");
    
    const select = document.getElementById('language-select');
    if (!select) return;
    
    const newSelect = select.cloneNode(true);
    select.parentNode.replaceChild(newSelect, select);
    
    newSelect.addEventListener('change', function() {
        const selected = this.value;
        const imageMap = {
            catalan: 'assets/recycling-guide-catalan.jpg',
            castellano: 'assets/recycling-guide-castellano.jpg',
            english: 'assets/recycling-guide-english.jpg',
            french: 'assets/recycling-guide-french.jpg'
        };
        
        const guideImage = document.getElementById('guide-image');
        if (guideImage) {
            guideImage.src = imageMap[selected];
        }
    });
};

// ==================== MODAL D'IMATGES ====================
window.openModal = function(imageSrc, caption) {
    console.log("🖼️ Obrint modal");
    
    const modal = document.getElementById('imageModal');
    const modalImage = document.getElementById('modalImage');
    const modalCaption = document.getElementById('modalCaption');
    
    if (modal && modalImage) {
        modalImage.src = imageSrc;
        if (modalCaption) modalCaption.textContent = caption || '';
        modal.classList.remove('hidden');
        
        const mapElement = document.getElementById('map');
        if (mapElement) mapElement.style.display = 'none';
    }
};

window.closeModal = function(event) {
    if (event) event.stopPropagation();
    
    const modal = document.getElementById('imageModal');
    if (modal) modal.classList.add('hidden');
    
    const mapElement = document.getElementById('map');
    if (mapElement) mapElement.style.display = 'block';
};

// ==================== INICIALITZACIÓ GLOBAL ====================
$(document).ready(function() {
    console.log("✅ jQuery llest, main.js carregat");
    
    // Amagar suggeriments en fer clic fora
    $(document).on('click', function(e) {
        if (!$(e.target).closest('#searchInput, #searchSuggestions').length) {
            $('#searchSuggestions').hide();
        }
    });
});

// ==================== ESTILS ADDICIONALS ====================
if (!document.getElementById('custom-styles')) {
    const style = document.createElement('style');
    style.id = 'custom-styles';
    style.textContent = `
        .animate-spin {
            animation: spin 1s linear infinite;
        }
        @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
        }
        .prose {
            font-family: inherit;
            line-height: 1.6;
        }
        .suggestion-item:hover {
            background-color: #E0F7FA !important;
        }
    `;
    document.head.appendChild(style);
}

console.log("🎯 MAIN.JS COMPLET CARREGAT - Mode professional activat");