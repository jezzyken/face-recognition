import FormData from 'form-data';

const LUXAND_API_URL = 'https://api.luxand.cloud';

async function parseResponse(response) {
  const contentType = response.headers.get('content-type');
  const text = await response.text();

  // If response is HTML, something went wrong
  if (contentType && contentType.includes('text/html')) {
    console.error('Luxand API returned HTML instead of JSON:', text.substring(0, 200));
    throw new Error('Invalid API response - check your API token and endpoint');
  }

  // Try to parse as JSON
  try {
    return JSON.parse(text);
  } catch (e) {
    console.error('Failed to parse response:', text.substring(0, 200));
    throw new Error('Invalid JSON response from API');
  }
}

/**
 * Enroll a person with face photo
 * POST /v2/person
 * Docs: https://documenter.getpostman.com/view/1485228/UVeCR95R
 */
export async function enrollFace(imageBuffer, userId) {
  const form = new FormData();
  form.append('name', userId);
  form.append('photos', imageBuffer, { filename: 'photo.jpg', contentType: 'image/jpeg' });
  form.append('store', '1'); // Store the photo

  try {
    const response = await fetch(`${LUXAND_API_URL}/v2/person`, {
      method: 'POST',
      headers: {
        'token': process.env.LUXAND_API_TOKEN,
        ...form.getHeaders(),
      },
      body: form,
    });

    const data = await parseResponse(response);

    if (!response.ok) {
      const errorMsg = data?.error?.message || data?.message || data?.status || `HTTP ${response.status}`;
      throw new Error(`Luxand API error: ${errorMsg}`);
    }

    // Returns: { uuid: "person-uuid", face_uuid: ["face-uuid-1", ...] }
    return data;
  } catch (error) {
    console.error('Luxand enroll error:', error.message);
    throw error;
  }
}

/**
 * Recognize people in a photo
 * POST /photo/search/v2
 * Docs: https://documenter.getpostman.com/view/1485228/UVeCR95R
 */
export async function verifyFace(imageBuffer) {
  const form = new FormData();
  form.append('photo', imageBuffer, { filename: 'photo.jpg', contentType: 'image/jpeg' });

  try {
    const response = await fetch(`${LUXAND_API_URL}/photo/search/v2`, {
      method: 'POST',
      headers: {
        'token': process.env.LUXAND_API_TOKEN,
        ...form.getHeaders(),
      },
      body: form,
    });

    const data = await parseResponse(response);

    if (!response.ok) {
      const errorMsg = data?.error?.message || data?.message || data?.status || `HTTP ${response.status}`;
      throw new Error(`Luxand API error: ${errorMsg}`);
    }

    // Returns: [{ uuid: "person-uuid", probability: 0.95, name: "Person Name" }, ...]
    return data;
  } catch (error) {
    console.error('Luxand verify error:', error.message);
    throw error;
  }
}

/**
 * Delete a person from the database
 * DELETE /person/:uuid
 * Docs: https://documenter.getpostman.com/view/1485228/UVeCR95R
 */
export async function deleteFace(faceId) {
  try {
    const response = await fetch(`${LUXAND_API_URL}/person/${faceId}`, {
      method: 'DELETE',
      headers: {
        'token': process.env.LUXAND_API_TOKEN,
      },
    });

    const data = await parseResponse(response);

    if (!response.ok) {
      const errorMsg = data?.error?.message || data?.message || data?.status || `HTTP ${response.status}`;
      throw new Error(`Luxand API error: ${errorMsg}`);
    }

    return data;
  } catch (error) {
    console.error('Luxand delete error:', error.message);
    throw error;
  }
}
