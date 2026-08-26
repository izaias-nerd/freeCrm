// Controla a abertura/fechamento do menu lateral em telas pequenas
document.addEventListener('DOMContentLoaded', () => {
  const hamburgerMenu = document.getElementById('hamburger-menu');
  const sidebar = document.getElementById('sidebar');

  if (hamburgerMenu && sidebar) {
    hamburgerMenu.addEventListener('click', () => {
      sidebar.classList.toggle('open');
    });
  }

  // Marca o link ativo no menu lateral conforme a rota atual
  const currentPath = window.location.pathname;
  document.querySelectorAll('.sidebar nav a[href]').forEach((link) => {
    if (link.getAttribute('href') === currentPath) {
      link.classList.add('active');
    }
  });
});
