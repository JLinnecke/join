/**
 * Handles the DOMContentLoaded event to initialize the login form functionalities.
 * - Loads saved email and password if 'Remember me' was checked.
 * - Sets up event listeners for form submission and password visibility toggle.
 */
document.addEventListener("DOMContentLoaded", function () {
  if (document.getElementById('login-form')) {
    const form = document.getElementById('login-form');
    const rememberMeCheckbox = document.querySelector("#login-form input[type='checkbox']");
    const emailInput = document.getElementById('emailInput');
    const passwordInput = document.getElementById('passwordInput');
    const errorMessage = document.getElementById('error-message');

    // Load saved email and password if 'Remember me' was checked
    if (localStorage.getItem('rememberMe') === 'true') {
      emailInput.value = localStorage.getItem('email');
      passwordInput.value = localStorage.getItem('password');
      rememberMeCheckbox.checked = true;
    }

    form.addEventListener('submit', function (event) {
      event.preventDefault();
      login();
    });

    setupPasswordToggle(passwordInput);
  }
});

/**
 * Toggles the visibility of the password input field.
 * @param {HTMLInputElement} passwordInputField - The password input field element.
 */
function setupPasswordToggle(passwordInputField) {
  let isPasswordVisible = false;
  let clickCount = 0;

  passwordInputField.addEventListener("mousedown", function (event) {
    event.preventDefault();
    clickCount += 1;
    const cursorPosition = passwordInputField.selectionStart;

    if (clickCount === 1) {
      passwordInputField.style.backgroundImage = "url('../assets/img/visibility_off_password.png')";
    } else if (clickCount === 2) {
      isPasswordVisible = true;
      passwordInputField.type = "text";
      passwordInputField.style.backgroundImage = "url('../assets/img/visibility_on.png')";
    } else if (clickCount === 3) {
      isPasswordVisible = false;
      passwordInputField.type = "password";
      passwordInputField.style.backgroundImage = "url('../assets/img/visibility_off_password.png')";
      clickCount = 0;
    }

    // Restore the cursor position
    passwordInputField.setSelectionRange(cursorPosition, cursorPosition);
    passwordInputField.focus();
  });

  passwordInputField.addEventListener("focus", function () {
    if (!isPasswordVisible) {
      passwordInputField.style.backgroundImage = "url('../assets/img/visibility_off_password.png')";
    }
  });

  passwordInputField.addEventListener("blur", function () {
    if (!isPasswordVisible) {
      passwordInputField.style.backgroundImage = "url('../assets/img/lock-password-input.png')";
      clickCount = 0;
    }
  });
}

/**
 * Handles the login process by validating the user's credentials against stored data.
 * If 'Remember me' is checked, saves the email and password in local storage.
 * Redirects to the summary page on successful login, otherwise displays an error message.
 * @returns {Promise<void>}
 */
async function login() {
  let email = document.getElementById('emailInput').value;
  let password = document.getElementById('passwordInput').value;
  const rememberMeCheckbox = document.querySelector("#login-form input[type='checkbox']");
  const errorMessage = document.getElementById('error-message');

  try {
    let userData = await getData("/userData");

    let user = null;
    for (let key in userData) {
      if (userData[key].email === email && userData[key].password === password) {
        user = userData[key];
        break;
      }
    }

    if (user) {
      if (rememberMeCheckbox.checked) {
        localStorage.setItem('email', email);
        localStorage.setItem('password', password);
        localStorage.setItem('rememberMe', 'true');
      } else {
        localStorage.removeItem('email');
        localStorage.removeItem('password');
        localStorage.setItem('rememberMe', 'false');
      }

      localStorage.setItem('userName', user.name);
      localStorage.setItem('userFirstLetters', user.firstLetters);
      localStorage.setItem('loggedInUser', user.name, user.firstLetter, user.bgColor);
      console.log("Username saved to localStorage:", user.name);

      if (user) {

        localStorage.setItem('showGreetings', 'true');
        window.location.href = "summary.html";
      }

    } else {
      errorMessage.style.display = 'block';
    }
  } catch (error) {
    console.error("Error fetching data from Firebase:", error);
  }
}

async function guestLogin() {
  const guestEmail = "guest@example.de"; // Ersetzen Sie dies durch die E-Mail des Gastaccounts
  const guestPassword = "Test12.."; // Ersetzen Sie dies durch das Passwort des Gastaccounts

  try {
    let userData = await getData("/userData");

    let guestUser = null;
    for (let key in userData) {
      if (userData[key].email === guestEmail && userData[key].password === guestPassword) {
        guestUser = userData[key];
        break;
      }
    }

    if (guestUser) {
      localStorage.setItem('email', guestEmail);
      localStorage.setItem('userName', guestUser.name);
      localStorage.setItem('userFirstLetters', guestUser.firstLetters);
      localStorage.setItem('guestLogin', 'true'); // Markieren Sie den Login als Gastlogin

      console.log("Gastbenutzer angemeldet:", guestUser.name);

      if (guestUser) {
        localStorage.setItem('showGreetings', 'true');
        window.location.href = "summary.html";
      }
    } else {
      console.error("Gastaccount nicht gefunden.");
    }
  } catch (error) {
    console.error("Fehler beim Abrufen der Daten von Firebase:", error);
  }
}


/**
 * Fetches data from the specified path.
 * @param {string} path - The path to fetch data from.
 * @returns {Promise<Object>} - The fetched data.
 */
async function getData(path) {
  let response = await fetch(BASE_URL + path + ".json");
  if (!response.ok) {
    console.error("Error fetching data:", response.statusText);
    return;
  }
  let responseData = await response.json();
  return responseData;
}

function logout() {
  localStorage.removeItem('loggedInUser', 'userName');
  localStorage.removeItem('userName');
  localStorage.removeItem('userFirstLetters');
  localStorage.removeItem('guestLogin');
  window.location.href = "index.html";
}

function showLoginInitial() {
  let userFirstLetters = localStorage.getItem('userFirstLetters');
  let joinProfilElement = document.getElementById('joinProfil');
  if (joinProfilElement) {
    joinProfilElement.innerHTML = userFirstLetters;
  }
}

document.addEventListener('DOMContentLoaded', showLoginInitial);
