import FormData from 'form-data';
import fs from 'fs';

const LUXAND_API_URL = 'https://api.luxand.cloud/v2';

export async function enrollFace(imageBuffer, userId) {
  const form = new FormData();
  form.append('photo', imageBuffer, 'photo.jpg');
  form.append('id', userId);

  try {
    const response = await fetch(`${LUXAND_API_URL}/subject`, {
      method: 'POST',
      headers: {
        'Authorization': `Token ${process.env.LUXAND_API_TOKEN}`,
        ...form.getHeaders(),
      },
      body: form,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || 'Luxand API error');
    }

    return data;
  } catch (error) {
    console.error('Luxand enroll error:', error);
    throw error;
  }
}

export async function verifyFace(imageBuffer) {
  const form = new FormData();
  form.append('photo', imageBuffer, 'photo.jpg');

  try {
    const response = await fetch(`${LUXAND_API_URL}/recognize`, {
      method: 'POST',
      headers: {
        'Authorization': `Token ${process.env.LUXAND_API_TOKEN}`,
        ...form.getHeaders(),
      },
      body: form,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || 'Luxand API error');
    }

    return data;
  } catch (error) {
    console.error('Luxand verify error:', error);
    throw error;
  }
}

export async function deleteFace(faceId) {
  try {
    const response = await fetch(`${LUXAND_API_URL}/subject/${faceId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Token ${process.env.LUXAND_API_TOKEN}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || 'Luxand API error');
    }

    return data;
  } catch (error) {
    console.error('Luxand delete error:', error);
    throw error;
  }
}
