import { test, expect } from '@playwright/test';

test('two independent browser sessions join one synchronized match', async ({ browser }) => {
  const hostContext = await browser.newContext();
  const guestContext = await browser.newContext();
  const host = await hostContext.newPage();
  const guest = await guestContext.newPage();

  await Promise.all([host.goto('/'), guest.goto('/')]);
  await expect(host.getByRole('heading', { name: /OUTTHINK/ })).toBeVisible();

  await host.getByPlaceholder('Enter your nickname').fill('Nova');
  await host.getByRole('button', { name: /CREATE ROOM/ }).click();
  await expect(host.getByText('WAITING FOR PLAYERS')).toBeVisible();
  const roomCode = (await host.getByText(/^[A-Z2-9]{6}$/).textContent())!;

  await guest.getByPlaceholder('Enter your nickname').fill('Pixel');
  await guest.getByLabel('Room code').fill(roomCode);
  await guest.getByRole('button', { name: 'JOIN', exact: true }).click();
  await expect(guest.getByText('WAITING FOR PLAYERS')).toBeVisible();
  await expect(host.getByText('Pixel')).toBeVisible();
  await expect(guest.getByText('Nova')).toBeVisible();

  await host.getByRole('button', { name: /START/ }).click();
  await expect(host.getByText(/QUESTION 1 \/ 10/)).toBeVisible();
  await expect(guest.getByText(/QUESTION 1 \/ 10/)).toBeVisible();
  await expect(host.getByText(/REALITY GLITCH \/\//)).toBeVisible();
  await expect(guest.getByText(/REALITY GLITCH \/\//)).toBeVisible();
  await expect(guest.getByRole('button', { name: /DOUBLE DOWN/ })).toBeVisible();
  await expect(guest.getByRole('button', { name: /PHASE SHIFT/ })).toBeVisible();
  await guest.getByRole('button', { name: '🤯', exact: true }).click();
  await expect(host.getByText('Pixel')).toBeVisible();

  await Promise.all([hostContext.close(), guestContext.close()]);
});
