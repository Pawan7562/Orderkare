import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  vus: 10,
  duration: '30s',
};

const BASE_URL = 'http://localhost:5000/api/v1';

export default function () {
  const customerName = `LoadTest-${__VU}-${__ITER}`;
  const tableNumber = `T-${__VU}`;

  const menu = http.get(
    `${BASE_URL}/menu/royal-palace/foods`
  );

  check(menu, {
    'menu status is 200': (r) => r.status === 200,
  });

  const orderPayload = JSON.stringify({
    customerName: customerName,
    tableNumber: tableNumber,
    phoneNumber: `900000${String(__VU).padStart(4, '0')}`,
    items: [
      {
        foodItemId: 'item-1',
        quantity: 1,
      },
      {
        foodItemId: 'item-5',
        quantity: 1,
      },
    ],
  });

  const order = http.post(
    `${BASE_URL}/orders/place/royal-palace`,
    orderPayload,
    {
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );

  check(order, {
    'order created': (r) => r.status === 201,
  });

  sleep(1);
}
