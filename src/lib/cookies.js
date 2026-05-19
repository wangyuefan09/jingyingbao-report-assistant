function cookiesToHeader(cookies) {
  return (cookies || [])
    .filter((cookie) => cookie && cookie.name)
    .map((cookie) => `${cookie.name}=${cookie.value ?? ""}`)
    .join("; ");
}

module.exports = {
  cookiesToHeader,
};
