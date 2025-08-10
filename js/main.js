/* =================================================================
   MAIN.JS - Final Unified JavaScript with Slider and Products
   ================================================================= */

// --- Firebase Configuration (Global) ---
const firebaseConfig = {
    apiKey: "AIzaSyBKK4FmXtcMniVv6_5-mFPBJICwEM5Dkzc",
    authDomain: "nasir-9102c.firebaseapp.com",
    projectId: "nasir-9102c",
    storageBucket: "nasir-9102c.firebasestorage.app",
    messagingSenderId: "182224792140",
    appId: "1:182224792140:web:42348e8b24f94cdf07e2e9",
    measurementId: "G-8R5J241MJM"
};

let app;
let db;

// --- Lazy initialization of Firebase ---
async function initializeFirebase() {
    if (!app) {
        const { initializeApp } = await import("https://www.gstatic.com/firebasejs/9.6.10/firebase-app.js");
        const { getFirestore } = await import("https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js");
        app = initializeApp(firebaseConfig);
        db = getFirestore(app);
    }
    return db;
}


// --- SHARED & COMMON FUNCTIONS ---

function updateCartCount() {
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    const countElement = document.querySelector('.cart-item-count');
    if (countElement) {
        countElement.textContent = totalItems;
        countElement.style.display = totalItems > 0 ? 'block' : 'none';
    }
}

function renderSocialLinks(links) {
    const container = document.getElementById('social-links');
    if (!links || !container) return;
    let html = '';
    if (links.facebook) html += `<a href="${links.facebook}" target="_blank" rel="noopener noreferrer" aria-label="Facebook"><i class="fab fa-facebook-f"></i></a>`;
    if (links.instagram) html += `<a href="${links.instagram}" target="_blank" rel="noopener noreferrer" aria-label="Instagram"><i class="fab fa-instagram"></i></a>`;
    container.innerHTML = html;
}

function createMenuItems(items, parentUl, slugMap) {
    items.forEach(item => {
        const li = document.createElement('li');
        let finalLink = item.link || '#';
        if (item.type === 'collection' && slugMap.has(item.name)) {
            finalLink = `/all-products/?collection=${slugMap.get(item.name)}`;
        }
        let linkHTML = `<a href="${finalLink}">${item.name}`;
        if (item.children && item.children.length > 0) {
            li.classList.add('has-submenu');
            linkHTML += ` <i class="fas fa-chevron-down" aria-hidden="true"></i>`;
        }
        linkHTML += `</a>`;
        li.innerHTML = linkHTML;
        if (item.children && item.children.length > 0) {
            const subUl = document.createElement('ul');
            subUl.className = 'submenu';
            createMenuItems(item.children, subUl, slugMap);
            li.appendChild(subUl);
        }
        parentUl.appendChild(li);
    });
}

function addMenuEventListeners() {
    document.querySelectorAll('.main-nav .has-submenu > a, .mobile-nav-panel .has-submenu > a').forEach(menu => {
        menu.addEventListener('click', function(event) {
            event.preventDefault();
            this.parentElement.classList.toggle('active');
        });
    });
     document.addEventListener('click', (e) => {
        if (!e.target.closest('.main-nav')) {
            document.querySelectorAll('.main-nav .has-submenu.active').forEach(item => item.classList.remove('active'));
        }
    });
}

