(() => {
  'use strict';

  // =============================================
  // DATA — Cardápio do restaurante fictício
  // =============================================
  const MENU = [
    // Lanches
    {
      id: 1, name: 'Smash Duplo Cheddar', category: 'lanches',
      desc: 'Dois smash burgers 90g, cheddar derretido, cebola caramelizada, alface, tomate e molho especial no brioche.',
      price: 32.90, oldPrice: 38.90, img: 'img/burger.png', badge: '-15%', featured: true
    },
    {
      id: 2, name: 'Wrap Frango Grelhado', category: 'lanches',
      desc: 'Tortilla grelhada com frango desfiado, alface, tomate, queijo e molho ranch.',
      price: 26.90, img: 'img/wrap.png', featured: true
    },
    {
      id: 3, name: 'Smash Bacon BBQ', category: 'lanches',
      desc: 'Smash burger 120g com bacon crocante, onion rings, cheddar e molho barbecue defumado.',
      price: 34.90, img: 'img/smash_bacon_bbq.png'
    },
    {
      id: 4, name: 'Smash Clássico', category: 'lanches',
      desc: 'Smash burger 90g com queijo, alface, tomate, picles e maionese da casa.',
      price: 24.90, img: 'img/smash_classico.png'
    },
    {
      id: 5, name: 'Wrap Veggie', category: 'lanches',
      desc: 'Tortilla integral com cogumelos, abobrinha grelhada, rúcula, cream cheese e pesto.',
      price: 25.90, img: 'img/wrap_veggie.png'
    },

    // Pizzas
    {
      id: 6, name: 'Pizza Pepperoni', category: 'pizzas',
      desc: 'Massa artesanal, molho de tomate italiano, mozzarella, pepperoni fatiado e manjericão fresco.',
      price: 49.90, img: 'img/pizza.png', badge: 'Novo', badgeType: 'new', featured: true
    },
    {
      id: 7, name: 'Pizza Margherita', category: 'pizzas',
      desc: 'Molho de tomate San Marzano, mozzarella de búfala, manjericão fresco e azeite extra virgem.',
      price: 44.90, img: 'img/pizza_margherita.png'
    },
    {
      id: 8, name: 'Pizza Quatro Queijos', category: 'pizzas',
      desc: 'Mozzarella, gorgonzola, parmesão e catupiry sobre massa fina e crocante.',
      price: 52.90, img: 'img/pizza_quatro_queijos.png'
    },

    // Porções
    {
      id: 9, name: 'Batata Cheddar & Bacon', category: 'porcoes',
      desc: 'Batata frita crocante coberta com cheddar cremoso, bacon crocante e cebolinha.',
      price: 28.90, img: 'img/fries.png', featured: true
    },
    {
      id: 10, name: 'Onion Rings', category: 'porcoes',
      desc: 'Anéis de cebola empanados e fritos, servidos com molho barbecue.',
      price: 22.90, img: 'img/onion_rings.png'
    },
    {
      id: 11, name: 'Nuggets (12 un)', category: 'porcoes',
      desc: 'Nuggets artesanais de frango com molho honey mustard.',
      price: 24.90, img: 'img/nuggets.png'
    },

    // Bebidas
    {
      id: 12, name: 'Refrigerante Artesanal', category: 'bebidas',
      desc: 'Escolha entre laranja, limão ou cola. Garrafa 355ml.',
      price: 9.90, img: 'img/drinks.png'
    },
    {
      id: 13, name: 'Suco Natural 500ml', category: 'bebidas',
      desc: 'Laranja, limão, maracujá ou abacaxi. Feito na hora.',
      price: 12.90, img: 'img/suco_natural.png'
    },
    {
      id: 14, name: 'Água Mineral 500ml', category: 'bebidas',
      desc: 'Com ou sem gás.',
      price: 5.90, img: 'img/agua_mineral.png'
    },

    // Sobremesas
    {
      id: 15, name: 'Açaí Bowl 500ml', category: 'sobremesas',
      desc: 'Açaí cremoso com granola, banana, morango e leite condensado.',
      price: 22.90, img: 'img/acai.png', badge: '⭐ Top', featured: true
    },
    {
      id: 16, name: 'Açaí Bowl 300ml', category: 'sobremesas',
      desc: 'Açaí cremoso com granola e banana.',
      price: 16.90, img: 'img/acai.png'
    }
  ];

  const CATEGORY_NAMES = {
    lanches: '🍔 Lanches',
    pizzas: '🍕 Pizzas',
    porcoes: '🍟 Porções',
    bebidas: '🥤 Bebidas',
    sobremesas: '🍨 Sobremesas'
  };

  const DELIVERY_FEE = 5.00;
  const FREE_DELIVERY_MIN = 60.00;
  const WHATSAPP_NUMBER = '5598981483900';

  // =============================================
  // STATE
  // =============================================
  let cart = [];
  let activeCategory = 'todos';
  let searchQuery = '';

  // =============================================
  // DOM REFS
  // =============================================
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => document.querySelectorAll(sel);

  const featuredGrid = $('#featured-grid');
  const menuItems = $('#menu-items');
  const emptyState = $('#empty-state');
  const cartFloat = $('#cart-float');
  const cartFloatCount = $('#cart-float-count');
  const cartFloatTotal = $('#cart-float-total');
  const cartOverlay = $('#cart-overlay');
  const cartDrawer = $('#cart-drawer');
  const cartBody = $('#cart-body');
  const cartItemsEl = $('#cart-items');
  const cartEmpty = $('#cart-empty');
  const cartFooter = $('#cart-footer');
  const cartSubtotal = $('#cart-subtotal-value');
  const cartDeliveryFee = $('#cart-delivery-fee');
  const cartTotal = $('#cart-total-value');
  const checkoutOverlay = $('#checkout-overlay');
  const checkoutSummary = $('#checkout-summary');
  const successOverlay = $('#success-overlay');
  const searchInput = $('#search-input');
  const addressGroup = $('#address-group');

  // =============================================
  // HELPERS
  // =============================================
  function formatPrice(val) {
    return 'R$ ' + val.toFixed(2).replace('.', ',');
  }

  function getCartQty(itemId) {
    const item = cart.find(c => c.id === itemId);
    return item ? item.qty : 0;
  }

  function getCartTotal() {
    return cart.reduce((sum, c) => sum + c.price * c.qty, 0);
  }

  function getCartCount() {
    return cart.reduce((sum, c) => sum + c.qty, 0);
  }

  function getDeliveryFee() {
    return getCartTotal() >= FREE_DELIVERY_MIN ? 0 : DELIVERY_FEE;
  }

  // =============================================
  // RENDER — Product Card
  // =============================================
  function renderProductCard(item, isFeatured = false) {
    const qty = getCartQty(item.id);
    const card = document.createElement('div');
    card.className = 'product-card' + (isFeatured ? ' featured' : '');
    card.dataset.id = item.id;

    let badgeHTML = '';
    if (item.badge) {
      const badgeClass = item.badgeType === 'new' ? 'product-badge new' : 'product-badge';
      badgeHTML = `<span class="${badgeClass}">${item.badge}</span>`;
    }

    let oldPriceHTML = '';
    if (item.oldPrice) {
      oldPriceHTML = `<small>${formatPrice(item.oldPrice)}</small>`;
    }

    let addBtnHTML;
    if (qty === 0) {
      addBtnHTML = `<button class="btn-add" data-action="add" data-id="${item.id}" aria-label="Adicionar ${item.name}">+</button>`;
    } else {
      addBtnHTML = `
        <div class="btn-add in-cart">
          <div class="qty-controls">
            <button class="qty-btn" data-action="decrease" data-id="${item.id}" aria-label="Diminuir">−</button>
            <span class="qty-value">${qty}</span>
            <button class="qty-btn" data-action="increase" data-id="${item.id}" aria-label="Aumentar">+</button>
          </div>
        </div>`;
    }

    card.innerHTML = `
      ${badgeHTML}
      <div class="product-card-img"><img src="${item.img}" alt="${item.name}" loading="lazy" width="200" height="200"></div>
      <div class="product-card-body">
        <div class="product-card-name">${item.name}</div>
        <div class="product-card-desc">${item.desc}</div>
        <div class="product-card-bottom">
          <span class="product-card-price">${formatPrice(item.price)}${oldPriceHTML}</span>
          ${addBtnHTML}
        </div>
      </div>`;

    return card;
  }

  // =============================================
  // RENDER — Full Menu
  // =============================================
  function renderMenu() {
    const query = searchQuery.toLowerCase().trim();
    let filtered = MENU;

    if (activeCategory !== 'todos') {
      filtered = filtered.filter(i => i.category === activeCategory);
    }

    if (query) {
      filtered = filtered.filter(i =>
        i.name.toLowerCase().includes(query) ||
        i.desc.toLowerCase().includes(query) ||
        i.category.toLowerCase().includes(query)
      );
    }

    // Featured
    const featuredItems = filtered.filter(i => i.featured);
    if (featuredItems.length > 0 && !query && activeCategory === 'todos') {
      featuredGrid.innerHTML = '';
      featuredItems.forEach(item => {
        featuredGrid.appendChild(renderProductCard(item, true));
      });
      $('#section-destaques').style.display = '';
    } else {
      $('#section-destaques').style.display = 'none';
    }

    // Grouped by category
    menuItems.innerHTML = '';
    const nonFeatured = query || activeCategory !== 'todos'
      ? filtered
      : filtered.filter(i => !i.featured);

    const categories = [...new Set(nonFeatured.map(i => i.category))];

    if (categories.length === 0 && featuredItems.length === 0) {
      emptyState.style.display = '';
      return;
    }

    emptyState.style.display = 'none';

    categories.forEach(cat => {
      const items = nonFeatured.filter(i => i.category === cat);
      if (items.length === 0) return;

      const section = document.createElement('section');
      section.className = 'menu-section';
      section.id = 'section-' + cat;

      const title = document.createElement('h2');
      title.className = 'section-title';
      title.innerHTML = CATEGORY_NAMES[cat] || cat;

      const grid = document.createElement('div');
      grid.className = 'menu-items-grid';

      items.forEach(item => {
        grid.appendChild(renderProductCard(item));
      });

      section.appendChild(title);
      section.appendChild(grid);
      menuItems.appendChild(section);
    });
  }

  // =============================================
  // RENDER — Cart
  // =============================================
  function renderCart() {
    const count = getCartCount();
    const subtotal = getCartTotal();
    const fee = getDeliveryFee();
    const total = subtotal + fee;

    // Float button
    cartFloat.style.display = count > 0 ? '' : 'none';
    cartFloatCount.textContent = count;
    cartFloatTotal.textContent = formatPrice(total);

    // Empty state
    cartEmpty.style.display = cart.length === 0 ? '' : 'none';
    cartFooter.style.display = cart.length > 0 ? '' : 'none';

    // Items
    cartItemsEl.innerHTML = '';
    cart.forEach(c => {
      const item = MENU.find(m => m.id === c.id);
      if (!item) return;

      const el = document.createElement('div');
      el.className = 'cart-item';
      el.innerHTML = `
        <div class="cart-item-img"><img src="${item.img}" alt="${item.name}" width="60" height="60"></div>
        <div class="cart-item-body">
          <div class="cart-item-name">${item.name}</div>
          <div class="cart-item-price">${formatPrice(item.price * c.qty)}</div>
          <div class="cart-item-actions">
            <div class="qty-controls">
              <button class="qty-btn" data-action="decrease" data-id="${c.id}">−</button>
              <span class="qty-value">${c.qty}</span>
              <button class="qty-btn" data-action="increase" data-id="${c.id}">+</button>
            </div>
            <button class="cart-item-remove" data-action="remove" data-id="${c.id}">Remover</button>
          </div>
        </div>`;
      cartItemsEl.appendChild(el);
    });

    // Totals
    cartSubtotal.textContent = formatPrice(subtotal);
    cartDeliveryFee.textContent = fee === 0 ? 'Grátis 🎉' : formatPrice(fee);
    cartTotal.textContent = formatPrice(total);
  }

  // =============================================
  // CART ACTIONS
  // =============================================
  function addToCart(id) {
    const existing = cart.find(c => c.id === id);
    if (existing) {
      existing.qty++;
    } else {
      const item = MENU.find(m => m.id === id);
      if (item) cart.push({ id: item.id, price: item.price, qty: 1 });
    }
    renderCart();
    renderMenu();
  }

  function decreaseFromCart(id) {
    const existing = cart.find(c => c.id === id);
    if (!existing) return;
    existing.qty--;
    if (existing.qty <= 0) {
      cart = cart.filter(c => c.id !== id);
    }
    renderCart();
    renderMenu();
  }

  function removeFromCart(id) {
    cart = cart.filter(c => c.id !== id);
    renderCart();
    renderMenu();
  }

  // =============================================
  // CART DRAWER
  // =============================================
  function openCart() {
    cartDrawer.classList.add('open');
    cartOverlay.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function closeCart() {
    cartDrawer.classList.remove('open');
    cartOverlay.classList.remove('open');
    document.body.style.overflow = '';
  }

  // =============================================
  // CHECKOUT
  // =============================================
  function openCheckout() {
    closeCart();
    // Build summary
    checkoutSummary.innerHTML = '';
    cart.forEach(c => {
      const item = MENU.find(m => m.id === c.id);
      if (!item) return;
      const row = document.createElement('div');
      row.className = 'checkout-summary-item';
      row.innerHTML = `<span>${c.qty}× ${item.name}</span><span>${formatPrice(item.price * c.qty)}</span>`;
      checkoutSummary.appendChild(row);
    });
    const totalRow = document.createElement('div');
    totalRow.className = 'checkout-summary-total';
    totalRow.innerHTML = `<span>Total</span><span>${formatPrice(getCartTotal() + getDeliveryFee())}</span>`;
    checkoutSummary.appendChild(totalRow);

    checkoutOverlay.style.display = '';
    document.body.style.overflow = 'hidden';
  }

  function closeCheckout() {
    checkoutOverlay.style.display = 'none';
    document.body.style.overflow = '';
  }

  function sendWhatsApp() {
    const name = $('#customer-name').value.trim() || 'Cliente';
    const orderType = document.querySelector('input[name="order-type"]:checked').value;
    const address = $('#customer-address').value.trim();
    const notes = $('#customer-notes').value.trim();
    const payment = document.querySelector('input[name="payment"]:checked').value;

    const paymentLabels = { pix: 'Pix', cartao: 'Cartão', dinheiro: 'Dinheiro' };

    let msg = `🔥 *NOVO PEDIDO — Sabor da Casa*\n\n`;
    msg += `👤 *Cliente:* ${name}\n`;
    msg += `📦 *Tipo:* ${orderType === 'delivery' ? 'Delivery' : 'Retirada'}\n`;
    if (orderType === 'delivery' && address) {
      msg += `📍 *Endereço:* ${address}\n`;
    }
    msg += `💳 *Pagamento:* ${paymentLabels[payment]}\n\n`;
    msg += `📋 *Itens do pedido:*\n`;

    cart.forEach(c => {
      const item = MENU.find(m => m.id === c.id);
      if (item) {
        msg += `  • ${c.qty}× ${item.name} — ${formatPrice(item.price * c.qty)}\n`;
      }
    });

    const subtotal = getCartTotal();
    const fee = getDeliveryFee();
    msg += `\n💰 *Subtotal:* ${formatPrice(subtotal)}\n`;
    msg += `🛵 *Entrega:* ${fee === 0 ? 'Grátis' : formatPrice(fee)}\n`;
    msg += `✅ *TOTAL: ${formatPrice(subtotal + fee)}*\n`;

    if (notes) {
      msg += `\n📝 *Obs:* ${notes}\n`;
    }

    msg += `\n_Pedido via CardápioDigital — andrestudio.dev_`;

    const encoded = encodeURIComponent(msg);
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encoded}`, '_blank');

    closeCheckout();
    successOverlay.style.display = '';
    document.body.style.overflow = 'hidden';
  }

  // =============================================
  // EVENT DELEGATION
  // =============================================

  // Menu & cart clicks (add/increase/decrease/remove)
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;

    const action = btn.dataset.action;
    const id = parseInt(btn.dataset.id, 10);

    switch (action) {
      case 'add':
      case 'increase':
        addToCart(id);
        break;
      case 'decrease':
        decreaseFromCart(id);
        break;
      case 'remove':
        removeFromCart(id);
        break;
    }
  });

  // Category tabs
  $$('.category-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      $$('.category-tab').forEach(t => { t.classList.remove('active'); t.setAttribute('aria-selected', 'false'); });
      tab.classList.add('active');
      tab.setAttribute('aria-selected', 'true');
      activeCategory = tab.dataset.category;
      renderMenu();

      // Scroll to top of menu
      $('#menu-nav').scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });

  // Search
  searchInput.addEventListener('input', (e) => {
    searchQuery = e.target.value;
    renderMenu();
  });

  // Cart float → open drawer
  cartFloat.addEventListener('click', openCart);

  // Close cart
  $('#cart-close').addEventListener('click', closeCart);
  cartOverlay.addEventListener('click', closeCart);

  // Checkout
  $('#btn-checkout').addEventListener('click', openCheckout);
  $('#checkout-close').addEventListener('click', closeCheckout);
  checkoutOverlay.addEventListener('click', (e) => {
    if (e.target === checkoutOverlay) closeCheckout();
  });

  // Order type toggle
  document.querySelectorAll('input[name="order-type"]').forEach(radio => {
    radio.addEventListener('change', () => {
      addressGroup.style.display = radio.value === 'delivery' ? '' : 'none';
    });
  });

  // Send WhatsApp
  $('#btn-whatsapp').addEventListener('click', sendWhatsApp);

  // Success → new order
  $('#btn-new-order').addEventListener('click', () => {
    cart = [];
    successOverlay.style.display = 'none';
    document.body.style.overflow = '';
    $('#customer-name').value = '';
    $('#customer-address').value = '';
    $('#customer-notes').value = '';
    renderCart();
    renderMenu();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  // Keyboard: Escape closes modals
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeCart();
      closeCheckout();
      if (successOverlay.style.display !== 'none') {
        successOverlay.style.display = 'none';
        document.body.style.overflow = '';
      }
    }
  });

  // =============================================
  // INIT
  // =============================================
  renderMenu();
  renderCart();
})();
