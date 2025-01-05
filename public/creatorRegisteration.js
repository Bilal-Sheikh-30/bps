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

async function checkEmailExists(email) {
    const response = await fetch('/user/is-email-unique', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email: email })
    });

    const data = await response.json();
    return data.exists;
}

// Form submission event handler
document.querySelector('#submit-btn').addEventListener('click', async (event) => {
    event.preventDefault();
    const email = document.querySelector('input[name="email"]').value;

    const emailExists = await checkEmailExists(email);

    if (emailExists) {
        alert('This email is already registered. Please use another email.');
    } else {
        document.querySelector('form').submit();
    }
});