import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { expect, test, vi } from 'vitest';
import { App } from './App.tsx';

const unit = (id: string, title: string, bedrooms: number, status = 'available') => ({
  id,
  title,
  brand: 'Yaya FLEX',
  neighborhood: 'Lavapiés',
  status,
  bedrooms,
  bathrooms: 1,
  maxOccupancy: 2,
  sizeM2: 40,
  monthlyRent: 118000,
  floorType: 'ático',
  isExterior: true,
  ageLabel: '-1 año',
});

const response = (results: unknown[], total: number) => ({
  ok: true,
  json: () =>
    Promise.resolve({
      results,
      facets: {
        bedrooms: [
          { value: 0, count: 3 },
          { value: 1, count: 6 },
          { value: 9, count: 0 },
        ],
        price: [
          { from: 75000, to: 99999, count: 2 },
          { from: 100000, to: 124999, count: 0 },
          { from: 125000, to: 149999, count: 4 },
        ],
      },
      total,
      rejectedRows: 0,
    }),
});

test('renders the grid, filters via the modal and toggles the scope', async () => {
  const fetchMock = vi
    .fn()
    .mockResolvedValue(response([unit('a', 'estudio uno', 0)], 1))
    .mockResolvedValueOnce(
      response([unit('a', 'estudio uno', 0), unit('b', 'piso dos', 1)], 2),
    );
  vi.stubGlobal('fetch', fetchMock);

  render(<App />);

  // Grid renders, money is formatted at the boundary, badges come from the data.
  await screen.findByText('Estudio uno');
  expect(screen.getByText('Piso dos')).toBeInTheDocument();
  expect(screen.getAllByText(/1180/)).toHaveLength(2);
  expect(screen.getAllByText('Ático')).toHaveLength(2);
  expect(screen.getByText('2 alquileres')).toBeInTheDocument();

  // Filters live behind the toolbar button.
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: /Filtros/ }));
  expect(screen.getByRole('dialog')).toBeInTheDocument();

  // Zero-count option is reachable but marked unavailable.
  expect(screen.getByLabelText(/9 Dormitorios/)).toHaveAttribute('aria-disabled', 'true');

  const apply = screen.getByRole('button', { name: 'Aplicar filtros' });
  expect(apply).toBeDisabled();
  fireEvent.click(screen.getByLabelText(/Estudio/));
  expect(apply).toBeEnabled();
  fireEvent.click(apply);

  await waitFor(() => {
    expect(screen.queryByText('Piso dos')).not.toBeInTheDocument();
  });
  expect(fetchMock.mock.calls.at(-1)?.[0]).toBe('/api/properties?bedrooms=0');

  // The scope switch commits immediately, without Apply.
  fireEvent.click(screen.getByRole('switch'));
  await waitFor(() => {
    expect(fetchMock.mock.calls.at(-1)?.[0]).toBe(
      '/api/properties?bedrooms=0&availability=all',
    );
  });
});

test('sends both dimensions together and blocks an incoherent price range', async () => {
  const fetchMock = vi.fn().mockResolvedValue(response([unit('a', 'estudio uno', 0)], 1));
  vi.stubGlobal('fetch', fetchMock);

  render(<App />);
  await screen.findByText('Estudio uno');
  fireEvent.click(screen.getByRole('button', { name: /Filtros/ }));

  const apply = screen.getByRole('button', { name: 'Aplicar filtros' });
  const minimum = screen.getByLabelText(/Mínimo/);
  const maximum = screen.getByLabelText(/Máximo/);

  // A minimum above the maximum is refused by the schema, so Apply stays shut.
  fireEvent.change(minimum, { target: { value: '2000' } });
  fireEvent.change(maximum, { target: { value: '1000' } });
  expect(apply).toBeDisabled();
  expect(screen.getByText(/El mínimo no puede superar al máximo/)).toBeInTheDocument();

  // Correcting it reopens Apply, and both dimensions travel in one request.
  fireEvent.change(maximum, { target: { value: '2500' } });
  fireEvent.click(screen.getByLabelText(/Estudio/));
  expect(apply).toBeEnabled();
  fireEvent.click(apply);

  await waitFor(() => {
    expect(fetchMock.mock.calls.at(-1)?.[0]).toBe(
      '/api/properties?bedrooms=0&minPrice=2000&maxPrice=2500',
    );
  });
});

test('leaves a bound out of the query when its field is empty', async () => {
  const fetchMock = vi.fn().mockResolvedValue(response([unit('a', 'estudio uno', 0)], 1));
  vi.stubGlobal('fetch', fetchMock);

  render(<App />);
  await screen.findByText('Estudio uno');
  fireEvent.click(screen.getByRole('button', { name: /Filtros/ }));

  fireEvent.change(screen.getByLabelText(/Mínimo/), { target: { value: '1500' } });
  fireEvent.click(screen.getByRole('button', { name: 'Aplicar filtros' }));

  await waitFor(() => {
    expect(fetchMock.mock.calls.at(-1)?.[0]).toBe('/api/properties?minPrice=1500');
  });
});
