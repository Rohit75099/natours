/* eslint-disable */

const bookTour = async (tourId) => {
  try {
    const stripe = Stripe(
      'pk_test_51N7IkOSBNNiAGIGziCy2zECYVyHQBkaZFS5pYrZEtOT0PQ5sO9GZcYbsN1kVxWXz1s0lrVvylBFePyyWHqmHRHHz00Odkses0P'
    );
    const session = await axios.get(`/api/v1/booking/check-out/${tourId}`);

    console.log(session.data.session.url);
    location.assign(session.data.session.url);
    // await stripe.redirectToCheckout({
    //   sessionId: session.data.session.id,
    // });
  } catch (err) {
    console.log(err);
    showAlert('error', err);
  }
};

const bookingButton = document.querySelector('#book--tour');

if (bookingButton) {
  bookingButton.addEventListener('click', async (e) => {
    const tourId = e.target.dataset.tourId;
    bookingButton.textContent = 'Processing!!!';
    await bookTour(tourId);
  });
}
