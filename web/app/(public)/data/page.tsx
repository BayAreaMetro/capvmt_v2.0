'use client';

import { Fragment, useEffect, useMemo, useState } from 'react';
import type { ThHTMLAttributes } from 'react';
import { flexRender, type ColumnDef, type Header, type HeaderGroup } from '@tanstack/react-table';
import { apiGet } from '../../../lib/api';
import backgroundStyles from '../../../components/shell/page-backgrounds.module.scss';
import {
  Card,
  Typography,
  Select,
  Button,
  VStack,
  HStack,
  DataTable,
  NotificationBox,
  clsx,
} from '@bayareametro/mtc-ui';

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

interface TableRow {
  populationSegment: string;
  persons: number;
  insideValue: number;
  insidePct: string;
  partialValue: number;
  partialPct: string;
  outsideValue: number;
  outsidePct: string;
  totalValue: number;
  totalPct: string;
  vmtPerCapita: string;
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

function toTableRows(rows: VmtRow[], totals: Totals): TableRow[] {
  const dataRows: TableRow[] = rows.map((row) => {
    const persons = parseFloat(row.persons);
    const insideValue = parseFloat(row.inside);
    const partialValue = parseFloat(row.partially_in);
    const outsideValue = parseFloat(row.outside);
    const totalValue = parseFloat(row.total);
    return {
      populationSegment: `${row.lives} / ${row.works}`,
      persons,
      insideValue,
      insidePct: percentage(insideValue, totalValue),
      partialValue,
      partialPct: percentage(partialValue, totalValue),
      outsideValue,
      outsidePct: percentage(outsideValue, totalValue),
      totalValue,
      totalPct: '100%',
      vmtPerCapita: (totalValue / persons).toFixed(2),
    };
  });

  return [
    ...dataRows,
    {
      populationSegment: 'Total',
      persons: totals.totalPersons,
      insideValue: totals.totalInside,
      insidePct: '',
      partialValue: totals.totalPartial,
      partialPct: '',
      outsideValue: totals.totalOutside,
      outsidePct: '',
      totalValue: totals.totalVMT,
      totalPct: '',
      vmtPerCapita: totals.totalVMTPerCapita.toFixed(2),
    },
  ];
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

const columns: ColumnDef<TableRow>[] = [
  {
    header: 'Population Segment',
    accessorKey: 'populationSegment',
  },
  {
    header: 'Persons',
    accessorKey: 'persons',
    cell: (info) => info.getValue<number>().toLocaleString(),
  },
  {
    id: 'nonCommercialPassengerVmt',
    header: 'Non-commercial Passenger Vehicle Miles Traveled',
    columns: [
      {
        id: 'inside',
        header: 'Entirely within',
        columns: [
          {
            id: 'insideValue',
            header: 'VMT',
            accessorKey: 'insideValue',
            cell: (info) => info.getValue<number>().toLocaleString(),
          },
          { id: 'insidePct', header: '%', accessorKey: 'insidePct' },
        ],
      },
      {
        id: 'partial',
        header: 'Partially in',
        columns: [
          {
            id: 'partialValue',
            header: 'VMT',
            accessorKey: 'partialValue',
            cell: (info) => info.getValue<number>().toLocaleString(),
          },
          { id: 'partialPct', header: '%', accessorKey: 'partialPct' },
        ],
      },
      {
        id: 'outside',
        header: 'Entirely outside',
        columns: [
          {
            id: 'outsideValue',
            header: 'VMT',
            accessorKey: 'outsideValue',
            cell: (info) => info.getValue<number>().toLocaleString(),
          },
          { id: 'outsidePct', header: '%', accessorKey: 'outsidePct' },
        ],
      },
      {
        id: 'total',
        header: 'Total',
        columns: [
          {
            id: 'totalValue',
            header: 'VMT',
            accessorKey: 'totalValue',
            cell: (info) => info.getValue<number>().toLocaleString(),
          },
          { id: 'totalPct', header: '%', accessorKey: 'totalPct' },
        ],
      },
    ],
  },
  {
    header: 'Vehicle miles traveled per capita',
    accessorKey: 'vmtPerCapita',
  },
];

function renderGroupedHeader(
  props: ThHTMLAttributes<HTMLTableHeaderCellElement>,
  header: Header<TableRow, unknown>,
) {
  const headerGroups = header.getContext().table.getHeaderGroups();

  if (header.isPlaceholder) return null;

  if (header.subHeaders.length === 0 && header.column.depth === 0 && header.depth > 0) return null;

  const rowSpan = header.subHeaders.length === 0 ? headerGroups.length - header.depth : 1;

  return (
    <th {...props} colSpan={header.colSpan} rowSpan={rowSpan}>
      {flexRender(header.column.columnDef.header, header.getContext())}
    </th>
  );
}

const ariaSortValues = { false: 'none', asc: 'ascending', desc: 'descending' } as const;

function getHeaderProps(header: Header<TableRow, unknown>): ThHTMLAttributes<HTMLTableHeaderCellElement> {
  return {
    'aria-sort': ariaSortValues[String(header.column.getIsSorted()) as keyof typeof ariaSortValues],
    className: clsx('th', { pinnedLeft: header.column.getIsPinned() === 'left' }),
  };
}

function renderHeaderWithContext(header: Header<TableRow, unknown>) {
  return (
    renderGroupedHeader(getHeaderProps(header), header)
  );
}

function renderStandaloneHeader(header: Header<TableRow, unknown>) {
  return (
    <th {...getHeaderProps(header)} colSpan={header.colSpan} rowSpan={header.getContext().table.getHeaderGroups().length}>
      {flexRender(header.column.columnDef.header, header.getContext())}
    </th>
  );
}

function renderGroupedTableHead(headerGroups: HeaderGroup<TableRow>[]) {
  const [topHeaderGroup, metricHeaderGroup, leafHeaderGroup] = headerGroups;
  const leafHeaders = leafHeaderGroup.headers;
  const standaloneHeaders = [leafHeaders[0], leafHeaders[1], leafHeaders[10]];

  return (
    <thead className={clsx('thead', 'table-dark')}>
      <tr>
        {standaloneHeaders.slice(0, 2).map((header) => (
          <Fragment key={header.id}>{renderStandaloneHeader(header)}</Fragment>
        ))}
        {renderHeaderWithContext(topHeaderGroup.headers[2])}
        {renderStandaloneHeader(standaloneHeaders[2])}
      </tr>
      <tr>
        {metricHeaderGroup.headers.slice(2, 6).map((header) => (
          <Fragment key={header.id}>{renderHeaderWithContext(header)}</Fragment>
        ))}
      </tr>
      <tr>
        {leafHeaders.slice(2, 10).map((header) => (
          <Fragment key={header.id}>{renderHeaderWithContext(header)}</Fragment>
        ))}
      </tr>
    </thead>
  );
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
  const tableRows = useMemo(() => (totals ? toTableRows(vmtData, totals) : []), [vmtData, totals]);

  return (
    <VStack className={`${backgroundStyles.dataBackground} data-page gap-3`}>
      <Card.Root>
        <Card.Body>
          <form onSubmit={(event) => event.preventDefault()}>
            <HStack className="gap-3 flex-wrap align-items-center">
              <Select.Field value={modelRun} onChange={(event) => setModelRun(event.target.value)}>
                <option value="">Choose a Scenario Year</option>
                {years.map((year) => (
                  <option key={year.model_run} value={year.model_run}>
                    {year.model_run.split('_')[0]}
                  </option>
                ))}
              </Select.Field>
              <Select.Field value={jurisdiction} onChange={(event) => setJurisdiction(event.target.value)}>
                <option value="">Choose a Jurisdiction</option>
                {jurisdictions.map((row) => (
                  <option key={row.cityname} value={row.cityname}>
                    {row.cityname}
                  </option>
                ))}
              </Select.Field>
              <Button
                type="button"
                disabled={vmtData.length === 0}
                onClick={() => downloadCsv(vmtData, jurisdiction, modelRun)}
              >
                Download Data
              </Button>
            </HStack>
          </form>
        </Card.Body>
      </Card.Root>

      {error && <NotificationBox type="info">{error}</NotificationBox>}
      {noData && !error && <NotificationBox type="info">No data available for this combination!</NotificationBox>}

      {vmtData.length > 0 && totals && (
        <Card.Root>
          <Card.Body>
            <VStack className="gap-3">
              <Typography as="h2">Climate Action Plan VMT Data</Typography>
              <Typography as="p">
                <strong>Place Name:</strong> {jurisdiction} &nbsp;
                <strong>Model Run:</strong> {modelRun}
              </Typography>

              <DataTable.Table
                columns={columns}
                data={tableRows}
                variant="dark"
                renderHeader={renderGroupedHeader}
                renderTableHead={renderGroupedTableHead}
              />

              <Typography as="h4">Selected Transportation Analysis Zones:</Typography>
              <Typography as="p">{tazList}</Typography>
            </VStack>
          </Card.Body>
        </Card.Root>
      )}
    </VStack>
  );
}
