import { StandardFooter, LegalFooter } from '@bayareametro/mtc-ui';
import Container from 'react-bootstrap/Container';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faXTwitter,
  faFacebookSquare,
  faYoutube,
  faInstagram,
} from '@fortawesome/free-brands-svg-icons';
import { faLocationDot } from '@fortawesome/free-solid-svg-icons';
import styles from './page-footer.module.scss';

export const PageFooter = () => (
  <StandardFooter.Root className={styles.root}>
    <Container className={styles.container}>
      <div className={styles.grid}>
        {/* Column 1: Contact & Logo */}
        <div className={styles.column}>
          <a
            href="https://www.baaqmd.gov/"
            target="_blank"
            rel="noopener noreferrer"
            className={styles.logoLink}
            title="Bay Area Air Quality Management District Website"
          >
            <img
              src="/images/HorizLogo-WHT.png"
              alt="Bay Area Air Quality Management District Logo"
              className={styles.logo}
            />
          </a>
          <address className={styles.address}>
            375 Beale Street, Suite 600
            <br />
            San Francisco, CA 94105
          </address>
          <p className={styles.contactLine}>
            <a href="tel:1-415-749-5000">415.749.5000</a> |{' '}
            <a href="tel:1-800-435-7247">1.800.HELP AIR</a>
          </p>
          <a
            href="https://www.baaqmd.gov/about-the-air-district/contact-us/location-and-directions"
            target="_blank"
            rel="noopener noreferrer"
            className={styles.directionsLink}
            aria-label="Directions to Bay Area Air District"
            title="Directions to Bay Area Air District"
          >
            <FontAwesomeIcon icon={faLocationDot} aria-hidden="true" />
            <span>Directions</span>
          </a>
        </div>

        {/* Column 2: Stay Informed */}
        <div className={styles.column}>
          <h2 className={styles.heading}>Stay Informed</h2>
          <div className={styles.socials}>
            <a
              href="https://twitter.com/AirDistrict"
              target="_blank"
              rel="noopener noreferrer"
              className={styles.socialLink}
              title="Follow Bay Area Air District on X / Twitter"
              aria-label="X / Twitter"
            >
              <FontAwesomeIcon icon={faXTwitter} />
            </a>
            <a
              href="https://www.facebook.com/bayareaairdistrict"
              target="_blank"
              rel="noopener noreferrer"
              className={styles.socialLink}
              title="Follow Bay Area Air District on Facebook"
              aria-label="Facebook"
            >
              <FontAwesomeIcon icon={faFacebookSquare} />
            </a>
            <a
              href="https://www.youtube.com/user/BayAreaAirDistrict"
              target="_blank"
              rel="noopener noreferrer"
              className={styles.socialLink}
              title="Watch Bay Area Air District videos on YouTube"
              aria-label="YouTube"
            >
              <FontAwesomeIcon icon={faYoutube} />
            </a>
            <a
              href="https://www.instagram.com/bayareaairdistrict"
              target="_blank"
              rel="noopener noreferrer"
              className={styles.socialLink}
              title="Follow Bay Area Air District on Instagram"
              aria-label="Instagram"
            >
              <FontAwesomeIcon icon={faInstagram} />
            </a>
          </div>
          <a
            href="https://www.baaqmd.gov/about-the-air-district/stay-informed/subscriptions"
            target="_blank"
            rel="noopener noreferrer"
            className={styles.subscribeLink}
          >
            Subscribe
          </a>
        </div>

        {/* Column 3: Air District Initiatives */}
        <div className={styles.column}>
          <h2 className={styles.heading}>Air District Initiatives</h2>
          <div className={styles.initiatives}>
            <a
              href="https://www.sparetheair.org"
              target="_blank"
              rel="noopener noreferrer"
              className={styles.initiativeLink}
              title="Spare the Air"
            >
              <img
                src="/images/spare_the_air.png"
                alt="Spare the Air"
                className={styles.initiativeImg}
              />
            </a>
            <div className={styles.noBurnSection}>
              <img
                src="/images/no_burn.png"
                alt="Wood Smoke Regulations / No Burn"
                className={styles.initiativeImg}
              />
            </div>
          </div>
        </div>
      </div>

      <div className={styles.bottomBarSection}>
        <div className={styles.bottomBar}>
          <span>&copy; {new Date().getFullYear()} Bay Area Air District. All rights reserved.</span>
          <LegalFooter.BackToTopLink className={styles.backToTop} />
        </div>
      </div>
    </Container>
  </StandardFooter.Root>
);
