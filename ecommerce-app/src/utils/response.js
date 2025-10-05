// PSEUDO: Response helpers
export function ok (res, data, status = 200) {
  return res.status(status).json(data)
}

export function fail (res, message, status = 400, details) {
  const body = { error: { message } }
  if (details) body.error.details = details
  return res.status(status).json(body)
}
