/* Label table cells for mobile card layout (data-label from thead). */
(function () {
  function labelTables(root) {
    root = root || document;
    root.querySelectorAll('table.owner-table, table.client-table').forEach(function (table) {
      var heads = Array.prototype.map.call(table.querySelectorAll('thead th'), function (th) {
        return (th.textContent || '').trim();
      });
      if (!heads.length) return;
      table.querySelectorAll('tbody tr').forEach(function (tr) {
        Array.prototype.forEach.call(tr.children, function (td, i) {
          if (td.tagName !== 'TD') return;
          if (!td.getAttribute('data-label') && heads[i]) td.setAttribute('data-label', heads[i]);
        });
      });
    });
  }
  function boot() {
    labelTables();
    var mo = new MutationObserver(function () { labelTables(); });
    if (document.body) mo.observe(document.body, { childList: true, subtree: true });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
