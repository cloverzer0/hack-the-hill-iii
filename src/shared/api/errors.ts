export class ApiError extends Error {
  status: number

  constructor(message: string, status = 500) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

export class NotFoundError extends ApiError {
  constructor(message = 'This spending record could not be found.') {
    super(message, 404)
    this.name = 'NotFoundError'
  }
}
