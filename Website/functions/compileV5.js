const url = 'https://hexi.wokwi.com';

export async function buildHex(source) {
  try {
    const resp = await fetch(url + '/build', {
      method: 'POST',
      mode: 'cors',
      cache: 'no-cache',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ sketch: source })
    });

    if (!resp.ok) {
      let reason = '';
      if (resp.status === 429) {
        reason = 'Server is busy (Too Many Requests). Please try again in a moment.';
      } else if (resp.status === 503) {
        reason = 'Server is temporarily unavailable. Try again shortly.';
      } else {
        reason = `Unexpected server error (${resp.status}).`;
      }

      return { stderr: reason };
    }

    return await resp.json();
  } catch (err) {
    return { stderr: `Network error: ${err.message}` };
  }
}