function renderProducts(productsToRender, containerId) {
    const grid = document.getElementById(containerId);
    if (!grid) return;
    grid.innerHTML = '';
    if (productsToRender.length === 0) {
        grid.innerHTML = '<p style="text-align: center; grid-column: 1 / -1;">No products found.</p>';
        return;
    }
    productsToRender.forEach(product => {
        const imageUrl1 = (product.imageUrls && product.imageUrls.length > 0) ? product.imageUrls[0] : 'https://placehold.co/400x600/eee/ccc?text=No+Image';
        const imageUrl2 = (product.imageUrls && product.imageUrls.length > 1) ? product.imageUrls[1] : imageUrl1;
        let priceHTML = `<span class="current-price">Tk ${product.price}</span>`;
        let badgeHTML = '';
        if (product.comparePrice && product.comparePrice > product.price) {
            priceHTML += `<span class="compare-at-price">Tk ${product.comparePrice}</span>`;
            const discount = Math.round(((product.comparePrice - product.price) / product.comparePrice) * 100);
            badgeHTML = `<div class="off-badge">${discount}% OFF</div>`;
        }
        const cardLink = document.createElement('a');
        const productSlug = product.name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');
        cardLink.href = `/product-details/?id=${product.id}`;
        cardLink.className = 'product-card';
        cardLink.innerHTML = `<div class="product-image-container">${badgeHTML}<img src="${imageUrl1}" alt="${product.name}" class="img-primary" loading="lazy"><img src="${imageUrl2}" alt="${product.name}" class="img-secondary" loading="lazy"></div><div class="product-info"><div class="product-name">${product.name}</div><div class="product-price">${priceHTML}</div></div>`;
        grid.appendChild(cardLink);
    });
}

// --- SLIDER FUNCTION - ADDED BACK ---
function setupSlider(sliderData, collectionSlugMap) {
    const sliderContainer = document.getElementById('hero-slider');
    if (!sliderContainer) return;
    
    let sliderTrack = document.createElement('div');
    sliderTrack.className = 'slider-track';
    
    sliderData.slides.forEach((slide) => {
        const slideEl = document.createElement('div');
        slideEl.className = 'slide';
        slideEl.style.backgroundImage = `url(${slide.imageUrl})`;
        
        let finalLink = '#';
        if (slide.linkType === 'collection' && slide.linkTarget) {
            const collectionName = slide.linkTarget;
            if (collectionSlugMap.has(collectionName)) finalLink = `/all-products/?collection=${collectionSlugMap.get(collectionName)}`;
        } else if (slide.linkType === 'product' && slide.linkTarget) {
            finalLink = slide.linkTarget;
        } else if (slide.linkType === 'custom' && slide.linkTarget) {
            finalLink = slide.linkTarget;
        }
        
        slideEl.innerHTML = `<div class="slide-content align-${slide.alignment || 'center'}"><h2 style="font-size: ${slide.headingSize}px;">${slide.heading}</h2><a href="${finalLink}" class="btn">${slide.buttonText}</a></div>`;
        sliderTrack.appendChild(slideEl);
    });
    
    sliderContainer.innerHTML = ''; // Clear previous content
    sliderContainer.prepend(sliderTrack);
    
    let slides = sliderContainer.querySelectorAll('.slide');
    if (slides.length <= 1) return;

    let currentSlide = 0;
    let autoChangeInterval;
    let autoChangeEnabled = sliderData.autoChange;
    let autoChangeTime = (sliderData.interval || 8) * 1000;

    function goToSlide(slideIndex) {
        currentTranslate = -slideIndex * sliderContainer.offsetWidth;
        sliderTrack.style.transition = 'transform 0.4s ease-in-out';
        sliderTrack.style.transform = `translateX(${currentTranslate}px)`;
        
        slides.forEach(s => s.classList.remove('active'));
        slides[slideIndex].classList.add('active');
        currentSlide = slideIndex;
        startAutoChange();
    }

    function nextSlide() {
        const newIndex = (currentSlide + 1) % slides.length;
        goToSlide(newIndex);
    }
    
    function startAutoChange() {
        if (!autoChangeEnabled) return;
        stopAutoChange();
        autoChangeInterval = setTimeout(nextSlide, autoChangeTime);
    }

    function stopAutoChange() {
        clearTimeout(autoChangeInterval);
    }

    sliderContainer.addEventListener('mouseenter', stopAutoChange);
    sliderContainer.addEventListener('mouseleave', startAutoChange);

    goToSlide(0);
}


function setCopyrightYear() {
    const yearEl = document.getElementById('copyright-year');
    if (yearEl) yearEl.textContent = new Date().getFullYear();
}

