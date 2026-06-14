export class APIError extends Error {
  constructor(public status: number, message: string) {
    super(message)
    this.name = 'APIError'
  }
}

export function handleAPIError(error: unknown): APIError {
  if (error instanceof APIError) return error
  if (error instanceof Error) return new APIError(500, error.message)
  return new APIError(500, 'Error desconocido')
}
