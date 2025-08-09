// Sundorica - Universal JavaScript File

// --------------------------------------------------
// 1. CONFIGURATION & INITIALIZATION
// --------------------------------------------------

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

async function initializeFirebase() {
    if (!app) {
        const { initializeApp } = await import("https://www.gstatic.com/firebasejs/9.6.10/firebase-app.js");
        const { getFirestore } = await import("https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js");
        app = initializeApp(firebaseConfig);
        db = getFirestore(app);
    }
}

// --------------------------------------------------
// 2. COMMON & SHARED FUNCTIONS
// --------------------------------------------------

function showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    const iconClass = type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle';
    toast.innerHTML = `<i class="fas ${iconClass}"></i><span>${message}</span>`;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 4000);
}

function updateCartCount() {
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    const countElements = document.querySelectorAll('.cart-item-count');
    countElements.forEach(el => {
        el.textContent = totalItems;
        el.style.display = totalItems > 0 ? 'block' : 'none';
    });
}

function createMenuItems(items, parentUl, slugMap) {
    parentUl.innerHTML = '';
    items.forEach(item => {
        const li = document.createElement('li');
        let finalLink = item.link || '#';
        if (item.type === 'collection' && slugMap.has(item.name)) {
            finalLink = `/collection/?slug=${slugMap.get(item.name)}`;
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

function renderSocialLinks(links) {
    const container = document.getElementById('social-links');
    if (!links || !container) return;
    let html = '';
    if (links.facebook) html += `<a href="${links.facebook}" target="_blank" rel="noopener noreferrer" aria-label="Facebook"><i class="fab fa-facebook-f"></i></a>`;
    if (links.instagram) html += `<a href="${links.instagram}" target="_blank" rel="noopener noreferrer" aria-label="Instagram"><i class="fab fa-instagram"></i></a>`;
    // Add other social links as needed
    container.innerHTML = html;
}

async function loadSharedComponents() {
    const { doc, getDoc, collection, getDocs } = await import("https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js");
    try {
        const [storeDetailsSnap, navigationSnap, allCollectionsSnap] = await Promise.all([
            getDoc(doc(db, "settings", "store_details")),
            getDoc(doc(db, "navigation", "main-menu")),
            getDocs(collection(db, "collections"))
        ]);

        if (storeDetailsSnap.exists()) {
            const data = storeDetailsSnap.data();
            const logoLink = document.getElementById('store-logo-link');
            if (logoLink) {
                if (data.logoUrl) {
                    logoLink.innerHTML = `<img src="${data.logoUrl}" alt="${data.storeName || 'Store Logo'}">`;
                } else if (data.storeName) {
                    logoLink.innerHTML = `<span class="store-name">${data.storeName}</span>`;
                }
            }
            const footerStoreName = document.getElementById('footer-store-name');
            if(footerStoreName) footerStoreName.textContent = data.storeName || 'Sundorica';
            renderSocialLinks(data.socialLinks);
        }

        const collectionSlugMap = new Map();
        if (!allCollectionsSnap.empty) {
            allCollectionsSnap.forEach(doc => {
                const data = doc.data();
                if (data.name && data.slug) collectionSlugMap.set(data.name, data.slug);
            });
        }

        if (navigationSnap.exists()) {
            const menuData = navigationSnap.data();
            if (menuData.items) {
                const navContainer = document.getElementById('main-nav');
                const mobileNavContainer = document.getElementById('mobile-nav-links');
                if (navContainer) {
                    const ul = document.createElement('ul');
                    createMenuItems(menuData.items, ul, collectionSlugMap);
                    navContainer.appendChild(ul);
                }
                if(mobileNavContainer) {
                    const mobileUl = document.createElement('ul');
                    createMenuItems(menuData.items, mobileUl, collectionSlugMap);
                    mobileNavContainer.appendChild(mobileUl);
                }
            }
        }
        const footer = document.querySelector('.main-footer');
        if(footer) footer.style.display = 'block';
    } catch(error) {
        console.error("Error loading shared components:", error);
    }
}

function setupGlobalEventListeners() {
    const handleSearch = () => {
        const desktopValue = document.getElementById('desktopSearchInput')?.value;
        const mobileValue = document.getElementById('mobileSearchInput')?.value;
        const searchTerm = (desktopValue || mobileValue || '').trim();
        if (searchTerm) {
            if (typeof fbq === 'function') fbq('track', 'Search', { search_string: searchTerm });
            window.location.href = `/all-products/?search=${encodeURIComponent(searchTerm)}`;
        }
    };
    
    document.getElementById('desktopSearchInput')?.addEventListener('keydown', (e) => { if (e.key === 'Enter') handleSearch(); });
    document.getElementById('mobileSearchInput')?.addEventListener('keydown', (e) => { if (e.key === 'Enter') handleSearch(); });
    document.getElementById('desktop-search-trigger')?.addEventListener('click', (e) => { e.preventDefault(); document.body.classList.add('desktop-search-active'); document.getElementById('desktopSearchInput')?.focus(); });
    document.querySelector('.close-desktop-search-btn')?.addEventListener('click', () => { document.body.classList.remove('desktop-search-active'); });
    document.getElementById('mobile-search-icon')?.addEventListener('click', (e) => { e.preventDefault(); document.body.classList.add('search-active'); document.getElementById('mobileSearchInput')?.focus(); });
    document.querySelector('.close-search-btn')?.addEventListener('click', () => { document.body.classList.remove('search-active'); });

    const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
    const mobileNavPanel = document.getElementById('mobile-nav-panel');
    const closeMobileNav = document.querySelector('.close-mobile-nav');
    const overlay = document.getElementById('overlay');
    const closeMenu = () => { mobileNavPanel?.classList.remove('active'); overlay?.classList.remove('active'); };
    mobileMenuToggle?.addEventListener('click', () => { mobileNavPanel?.classList.add('active'); overlay?.classList.add('active'); });
    closeMobileNav?.addEventListener('click', closeMenu);
    overlay?.addEventListener('click', closeMenu);

    document.body.addEventListener('click', function(event) {
        const desktopLink = event.target.closest('.main-nav .has-submenu > a');
        if (desktopLink) {
            event.preventDefault();
            const parentLi = desktopLink.parentElement;
            parentLi.classList.toggle('active');
            document.querySelectorAll('.main-nav .has-submenu').forEach(item => { if (item !== parentLi) item.classList.remove('active'); });
        } else if (!event.target.closest('.main-nav')) {
            document.querySelectorAll('.main-nav .has-submenu').forEach(item => item.classList.remove('active'));
        }
        const mobileLink = event.target.closest('.mobile-nav-panel .has-submenu > a');
        if (mobileLink) {
            event.preventDefault();
            mobileLink.parentElement.classList.toggle('active');
        }
    });

    const copyrightYear = document.getElementById('copyright-year');
    if(copyrightYear) copyrightYear.textContent = new Date().getFullYear();
}

function renderProducts(productsToRender, gridContainerId) {
    const grid = document.getElementById(gridContainerId);
    if (!grid) return;
    grid.innerHTML = '';
    if (!productsToRender || productsToRender.length === 0) {
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
        cardLink.href = `/product-details/?id=${product.id}&slug=${productSlug}`;
        cardLink.className = 'product-card';
        cardLink.innerHTML = `<div class="product-image-container">${badgeHTML}<img src="${imageUrl1}" alt="${product.name}" class="img-primary" loading="lazy"><img src="${imageUrl2}" alt="${product.name}" class="img-secondary" loading="lazy"></div><div class="product-info"><div class="product-name">${product.name}</div><div class="product-price">${priceHTML}</div></div>`;
        grid.appendChild(cardLink);
    });
}

// --------------------------------------------------
// 3. PAGE-SPECIFIC LOGIC
// --------------------------------------------------

// --- Homepage Logic ---
async function initHomepage() {
    const { doc, getDoc, collection, getDocs, query, where, limit, orderBy } = await import("https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js");
    
    // Function to set up the hero slider
    function setupSlider(sliderData, collectionSlugMap) {
        const sliderContainer = document.getElementById('hero-slider');
        if (!sliderContainer) return;
        const sliderTrack = document.createElement('div');
        sliderTrack.className = 'slider-track';

        sliderData.slides.forEach((slide) => {
            const slideEl = document.createElement('div');
            slideEl.className = 'slide';
            slideEl.style.backgroundImage = `url(${slide.imageUrl})`;
            let finalLink = '#';
            if (slide.linkType === 'collection' && slide.linkTarget) {
                if (collectionSlugMap.has(slide.linkTarget)) {
                    finalLink = `/collection/?slug=${collectionSlugMap.get(slide.linkTarget)}`;
                }
            } else if (slide.linkType === 'custom' && slide.linkTarget) {
                finalLink = slide.linkTarget;
            }
            slideEl.innerHTML = `<div class="slide-content align-${slide.alignment || 'center'}"><h2 style="font-size: ${slide.headingSize}px;">${slide.heading}</h2><a href="${finalLink}" class="btn">${slide.buttonText}</a></div>`;
            sliderTrack.appendChild(slideEl);
        });
        sliderContainer.prepend(sliderTrack);
        
        // Add slider functionality (drag, auto-change etc.) if needed
        const slides = sliderContainer.querySelectorAll('.slide');
        if (slides.length > 0) {
            slides[0].classList.add('active');
        }
    }

    try {
        const [announcementSnap, sliderSnap, productsSnap, allCollectionsSnap] = await Promise.all([
            getDoc(doc(db, "settings", "announcementBar")),
            getDoc(doc(db, "settings", "hero_slider")),
            getDocs(query(collection(db, "products"), where("status", "==", "active"), orderBy("createdAt", "desc"), limit(10))),
            getDocs(collection(db, "collections"))
        ]);

        if (announcementSnap.exists()) { 
            const data = announcementSnap.data(); 
            const bar = document.getElementById('announcement-bar'); 
            const textEl = document.getElementById('announcement-text'); 
            if (bar && textEl && data.texts && data.texts.length > 0) { 
                bar.style.display = 'block'; 
                textEl.textContent = data.texts[0];
            } 
        }

        if (sliderSnap.exists()) {
            const sliderData = sliderSnap.data();
            const collectionSlugMap = new Map();
            if (!allCollectionsSnap.empty) {
                allCollectionsSnap.forEach(doc => {
                    const data = doc.data();
                    if (data.name && data.slug) collectionSlugMap.set(data.name, data.slug);
                });
            }
            if (sliderData.slides && sliderData.slides.length > 0) {
                setupSlider(sliderData, collectionSlugMap);
            }
        }

        if (!productsSnap.empty) {
            const featuredProducts = productsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            renderProducts(featuredProducts, 'product-grid');
        }
        
        const modalContent = { about: { title: 'About', body: `<p>Sundorica is a celebration of feminine elegance...</p>` }, contact: { title: 'Contact', body: `<p>Contact us...</p>` }, privacy: { title: 'Privacy Policy', body: `<p>Our privacy policy...</p>` } };
        const modalOverlay = document.getElementById('info-modal');
        const modalTitle = document.getElementById('info-modal-title');
        const modalBody = document.getElementById('info-modal-body');
        const closeModalBtn = document.querySelector('.info-modal-close');
        document.querySelectorAll('.footer-left-links a[data-modal]').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const modalType = link.getAttribute('data-modal');
                if (modalContent[modalType] && modalOverlay) {
                    modalTitle.textContent = modalContent[modalType].title;
                    modalBody.innerHTML = modalContent[modalType].body;
                    modalOverlay.classList.add('active');
                }
            });
        });
        const closeModal = () => modalOverlay?.classList.remove('active');
        closeModalBtn?.addEventListener('click', closeModal);
        modalOverlay?.addEventListener('click', (e) => { if (e.target === modalOverlay) closeModal(); });

    } catch (error) {
        console.error("Error loading homepage content:", error);
    }
}

