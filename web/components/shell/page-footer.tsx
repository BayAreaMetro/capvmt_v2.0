import { StandardFooter, LegalFooter, AbagLogo, MtcLogo, ExternalLink, Typography } from '@bayareametro/mtc-ui';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faXTwitter, faLinkedin, faFacebookSquare, faInstagram, faYoutube } from '@fortawesome/free-brands-svg-icons';
import packageJson from '../../package.json';

export const PageFooter = () => (
  <StandardFooter.Root>
    <StandardFooter.Container>
      <StandardFooter.Row>
        <StandardFooter.Col>
          <ExternalLink
            href="https://mtc.ca.gov"
            title="Metropolitan Transportation Commission"
            RightAdornment={null}
          >
            <StandardFooter.Logo as={MtcLogo} />
          </ExternalLink>
          <Typography variant="paragraph2Emphasis">Metropolitan Transportation Commission</Typography>
          <Typography>
            MTC is responsible for planning, financing and coordinating transportation for the
            nine-county San Francisco Bay Area.
          </Typography>
          <StandardFooter.ExternalLink href="https://mtc.ca.gov">mtc.ca.gov</StandardFooter.ExternalLink>
          <StandardFooter.SocialsContainer>
            <StandardFooter.SocialIconLink
              href="https://www.twitter.com/mtcbata"
              title="Find Metropolitan Transportation Commission on Twitter"
            >
              <FontAwesomeIcon icon={faXTwitter} size="lg" />
            </StandardFooter.SocialIconLink>
            <StandardFooter.SocialIconLink
              href="https://www.linkedin.com/company/metropolitan-transportation-commission"
              title="Find Metropolitan Transportation Commission on LinkedIn"
            >
              <FontAwesomeIcon icon={faLinkedin} size="lg" />
            </StandardFooter.SocialIconLink>
            <StandardFooter.SocialIconLink
              href="https://www.facebook.com/MTCBATA"
              title="Find Metropolitan Transportation Commission on Facebook"
            >
              <FontAwesomeIcon icon={faFacebookSquare} size="lg" />
            </StandardFooter.SocialIconLink>
            <StandardFooter.SocialIconLink
              href="https://www.instagram.com/mtcbata"
              title="Find Metropolitan Transportation Commission on Instagram"
            >
              <FontAwesomeIcon icon={faInstagram} size="lg" />
            </StandardFooter.SocialIconLink>
            <StandardFooter.SocialIconLink
              href="https://www.youtube.com/user/mtcabaglibrary"
              title="Find Metropolitan Transportation Commission on YouTube"
            >
              <FontAwesomeIcon icon={faYoutube} size="lg" />
            </StandardFooter.SocialIconLink>
          </StandardFooter.SocialsContainer>
        </StandardFooter.Col>

        <StandardFooter.Col>
          <ExternalLink href="https://abag.ca.gov/" title="Association of Bay Area Governments" RightAdornment={null}>
            <StandardFooter.Logo as={AbagLogo} />
          </ExternalLink>
          <Typography variant="paragraph2Emphasis">Association of Bay Area Governments</Typography>
          <Typography>
            ABAG supports regional planning and cooperation among the cities and counties of the San
            Francisco Bay Area.
          </Typography>
          <StandardFooter.ExternalLink href="https://abag.ca.gov">abag.ca.gov</StandardFooter.ExternalLink>
        </StandardFooter.Col>

        <StandardFooter.Col>
          <StandardFooter.ContactDetails>
            <Typography variant="paragraph1" color="var(--dv-gold)">
              Contact Us
            </Typography>
            <Typography variant="paragraph4">
              Bay Area Metro Center
              <br />
              375 Beale Street
              <br />
              San Francisco, CA 94105
            </Typography>
            <Typography variant="paragraph4">
              Main Phone Number: <a href="tel:1-415-778-6700">(415) 778-6700</a>
              <br />
              Public Information Line: <a href="tel:1-415-778-6757">(415) 778-6757</a>
            </Typography>
            <Typography variant="paragraph4">
              <ExternalLink href="mailto:info@bayareametro.gov">info@bayareametro.gov</ExternalLink>
            </Typography>
          </StandardFooter.ContactDetails>
        </StandardFooter.Col>
      </StandardFooter.Row>

      <Typography variant="paragraph4" style={{ textAlign: 'center', width: '100%' }}>
        &copy; {new Date().getFullYear()} Metropolitan Transportation Commission
      </Typography>

      <LegalFooter.Root>
        <LegalFooter.Container>
          <span style={{ color: '#80979f' }}>Version {packageJson.version}</span>
        </LegalFooter.Container>
        <LegalFooter.BackToTopLink />
      </LegalFooter.Root>
    </StandardFooter.Container>
  </StandardFooter.Root>
);
