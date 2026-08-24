'use client';

import { useEffect, useState } from 'react';
import { apiGet } from '../../../lib/api';

interface YearRow {
  model_run: string;
}

interface JurisdictionRow {
  cityname: string;
}

interface VmtRow {
  lives: string;
  works: string;
  persons: string;
  inside: string;
  partially_in: string;
  outside: string;
  total: string;
  cityname: string;
  model_run: string;
  tazlist: string;
}

interface Totals {
  totalPersons: number;
  totalInside: number;
  totalPartial: number;
  totalOutside: number;
  totalVMT: number;
  totalVMTPerCapita: number;
}

const DEFAULT_MODEL_RUN = '2050_06_YYY';
const DEFAULT_JURISDICTION = 'Alameda';

function sumBy(rows: VmtRow[], key: 'persons' | 'inside' | 'partially_in' | 'outside' | 'total'): number {
  return rows.reduce((total, row) => total + parseFloat(row[key]), 0);
}

function computeTotals(rows: VmtRow[]): Totals {
  const totalPersons = sumBy(rows, 'persons');
  const totalInside = sumBy(rows, 'inside');
  const totalPartial = sumBy(rows, 'partially_in');
  const totalOutside = sumBy(rows, 'outside');
  const totalVMT = sumBy(rows, 'total');
  return {
    totalPersons,
    totalInside,
    totalPartial,
    totalOutside,
    totalVMT,
    totalVMTPerCapita: totalVMT / totalPersons,
  };
}

function percentage(part: number, whole: number): string {
  if (!whole) return '—';
  return `${((part / whole) * 100).toFixed(1)}%`;
}

/** Replaces the legacy jsonToCSVConverter in client/app/data/data.component.js. */
function downloadCsv(rows: VmtRow[], placeName: string, modelRun: string) {
  const header = Object.keys(rows[0]) as (keyof VmtRow)[];
  const lines = [
    `Jurisdiction: ${placeName}`,
    `Model Run: ${modelRun}`,
    '',
    header.join(','),
    ...rows.map((row) => header.map((key) => `"${row[key]}"`).join(',')),
  ];
  const blob = new Blob([lines.join('\r\n')], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `VMT_Data_${placeName.replace(/ /g, '_')}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export default function DataPage() {
  const [years, setYears] = useState<YearRow[]>([]);
  const [jurisdictions, setJurisdictions] = useState<JurisdictionRow[]>([]);
  const [modelRun, setModelRun] = useState(DEFAULT_MODEL_RUN);
  const [jurisdiction, setJurisdiction] = useState(DEFAULT_JURISDICTION);
  const [vmtData, setVmtData] = useState<VmtRow[]>([]);
  const [noData, setNoData] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiGet<YearRow[]>('/api/data/years/all')
      .then(setYears)
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load years'));
    apiGet<JurisdictionRow[]>('/api/data/jurisdictions/all')
      .then(setJurisdictions)
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load jurisdictions'));
  }, []);

  useEffect(() => {
    if (!modelRun || !jurisdiction) return;
    apiGet<VmtRow[]>(`/api/data/vmt/${encodeURIComponent(modelRun)}/${encodeURIComponent(jurisdiction)}`)
      .then((rows) => {
        setVmtData(rows);
        setNoData(rows.length === 0);
        setError(null);
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load VMT data'));
  }, [modelRun, jurisdiction]);

  const totals = vmtData.length > 0 ? computeTotals(vmtData) : null;
  const tazList = vmtData[0]?.tazlist.replace(/,/g, ', ') ?? '';

  return (
    <main className="data-page">
      <form
        className="data-page__controls"
        onSubmit={(event) => event.preventDefault()}
      >
        <select value={modelRun} onChange={(event) => setModelRun(event.target.value)}>
          <option value="">Choose a Scenario Year</option>
          {years.map((year) => (
            <option key={year.model_run} value={year.model_run}>
              {year.model_run.split('_')[0]}
            </option>
          ))}
        </select>
        <select value={jurisdiction} onChange={(event) => setJurisdiction(event.target.value)}>
          <option value="">Choose a Jurisdiction</option>
          {jurisdictions.map((row) => (
            <option key={row.cityname} value={row.cityname}>
              {row.cityname}
            </option>
          ))}
        </select>
        <button
          type="button"
          className="button"
          disabled={vmtData.length === 0}
          onClick={() => downloadCsv(vmtData, jurisdiction, modelRun)}
        >
          Download Data
        </button>
      </form>

      {error && <p className="data-page__error">{error}</p>}
      {noData && !error && <p className="data-page__error">No data available for this combination!</p>}

      {vmtData.length > 0 && totals && (
        <>
          <h2>Climate Action Plan VMT Data</h2>
          <p>
            <strong>Place Name:</strong> {jurisdiction} &nbsp;
            <strong>Model Run:</strong> {modelRun}
          </p>

          <table className="data-page__table">
            <thead>
              <tr>
                <th rowSpan={2}>Population Segment</th>
                <th rowSpan={2}>Persons</th>
                <th colSpan={8}>Non-commercial Passenger Vehicle Miles Traveled</th>
                <th rowSpan={2}>VMT per capita</th>
              </tr>
              <tr>
                <th colSpan={2}>Entirely within</th>
                <th colSpan={2}>Partially in</th>
                <th colSpan={2}>Entirely outside</th>
                <th colSpan={2}>Total</th>
              </tr>
            </thead>
            <tbody>
              {vmtData.map((row, index) => {
                const persons = parseFloat(row.persons);
                const inside = parseFloat(row.inside);
                const partiallyIn = parseFloat(row.partially_in);
                const outside = parseFloat(row.outside);
                const total = parseFloat(row.total);
                return (
                  <tr key={index}>
                    <td>
                      {row.lives} / {row.works}
                    </td>
                    <td>{persons.toLocaleString()}</td>
                    <td>{inside.toLocaleString()}</td>
                    <td>{percentage(inside, total)}</td>
                    <td>{partiallyIn.toLocaleString()}</td>
                    <td>{percentage(partiallyIn, total)}</td>
                    <td>{outside.toLocaleString()}</td>
                    <td>{percentage(outside, total)}</td>
                    <td>{total.toLocaleString()}</td>
                    <td>100%</td>
                    <td>{(total / persons).toFixed(2)}</td>
                  </tr>
                );
              })}
              <tr>
                <td>Total</td>
                <td>{totals.totalPersons.toLocaleString()}</td>
                <td>{totals.totalInside.toLocaleString()}</td>
                <td />
                <td>{totals.totalPartial.toLocaleString()}</td>
                <td />
                <td>{totals.totalOutside.toLocaleString()}</td>
                <td />
                <td>{totals.totalVMT.toLocaleString()}</td>
                <td />
                <td>{totals.totalVMTPerCapita.toFixed(2)}</td>
              </tr>
            </tbody>
          </table>

          <h4>Selected Transportation Analysis Zones:</h4>
          <p>{tazList}</p>
        </>
      )}
    </main>
  );
}