function setupEventListeners() {
    const desktopSearchInput = document.getElementById('desktopSearchInput');
    const mobileSearchInput = document.getElementById('mobileSearchInput');
    
    if (document.body.classList.contains('all-products-page')) {
        const handleLiveSearch = (e) => {
            const searchTerm = e.target.value.toLowerCase().trim();
            if (typeof fbq === 'function' && searchTerm) fbq('track', 'Search', { search_string: searchTerm });
            renderProducts(window.allProducts.filter(p => p.name.toLowerCase().includes(searchTerm)), 'product-grid');
        };
        if(desktopSearchInput) desktopSearchInput.addEventListener('input', handleLiveSearch);
        if(mobileSearchInput) mobileSearchInput.addEventListener('input', handleLiveSearch);
    } else { 
         const handleRedirectSearch = () => {
            const desktopValue = desktopSearchInput ? desktopSearchInput.value : '';
            const mobileValue = mobileSearchInput ? mobileSearchInput.value : '';
            const searchTerm = (desktopValue || mobileValue).trim();
            if (searchTerm) {
                if (typeof fbq === 'function') fbq('track', 'Search', { search_string: searchTerm });
                window.location.href = `/all-products/?search=${encodeURIComponent(searchTerm)}`;
            }
        };
        if(desktopSearchInput) desktopSearchInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') handleRedirectSearch(); });
        if(mobileSearchInput) mobileSearchInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') handleRedirectSearch(); });
    }

    const desktopSearchTrigger = document.getElementById('desktop-search-trigger');
    const closeDesktopSearchBtn = document.querySelector('.close-desktop-search-btn');
    if (desktopSearchTrigger) desktopSearchTrigger.addEventListener('click', (e) => { e.preventDefault(); document.body.classList.add('desktop-search-active'); if(desktopSearchInput) desktopSearchInput.focus(); });
    if (closeDesktopSearchBtn) closeDesktopSearchBtn.addEventListener('click', () => { document.body.classList.remove('desktop-search-active'); });

    const mobileSearchIcon = document.getElementById('mobile-search-icon');
    const closeSearchBtn = document.querySelector('.close-search-btn');
    if(mobileSearchIcon) mobileSearchIcon.addEventListener('click', (e) => { e.preventDefault(); document.body.classList.add('search-active'); if(mobileSearchInput) mobileSearchInput.focus(); });
    if(closeSearchBtn) closeSearchBtn.addEventListener('click', () => { document.body.classList.remove('search-active'); });

    const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
    const mobileNavPanel = document.getElementById('mobile-nav-panel');
    const closeMobileNav = document.querySelector('.close-mobile-nav');
    const overlay = document.getElementById('overlay');
    const closeMenu = () => { if(mobileNavPanel) mobileNavPanel.classList.remove('active'); if(overlay) overlay.classList.remove('active'); };
    if (mobileMenuToggle) mobileMenuToggle.addEventListener('click', () => { if(mobileNavPanel) mobileNavPanel.classList.add('active'); if(overlay) overlay.classList.add('active'); });
    if (closeMobileNav) closeMobileNav.addEventListener('click', closeMenu);
    if (overlay) overlay.addEventListener('click', closeMenu);
}


// --- DATA LOADING FUNCTIONS ---

async function loadSharedComponents(collectionSlugMap) {
    const db = await initializeFirebase();
    const { doc, getDoc } = await import("https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js");
    
    const [storeDetailsSnap, navigationSnap] = await Promise.all([
        getDoc(doc(db, "settings", "store_details")),
        getDoc(doc(db, "navigation", "main-menu")),
    ]);

    if (storeDetailsSnap.exists()) {
        const data = storeDetailsSnap.data();
        const logoLink = document.getElementById('store-logo-link');
        if (logoLink) {
            if (data.logoUrl) { logoLink.innerHTML = `<img src="${data.logoUrl}" alt="${data.storeName || 'Store Logo'}">`; }
            else if (data.storeName) { logoLink.innerHTML = `<span class="store-name">${data.storeName}</span>`; }
        }
        const footerStoreName = document.getElementById('footer-store-name');
        if(footerStoreName) footerStoreName.textContent = data.storeName || 'Sundorica';
        renderSocialLinks(data.socialLinks);
    }

    if (navigationSnap.exists()) {
        const menuData = navigationSnap.data();
        if (menuData.items) {
            const navContainer = document.getElementById('main-nav');
            const mobileNavContainer = document.getElementById('mobile-nav-links');
            if (navContainer && mobileNavContainer) {
                const ul = document.createElement('ul');
                const mobileUl = document.createElement('ul');
                createMenuItems(menuData.items, ul, collectionSlugMap);
                navContainer.innerHTML = ''; navContainer.appendChild(ul);
                createMenuItems(menuData.items, mobileUl, collectionSlugMap);
                mobileNavContainer.innerHTML = ''; mobileNavContainer.appendChild(mobileUl);
                addMenuEventListeners();
            }
        }
    }
    const footer = document.querySelector('.main-footer');
    if(footer) footer.style.display = 'flex';
}

