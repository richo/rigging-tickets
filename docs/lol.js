function onLoad() {
  const stripe = Stripe(
                        'pk_test_PFT2A1HuXHz8zzwwwmuCDtpu',
                        {betas: ['payment_intent_beta_1']},
  );

  var urlParams = new URLSearchParams(window.location.search);
  var intent_id = urlParams.get("intent")
  console.log("Loading " + intent_id)

  stripe.retrievePaymentIntent(intent_id)
    .then(({ paymentIntent, error }) => {
      if (error) {
        // Payment failed! Display the error and re-enable the submit button
        // to allow the customer to try again.
        document.querySelector('.PaymentForm-error').innerText = "Couldn't find payment intent";
        document.querySelector('.PaymentForm-submit').disabled = false;
        return;
      } else {
        var description = "$" + (paymentIntent.amount / 100) + " owed for " + paymentIntent.description;
        document.querySelector('#description').innerText = description;
      }



      const elements = stripe.elements();
      const cardElement = elements.create('card');
      cardElement.mount('.CardElement');

      document.querySelector('.PaymentForm').addEventListener('submit', ev => {
        ev.preventDefault();
        // Display a loading state and disable the submit button while attempting to
        // fulfill the payment.
        document.querySelector('.PaymentForm').classList.add('PaymentForm--loading');
        document.querySelector('.PaymentForm-submit').disabled = true;
        // const cardholderName = document.querySelector('input[name="cardholder-name"]').value;

        stripe
          .fulfillPaymentIntent(intent_id, cardElement, {
            payment_intent: {
              source_data: {
                // owner: {
                //   name: cardholderName
                // }
              }
            }
          })
          .then(({ paymentIntent, error }) => {
            document.querySelector('.PaymentForm').classList.remove('PaymentForm--loading');

            if (error) {
              // Payment failed! Display the error and re-enable the submit button
              // to allow the customer to try again.
              document.querySelector('.PaymentForm-error').innerText = error.message;
              document.querySelector('.PaymentForm-submit').disabled = false;
            } else {
              document.querySelector('.PaymentForm-success').innerText = "Neat, you just paid richo!";
              document.querySelector('.PaymentForm-success').disabled = false;

            }
          });
      });
    });

}

window.onload = onLoad
