// Import the local JSON file
import localEventsData from './events.json';

// Set your control boolean (true to use local JSON, false to try external API)
const USE_LOCAL_JSON = true;

const API_URL =
  'https://prod-179.westeurope.logic.azure.com/workflows/7c84997dd6894507a60796acb06e5c43/triggers/manual/paths/invoke?api-version=2016-10-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=6hFoizfo2w62d0iQK_Zyt7a3Ycr9akAkXdCPAG0ecwQ';

const myHeaders = new Headers();
myHeaders.append('Content-Type', 'application/json');

const raw = JSON.stringify({});

const requestOptions = {
  method: 'POST',
  headers: myHeaders,
  body: raw,
  redirect: 'follow',
};

export async function fetchEvents() {
  // Intercept the request if the boolean is true
  if (USE_LOCAL_JSON) {
    // console.log('Using local events.json data');

    // Simulate network delay so your app's loading states still trigger
    await new Promise((resolve) => setTimeout(resolve, 5000));

    // Since events.json perfectly mirrors the original response,
    // we return the .value property just like the real API did.
    return localEventsData.value;
  }

  // Proceed with normal fetch if boolean is false
  try {
    const response = await fetch(API_URL, requestOptions);
    if (!response.ok) {
      throw new Error(`Response status: ${response.status}`);
    }
    const data = await response.json();
    return data.value;
  } catch (error) {
    console.error('API Fetch Error:', error.message);
  }
}
