import React from 'react';
import styles from '../styles/Footer.module.css';

const Join = () => {
  return (
    <div className="content-overlay-wrapper mobileImage-notSet">
      <div className="overlay fullImageLayout"></div>
      <div className="content fullImageLayout flex-column">
        {/* Promo Headline */}
        <div className="contentItem">
          <div className="headline center">YOUR FIRST ORDER GETS $20 OFF!</div>
        </div>

        <div className="bottom-spacing" style={{ marginBottom: 0 }}></div>

        {/* Coupon Text */}
        <div className="contentItem">
          <div className="text">
            <p style={{ textAlign: 'center' }}>
              <strong>JUST CLICK ORDER ONLINE!</strong>
            </p>
            <p style={{ textAlign: 'center' }}>
              <strong>A COUPON IS WAITING FOR YOU.</strong>
            </p>
          </div>
        </div>

        <div className="bottom-spacing" style={{ marginBottom: 0 }}></div>

        {/* Email Form */}
        <div className="contentItem js-submit-content-item">
          <form
            className="js-email-form text_input email_input app-email-container"
            style={{ textAlign: 'center' }}
          >
            <div className="app-email-container__full">
              <input
                className="emailInputFields emailInputFieldEmail"
                placeholder="Email"
                type="email"
                name="email"
                required
              />
            </div>
            <div className="errorMessage"></div>

            <div className="app-button-container center">
              <button type="submit" className="emailButton buttonText">
                JOIN FOR MORE COUPONS
              </button>
            </div>
          </form>

          {/* Success Message */}
          <div className="submit_message hidden flex-center">
            <i className="success-icon fal fa-check-circle" aria-hidden="true"></i>
            YAY! MORE COUPONS TO YOUR WAY
          </div>
        </div>

        <div className="bottom-spacing" style={{ marginBottom: 0 }}></div>
      </div>
    </div>
  );
};

export default Join;
