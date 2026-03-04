export function getRequestOptions(token: unknown) {
  return {
    headers: {
      "Content-Type": "application/json",
      Accepts: "*/*",
      // clientId: `${CLIENT_ID}`,
      // Authorization : `Bearer ${token}`
    },
  };
}

export function postRequestOptions(token: unknown) {
  return {
    headers: {
      "Content-Type": "application/json",
      Accepts: "application/json",
      // clientId: `${CLIENT_ID}`,
      // Authorization : `Bearer ${token}`
    },
  };
}
