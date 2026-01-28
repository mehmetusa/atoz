import React, { useState } from 'react';
import { FaPaperPlane, FaPhone, FaEnvelope, FaMapMarkerAlt } from 'react-icons/fa';
import styles from '../styles/Contact.module.css';
import Toast from '../components/Toast'; // import the toast component

const Contact = () => {
  const [toastMessage, setToastMessage] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const onSubmit = async (event) => {
    event.preventDefault();
    const form = new FormData(event.target);
    form.append('access_key', 'b17b8eac-5062-4afb-b241-a18eabb06b74');

    try {
      const response = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        body: form,
      });

      const data = await response.json();

      if (data.success) {
        setToastMessage('✅ Message Submitted Successfully!');
        setShowToast(true);
        event.target.reset();
      } else {
        console.error('Error', data);
        setToastMessage(`❌ ${data.message || 'Submission failed'}`);
        setShowToast(true);
      }
    } catch (err) {
      console.error(err);
      setToastMessage('❌ Submission failed, please try again.');
      setShowToast(true);
    }
  };

  return (
    <section className={styles.contactSection} id="contact">
      <div className={styles.contactContainer}>
        {/* Contact Info */}
        <div className={styles.contactInfoMain}>
          <img className={styles.logoContact} src="/img/Amazon.png" alt="Logo" />
          <h2>Contact Us</h2>
          <p>Have questions or ready to schedule service? Reach out today!</p>

          <div className={styles.contactDetails}>
            <div className={styles.contactItem}>
              <FaPhone className={styles.contactIcon} />
              <span>(571) 279-0444</span>
            </div>
            <div className={styles.contactItem}>
              <FaEnvelope className={styles.contactIcon} />
              <span>info@Amazon.com</span>
            </div>
            <div className={styles.contactItem}>
              <FaMapMarkerAlt className={styles.contactIcon} />
              <span>3548 Finish Line Dr, Gainesville, VA 20155</span>
            </div>
            <div className={styles.social}>
              <a
                href="https://instagram.com/AmazonArbirtage"
                target="_blank"
                rel="noopener noreferrer"
              >
                <img
                  src="https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/instagram.svg"
                  alt="Instagram"
                />
              </a>
              <a
                href="https://youtube.com/@AmazonArbirtage"
                target="_blank"
                rel="noopener noreferrer"
              >
                <img
                  src="https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/youtube.svg"
                  alt="YouTube"
                />
              </a>
              <a
                href="https://facebook.com/AmazonArbirtage"
                target="_blank"
                rel="noopener noreferrer"
              >
                <img
                  src="https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/facebook.svg"
                  alt="Facebook"
                />
              </a>
            </div>
          </div>
        </div>

        {/* Contact Form */}
        <div className={styles.contactFormContainer}>
          <form className={styles.contactForm} onSubmit={onSubmit}>
            <div className={styles.formGroup}>
              <label htmlFor="name">Full Name</label>
              <input
                type="text"
                id="name"
                name="name"
                placeholder="John Smith"
                required
                onChange={handleChange}
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                name="email"
                placeholder="john@example.com"
                required
                onChange={handleChange}
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="message">Your Message</label>
              <textarea
                id="message"
                name="message"
                placeholder="How can we help you?"
                rows="5"
                required
                onChange={handleChange}
              ></textarea>
            </div>

            <button type="submit" className={styles.submitButton}>
              <FaPaperPlane className={styles.buttonIcon} />
              Send Message
            </button>

            <div>
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3106.812121084468!2d-77.59952582490976!3d38.859657448931415!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x89b66851fa190121%3A0xcfdf5d8fd639c96e!2s3548%20Finish%20Line%20Dr%2C%20Gainesville%2C%20VA%2020155!5e0!3m2!1sen!2sus!4v1758906136822!5m2!1sen!2sus"
                allowfullscreen=""
                loading="lazy"
              ></iframe>
            </div>
          </form>
        </div>
      </div>

      {/* Toast notification */}
      <Toast message={toastMessage} show={showToast} setShow={setShowToast} />
    </section>
  );
};

export default Contact;
