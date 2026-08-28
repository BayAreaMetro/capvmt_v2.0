import NextLink from 'next/link';
import { Card, Typography, VStack } from '@bayareametro/mtc-ui';
import backgroundStyles from '../../components/shell/page-backgrounds.module.scss';

export default function HomePage() {
  return (
    <div className={backgroundStyles.homeBackground}>
      <Card.Root className="narrow-content">
        <Card.Body>
          <VStack className="gap-3 text-center align-items-center">
            <Typography as="h1">Climate Action Plan</Typography>
            <Typography as="h2">Vehicle Miles Traveled by Jurisdiction</Typography>
            <Typography as="p">
              This site delivers estimates of vehicle miles traveled (VMT) relative to local
              jurisdictional boundaries or selected areas of interest using a standardized method.
            </Typography>
            <NextLink href="/data" className="btn btn-primary">
              Get VMT Data
            </NextLink>
          </VStack>
        </Card.Body>
      </Card.Root>
    </div>
  );
}
