document.addEventListener('DOMContentLoaded', (event) => {
    const currentYear = new Date().getFullYear();
    document.getElementById('year').textContent = `©2023-${currentYear} Powered by KO Ho Tin`;
});

// 在移动端可选添加下拉连接的显隐控制
function toggleMobileNav() {
    const nav = document.querySelector('.navbar');
    if (nav.style.display === 'none') {
        nav.style.display = 'flex';
    } else {
        nav.style.display = 'none';
    }
}