// --- Cart Page Logic ---
async function initCartPage() {
    const { collection, getDocs, doc, runTransaction, serverTimestamp } = await import("https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js");
    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    let shippingZones = [];

    const cartView = document.getElementById('cart-view');
    const emptyCartView = document.getElementById('empty-cart-view');

    function updateTotals() {
        const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const selectedZone = shippingZones.find(zone => zone.id === document.getElementById('deliveryZone').value);
        const shippingCharges = selectedZone ? selectedZone.amount : 0;
        const totalAmount = subtotal + shippingCharges;
        document.getElementById('subtotal').textContent = `Tk ${subtotal.toFixed(2)}`;
        document.getElementById('shipping-charges').textContent = `Tk ${shippingCharges.toFixed(2)}`;
        document.getElementById('total-amount').textContent = `Tk ${totalAmount.toFixed(2)}`;
        const orderBtn = document.getElementById('complete-order-btn');
        const form = document.getElementById('shipping-form');
        if(orderBtn && form) orderBtn.disabled = !(cart.length > 0 && form.checkValidity());
    }

    function renderCartItems() {
        const cartItemsList = document.getElementById('cart-items-list');
        updateCartCount();
        if (cart.length === 0) {
            cartView.style.display = 'none';
            emptyCartView.style.display = 'block';
            return;
        }
        cartView.style.display = 'block';
        emptyCartView.style.display = 'none';
        cartItemsList.innerHTML = '';
        cart.forEach(item => {
            const itemElement = document.createElement('div');
            itemElement.className = 'cart-item';
            itemElement.dataset.id = item.id;
            itemElement.innerHTML = `
                <a href="${item.productPage || '#'}" class="cart-item-image"><img src="${item.image || 'https://placehold.co/80x80'}" alt="${item.name}"></a>
                <div class="cart-item-details">
                    <a href="${item.productPage || '#'}" class="cart-item-name-link"><div class="cart-item-name">${item.name}</div></a>
                    <div class="cart-item-price">Tk ${item.price}</div>
                </div>
                <div class="cart-item-actions">
                    <div class="quantity-selector">
                        <button class="quantity-btn decrease-qty">-</button>
                        <span class="item-quantity">${item.quantity}</span>
                        <button class="quantity-btn increase-qty">+</button>
                    </div>
                    <button class="remove-item-btn"><i class="fas fa-trash-alt"></i></button>
                </div>`;
            cartItemsList.appendChild(itemElement);
        });
        updateTotals();
    }
    
    try {
        const zonesSnap = await getDocs(collection(db, "shipping_zones"));
        const deliveryZoneSelect = document.getElementById('deliveryZone');
        shippingZones = zonesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        if(deliveryZoneSelect) {
            shippingZones.forEach(zone => {
                const option = document.createElement('option');
                option.value = zone.id;
                option.textContent = `${zone.name} - Tk ${zone.amount}`;
                deliveryZoneSelect.appendChild(option);
            });
            deliveryZoneSelect.addEventListener('change', updateTotals);
        }
        document.getElementById('shipping-form')?.addEventListener('input', updateTotals);
        renderCartItems();
    } catch (error) {
        console.error("Error setting up cart page:", error);
    }
}

// ... other page-specific init functions (initAllProductsPage, initCollectionPage etc.) would go here...

// --------------------------------------------------
// 4. MAIN EXECUTION
// --------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
    
    updateCartCount();
    setupGlobalEventListeners();

    const loadDynamicContent = async () => {
        await initializeFirebase();
        await loadSharedComponents();

        const path = window.location.pathname;

        if (document.getElementById('hero-slider')) {
            initHomepage();
        } else if (path.includes('/cart/')) {
            initCartPage();
        } 
        // Add other `else if` conditions for other pages
    };

    if ('requestIdleCallback' in window) {
        requestIdleCallback(loadDynamicContent);
    } else {
        setTimeout(loadDynamicContent, 300);
    }
});
