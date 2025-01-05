const body = document.body;
const themeIcon = document.querySelector('#theme-icon');

// Load theme preference from localStorage or set default to "dark"
const savedTheme = localStorage.getItem('theme') || 'dark';
body.setAttribute('data-theme', savedTheme);
updateThemeIcon(savedTheme);

function toggleTheme() {
    const currentTheme = body.getAttribute('data-theme');
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    body.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    updateThemeIcon(newTheme);
}

function updateThemeIcon(theme) {
    themeIcon.className = theme === 'light' ? 'fa-solid fa-moon theme-toggle' : 'fa-regular fa-sun theme-toggle';
}