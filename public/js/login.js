/* eslint-disable */

const hideAlert = () => {
  const el = document.querySelector('.alert');
  if (el) el.parentElement.removeChild(el);
};

const showAlert = (type, msg) => {
  hideAlert();
  const markup = `<div class="alert alert--${type}">${msg}</div>`;
  document.querySelector('body').insertAdjacentHTML('afterbegin', markup);
  window.setTimeout(hideAlert, 5000);
};

const login = async (email, password) => {
  try {
    const res = await axios.post('/api/v1/users/login', { email, password });
    if (res.data.status === 'success')
      showAlert('success', 'Logged in successfully');
    window.setTimeout(() => {
      location.assign('/');
    }, 1000);
  } catch (err) {
    showAlert('error', err.response.data.message);
  }
};

const loginForm = document.querySelector('.form--login');

if (loginForm)
  loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.querySelector('#email').value;
    const password = document.querySelector('#password').value;
    login(email, password);
  });

const logout = async () => {
  try {
    const res = await axios.get('/api/v1/users/logout');
    if (res.data.status === 'success')
      showAlert('success', 'Logged Out successfully');
    window.setTimeout(() => {
      location.reload(true);
    }, 1000);
  } catch (err) {
    console.log(err);
    showAlert('error', 'OOPS! Something went wrong!!');
  }
};

const logoutBtn = document.querySelector('.nav__el--logout');

if (logoutBtn)
  logoutBtn.addEventListener('click', (e) => {
    e.preventDefault();
    console.log('in logout');
    logout();
  });