// --- PAGE-SPECIFIC LOGIC ---

async function loadHomepageContent(collectionSlugMap) {
    const db = await initializeFirebase();
    const { doc, getDoc, collection, getDocs, query, where, limit, orderBy } = await import("https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js");
    
    const [ announcementSnap, sliderSnap, productsSnap ] = await Promise.all([ 
        getDoc(doc(db, "settings", "announcementBar")),
        getDoc(doc(db, "settings", "hero_slider")),
        getDocs(query(collection(db, "products"), where("status", "==", "active"), orderBy("createdAt", "desc"), limit(10))),
    ]);

    if (announcementSnap.exists()) {
        const data = announcementSnap.data();
        const bar = document.getElementById('announcement-bar');
        const textEl = document.getElementById('announcement-text');
        if (bar && textEl && data.texts && data.texts.length > 0) {
            bar.style.backgroundColor = data.isTransparent ? 'transparent' : data.backgroundColor;
            bar.style.color = data.textColor; bar.style.fontSize = `${data.fontSize}px`;
            bar.style.display = 'block';
            let currentIndex = 0; textEl.textContent = data.texts[currentIndex];
            if (data.texts.length > 1) { setInterval(() => { currentIndex = (currentIndex + 1) % data.texts.length; textEl.textContent = data.texts[currentIndex]; }, 3000); }
        }
    }
    
    // Slider logic added back
    if (sliderSnap.exists()) {
        const sliderData = sliderSnap.data();
        if (sliderData.slides && sliderData.slides.length > 0) {
            setupSlider(sliderData, collectionSlugMap);
        }
    }

    if (!productsSnap.empty) {
        const featuredProducts = productsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        renderProducts(featuredProducts, 'product-grid-homepage');
    }
}

async function loadAllProductsPage() {
    const db = await initializeFirebase();
    const { collection, getDocs, query, where, orderBy } = await import("https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js");
    
    const productsRef = collection(db, "products");
    const q = query(productsRef, where("status", "==", "active"), orderBy("createdAt", "desc"));
    const productsSnap = await getDocs(q);
    
    window.allProducts = productsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    const urlParams = new URLSearchParams(window.location.search);
    const searchTerm = urlParams.get('search');

    if (searchTerm) {
        const desktopSearch = document.getElementById('desktopSearchInput');
        const mobileSearch = document.getElementById('mobileSearchInput');
        if(desktopSearch) desktopSearch.value = searchTerm;
        if(mobileSearch) mobileSearch.value = searchTerm;
        renderProducts(window.allProducts.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase())), 'product-grid');
    } else {
        renderProducts(window.allProducts, 'product-grid');
    }
}


// --- MAIN EXECUTION LOGIC ---
async function main() {
    setupEventListeners();
    updateCartCount();
    setCopyrightYear();
    
    const db = await initializeFirebase();
    const { getDocs, collection } = await import("https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js");

    const allCollectionsSnap = await getDocs(collection(db, "collections"));
    const collectionSlugMap = new Map();
    if (!allCollectionsSnap.empty) {
        allCollectionsSnap.forEach(doc => {
            const data = doc.data();
            if (data.name && data.slug) collectionSlugMap.set(data.name, data.slug);
        });
    }

    await loadSharedComponents(collectionSlugMap);

    if (document.body.classList.contains('homepage')) {
        await loadHomepageContent(collectionSlugMap);
    } else if (document.body.classList.contains('all-products-page')) {
        await loadAllProductsPage();
    }
}

document.addEventListener('DOMContentLoaded', main);
