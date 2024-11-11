document.addEventListener('DOMContentLoaded', (event) => {
    const currentYear = new Date().getFullYear();
    document.getElementById('year').textContent = `©2023-${currentYear} Powered by BlackCat`;
});