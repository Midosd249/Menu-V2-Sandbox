/* Public Menu UX refinement layer. DOM/UI only; no data, routing, Supabase, RPC, RLS, auth or analytics changes. */
(() => {
  const $ = (id) => document.getElementById(id);
  const isImage = (node) => !!node?.querySelector('img');
  const enhance = () => {
    const nav = $('categoryNav');
    if (nav) {
      const categoryButtons = nav.querySelectorAll('.cat');
      nav.classList.toggle('single-category', categoryButtons.length <= 2 && categoryButtons.length > 0);
    }

    const featured = $('featured');
    if (featured) {
      const cards = [...featured.querySelectorAll('.featured-card')];
      const strong = cards.some((card) => isImage(card) || /\d/.test(card.querySelector('small')?.textContent || ''));
      featured.classList.toggle('weak-featured', cards.length > 0 && !strong);
      cards.forEach((card) => card.classList.toggle('no-photo', !isImage(card)));
    }

    document.querySelectorAll('.menu-item, .featured-card').forEach((card) => {
      card.classList.toggle('no-photo', !isImage(card));
    });

    const modalImage = $('modalImage');
    const modalCard = document.querySelector('.modal-card');
    if (modalCard && modalImage) {
      modalCard.classList.toggle('no-product-image', !isImage(modalImage));
    }

    document.querySelectorAll('.item-copy em, #modalPrice').forEach((price) => {
      const text = (price.textContent || '').trim().toLowerCase();
      price.classList.toggle('price-on-request', text.includes('حسب') || text.includes('request'));
    });
  };

  enhance();
  const observer = new MutationObserver(enhance);
  observer.observe(document.body, { childList: true, subtree: true });
})();
