async function apiRequest(endpoint, options = {}) {
  const token = getToken();

  const config = {
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    ...options,
  };

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  try {
    const response = await fetch(`${CONFIG.BASE_URL}${endpoint}`, config);
    let data = {};
    try {
      data = await response.json();
    } catch {
      data = {};
    }
    if ((response.status === 401 || response.status === 403) && token) {
      logout();
    }
    return {
      ok: response.ok,
      status: response.status,
      data,
    };
  } catch (error) {
    return {
      ok: false,
      status: 500,
      data: {
        success: false,
        message: "unable to connect to the server.",
      },
    };
  }
}
