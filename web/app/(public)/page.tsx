import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="home">
      <div className="home__card">
        <h1>Climate Action Plan</h1>
        <h2>Vehicle Miles Traveled by Jurisdiction</h2>
        <p>
          This site delivers estimates of vehicle miles traveled (VMT) relative to local
          jurisdictional boundaries or selected areas of interest using a standardized method.
        </p>
        <Link href="/data" className="button">
          Get VMT Data
        </Link>
      </div>
    </main>
  );
}
