// This script is for the ALL PRODUCTS PAGE ONLY

async function loadFirebaseAndApp() {
    const { initializeApp } = await import("https://www.gstatic.com/firebasejs/9.6.10/firebase-app.js");
    const { getFirestore, collection, getDocs, query, where, doc, getDoc } = await import("https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js");

    const firebaseConfig = {
        apiKey: "AIzaSyBKK4FmXtcMniVv6_5-mFPBJICwEM5Dkzc",
        authDomain: "nasir-9102c.firebaseapp.com",
        projectId: "nasir-9102c",
        storageBucket: "nasir-9102c.firebasestorage.app",
        messagingSenderId: "182224792140",
        appId: "1:182224792140:web:42348e8b24f94cdf07e2e9",
        measurementId: "G-8R5J241MJM"
    };

    const app = initializeApp(firebaseConfig);
    return getFirestore(app);
}

let allProducts = [];

function updateCartCount() { const cart = JSON.parse(localStorage.getItem('cart')) || []; const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0); const countElement = document.querySelector('.cart-item-count'); if (countElement) { countElement.textContent = totalItems; countElement.style.display = totalItems > 0 ? 'block' : 'none'; } }

function createMenuItems(items, parentUl, slugMap) {  items.forEach(item => {  const li = document.createElement('li');  let finalLink = item.link || '#'; if (item.type === 'collection' && slugMap.has(item.name)) { finalLink = `/all-products/?collection=${slugMap.get(item.name)}`; } let linkHTML = `<a href="${finalLink}">${item.name}</a>`;  if (item.children && item.children.length > 0) {  li.classList.add('has-submenu');  linkHTML += ` <i class="fas fa-chevron-down" aria-hidden="true"></i>`;  }  li.innerHTML = linkHTML;  if (item.children && item.children.length > 0) {  const subUl = document.createElement('ul');  subUl.className = 'submenu';  createMenuItems(item.children, subUl, slugMap);  li.appendChild(subUl);  }  parentUl.appendChild(li);  });  }

function renderSocialLinks(links) { const container = document.getElementById('social-links'); if (!links || !container) return; let html = ''; if (links.facebook) html += `<a href="${links.facebook}" target="_blank" rel="noopener noreferrer" aria-label="Facebook"><i class="fab fa-facebook-f"></i></a>`; if (links.instagram) html += `<a href="${links.instagram}" target="_blank" rel="noopener noreferrer" aria-label="Instagram"><i class="fab fa-instagram"></i></a>`; if (links.twitter) html += `<a href="${links.twitter}" target="_blank" rel="noopener noreferrer" aria-label="Twitter"><i class="fab fa-twitter"></i></a>`; if (links.youtube) html += `<a href="${links.youtube}" target="_blank" rel="noopener noreferrer" aria-label="YouTube"><i class="fab fa-youtube"></i></a>`; container.innerHTML = html; }

async function loadSharedComponents(db) {
    const { doc, getDoc, getDocs, collection } = await import("https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js");
    const [storeDetailsSnap, navigationSnap, allCollectionsSnap] = await Promise.all([ getDoc(doc(db, "settings", "store_details")), getDoc(doc(db, "navigation", "main-menu")), getDocs(collection(db, "collections")) ]);

    if (storeDetailsSnap.exists()) { const data = storeDetailsSnap.data(); const logoLink = document.getElementById('store-logo-link'); if (data.logoUrl) { logoLink.innerHTML = `<img src="${data.logoUrl}" alt="${data.storeName || 'Store Logo'}">`; } else if (data.storeName) { logoLink.innerHTML = `<span class="store-name">${data.storeName}</span>`; } document.getElementById('footer-store-name').textContent = data.storeName || 'Your Store'; renderSocialLinks(data.socialLinks); }

    const collectionSlugMap = new Map();
    if (!allCollectionsSnap.empty) { allCollectionsSnap.forEach(doc => { const data = doc.data(); if (data.name && data.slug) collectionSlugMap.set(data.name, data.slug); }); }

    if (navigationSnap.exists()) {
        const menuData = navigationSnap.data();
        if (menuData.items) {
            const navContainer = document.getElementById('main-nav');
            const mobileNavContainer = document.getElementById('mobile-nav-links');
            const ul = document.createElement('ul'); const mobileUl = document.createElement('ul');
            createMenuItems(menuData.items, ul, collectionSlugMap); navContainer.innerHTML = ''; navContainer.appendChild(ul);
            createMenuItems(menuData.items, mobileUl, collectionSlugMap); mobileNavContainer.innerHTML = ''; mobileNavContainer.appendChild(mobileUl);
            addMenuEventListeners();
        }
    }
}

