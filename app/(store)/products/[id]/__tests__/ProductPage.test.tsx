import { render, screen, waitFor } from '@testing-library/react';
import ProductPage from '../page';
import * as db from '@/lib/db';
import * as chaos from '@/lib/chaos/toggles';

jest.mock('@/lib/db');
jest.mock('@/lib/chaos/toggles');

describe('ProductPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('handles fetch failure for related products gracefully', async () => {
    (chaos.isChaosActive as jest.Mock).mockResolvedValue(true);
    (db.db.select as jest.Mock).mockReturnValueOnce({
      from: jest.fn().mockReturnThis(),
      where: jest.fn().mockResolvedValue([{ id: '1', category: 'mugs' }])
    }).mockReturnValueOnce({
      from: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnValue(
        jest.fn().mockReturnValue({
          innerJoin: jest.fn().mockReturnThis(),
          where: jest.fn().mockResolvedValue([])
        })
      ),
    });

    global.fetch = jest.fn(() => Promise.reject(new TypeError('fetch failed')));

    render(<ProductPage params={Promise.resolve({ id: '1' })} />);

    await waitFor(() => expect(screen.getByText('Mug')).toBeInTheDocument());
    expect(global.fetch).toHaveBeenCalledWith('https://api.example.com/related/1');
  });
})