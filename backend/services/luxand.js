import FormData from 'form-data';
import axios from 'axios';

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
 *
 * Note: The enrollment may not return UUID in response body.
 * We need to list persons to find the newly created person by name.
 */
export async function enrollFace(imageBuffer, userId) {
  const form = new FormData();
  form.append('name', userId);
  form.append('photos', imageBuffer, { filename: 'photo.jpg', contentType: 'image/jpeg' });
  form.append('store', '1'); // Store the photo

  try {
    const response = await axios.post(`${LUXAND_API_URL}/v2/person`, form, {
      headers: {
        'token': process.env.LUXAND_API_TOKEN,
        ...form.getHeaders(),
      },
    });

    // Log response details for debugging
    console.log('Luxand enroll response status:', response.status);
    console.log('Luxand enroll response data:', JSON.stringify(response.data));

    // Check if UUID is in response body (some API versions may return it)
    if (response.data?.uuid || response.data?.id) {
      return { uuid: response.data.uuid || response.data.id };
    }

    // If no UUID in response, list persons to find the one we just created
    console.log('No UUID in enrollment response, listing persons to find newly created person...');
    const listResponse = await axios.get(`${LUXAND_API_URL}/v2/person`, {
      headers: {
        'token': process.env.LUXAND_API_TOKEN,
      },
    });

    console.log('Luxand list persons response:', JSON.stringify(listResponse.data));

    // Find the person by name (userId is the name we used)
    const persons = Array.isArray(listResponse.data) ? listResponse.data : (listResponse.data?.persons || []);
    const newPerson = persons.find(p => p.name === userId || p.id === userId);

    if (!newPerson) {
      throw new Error(`Person not found after enrollment. Searched for name: ${userId}`);
    }

    return { uuid: newPerson.uuid || newPerson.id };
  } catch (error) {
    console.error('Luxand enroll error:', error.message);
    if (error.response) {
      console.error('Error response data:', JSON.stringify(error.response.data));
      console.error('Error response status:', error.response.status);
      const errorMsg = error.response.data?.message || error.response.data?.error || error.message;
      throw new Error(`Luxand API error: ${errorMsg}`);
    }
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
    const response = await axios.post(`${LUXAND_API_URL}/photo/search/v2`, form, {
      headers: {
        'token': process.env.LUXAND_API_TOKEN,
        ...form.getHeaders(),
      },
    });

    // Log response details for debugging
    console.log('Luxand verify response status:', response.status);
    console.log('Luxand verify response data:', JSON.stringify(response.data));

    // Returns: [{ uuid: "person-uuid", probability: 0.95, name: "Person Name" }, ...]
    return response.data;
  } catch (error) {
    console.error('Luxand verify error:', error.message);
    if (error.response) {
      console.error('Error response data:', JSON.stringify(error.response.data));
      console.error('Error response status:', error.response.status);
      const errorMsg = error.response.data?.message || error.response.data?.error || error.message;
      throw new Error(`Luxand API error: ${errorMsg}`);
    }
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
    const response = await axios.delete(`${LUXAND_API_URL}/person/${faceId}`, {
      headers: {
        'token': process.env.LUXAND_API_TOKEN,
      },
    });

    return response.data;
  } catch (error) {
    console.error('Luxand delete error:', error.message);
    if (error.response) {
      const errorMsg = error.response.data?.message || error.response.data?.error || error.message;
      throw new Error(`Luxand API error: ${errorMsg}`);
    }
    throw error;
  }
}
