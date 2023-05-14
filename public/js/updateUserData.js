/* eslint-disable */

// const hideAlert = () => {
//   const el = document.querySelector('.alert');
//   if (el) el.parentElement.removeChild(el);
// };

// const showAlert = (type, msg) => {
//   hideAlert();
//   const markup = `<div class="alert alert--${type}">${msg}</div>`;
//   document.querySelector('body').insertAdjacentHTML('afterbegin', markup);
//   window.setTimeout(hideAlert, 5000);
// };

const updateUserData = async (data, type) => {
  try {
    const url =
      type === 'Data'
        ? 'api/v1/users/update-me'
        : '/api/v1/users/update-password';
    const res = await axios.patch(url, data);
    if (res.data.status === 'success')
      showAlert('success', `${type} updated sucessfully!!!`);
  } catch (err) {
    showAlert('error', err.response.data.message);
  }
};

const userDataForm = document.querySelector('.form-user-data');
if (userDataForm) {
  userDataForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const form = new FormData();
    form.append('name', document.querySelector('#name').value);
    form.append('email', document.querySelector('#email').value);
    form.append('photo', document.querySelector('#photo').files[0]);
    updateUserData(form, 'Data');
  });
}

const userPasswordForm = document.querySelector('.form-user-password');
if (userPasswordForm) {
  userPasswordForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    document.querySelector('.btn--update--password').textContent =
      'UPDATING...';
    const currentPassword = document.querySelector('#password-current').value;
    const newPassword = document.querySelector('#password').value;
    const newPasswordConfirm =
      document.querySelector('#password-confirm').value;
    await updateUserData(
      { currentPassword, newPassword, newPasswordConfirm },
      'Password'
    );
    document.querySelector('.btn--update--password').textContent =
      'SAVE PASSWORD';
    document.querySelector('#password-current').value = '';
    document.querySelector('#password').value = '';
    document.querySelector('#password-confirm').value = '';
  });
}