function renderProducts(productsToRender) {
    const grid = document.getElementById('product-grid');
    grid.innerHTML = '';
    if (productsToRender.length === 0) { grid.innerHTML = '<p style="text-align: center; grid-column: 1 / -1;">No products found.</p>'; return; }

    productsToRender.forEach(product => {
        const imageUrl1 = (product.imageUrls && product.imageUrls.length > 0) ? product.imageUrls[0] : 'https://placehold.co/400x600/eee/ccc?text=No+Image';
        const imageUrl2 = (product.imageUrls && product.imageUrls.length > 1) ? product.imageUrls[1] : imageUrl1;
        let priceHTML = `<span class="current-price">Tk ${product.price}</span>`;
        let badgeHTML = '';
        if (product.comparePrice && product.comparePrice > product.price) { priceHTML += `<span class="compare-at-price">Tk ${product.comparePrice}</span>`; const discount = Math.round(((product.comparePrice - product.price) / product.comparePrice) * 100); badgeHTML = `<div class="off-badge">${discount}% OFF</div>`; }
        const cardLink = document.createElement('a');
        const productSlug = product.name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');
        cardLink.href = `/product-details/?id=${product.id}`;
        cardLink.className = 'product-card';
        cardLink.innerHTML = ` <div class="product-image-container"> ${badgeHTML} <img src="${imageUrl1}" alt="${product.name}" class="img-primary" loading="lazy"> <img src="${imageUrl2}" alt="${product.name}" class="img-secondary" loading="lazy"> </div> <div class="product-info"> <div class="product-name">${product.name}</div> <div class="product-price">${priceHTML}</div> </div>`;
        grid.appendChild(cardLink);
    });
}

function addAllProductsSeoTags(products) {
    let schemaScript = document.querySelector('script[type="application/ld+json"]');
    if (!schemaScript) { schemaScript = document.createElement('script'); schemaScript.type = 'application/ld+json'; document.head.appendChild(schemaScript); }
    const schema = { "@context": "https://schema.org", "@type": "ItemList", "name": "All Products", "description": "Browse all available products from Sundorica.", "url": "https://www.sundorica.com/all-products/", "numberOfItems": products.length, "itemListElement": products.map((product, index) => { const productSlug = product.name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, ''); const productUrl = `https://www.sundorica.com/product-details/${productSlug}/${product.id}`; return { "@type": "ListItem", "position": index + 1, "item": { "@type": "Product", "url": productUrl, "name": product.name, "image": (product.imageUrls && product.imageUrls.length > 0) ? product.imageUrls[0] : '', "offers": { "@type": "Offer", "priceCurrency": "BDT", "price": product.price } } }; }) };
    schemaScript.textContent = JSON.stringify(schema);
}

async function loadAllProducts(db) {
    const { collection, getDocs, query, where } = await import("https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js");
    const productsRef = collection(db, "products");
    const q = query(productsRef, where("status", "==", "active"));
    const productsSnap = await getDocs(q);
    
    allProducts = productsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    allProducts.sort((a, b) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0));

    const urlParams = new URLSearchParams(window.location.search);
    const searchTerm = urlParams.get('search');

    if (searchTerm) {
        document.getElementById('desktopSearchInput').value = searchTerm;
        document.getElementById('mobileSearchInput').value = searchTerm;
        const filtered = allProducts.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));
        renderProducts(filtered);
    } else {
        renderProducts(allProducts);
    }
    addAllProductsSeoTags(allProducts);
}

function addMenuEventListeners() { document.querySelectorAll('.main-nav .has-submenu > a, .mobile-nav-panel .has-submenu > a').forEach(menu => { menu.addEventListener('click', function(event) { event.preventDefault(); this.parentElement.classList.toggle('active'); }); }); }

function setupEventListeners() {
    const handleSearch = (e) => { const searchTerm = e.target.value.toLowerCase().trim(); if (typeof fbq === 'function' && searchTerm) fbq('track', 'Search', { search_string: searchTerm }); renderProducts(allProducts.filter(p => p.name.toLowerCase().includes(searchTerm))); };
    const desktopSearchInput = document.getElementById('desktopSearchInput');
    const mobileSearchInput = document.getElementById('mobileSearchInput');
    desktopSearchInput.addEventListener('input', handleSearch);
    mobileSearchInput.addEventListener('input', handleSearch);

    document.getElementById('desktop-search-trigger').addEventListener('click', (e) => { e.preventDefault(); document.body.classList.add('desktop-search-active'); desktopSearchInput.focus(); });
    document.querySelector('.close-desktop-search-btn').addEventListener('click', () => { document.body.classList.remove('desktop-search-active'); });
    document.getElementById('mobile-search-icon').addEventListener('click', (e) => { e.preventDefault(); document.body.classList.add('search-active'); mobileSearchInput.focus(); });
    document.querySelector('.close-search-btn').addEventListener('click', () => { document.body.classList.remove('search-active'); });

    const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
    const mobileNavPanel = document.getElementById('mobile-nav-panel');
    const closeMobileNav = document.querySelector('.close-mobile-nav');
    const overlay = document.getElementById('overlay');
    const closeMenu = () => { mobileNavPanel.classList.remove('active'); overlay.classList.remove('active'); };
    mobileMenuToggle.addEventListener('click', () => { mobileNavPanel.classList.add('active'); overlay.classList.add('active'); });
    closeMobileNav.addEventListener('click', closeMenu);
    overlay.addEventListener('click', closeMenu);
}

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('copyright-year').textContent = new Date().getFullYear();
    setupEventListeners();
    updateCartCount();
    const loadDynamicContent = async () => {
        try {
            const db = await loadFirebaseAndApp();
            await Promise.all([ loadSharedComponents(db), loadAllProducts(db) ]);
            document.querySelector('.main-footer').style.display = 'block';
        } catch (error) {
            console.error("Failed to load page content:", error);
        }
    };
    if ('requestIdleCallback' in window) {
        requestIdleCallback(loadDynamicContent);
    } else {
        setTimeout(loadDynamicContent, 300);
    }
});
