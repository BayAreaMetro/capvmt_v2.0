import { StandardFooter, AbagLogo, MtcLogo, ExternalLink } from '@bayareametro/mtc-ui';

export const PageFooter = () => (
  <StandardFooter.Root>
    <StandardFooter.Container>
      <StandardFooter.Row>
        <StandardFooter.Col>
          <p>Powered by:</p>
        </StandardFooter.Col>
      </StandardFooter.Row>
      <StandardFooter.Row>
        <StandardFooter.Col>
          <ExternalLink
            href="https://mtc.ca.gov"
            title="Metropolitan Transportation Commission"
            RightAdornment={null}
          >
            <StandardFooter.Logo as={MtcLogo} color="#FFF" />
          </ExternalLink>
        </StandardFooter.Col>
        <StandardFooter.Col>
          <ExternalLink
            href="https://abag.ca.gov/"
            title="Association of Bay Area Governments"
            RightAdornment={null}
          >
            <StandardFooter.Logo as={AbagLogo} color="#FFF" />
          </ExternalLink>
        </StandardFooter.Col>
      </StandardFooter.Row>
    </StandardFooter.Container>
  </StandardFooter.Root>
);
